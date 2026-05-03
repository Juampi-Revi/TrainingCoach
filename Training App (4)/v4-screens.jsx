// v4-screens.jsx — Iteración v4 (Brief: lifestyle metrics + intervalos HIIT)
// 1) Recomendación de imagen de ejercicio (visualizada in-canvas)
// 2) Alumno · Mi panel (métricas semanales: fuerza, cardio, pasos, sueño, energía, nutrición)
// 3) Logger rápido de comida + suplementación (3-tap)
// 4) Coach Editor v3 — bloques de intervalos (HIIT / Tabata)
// 5) Alumno · Ejecución de intervalos (work/rest screen)

const PHONE_W4 = 320;
const PHONE_H4 = 680;

// ─────────────────────────────────────────────────────────────
// Status bar / home bar (mobile chrome) — local helpers
// ─────────────────────────────────────────────────────────────
const SBar = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 38, padding: '12px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, color: 'var(--text)' }}>
    <span className="ta-mono" style={{ fontSize: 12, fontWeight: 600 }}>9:41</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <span style={{ fontSize: 9 }}>●●●●</span>
      <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke="currentColor" /><rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" /><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
    </div>
  </div>
);

const HBar = () => (
  <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 110, height: 4, borderRadius: 2, background: 'var(--text)', opacity: 0.55, zIndex: 20 }} />
);

const PhoneFrame = ({ children }) => (
  <div className="ta-app" style={{ width: PHONE_W4, height: PHONE_H4, background: 'var(--bg)', color: 'var(--text)', position: 'relative', overflow: 'hidden' }}>
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════
// 1 · IMAGE GUIDELINES — pantalla informativa para vos en el canvas
// ═════════════════════════════════════════════════════════════
const ImageGuidelines = () => {
  const Box = ({ ratio, label, w, h }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: w, height: h, borderRadius: 12, position: 'relative',
        background: 'linear-gradient(135deg, #2a2a2e, #14141a)',
        border: '1px solid var(--line-2)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
          <defs><pattern id={`gh-${label}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#F5F5F4" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill={`url(#gh-${label})`} />
        </svg>
        {/* Subject silhouette */}
        <svg width={Math.min(w, h) * 0.5} height={Math.min(w, h) * 0.5} viewBox="0 0 24 24" fill="none" stroke="#D7FF3A" strokeWidth="1.5" style={{ position: 'relative' }}>
          <circle cx="12" cy="6" r="2.5" />
          <path d="M9 9c-1 2-2 3.5-3 6.5M15 9c1 2 2 3.5 3 6.5M12 9v6" />
          <path d="M8 18l4-3 4 3" />
        </svg>
        {/* Play overlay */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" s={11} color="#0B0B0C" />
        </div>
        {/* Ratio label */}
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 7px', background: 'rgba(11,11,12,.85)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--lime)', fontWeight: 700 }}>{ratio}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700, letterSpacing: '.05em' }}>{label}</div>
        <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{w} × {h}px</div>
      </div>
    </div>
  );

  return (
    <div className="ta-app" style={{ width: 1240, height: 820, background: 'var(--bg)', color: 'var(--text)', padding: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '.18em', fontWeight: 700 }}>RECOMENDACIÓN · ASSETS</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.02em', marginTop: 6, lineHeight: 1.1 }}>Imágenes de ejercicio</div>
          <div style={{ fontSize: 14, color: 'var(--text-mute)', marginTop: 4, maxWidth: 720, lineHeight: 1.5 }}>
            La media del ejercicio aparece en 3 contextos. Lo ideal: una sola fuente <strong style={{ color: 'var(--text)' }}>vertical 4:5</strong> que el sistema crop-ea según contexto. Para movimiento real, video corto (sin sonido).
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="success">Mínimo viable</Badge>
        </div>
      </div>

      {/* Three context cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
        <Box ratio="16:9" label="WORKOUT DETAIL" w={300} h={170} />
        <Box ratio="4:5" label="EJECUCIÓN · HERO" w={220} h={275} />
        <Box ratio="1:1" label="THUMBNAIL EDITOR" w={180} h={180} />
      </div>

      {/* Spec table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left: Specs */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, padding: 22, overflow: 'hidden' }}>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 14 }}>SPECS RECOMENDADAS</div>
          <SpecRow k="Foto principal" v="1080 × 1350 px (4:5)" hint="Vertical, fondo neutro, atleta en frame completo" />
          <SpecRow k="Ratio fuente" v="4:5 (vertical)" hint="Crop automático a 16:9 / 1:1 desde aquí" />
          <SpecRow k="Formato" v="WebP · fallback JPG" hint="WebP 60-75% calidad ≈ 80-150 KB" />
          <SpecRow k="Peso ideal" v="< 200 KB por foto" hint="Mobile-first, conexiones lentas en gimnasio" />
          <SpecRow k="Video técnica" v="MP4 H.264 · 6-12 seg" hint="Loop limpio, mute por default, ~1 MB" />
          <SpecRow k="Resolución video" v="720 × 900 (4:5)" hint="No 1080p — duplica peso sin valor" last />
        </div>

        {/* Right: Composition rules */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, padding: 22 }}>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 14 }}>REGLAS DE COMPOSICIÓN</div>
          <Rule n={1} t="Atleta centrado en el tercio superior" d="Para que el crop a 1:1 conserve la cara" />
          <Rule n={2} t="Fondo neutro y consistente" d="Gris/grafito sin distracciones, mismo gimnasio si es posible" />
          <Rule n={3} t="Iluminación lateral, no frontal" d="Resalta el músculo trabajado" />
          <Rule n={4} t="Pose en el punto de máxima tensión" d="No reposo. Momento donde se vea el patrón motor" />
          <Rule n={5} t="Margen de seguridad de 80px en bordes" d="No texto ni elementos críticos al borde" last />

          <div style={{ marginTop: 18, padding: 14, background: 'rgba(215,255,58,.06)', border: '1px solid var(--lime)', borderRadius: 8 }}>
            <div className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 6 }}>MVP · OPCIÓN PRAGMÁTICA</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              Si no podés producir todo desde cero: usá <strong>video 6-8 seg vertical</strong> grabado con celular en modo retrato, fondo limpio. Cada video pesa ~800 KB y cubre los 3 contextos (frame de portada + loop). Es el camino con mejor ROI.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecRow = ({ k, v, hint, last }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 16, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
    <div style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500 }}>{k}</div>
    <div>
      <div className="ta-mono" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{v}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
    </div>
  </div>
);

