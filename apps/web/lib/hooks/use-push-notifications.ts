"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
  });
  const { token } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Create API client
  const api = createClient(token);

  // Check if push is supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      setState((prev) => ({ ...prev, isSupported: supported, isLoading: false }));
    };

    checkSupport();
  }, []);

  // Check existing subscription
  const checkSubscription = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
      }));
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, [state.isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toastError("Las notificaciones push no están soportadas en este navegador");
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const keyData = await api.get<{ publicKey: string; configured: boolean }>(
        "/push"
      );

      if (!keyData.configured || !keyData.publicKey) {
        toastError("Las notificaciones push no están configuradas");
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
      });

      // Send subscription to server
      await api.post("/push", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      toastSuccess("¡Notificaciones activadas!");
      return true;
    } catch (err) {
      console.error("Failed to subscribe:", err);
      const errorMsg = err instanceof Error ? err.message : "Error al suscribirse";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      toastError(errorMsg);
      return false;
    }
  }, [state.isSupported, toastError, toastSuccess, api]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.isSupported) return false;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await api.del("/push", { endpoint: subscription.endpoint });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toastSuccess("Notificaciones desactivadas");
      return true;
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      const errorMsg = err instanceof Error ? err.message : "Error al cancelar suscripción";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      toastError(errorMsg);
      return false;
    }
  }, [state.isSupported, toastError, toastSuccess, api]);

  // Send test notification
  const sendTest = useCallback(async () => {
    try {
      await api.post("/push/test", {
        title: "¡Funciona! 🎉",
        body: "Las notificaciones push están configuradas correctamente",
        type: "test",
      });
      toastSuccess("Notificación de prueba enviada");
      return true;
    } catch (err) {
      toastError("Error al enviar notificación de prueba");
      return false;
    }
  }, [toastError, toastSuccess, api]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTest,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
