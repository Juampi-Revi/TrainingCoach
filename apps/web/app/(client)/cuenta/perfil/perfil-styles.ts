export const perfilStyles = `
  .perfil-page {
    min-height: 100dvh;
    background: var(--bg);
    padding-bottom: calc(100px + env(safe-area-inset-bottom));
  }

  .perfil-header {
    padding: 20px 16px 16px;
  }

  .perfil-subtitle {
    font-size: 12px;
    color: var(--text-mute);
    margin-top: 4px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-mute);
    font-size: 14px;
    padding: 0;
    margin-bottom: 14px;
  }

  .perfil-title {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .perfil-section {
    padding: 0 16px 16px;
    margin-top: 8px;
  }

  .perfil-section:first-of-type {
    margin-top: 16px;
  }

  .profile-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-1);
    border: 1px solid var(--line);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .section-label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-mute);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .profile-info {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-email {
    font-size: 13px;
    color: var(--text-mute);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-cuenta {
    background: var(--bg-1);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }

  .card-cuenta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid var(--line);
  }

  .card-cuenta-row:last-child {
    border-bottom: none;
  }

  .card-cuenta-row:hover {
    background: var(--bg-2);
  }

  .card-cuenta-row.is-disabled {
    cursor: default;
  }

  .card-cuenta-row.is-disabled:hover {
    background: transparent;
  }

  .card-cuenta-left {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }

  .card-cuenta-right {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-dim);
  }

  .card-cuenta-value {
    font-size: 13px;
    color: var(--text-mute);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px 16px;
    background: var(--bg-2);
    border-bottom: 1px solid var(--line);
  }

  .form-label {
    font-size: 13px;
    color: var(--text-mute);
    font-weight: 500;
    margin-bottom: 6px;
    display: block;
  }

  .form-input {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    background: var(--bg-1);
    border: 1px solid var(--line);
    border-radius: 10px;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus {
    border-color: var(--lime);
    box-shadow: 0 0 0 4px rgba(215, 255, 58, 0.12);
  }

  .btn-row {
    display: flex;
    gap: 12px;
  }

  @media (min-width: 768px) {
    .perfil-header {
      padding: 48px 28px 22px;
    }

    .perfil-title {
      font-size: 28px;
    }

    .perfil-subtitle {
      font-size: 14px;
      margin-top: 6px;
    }

    .perfil-section {
      padding: 0 28px 24px;
      margin-top: 12px;
    }

    .perfil-section:first-of-type {
      margin-top: 32px;
    }

    .section-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      margin-bottom: 16px;
    }

    .profile-banner {
      padding: 24px;
      border-radius: 16px;
      gap: 20px;
    }

    .profile-name {
      font-size: 18px;
    }

    .profile-email {
      font-size: 14px;
    }

    .card-cuenta-value {
      max-width: 360px;
    }
  }

  @media (min-width: 1200px) {
    .perfil-header {
      padding: 52px 48px 24px;
    }

    .perfil-section {
      padding: 0 48px 24px;
    }
  }
`;