const Rule = ({ n, t, d, last }) => (
  <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--lime)' }}>{n}</div>
    <div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t}</div>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2, lineHeight: 1.4 }}>{d}</div>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════
// 2 · ALUMNO · MI PANEL — lifestyle metrics
// ═════════════════════════════════════════════════════════════
const ClientMyPanel = () => {
  return (
    <PhoneFrame>
      <SBar />

      {/* Header */}
      <div style={{ padding: '46px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700 }}>MI PANEL · SEM 5 / 8</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.05 }}>27 oct — 2 nov</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" s={14} />
          </div>
        </div>

        {/* Activity ring + summary score */}
        <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <ActivityRings />
          <div style={{ flex: 1 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>SCORE SEMANAL</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span className="ta-mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1 }}>82</span>
              <span className="ta-mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>+6 vs sem anterior</div>
          </div>
        </div>
      </div>

      {/* Quick log strip */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 8 }}>HOY · REGISTRAR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <QuickLog icon="dumbbell" label="Workout" done />
          <QuickLog icon="book" label="Comida" badge="2" />
          <QuickLog icon="flame" label="Pastilla" badge="1" />
          <QuickLog icon="home" label="Sueño" />
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {/* Training row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MetricCard
            label="FUERZA"
            value="3"
            sub="de 4 esta sem"
            chart={<DotProgress count={4} done={3} color="var(--lime)" />}
          />
          <MetricCard
            label="AERÓBICO"
            value="2"
            sub="de 2 esta sem"
            chart={<DotProgress count={2} done={2} color="#7AB8FF" />}
            tone="info"
          />
        </div>

        {/* Steps + Sleep */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
          <MetricCard
            label="PASOS · 7D"
            value="9.420"
            sub="prom diario · meta 8k"
            trend="+12%"
            chart={<MiniBars data={[7.2, 8.4, 9.1, 6.8, 11.2, 10.5, 12.6]} target={8} color="var(--lime)" />}
          />
          <MetricCard
            label="SUEÑO"
            value="7h32"
            sub="prom · meta 8h"
            chart={<SleepRing hours={7.53} />}
          />
        </div>

        {/* Energy */}
        <MetricCard
          label="ENERGÍA · DIARIA"
          value="3.6"
          sub="/ 5 · prom 7 días"
          chart={<EnergyBars data={[4, 3, 5, 4, 3, 4, 3]} />}
        />

        {/* Nutrition */}
        <MetricCard
          label="NUTRICIÓN · 7D"
          value="6.4"
          sub="/ 10 · 28 comidas registradas"
          chart={<NutritionStack good={18} ok={6} bad={4} />}
          tone="warn"
        />
      </div>

      <PanelTabs active="panel" />
      <HBar />
    </PhoneFrame>
  );
};

const ActivityRings = () => {
  const C = 28;
  const rings = [
    { r: 28, val: 0.92, color: 'var(--lime)' },     // workouts
    { r: 22, val: 0.78, color: '#7AB8FF' },          // steps
    { r: 16, val: 0.58, color: '#A78BFA' },          // sleep
  ];
  return (
    <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
      <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
        {rings.map((r, i) => (
          <g key={i}>
            <circle cx="38" cy="38" r={r.r} fill="none" stroke={r.color} strokeWidth="5" opacity="0.18" />
            <circle cx="38" cy="38" r={r.r} fill="none" stroke={r.color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * r.r}`} strokeDashoffset={`${2 * Math.PI * r.r * (1 - r.val)}`} />
          </g>
        ))}
      </svg>
    </div>
  );
};

const QuickLog = ({ icon, label, done, badge }) => (
  <button style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '10px 4px', background: done ? 'rgba(215,255,58,.08)' : 'var(--bg-1)',
    border: `1px solid ${done ? 'var(--lime)' : 'var(--line)'}`, borderRadius: 10,
    cursor: 'pointer', position: 'relative',
  }}>
    <div style={{ position: 'relative' }}>
      <Icon name={icon} s={18} color={done ? 'var(--lime)' : 'var(--text)'} />
      {badge && (
        <div style={{ position: 'absolute', top: -6, right: -8, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 7, background: 'var(--lime)', color: '#0B0B0C', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</div>
      )}
      {done && (
        <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" s={8} color="#0B0B0C" />
        </div>
      )}
    </div>
    <span style={{ fontSize: 10, color: done ? 'var(--lime)' : 'var(--text-mute)', fontWeight: 600 }}>{label}</span>
  </button>
);

const MetricCard = ({ label, value, sub, trend, chart, tone }) => (
  <div style={{ padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
          <span className="ta-mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, color: tone === 'warn' ? 'var(--warn)' : 'var(--text)' }}>{value}</span>
          {trend && <span className="ta-mono" style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>{trend}</span>}
        </div>
        <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
    {chart}
  </div>
);

const DotProgress = ({ count, done, color }) => (
  <div style={{ display: 'flex', gap: 5 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < done ? color : 'var(--bg-3)' }} />
    ))}
  </div>
);

const MiniBars = ({ data, target, color }) => {
  const max = Math.max(...data, target);
  return (
    <div style={{ height: 38, display: 'flex', alignItems: 'flex-end', gap: 4, position: 'relative' }}>
      {/* target line */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - target / max) * 100}%`, borderTop: '1px dashed var(--line-2)' }} />
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, minHeight: 3, borderRadius: 1.5, background: v >= target ? color : 'var(--bg-3)' }} />
      ))}
    </div>
  );
};

