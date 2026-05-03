// ds-components.jsx — Training App design system primitives
// All components read from CSS variables, so they respond to [data-theme].

// ─────────────────────────────────────────────────────────────
// Icons — lightweight stroke set, sized via `s` prop (default 18)
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, s = 18, color = 'currentColor', style }) => {
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const P = {
    search:    <path d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zM21 21l-4.3-4.3"/>,
    plus:      <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    check:     <path d="M4 12l5 5L20 6"/>,
    chevR:     <path d="M9 6l6 6-6 6"/>,
    chevL:     <path d="M15 6l-6 6 6 6"/>,
    chevD:     <path d="M6 9l6 6 6-6"/>,
    play:      <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/>,
    pause:     <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></>,
    timer:     <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/></>,
    reset:     <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></>,
    flame:     <path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3 0 2 1 3 2 3 0-3-1-4 1-8z"/>,
    dumbbell:  <><path d="M7 8v8M17 8v8M4 10v4M20 10v4"/><path d="M7 12h10"/></>,
    user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
    users:     <><circle cx="9" cy="8" r="4"/><path d="M2 21c1-4 3-6 7-6s6 2 7 6"/><path d="M16 4a4 4 0 1 1 0 8"/><path d="M18 21c0-3-1-5-3-6"/></>,
    calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    chart:     <><path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 5-7"/></>,
    msg:       <path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12z"/>,
    bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    alert:     <><path d="M12 2L1 21h22L12 2z"/><path d="M12 9v5M12 18h.01"/></>,
    edit:      <><path d="M4 20h4L20 8l-4-4L4 16v4z"/><path d="M14 6l4 4"/></>,
    trash:     <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
    filter:    <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>,
    more:      <><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></>,
    x:         <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    logo:      <><path d="M4 9v6M20 9v6M8 6v12M16 6v12M12 4v16" strokeWidth="2"/></>,
    send:      <path d="M4 12l16-8-6 18-3-7-7-3z"/>,
    home:      <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9z"/>,
    history:   <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v5l3 2"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.5-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.3a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5 0 .9.1 1.3l-2 1.5 2 3.5 2.3-.9a7 7 0 0 0 2.2 1.3L10 21h4l.4-2.3a7 7 0 0 0 2.2-1.3l2.3.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.3z"/></>,
    star:      <path d="M12 3l3 6 6 .9-4.3 4.3 1 6.3L12 17.8 6.3 20.5l1-6.3L3 9.9 9 9l3-6z"/>,
    book:      <><path d="M4 4v16a2 2 0 0 0 2 2h14V4H6a2 2 0 0 0-2 2z"/><path d="M4 20h14"/></>,
  };
  return <svg {...props}>{P[name] || null}</svg>;
};

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
const Button = ({ children, variant = 'primary', size = 'md', block, icon, iconRight, as = 'button', disabled, style, ...rest }) => {
  const sz = {
    sm: { h: 32, px: 12, fs: 13, gap: 6, r: 8 },
    md: { h: 40, px: 16, fs: 14, gap: 8, r: 10 },
    lg: { h: 52, px: 22, fs: 16, gap: 10, r: 12 },
    xl: { h: 64, px: 28, fs: 18, gap: 12, r: 14 },
  }[size];
  const variants = {
    primary: { bg: 'var(--lime)', color: '#0B0B0C', border: 'none', fw: 600 },
    secondary: { bg: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--line-2)', fw: 500 },
    ghost: { bg: 'transparent', color: 'var(--text)', border: '1px solid transparent', fw: 500 },
    outline: { bg: 'transparent', color: 'var(--text)', border: '1px solid var(--line-2)', fw: 500 },
    danger: { bg: 'transparent', color: 'var(--danger)', border: '1px solid var(--line-2)', fw: 500 },
  }[variant];
  const Comp = as;
  return (
    <Comp
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sz.gap, height: sz.h, padding: `0 ${sz.px}px`,
        fontFamily: 'var(--font-sans)', fontSize: sz.fs, fontWeight: variants.fw,
        letterSpacing: '-0.01em', color: variants.color, background: variants.bg,
        border: variants.border, borderRadius: sz.r, cursor: disabled ? 'not-allowed' : 'pointer',
        width: block ? '100%' : undefined, opacity: disabled ? 0.45 : 1,
        transition: 'background .12s, transform .08s', whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} s={sz.fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} s={sz.fs + 2} />}
    </Comp>
  );
};

// ─────────────────────────────────────────────────────────────
// Input / Stepper
// ─────────────────────────────────────────────────────────────
const Input = ({ label, value, placeholder, suffix, error, style, size = 'md', align = 'left', ...rest }) => {
  const h = { sm: 32, md: 40, lg: 48 }[size];
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', ...style }}>
      {label && <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase' }}>{label}</span>}
      <div style={{
        display: 'flex', alignItems: 'center', height: h,
        background: 'var(--bg-2)', border: `1px solid ${error ? 'var(--danger)' : 'var(--line-2)'}`,
        borderRadius: 10, padding: '0 12px',
      }}>
        <input
          value={value} placeholder={placeholder}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'inherit', fontSize: 15, color: 'var(--text)', textAlign: align,
            width: '100%',
          }}
          {...rest}
        />
        {suffix && <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 6 }}>{suffix}</span>}
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </label>
  );
};

