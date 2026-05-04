"use client";

import { useCallback, useRef } from "react";

export function useSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine") => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.value = frequency;
      osc.type = type;
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail if audio is not supported
    }
  }, [getAudioContext]);

  const playBeep = useCallback((count: number = 1) => {
    const ctx = getAudioContext();
    for (let i = 0; i < count; i++) {
      setTimeout(() => playTone(880, 0.15, "sine"), i * 200);
    }
  }, [getAudioContext, playTone]);

  const playStart = useCallback(() => {
    // Ascending tone - block/timer started
    playTone(523.25, 0.1, "sine"); // C5
    setTimeout(() => playTone(659.25, 0.1, "sine"), 100); // E5
    setTimeout(() => playTone(783.99, 0.2, "sine"), 200); // G5
  }, [playTone]);

  const playComplete = useCallback(() => {
    // Success chime - block completed
    playTone(523.25, 0.15, "sine"); // C5
    setTimeout(() => playTone(659.25, 0.15, "sine"), 150); // E5
    setTimeout(() => playTone(783.99, 0.15, "sine"), 300); // G5
    setTimeout(() => playTone(1046.50, 0.4, "sine"), 450); // C6
  }, [playTone]);

  const playWorkPhase = useCallback(() => {
    // Sharp beep for work phase
    playTone(880, 0.2, "square");
  }, [playTone]);

  const playRestPhase = useCallback(() => {
    // Lower tone for rest phase
    playTone(440, 0.2, "sine");
  }, [playTone]);

  const playCountdown = useCallback((secondsLeft: number) => {
    // Beep for last 3 seconds
    if (secondsLeft <= 3 && secondsLeft > 0) {
      playBeep(1);
    }
  }, [playBeep]);

  const playRestComplete = useCallback(() => {
    // Alert when rest is done
    playBeep(3);
  }, [playBeep]);

  return {
    playStart,
    playComplete,
    playWorkPhase,
    playRestPhase,
    playCountdown,
    playBeep,
    playRestComplete,
  };
}