const SleepRing = ({ hours }) => {
  const pct = hours / 8;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 38 }}>
      <svg width="38" height="38" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="19" cy="19" r="14" fill="none" stroke="var(--bg-3)" strokeWidth="3" />
        <circle cx="19" cy="19" r="14" fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 14}`} strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct)}`} />
      </svg>
    </div>
  );
};

const EnergyBars = ({ data }) => {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <div style={{ display: 'flex', gap: 4, height: 32, alignItems: 'flex-end' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', height: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{ height: 3, borderRadius: 1, background: n <= v ? 'var(--lime)' : 'var(--bg-3)' }} />
            ))}
          </div>
          <span className="ta-mono" style={{ fontSize: 8, color: 'var(--text-dim)', fontWeight: 700 }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
};

const NutritionStack = ({ good, ok, bad }) => {
  const total = good + ok + bad;
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-3)' }}>
        <div style={{ width: `${(good / total) * 100}%`, background: 'var(--success)' }} />
        <div style={{ width: `${(ok / total) * 100}%`, background: 'var(--warn)' }} />
        <div style={{ width: `${(bad / total) * 100}%`, background: 'var(--danger)' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 10, color: 'var(--text-mute)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)' }} /><span className="ta-mono">{good} buena</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--warn)' }} /><span className="ta-mono">{ok} regular</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--danger)' }} /><span className="ta-mono">{bad} pobre</span></span>
      </div>
    </div>
  );
};