const NumCell = ({ value, label, active, onClick, big, style }) => (
  <button onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2, padding: '8px 4px', minWidth: 56,
      background: active ? 'var(--bg-3)' : 'var(--bg-2)',
      border: `1px solid ${active ? 'var(--lime)' : 'var(--line-2)'}`,
      borderRadius: 10, cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-mono)',
      ...style,
    }}>
    <span style={{ fontSize: big ? 22 : 18, fontWeight: 600, letterSpacing: '-.02em' }}>{value}</span>
    {label && <span style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>}
  </button>
);

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
const Card = ({ children, pad = 16, style, interactive, accent }) => (
  <div style={{
    background: 'var(--bg-1)',
    border: `1px solid ${accent ? 'var(--lime)' : 'var(--line)'}`,
    borderRadius: 14, padding: pad,
    boxShadow: 'var(--shadow-sm)',
    ...style,
  }}>{children}</div>
);

// ─────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────
const Badge = ({ children, tone = 'neutral', size = 'sm', icon, style }) => {
  const tones = {
    neutral: { bg: 'var(--bg-2)', color: 'var(--text-mute)', border: 'var(--line-2)' },
    lime:    { bg: 'var(--lime)', color: '#0B0B0C', border: 'transparent' },
    limeSoft:{ bg: 'rgba(215,255,58,.12)', color: 'var(--lime)', border: 'rgba(215,255,58,.3)' },
    success: { bg: 'rgba(110,231,168,.12)', color: 'var(--success)', border: 'rgba(110,231,168,.3)' },
    warn:    { bg: 'rgba(255,181,71,.14)', color: 'var(--warn)', border: 'rgba(255,181,71,.3)' },
    danger:  { bg: 'rgba(255,91,91,.14)', color: 'var(--danger)', border: 'rgba(255,91,91,.3)' },
    info:    { bg: 'rgba(122,184,255,.14)', color: 'var(--info)', border: 'rgba(122,184,255,.3)' },
  }[tone];
  const sz = { sm: { h: 22, px: 8, fs: 11 }, md: { h: 28, px: 10, fs: 12 } }[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: sz.h, padding: `0 ${sz.px}px`, borderRadius: 999,
      background: tones.bg, color: tones.color, border: `1px solid ${tones.border}`,
      fontFamily: 'var(--font-sans)', fontSize: sz.fs, fontWeight: 600,
      letterSpacing: '.02em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon name={icon} s={sz.fs + 1} />}
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const Tabs = ({ tabs, active, onChange, variant = 'underline', style }) => {
  if (variant === 'pills') {
    return (
      <div style={{ display: 'inline-flex', padding: 4, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--line)', ...style }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => onChange && onChange(t)}
            style={{
              padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: t === active ? 'var(--bg-3)' : 'transparent',
              color: t === active ? 'var(--text)' : 'var(--text-mute)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            }}>{t}</button>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--line)', ...style }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange && onChange(t)}
          style={{
            padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer',
            color: t === active ? 'var(--text)' : 'var(--text-mute)',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: t === active ? 600 : 500,
            borderBottom: `2px solid ${t === active ? 'var(--lime)' : 'transparent'}`,
            marginBottom: -1, letterSpacing: '-.01em',
          }}>{t}</button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Table (desktop)
// ─────────────────────────────────────────────────────────────
const Table = ({ cols, rows, onRow }) => (
  <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{
      display: 'grid', gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' '),
      padding: '10px 16px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)',
      fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600,
    }}>
      {cols.map((c, i) => <div key={i} style={{ textAlign: c.align || 'left' }}>{c.label}</div>)}
    </div>
    {rows.map((r, ri) => (
      <div key={ri} onClick={() => onRow && onRow(r)}
        style={{
          display: 'grid', gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' '),
          padding: '14px 16px', borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--line)',
          cursor: onRow ? 'pointer' : 'default', alignItems: 'center',
          fontSize: 14, color: 'var(--text)',
        }}>
        {cols.map((c, ci) => (
          <div key={ci} style={{ textAlign: c.align || 'left', color: c.mute ? 'var(--text-mute)' : undefined, fontFamily: c.mono ? 'var(--font-mono)' : undefined }}>
            {r[c.key]}
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// States — empty / loading / error
// ─────────────────────────────────────────────────────────────
const StateBlock = ({ kind, title, body, cta }) => {
  const icons = { empty: 'calendar', loading: 'reset', error: 'alert' };
  const tones = { empty: 'var(--text-mute)', loading: 'var(--text-mute)', error: 'var(--danger)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: tones[kind],
        animation: kind === 'loading' ? 'ta-spin 1.2s linear infinite' : undefined,
      }}><Icon name={icons[kind]} s={22} /></div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: 'var(--text-mute)', maxWidth: 240, lineHeight: 1.5 }}>{body}</div>}
      {cta && <div style={{ marginTop: 4 }}>{cta}</div>}
      <style>{`@keyframes ta-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────
const Avatar = ({ name = 'ML', size = 32, tone }) => {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const bg = tone || 'var(--bg-3)';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: size * 0.38,
      color: 'var(--text)', flexShrink: 0, letterSpacing: '.02em',
      border: '1px solid var(--line-2)',
    }}>{initials}</div>
  );
};

// ─────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────
const Progress = ({ value = 0, total = 100, height = 6, color = 'var(--lime)', style }) => {
  const pct = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div style={{ height, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', ...style }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .2s' }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────────────────────
const KPI = ({ label, value, unit, trend, hint }) => (
  <div style={{
    padding: 18, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg-1)',
    display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
  }}>
    <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="ta-mono" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--text)' }}>{value}</span>
      {unit && <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>{unit}</span>}
    </div>
    {(trend || hint) && (
      <div style={{ fontSize: 12, color: trend ? (trend[0] === '+' ? 'var(--success)' : trend[0] === '−' ? 'var(--danger)' : 'var(--text-mute)') : 'var(--text-mute)' }}>
        {trend}{hint && <span style={{ color: 'var(--text-mute)', marginLeft: 6 }}>{hint}</span>}
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Bottom tab bar (mobile)
// ─────────────────────────────────────────────────────────────
const MobileTabBar = ({ active = 'home' }) => {
  const items = [
    { id: 'home', icon: 'home', label: 'Semana' },
    { id: 'history', icon: 'history', label: 'Historial' },
    { id: 'chart', icon: 'chart', label: 'Progreso' },
    { id: 'me', icon: 'user', label: 'Yo' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 84,
      background: 'var(--bg-1)', borderTop: '1px solid var(--line)',
      display: 'flex', padding: '8px 8px 28px',
    }}>
      {items.map((it) => (
        <div key={it.id} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          color: it.id === active ? 'var(--text)' : 'var(--text-mute)',
        }}>
          <Icon name={it.icon} s={22} />
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.02em' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Phone frame (simplified, locked to canvas bg — avoids iOS chrome overload)
// ─────────────────────────────────────────────────────────────
const Phone = ({ children, width = 320, height = 680, statusBar = true }) => (
  <div className="ta-app" style={{
    width, height, position: 'relative', overflow: 'hidden',
    background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)',
  }}>
    {statusBar && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: 36, padding: '0 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600,
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="6" width="2" height="4" fill="currentColor"/><rect x="3" y="4" width="2" height="6" fill="currentColor"/><rect x="6" y="2" width="2" height="8" fill="currentColor"/><rect x="9" y="0" width="2" height="10" fill="currentColor"/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0" y="0" width="18" height="10" rx="2" fill="none" stroke="currentColor" strokeOpacity=".5"/><rect x="2" y="2" width="11" height="6" rx="1" fill="currentColor"/></svg>
        </div>
      </div>
    )}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Desktop shell — sidebar + content
// ─────────────────────────────────────────────────────────────
const DesktopShell = ({ children, active = 'dashboard', subtitle, title, actions }) => {
  const nav = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'athletes', icon: 'users', label: 'Alumnos' },
    { id: 'plans', icon: 'calendar', label: 'Planes' },
    { id: 'templates', icon: 'book', label: 'Templates' },
    { id: 'library', icon: 'dumbbell', label: 'Ejercicios' },
    { id: 'messages', icon: 'msg', label: 'Mensajes' },
  ];
  return (
    <div className="ta-app" style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
      {/* sidebar */}
      <aside style={{
        width: 220, borderRight: '1px solid var(--line)', background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column', padding: '18px 12px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="logo" s={18} color="#0B0B0C" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.02em' }}>REGEN</div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '4px 10px 8px' }}>Coach</div>
        {nav.map((n) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, marginBottom: 2,
            background: n.id === active ? 'var(--bg-3)' : 'transparent',
            color: n.id === active ? 'var(--text)' : 'var(--text-mute)',
            fontSize: 13, fontWeight: n.id === active ? 600 : 500, cursor: 'pointer',
          }}>
            <Icon name={n.icon} s={16} />
            {n.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-2)' }}>
          <Avatar name="Coach N" size={28} tone="var(--lime)" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }} className="ta-ellipsis">N. Álvarez</div>
            <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Coach · PRO</div>
          </div>
          <Icon name="settings" s={14} color="var(--text-mute)" />
        </div>
      </aside>
      {/* main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {title && (
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 28px', borderBottom: '1px solid var(--line)', flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 2 }}>{subtitle}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
          </header>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
};

// Placeholder image block — monospace label (per design rules)
const ImgPlaceholder = ({ label = 'photo', height = 120, style }) => (
  <div style={{
    height, background: 'repeating-linear-gradient(135deg, var(--bg-2) 0 6px, var(--bg-1) 6px 12px)',
    border: '1px solid var(--line)', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)',
    letterSpacing: '.1em', textTransform: 'uppercase', ...style,
  }}>{label}</div>
);

Object.assign(window, {
  Icon, Button, Input, NumCell, Card, Badge, Tabs, Table,
  StateBlock, Avatar, Progress, KPI, MobileTabBar, Phone,
  DesktopShell, ImgPlaceholder,
});
