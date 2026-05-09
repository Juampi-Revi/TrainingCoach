"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

interface GarminModalProps {
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export function GarminModal({ onClose, onSubmit, error, isLoading }: GarminModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Conectar Garmin Connect</h2>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <p className="modal-desc">Ingresá tus credenciales de Garmin para sincronizar tus datos de salud y actividad.</p>
        <form onSubmit={handleSubmit}>
          <div className="modal-fields">
            <label className="field-label">
              Email de Garmin
              <input type="email" className="field-input" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="field-label">
              Contraseña
              <input type="password" className="field-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
          </div>
          {error && (
            <div className="modal-error"><Icon name="alert" size={16} color="var(--danger)" /><span>{error}</span></div>
          )}
          <p className="modal-privacy"><Icon name="lock" size={14} color="var(--text-mute)" />Tus credenciales se usan solo para autenticar la conexión y se almacenan de forma segura.</p>
          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="modal-btn connect" disabled={isLoading || !email || !password}>
              {isLoading ? <><Icon name="refresh" size={16} className="spinning" /> Conectando...</> : "Conectar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AlertBannerProps {
  message: string;
  type: "error" | "success";
  onDismiss: () => void;
}

export function AlertBanner({ message, type, onDismiss }: AlertBannerProps) {
  return (
    <div className={`alert alert-${type}`}>
      <Icon name={type === "error" ? "alert" : "check"} size={18} color={type === "error" ? "var(--danger)" : "var(--lime)"} />
      <span>{message}</span>
      <button className="alert-close" onClick={onDismiss}><Icon name="x" size={16} /></button>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  items: string[];
}

export function InfoCard({ title, items }: InfoCardProps) {
  return (
    <div className="info-card">
      <div className="info-icon"><Icon name="info" size={20} color="var(--lime)" /></div>
      <div className="info-content">
        <div className="info-title">{title}</div>
        <ul className="info-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

export function PrivacyNote() {
  return (
    <div className="privacy-note">
      <Icon name="lock" size={16} color="var(--text-mute)" />
      <p>Tus datos de salud son privados y seguros. Solo tú y tu coach pueden verlos (si decides compartirlos). La sincronización se realiza cada 6 horas automáticamente.</p>
    </div>
  );
}