const PanelTabs = ({ active }) => {
  const tabs = [
    { id: 'semana', icon: 'calendar', label: 'Semana' },
    { id: 'panel', icon: 'chart', label: 'Mi panel' },
    { id: 'historial', icon: 'history', label: 'Historial' },
    { id: 'msg', icon: 'msg', label: 'Coach' },
    { id: 'cuenta', icon: 'user', label: 'Cuenta' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 76, padding: '8px 8px 24px', background: 'rgba(11,11,12,.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', zIndex: 5 }}>
      {tabs.map(t => (
        <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: t.id === active ? 1 : 0.55 }}>
          <Icon name={t.icon} s={20} color={t.id === active ? 'var(--lime)' : 'var(--text)'} />
          <span style={{ fontSize: 9, fontWeight: 600, color: t.id === active ? 'var(--lime)' : 'var(--text-mute)', letterSpacing: '.02em' }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// 3 · LOGGER RÁPIDO — Comida + suplementación
// ═════════════════════════════════════════════════════════════
const QuickFoodLogger = () => {
  return (
    <PhoneFrame>
      <SBar />

      {/* Sheet handle */}
      <div style={{ padding: '50px 16px 4px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-2)' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '8px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700 }}>REGISTRAR · 14:23</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4 }}>¿Qué comiste?</div>
        </div>
        <button style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-1)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
          <Icon name="x" s={13} />
        </button>
      </div>

      {/* Step 1 — Type */}
      <div style={{ padding: '18px 20px 0' }}>
        <Step n={1} title="Momento" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
          {['Desayuno', 'Almuerzo', 'Snack', 'Cena'].map((m, i) => (
            <button key={m} style={{
              padding: '10px 4px', background: i === 1 ? 'var(--lime)' : 'var(--bg-1)',
              border: `1px solid ${i === 1 ? 'var(--lime)' : 'var(--line-2)'}`, borderRadius: 9,
              color: i === 1 ? '#0B0B0C' : 'var(--text)', fontFamily: 'var(--font-sans)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Step 2 — Score */}
      <div style={{ padding: '18px 20px 0' }}>
        <Step n={2} title="Calidad" sub="¿Cómo se sintió esa comida?" />
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <ScoreOption tone="success" emoji="" label="Buena" desc="Saludable, balanceada" selected />
          <ScoreOption tone="warn" emoji="" label="Regular" desc="Aceptable, mejorable" />
          <ScoreOption tone="danger" emoji="" label="Pobre" desc="Procesados, pesado" />
        </div>
      </div>

      {/* Step 3 — Quick tags (optional) */}
      <div style={{ padding: '18px 20px 0' }}>
        <Step n={3} title="Macros aproximadas" sub="Opcional · 1 tap" />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
          {[
            { l: 'Proteína', sel: true },
            { l: 'Carbos', sel: true },
            { l: 'Verduras', sel: true },
            { l: 'Grasas buenas', sel: false },
            { l: 'Procesado', sel: false },
            { l: 'Postre', sel: false },
            { l: 'Alcohol', sel: false },
          ].map((t) => (
            <button key={t.l} style={{
              padding: '6px 10px', borderRadius: 14,
              background: t.sel ? 'rgba(215,255,58,.12)' : 'transparent',
              border: `1px solid ${t.sel ? 'var(--lime)' : 'var(--line-2)'}`,
              color: t.sel ? 'var(--lime)' : 'var(--text-mute)',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{t.sel ? '✓ ' : '+ '}{t.l}</button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 9, fontSize: 12, color: 'var(--text-dim)', minHeight: 36 }}>
          Nota opcional · ej: "milanesa con ensalada"
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 18px', background: 'linear-gradient(180deg, transparent, var(--bg) 30%)' }}>
        <Button size="lg" block icon="check">Guardar · 2 seg</Button>
      </div>

      <HBar />
    </PhoneFrame>
  );
};

const Step = ({ n, title, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.12em', fontWeight: 700 }}>{`0${n}`}</div>
    <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
    <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>{title.toUpperCase()}</div>
    {sub && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sub}</span>}
  </div>
);

const ScoreOption = ({ tone, label, desc, selected }) => {
  const colors = { success: 'var(--success)', warn: 'var(--warn)', danger: 'var(--danger)' };
  return (
    <button style={{
      flex: 1, padding: 12, borderRadius: 10,
      background: selected ? `color-mix(in srgb, ${colors[tone]} 12%, transparent)` : 'var(--bg-1)',
      border: `1px solid ${selected ? colors[tone] : 'var(--line)'}`,
      cursor: 'pointer', textAlign: 'left', position: 'relative',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: colors[tone], marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <Icon name="check" s={12} color="#0B0B0C" />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
    </button>
  );
};

// ═════════════════════════════════════════════════════════════
// 4 · COACH · TEMPLATE EDITOR V3 — bloques de fuerza + intervalos
// ═════════════════════════════════════════════════════════════
const CoachTemplateEditorV3 = () => {
  return (
    <div style={{ width: 1240, height: 820 }}>
      <DesktopShell
        active="templates"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Templates <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>Híbrido B · Fuerza + HIIT</span></span>}
        actions={<>
          <Badge tone="success">Auto-guardado</Badge>
          <Button size="sm" variant="secondary">Vista previa</Button>
          <Button size="sm" icon="check">Publicar</Button>
        </>}
      >
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* CENTER: Phase canvas */}
          <div style={{ flex: 1, padding: '20px 24px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Híbrido B</div>
              <Badge tone="neutral">Fuerza + HIIT</Badge>
              <Badge tone="neutral">Tren superior</Badge>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
              <span>~52 min estimado</span><span>·</span>
              <span>3 bloques · 8 ejercicios + intervalos</span><span>·</span>
              <span>Volumen 12.4k kg · Cardio 480 kcal</span>
            </div>

            {/* Add block toolbar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, alignSelf: 'center', marginRight: 6 }}>+ AGREGAR BLOQUE</span>
              <BlockTypeBtn icon="timer" label="Calentamiento" color="var(--warn)" />
              <BlockTypeBtn icon="dumbbell" label="Fuerza" color="var(--lime)" active />
              <BlockTypeBtn icon="flame" label="Intervalos · HIIT" color="#FF8E72" />
              <BlockTypeBtn icon="reset" label="Cardio continuo" color="#7AB8FF" />
              <BlockTypeBtn icon="star" label="Cooldown" color="#A78BFA" />
            </div>

            {/* Block timeline */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Block 1 — Strength */}
              <PhaseBlock
                num="1"
                kind="Fuerza"
                title="Pecho + Tríceps"
                duration="22 min"
                color="var(--lime)"
                icon="dumbbell"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <BlockExercise name="Press banca" detail="4 × 6-8 · RPE 8 · 120s" thumb />
                  <BlockExercise name="Press inclinado mancuernas" detail="3 × 8-10 · RIR 2 · 90s" thumb />
                  <BlockExercise name="Press francés" detail="3 × 12 · RIR 1 · 60s" />
                </div>
              </PhaseBlock>

              {/* Block 2 — HIIT — selected/expanded */}
              <PhaseBlock
                num="2"
                kind="Intervalos · HIIT"
                title="Tabata · 4 ejercicios"
                duration="16 min"
                color="#FF8E72"
                icon="flame"
                selected
              >
                {/* HIIT-specific structure */}
                <div style={{ display: 'flex', gap: 14, padding: '8px 4px', alignItems: 'center', borderBottom: '1px dashed var(--line-2)', marginBottom: 8 }}>
                  <ParamChip label="WORK" value="20s" color="#FF8E72" />
                  <ParamChip label="REST" value="10s" />
                  <ParamChip label="ROUNDS" value="8" />
                  <ParamChip label="EJERCICIOS" value="4" />
                  <ParamChip label="DESC ENTRE EJ" value="60s" />
                  <div style={{ flex: 1 }} />
                  <button style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--line-2)', borderRadius: 7, fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>Preset Tabata</button>
                </div>

                {/* Visual timeline */}
                <div style={{ marginBottom: 10 }}>
                  <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 6 }}>TIMELINE · 1 RONDA = 30 SEG × 4 EJ × 8 = 16 MIN</div>
                  <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    {Array.from({ length: 8 }).map((_, r) => (
                      Array.from({ length: 4 }).map((_, e) => (
                        <React.Fragment key={`${r}-${e}`}>
                          <div style={{ flex: 2, background: r % 2 === 0 ? '#FF8E72' : '#FFA88E', position: 'relative' }}>
                            {r === 0 && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: '#0B0B0C' }}>{e + 1}</span>}
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-3)' }} />
                        </React.Fragment>
                      ))
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--text-mute)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: '#FF8E72' }} /> work</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: 'var(--bg-3)' }} /> rest</span>
                  </div>
                </div>

                {/* Exercises in interval */}
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 6 }}>EJERCICIOS · ROTAN POR RONDA</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <IntervalEx num="1" name="Burpees" />
                  <IntervalEx num="2" name="Mountain climbers" />
                  <IntervalEx num="3" name="Jump squats" />
                  <IntervalEx num="4" name="+ Agregar" empty />
                </div>
              </PhaseBlock>

              {/* Block 3 — Cooldown */}
              <PhaseBlock
                num="3"
                kind="Cooldown"
                title="Movilidad + estiramientos"
                duration="6 min"
                color="#A78BFA"
                icon="star"
                collapsed
              />
            </div>
          </div>

          {/* RIGHT: Inspector for selected block (HIIT) */}
          <aside style={{ width: 320, borderLeft: '1px solid var(--line)', background: 'var(--bg-1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <div className="ta-mono" style={{ fontSize: 9, color: '#FF8E72', letterSpacing: '.12em', fontWeight: 700 }}>BLOQUE 2 · INTERVALOS</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tabata clásico</div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Preset selector */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>PRESET</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <PresetRow name="Tabata" detail="20 / 10 · 8 rondas" selected />
                  <PresetRow name="HIIT 30:30" detail="30 / 30 · 10 rondas" />
                  <PresetRow name="EMOM" detail="60s on the minute" />
                  <PresetRow name="AMRAP" detail="Tantas vueltas como puedas" />
                  <PresetRow name="Personalizado" detail="Definir manualmente" />
                </div>
              </div>

              {/* Times */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>TIEMPOS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input label="Trabajo (s)" defaultValue="20" align="right" />
                  <Input label="Descanso (s)" defaultValue="10" align="right" />
                  <Input label="Rondas" defaultValue="8" align="right" />
                  <Input label="Desc entre ej (s)" defaultValue="60" align="right" />
                </div>
              </div>

              {/* Audio cues */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>SEÑALES AUDIO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ToggleRow label="Beep al iniciar work" on />
                  <ToggleRow label="Cuenta regresiva últimos 3s" on />
                  <ToggleRow label="Voz: nombre del próximo ej" on />
                  <ToggleRow label="Música del coach" />
                </div>
              </div>

              {/* Display */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>EN LA PANTALLA DEL ALUMNO</div>
                <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                  Mostrar el ejercicio actual + el próximo, contador grande, ring de progreso por ronda.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DesktopShell>
    </div>
  );
};

const BlockTypeBtn = ({ icon, label, color, active }) => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
    background: active ? `color-mix(in srgb, ${color} 12%, var(--bg-2))` : 'var(--bg-2)',
    border: `1px solid ${active ? color : 'var(--line-2)'}`,
    borderRadius: 8, color: active ? color : 'var(--text)',
    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  }}>
    <Icon name={icon} s={13} />
    {label}
  </button>
);

const PhaseBlock = ({ num, kind, title, duration, color, icon, children, selected, collapsed }) => (
  <div style={{
    background: selected ? `color-mix(in srgb, ${color} 6%, var(--bg-1))` : 'var(--bg-1)',
    border: `1px solid ${selected ? color : 'var(--line)'}`,
    borderLeft: `3px solid ${color}`, borderRadius: 10,
    padding: 12,
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: collapsed || !children ? 0 : 12 }}>
      <Icon name="more" s={14} color="var(--text-dim)" style={{ transform: 'rotate(90deg)' }} />
      <div style={{ width: 28, height: 28, borderRadius: 7, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} s={15} color="#0B0B0C" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ta-mono" style={{ fontSize: 9, color, letterSpacing: '.12em', fontWeight: 700 }}>BLOQUE {num} · {kind.toUpperCase()}</span>
          <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{duration}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{title}</div>
      </div>
      <Button size="sm" variant="ghost" icon={collapsed ? "chevR" : "chevD"} />
      <button style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', cursor: 'pointer' }}>
        <Icon name="more" s={13} />
      </button>
    </div>
    {!collapsed && children}
  </div>
);

const BlockExercise = ({ name, detail, thumb }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
    {thumb ? (
      <div style={{ width: 32, height: 40, borderRadius: 5, background: 'linear-gradient(135deg, #2a2a2e, #14141a)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', flexShrink: 0 }}>
        <Icon name="play" s={13} />
      </div>
    ) : (
      <div style={{ width: 32, height: 40, borderRadius: 5, background: 'var(--bg-3)', border: '1px dashed var(--line-2)', flexShrink: 0 }} />
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
      <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{detail}</div>
    </div>
    <Icon name="more" s={13} color="var(--text-dim)" />
  </div>
);

const ParamChip = ({ label, value, color }) => (
  <div>
    <div className="ta-mono" style={{ fontSize: 8, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>{label}</div>
    <div className="ta-mono" style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.1 }}>{value}</div>
  </div>
);

const IntervalEx = ({ num, name, empty }) => (
  <div style={{
    padding: 8, background: empty ? 'transparent' : 'var(--bg-2)',
    border: empty ? '1px dashed var(--line-2)' : '1px solid var(--line)',
    borderRadius: 8, textAlign: 'center', cursor: 'pointer',
    color: empty ? 'var(--text-mute)' : 'var(--text)',
  }}>
    {!empty && (
      <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg, #2a2a2e, #14141a)', borderRadius: 5, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
        <Icon name="play" s={16} />
      </div>
    )}
    <div className="ta-mono" style={{ fontSize: 9, color: empty ? 'var(--text-mute)' : '#FF8E72', letterSpacing: '.1em', fontWeight: 700 }}>{empty ? '' : `EJ ${num}`}</div>
    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, lineHeight: 1.2 }}>{name}</div>
  </div>
);

const PresetRow = ({ name, detail, selected }) => (
  <div style={{
    padding: 10, background: selected ? 'rgba(255,142,114,.08)' : 'var(--bg-2)',
    border: `1px solid ${selected ? '#FF8E72' : 'var(--line)'}`, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
      <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{detail}</div>
    </div>
    {selected && <Icon name="check" s={14} color="#FF8E72" />}
  </div>
);

const ToggleRow = ({ label, on }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 7 }}>
    <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
    <div style={{ width: 32, height: 18, borderRadius: 9, background: on ? 'var(--lime)' : 'var(--bg-3)', border: `1px solid ${on ? 'var(--lime)' : 'var(--line-2)'}`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 1, left: on ? 14 : 1, width: 14, height: 14, borderRadius: 7, background: on ? '#0B0B0C' : 'var(--text-mute)', transition: 'left .15s' }} />
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════
// 5 · ALUMNO · EJECUCIÓN DE INTERVALOS
// ═════════════════════════════════════════════════════════════
const ClientIntervalScreen = () => {
  const phase = 'work'; // 'work' | 'rest'
  const remaining = 14;
  const total = phase === 'work' ? 20 : 10;
  const round = 3, totalRounds = 8;
  const exNum = 2, totalEx = 4;
  const C = 105;
  const phaseColor = phase === 'work' ? '#FF8E72' : '#7AB8FF';

  return (
    <PhoneFrame>
      <SBar />
      {/* Background tint */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${phaseColor}30, transparent 65%)` }} />

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '46px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(11,11,12,.4)', backdropFilter: 'blur(8px)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
            <Icon name="x" s={13} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700 }}>TABATA · BLOQUE 2</div>
            <div className="ta-mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700 }}>RONDA {round} / {totalRounds}</div>
          </div>
          <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(11,11,12,.4)', backdropFilter: 'blur(8px)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
            <Icon name="pause" s={12} />
          </button>
        </div>

        {/* Round progress dots */}
        <div style={{ padding: '4px 16px', display: 'flex', gap: 3 }}>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < round - 1 ? phaseColor : i === round - 1 ? phaseColor : 'var(--bg-3)',
              opacity: i === round - 1 ? 1 : i < round - 1 ? 0.5 : 1,
            }} />
          ))}
        </div>

        {/* Phase label */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 14, background: phaseColor, color: '#0B0B0C' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#0B0B0C' }} />
            <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em' }}>WORK</span>
          </div>
        </div>

        {/* Big timer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 240, height: 240 }}>
            <svg width="240" height="240" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="120" cy="120" r={C} fill="none" stroke="var(--bg-2)" strokeWidth="8" />
              <circle cx="120" cy="120" r={C} fill="none" stroke={phaseColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * C}`} strokeDashoffset={`${2 * Math.PI * C * (1 - remaining / total)}`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="ta-mono" style={{ fontSize: 84, fontWeight: 700, letterSpacing: '-.05em', lineHeight: 0.95, color: phaseColor }}>{remaining}</div>
              <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700, marginTop: 4 }}>SEG · DE {total}</div>
            </div>
          </div>

          {/* Current exercise name */}
          <div style={{ marginTop: 24, textAlign: 'center', padding: '0 20px' }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.16em', fontWeight: 700 }}>EJERCICIO {exNum} / {totalEx} · ACTUAL</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', marginTop: 6, lineHeight: 1.05 }}>Mountain climbers</div>
          </div>
        </div>

        {/* Up next strip */}
        <div style={{ padding: '0 14px 12px' }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.14em', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>SIGUIENTE EN 14s</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(11,11,12,.6)', backdropFilter: 'blur(10px)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 8, background: 'linear-gradient(135deg, #2a2a2e, #14141a)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="2.5"/><path d="M9 9c-1 2-2 4-3 6M15 9c1 2 2 4 3 6M12 9v8"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Jump squats</div>
              <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>20s work · técnica: aterrizaje suave</div>
            </div>
            <Icon name="chevR" s={14} color="var(--text-mute)" />
          </div>
        </div>

        <HBar />
      </div>
    </PhoneFrame>
  );
};

Object.assign(window, {
  ImageGuidelines, ClientMyPanel, QuickFoodLogger,
  CoachTemplateEditorV3, ClientIntervalScreen,
});
