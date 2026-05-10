import { Icon } from "@/components/ui";

export function PerfilHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="perfil-header">
      <button onClick={onBack} className="back-btn" type="button">
        <Icon name="chevL" size={16} color="var(--text-mute)" />
        Volver
      </button>
      <div className="perfil-title">Mi perfil</div>
      <div className="perfil-subtitle">Configuración y datos personales</div>
    </div>
  );
}
