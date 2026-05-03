// v3-screens.jsx — Refinamientos prioritarios (Brief: YourCoach Fit)
// Pantallas: Session execution, Week view, Coach client detail
// Cada una en dark + light. data-theme="light" cambia tokens automáticamente.

const PHONE_W3 = 320;
const PHONE_H3 = 680;

// ─────────────────────────────────────────────────────────────
// Theme wrapper — aplica data-theme al artboard
// ─────────────────────────────────────────────────────────────
const Themed = ({ light, children, w, h }) => (
  <div data-theme={light ? 'light' : 'dark'} className="ta-app" style={{ width: w, height: h, background: 'var(--bg)', color: 'var(--text)', position: 'relative', overflow: 'hidden' }}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// 1 · SESSION EXECUTION (mobile, full-screen, no nav)
// ─────────────────────────────────────────────────────────────
const SessionExecutionV3 = ({ light = false }) => {
  // Datos
  const ex = { name: 'Aperturas polea alta', muscle: 'PECHO · BISERIE A', sets: 3, reps: '12-15', intensity: 'RIR 1', weight: 'pin 8' };
  const completedSets = [
    { n: 1, kg: 'pin 8', reps: 14, rpe: 7 },
    { n: 2, kg: 'pin 8', reps: 13, rpe: 8 },
  ];

  return (
    <Themed light={light} w={PHONE_W3} h={PHONE_H3}>
      {/* Status bar */}
      <StatusBar light={light} />

      {/* Top: progress through exercises */}
      <div style={{ padding: '46px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={iconBtn(light)}>
            <Icon name="x" s={14} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>PUSH A · 18:42 ELAPSED</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
              {[1,1,1,0,0].map((d, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === 2 ? 'var(--lime)' : d ? (light ? '#0B0B0C' : 'var(--text)') : 'var(--bg-3)' }} />
              ))}
            </div>
          </div>
          <button style={iconBtn(light)}>
            <Icon name="more" s={16} />
          </button>
        </div>
      </div>

      {/* Hero: current exercise */}
      <div style={{ padding: '8px 14px 0' }}>
        {/* Media thumbnail */}
        <div style={{
          position: 'relative', height: 140, borderRadius: 14,
          background: light ? 'linear-gradient(135deg, #DEDEDA 0%, #C8C8C2 100%)' : 'linear-gradient(135deg, #1f1f23 0%, #0f0f12 100%)',
          border: `1px solid var(--line)`, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Diagonal hatch placeholder */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: light ? 0.25 : 0.18 }}>
            <defs>
              <pattern id={`hatch-${light?'l':'d'}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke={light ? '#0B0B0C' : '#F5F5F4'} strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#hatch-${light?'l':'d'})`} />
          </svg>
          {/* Group badge top-left */}
          <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 8px', background: 'var(--lime)', color: '#0B0B0C', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '.05em' }}>BISERIE A · 1/2</div>
          {/* Play */}
          <button style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--lime)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(215,255,58,.35)' }}>
            <Icon name="play" s={18} color="#0B0B0C" />
          </button>
          {/* Bottom controls overlay */}
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 6 }}>
            <button style={pillBtn(light, true)}>Técnica</button>
            <button style={pillBtn(light, false)}>Ver alternativas</button>
            <div style={{ flex: 1 }} />
            <button style={pillBtn(light, false)}>YouTube</button>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 12 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.15em', fontWeight: 700 }}>
            {ex.muscle}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.05 }}>
            {ex.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="ta-mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{ex.sets} × {ex.reps}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>·</span>
            <span className="ta-mono" style={{ fontSize: 12, color: 'var(--lime)', fontWeight: 700 }}>{ex.intensity}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>·</span>
            <span className="ta-mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>60s rest</span>
          </div>
        </div>
      </div>

      {/* Set input row — chips */}
      <div style={{ padding: '14px 14px 0' }}>
        <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>SET 3 / 3 · ACTIVO</span>
          <span style={{ color: 'var(--lime)' }}>● Autosave</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 6 }}>
          <ChipInput label="kg" value="—" light={light} active />
          <ChipInput label="reps" value="—" light={light} active />
          <ChipInput label="rpe" value="—" light={light} active />
        </div>
      </div>

      {/* Completed sets pill list */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {completedSets.map((s) => (
            <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 16px', gap: 6, alignItems: 'center', padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 9 }}>
              <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>SET {s.n}</span>
              <span className="ta-mono" style={{ fontSize: 13, fontWeight: 600 }}>{s.kg} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>kg</span></span>
              <span className="ta-mono" style={{ fontSize: 13, fontWeight: 600 }}>{s.reps} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>rep</span></span>
              <span className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 700, textAlign: 'center' }}>RPE {s.rpe}</span>
              <Icon name="check" s={13} color="var(--success)" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA bar — fixed */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px 18px', background: light ? 'linear-gradient(180deg, transparent, #F7F7F5 30%)' : 'linear-gradient(180deg, transparent, #0B0B0C 30%)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button style={navIconBtn(light)}><Icon name="chevL" s={16} /></button>
        <Button size="lg" block icon="check">Guardar set</Button>
        <button style={navIconBtn(light)}><Icon name="chevR" s={16} /></button>
      </div>

      <HomeBar light={light} />
    </Themed>
  );
};

// ─────────────────────────────────────────────────────────────
// 1b · SESSION EXECUTION · REST TIMER OVERLAY (mobile, full-screen)
// ─────────────────────────────────────────────────────────────
const SessionRestOverlayV3 = ({ light = false }) => {
  const total = 60, remaining = 24;
  const pct = remaining / total;
  const C = 92;
  return (
    <Themed light={light} w={PHONE_W3} h={PHONE_H3}>
      <StatusBar light={light} />
      {/* Background tint */}
      <div style={{ position: 'absolute', inset: 0, background: light ? 'radial-gradient(circle at 50% 35%, rgba(215,255,58,.4), transparent 60%)' : 'radial-gradient(circle at 50% 35%, rgba(215,255,58,.18), transparent 65%)' }} />

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top: dismiss + label */}
        <div style={{ padding: '50px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.15em', fontWeight: 700 }}>SET 2 COMPLETADO</div>
          <button style={{ ...iconBtn(light), background: 'transparent' }}><Icon name="x" s={14} /></button>
        </div>

        {/* Centered timer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '.18em', fontWeight: 700 }}>DESCANSO</div>
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            <svg width="220" height="220" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="110" cy="110" r={C} fill="none" stroke="var(--bg-2)" strokeWidth="6" />
              <circle cx="110" cy="110" r={C} fill="none" stroke="var(--lime)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * C}`} strokeDashoffset={`${2 * Math.PI * C * (1 - pct)}`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="ta-mono" style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: 'var(--text)' }}>0:{remaining}</div>
              <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', marginTop: 6 }}>DE 1:00</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <Button size="md" variant="secondary">−15s</Button>
            <Button size="md" variant="secondary" icon="pause">Pausar</Button>
            <Button size="md" variant="secondary">+15s</Button>
          </div>
        </div>

        {/* Up next card */}
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 6 }}>SIGUIENTE · A2 · BISERIE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
                <Icon name="play" s={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Press francés mancuerna</div>
                <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>3 × 12 · RIR 1 · 14 kg</div>
              </div>
              <Icon name="chevR" s={14} color="var(--text-dim)" />
            </div>
          </div>
          <Button size="lg" block style={{ marginTop: 10 }}>Saltar al siguiente</Button>
        </div>

        <HomeBar light={light} />
      </div>
    </Themed>
  );
};

// ─────────────────────────────────────────────────────────────
// 2 · WEEK VIEW (Semana) — calendario, no list
// ─────────────────────────────────────────────────────────────
const WeekViewV3 = ({ light = false }) => {
  const days = [
    { d: 'LUN', n: 27, kind: 'workout', name: 'Push A', mins: 50, groups: ['Pecho', 'Hombro'], status: 'done' },
    { d: 'MAR', n: 28, kind: 'workout', name: 'Pull A', mins: 55, groups: ['Espalda', 'Bíceps'], status: 'done' },
    { d: 'MIÉ', n: 29, kind: 'rest' },
    { d: 'JUE', n: 30, kind: 'workout', name: 'Legs A', mins: 65, groups: ['Cuádriceps', 'Glúteo'], status: 'today' },
    { d: 'VIE', n: 31, kind: 'workout', name: 'Push B', mins: 50, groups: ['Pecho', 'Tríceps'], status: 'upcoming' },
    { d: 'SÁB', n: 1, kind: 'workout', name: 'Pull B', mins: 55, groups: ['Espalda', 'Antebrazo'], status: 'upcoming' },
    { d: 'DOM', n: 2, kind: 'rest' },
  ];
  const groupColors = { Pecho: '#FF8E72', Hombro: '#FFB547', Espalda: '#7AB8FF', 'Bíceps': '#A78BFA', Cuádriceps: '#6EE7A8', 'Glúteo': '#F472B6', 'Tríceps': '#FBBF24', Antebrazo: '#94A3B8' };

  return (
    <Themed light={light} w={PHONE_W3} h={PHONE_H3}>
      <StatusBar light={light} />

      {/* Header */}
      <div style={{ padding: '46px 18px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>SEMANA 5 / 8 · RECOMP</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.05 }}>27 oct — 2 nov</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={iconBtn(light)}><Icon name="chevL" s={14} /></button>
            <button style={iconBtn(light)}><Icon name="chevR" s={14} /></button>
          </div>
        </div>

        {/* Week summary strip */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <WeekStat n="2/5" label="HECHOS" />
          <Divider light={light} />
          <WeekStat n="13.2k" label="VOLUMEN" unit="kg" />
          <Divider light={light} />
          <WeekStat n="3.5h" label="TIEMPO" />
        </div>
      </div>

      {/* Days */}
      <div style={{ padding: '4px 14px 80px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        {days.map((d, i) => (
          <DayRow key={i} day={d} light={light} groupColors={groupColors} />
        ))}
      </div>

      {/* Bottom tab bar */}
      <BottomTabs active="semana" light={light} />
      <HomeBar light={light} />
    </Themed>
  );
};

const DayRow = ({ day, light, groupColors }) => {
  if (day.kind === 'rest') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'transparent', border: `1px dashed var(--line-2)`, borderRadius: 10 }}>
        <div style={{ width: 38, textAlign: 'center' }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '.05em' }}>{day.d}</div>
          <div className="ta-mono" style={{ fontSize: 16, color: 'var(--text-dim)', fontWeight: 600 }}>{day.n}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mute)' }}>Día de descanso</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Movilidad ligera opcional</div>
        </div>
      </div>
    );
  }
  const isToday = day.status === 'today';
  const isDone = day.status === 'done';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 12, padding: '12px',
      background: isToday ? 'rgba(215,255,58,.06)' : 'var(--bg-1)',
      border: `1px solid ${isToday ? 'var(--lime)' : 'var(--line)'}`,
      borderRadius: 12,
    }}>
      {/* Date column */}
      <div style={{ width: 38, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div className="ta-mono" style={{ fontSize: 9, color: isToday ? 'var(--lime)' : 'var(--text-mute)', fontWeight: 700, letterSpacing: '.06em' }}>{day.d}</div>
        <div className="ta-mono" style={{ fontSize: 20, color: 'var(--text)', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.05 }}>{day.n}</div>
        {isToday && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 14, height: 2, borderRadius: 1, background: 'var(--lime)' }} />}
      </div>

      {/* Vertical separator */}
      <div style={{ width: 1, background: 'var(--line)', alignSelf: 'stretch' }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{day.name}</div>
          {isDone && (
            <div style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" s={9} color={light ? '#FFF' : '#0B0B0C'} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>~{day.mins} min</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>·</span>
          {day.groups.slice(0, 3).map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: groupColors[g] || 'var(--text-mute)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 500 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {isToday ? (
        <button style={{ alignSelf: 'center', padding: '8px 14px', borderRadius: 9, background: 'var(--lime)', color: '#0B0B0C', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="play" s={11} color="#0B0B0C" /> Empezar
        </button>
      ) : isDone ? (
        <div style={{ alignSelf: 'center', padding: '0 6px', color: 'var(--text-dim)' }}>
          <Icon name="chevR" s={14} />
        </div>
      ) : (
        <div style={{ alignSelf: 'center', padding: '0 6px', color: 'var(--text-dim)' }}>
          <Icon name="chevR" s={14} />
        </div>
      )}
    </div>
  );
};

const WeekStat = ({ n, label, unit }) => (
  <div style={{ flex: 1 }}>
    <div style={{ display: 'baseline', alignItems: 'baseline', gap: 3 }}>
      <span className="ta-mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{n}</span>
      {unit && <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', marginLeft: 3 }}>{unit}</span>}
    </div>
    <div className="ta-mono" style={{ fontSize: 8, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginTop: 1 }}>{label}</div>
  </div>
);

const Divider = ({ light }) => <div style={{ width: 1, background: 'var(--line)' }} />;

// ─────────────────────────────────────────────────────────────
// 3 · COACH · CLIENT DETAIL (desktop)
// ─────────────────────────────────────────────────────────────
const CoachClientDetailV3 = ({ light = false }) => {
  return (
    <Themed light={light} w={1240} h={820}>
      <DesktopShell
        active="athletes"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Alumnos <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>María López</span></span>}
        actions={<>
          <Button size="sm" variant="ghost" icon="msg">Mensaje</Button>
          <Button size="sm" variant="secondary" icon="calendar">Asignar plan</Button>
          <Button size="sm" icon="plus">Workout</Button>
        </>}
      >
        <div style={{ flex: 1, overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header card: avatar + meta + stats */}
          <div style={{ display: 'flex', gap: 18, padding: 20, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14 }}>
            <Avatar3 name="ML" size={64} accent="#A78BFA" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em' }}>María López</div>
                <Badge tone="success">Activa</Badge>
                <Badge tone="neutral">Recomp · S5/8</Badge>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--text-mute)' }}>
                <span>maria@mail.com</span><span>·</span>
                <span>34 años · 1.66m</span><span>·</span>
                <span>Asignada hace 3 meses</span>
              </div>

              {/* Inline stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
                <MiniStat label="ÚLTIMA SESIÓN" value="Hoy 19:38" sub="Push A · 53 min" tone="lime" />
                <MiniStat label="ADHERENCIA · 30D" value="92%" sub="11/12 sesiones" trend="+8%" />
                <MiniStat label="VOLUMEN · 7D" value="13.240" sub="kg totales" trend="+12%" />
                <MiniStat label="PESO CORPORAL" value="61.4" sub="kg · −1.2 kg" trend="−1.9%" tone="success" />
              </div>
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, flex: 1, minHeight: 0 }}>
            {/* Left: progress chart + recent sessions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              {/* Bodyweight chart */}
              <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>PESO CORPORAL · 8 SEMANAS</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span className="ta-mono" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>61.4</span>
                      <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>kg</span>
                      <span className="ta-mono" style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>−1.9% · 8s</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['1M', '3M', '8S', '6M'].map((p) => (
                      <button key={p} style={{ padding: '4px 10px', borderRadius: 7, background: p === '8S' ? 'var(--bg-3)' : 'transparent', border: '1px solid var(--line)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
                    ))}
                  </div>
                </div>
                <BodyweightChart light={light} />
              </div>

              {/* Recent sessions */}
              <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>SESIONES RECIENTES</div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--lime)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Ver todas →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px 80px 60px 70px 24px', columnGap: 10, fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', letterSpacing: '.08em', fontWeight: 700, padding: '6px 4px', borderBottom: '1px solid var(--line)' }}>
                  <span>FECHA</span><span>WORKOUT</span><span style={{ textAlign: 'right' }}>VOL kg</span><span style={{ textAlign: 'center' }}>SETS</span><span style={{ textAlign: 'center' }}>RPE</span><span style={{ textAlign: 'center' }}>ENERGÍA</span><span></span>
                </div>
                {[
                  { d: 'HOY', t: '19:38', name: 'Push A', vol: '6.840', sets: '14/14', rpe: 7.8, energy: 4 },
                  { d: 'AYER', t: '07:12', name: 'Legs A', vol: '11.220', sets: '16/16', rpe: 8.4, energy: 5 },
                  { d: 'JUE 24', t: '19:50', name: 'Pull A', vol: '8.120', sets: '15/15', rpe: 7.2, energy: 3 },
                  { d: 'MAR 22', t: '07:05', name: 'Push B', vol: '6.650', sets: '12/14', rpe: 8.0, energy: 3, partial: true },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px 80px 60px 70px 24px', columnGap: 10, alignItems: 'center', padding: '10px 4px', borderBottom: i < 3 ? '1px solid var(--line)' : 'none' }}>
                    <div>
                      <div className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--lime)' : 'var(--text)' }}>{s.d}</div>
                      <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{s.t}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                      {s.partial && <Badge tone="warn">Parcial</Badge>}
                    </div>
                    <span className="ta-mono" style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{s.vol}</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'center' }}>{s.sets}</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 700, textAlign: 'center' }}>{s.rpe}</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width: 4, height: 11, borderRadius: 1, background: n <= s.energy ? 'var(--lime)' : 'var(--bg-3)' }} />
                      ))}
                    </div>
                    <Icon name="chevR" s={12} color="var(--text-dim)" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: plan + adherence + notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              {/* Plan card */}
              <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>PLAN ACTIVO</div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-mute)', cursor: 'pointer' }}><Icon name="more" s={14} /></button>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>Recomposición · 8 semanas</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
                  <span>Inicio 23 sep</span><span>·</span><span>Fin 17 nov</span>
                </div>
                {/* Plan progress */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>SEMANA 5 / 8</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 700 }}>62%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,1,1,1,0.6,0,0,0].map((w, i) => (
                      <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-3)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, width: `${w * 100}%`, background: 'var(--lime)' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="secondary" block style={{ marginTop: 14 }}>Ver plan</Button>
              </div>

              {/* Adherence heatmap */}
              <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14 }}>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700, marginBottom: 10 }}>ACTIVIDAD · ÚLTIMOS 90 DÍAS</div>
                <Heatmap />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text-mute)' }}>
                  <span>Menos</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0.1, 0.3, 0.55, 0.8, 1].map(o => <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(215,255,58,${o})` }} />)}
                  </div>
                  <span>Más</span>
                </div>
              </div>

              {/* Coach notes */}
              <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>NOTAS · 3</div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--lime)', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="plus" s={11} /> Agregar
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
                  <NoteRow tag="MOLESTIA" date="hoy" text="Reportó molestia leve hombro derecho en press militar. Sustituir por landmine." color="var(--warn)" />
                  <NoteRow tag="OBJETIVO" date="hace 1 sem" text="Quiere preparar la 10K en febrero. Ajustar volumen tren inferior progresivamente." color="var(--info)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesktopShell>
    </Themed>
  );
};

// ─── Helpers ──────────────────────────────────────────────────
const StatusBar = ({ light }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 38, padding: '12px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, color: 'var(--text)' }}>
    <span className="ta-mono" style={{ fontSize: 12, fontWeight: 600 }}>9:41</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <span style={{ fontSize: 9 }}>●●●●</span>
      <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke="currentColor" /><rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" /><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
    </div>
  </div>
);

const HomeBar = ({ light }) => (
  <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 110, height: 4, borderRadius: 2, background: 'var(--text)', opacity: 0.55, zIndex: 20 }} />
);

const iconBtn = (light) => ({
  width: 32, height: 32, borderRadius: 8, background: 'var(--bg-1)', border: '1px solid var(--line-2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer',
});

const navIconBtn = (light) => ({
  width: 52, height: 52, borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line-2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', flexShrink: 0,
});

const pillBtn = (light, primary) => ({
  padding: '5px 9px', borderRadius: 6,
  background: primary ? (light ? 'rgba(255,255,255,.85)' : 'rgba(11,11,12,.75)') : (light ? 'rgba(255,255,255,.4)' : 'rgba(11,11,12,.4)'),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${light ? 'rgba(11,11,12,.15)' : 'rgba(255,255,255,.15)'}`,
  color: primary ? (light ? '#0B0B0C' : '#F5F5F4') : (light ? '#0B0B0C' : '#F5F5F4'),
  fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
});

const ChipInput = ({ label, value, light, active }) => (
  <div style={{
    height: 56, borderRadius: 10, padding: '6px 10px',
    background: active ? (light ? '#FFFFFF' : 'var(--bg-2)') : 'var(--bg-2)',
    border: `1px solid ${active ? 'var(--lime)' : 'var(--line-2)'}`,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    boxShadow: active ? '0 0 0 3px rgba(215,255,58,.12)' : 'none',
  }}>
    <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
    <span className="ta-mono" style={{ fontSize: 22, fontWeight: 700, color: value === '—' ? 'var(--text-dim)' : 'var(--text)', letterSpacing: '-.02em', lineHeight: 1 }}>{value}</span>
  </div>
);

const BottomTabs = ({ active, light }) => {
  const tabs = [
    { id: 'semana', icon: 'calendar', label: 'Semana' },
    { id: 'historial', icon: 'history', label: 'Historial' },
    { id: 'progreso', icon: 'chart', label: 'Progreso' },
    { id: 'msg', icon: 'msg', label: 'Mensajes' },
    { id: 'cuenta', icon: 'user', label: 'Cuenta' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 76, padding: '8px 8px 24px', background: light ? 'rgba(247,247,245,.85)' : 'rgba(11,11,12,.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', zIndex: 5 }}>
      {tabs.map(t => (
        <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: t.id === active ? 1 : 0.55 }}>
          <Icon name={t.icon} s={20} color={t.id === active ? 'var(--lime)' : 'var(--text)'} />
          <span style={{ fontSize: 9, fontWeight: 600, color: t.id === active ? 'var(--lime)' : 'var(--text-mute)', letterSpacing: '.02em' }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

const Avatar3 = ({ name, size = 40, accent = 'var(--lime)' }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2.5,
    background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
    color: '#0B0B0C', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
  }}>{name}</div>
);

const MiniStat = ({ label, value, sub, trend, tone }) => (
  <div>
    <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.12em', fontWeight: 700 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
      <span className="ta-mono" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: tone === 'lime' ? 'var(--lime)' : tone === 'success' ? 'var(--success)' : 'var(--text)' }}>{value}</span>
      {trend && <span className="ta-mono" style={{ fontSize: 10, color: trend.startsWith('−') || trend.startsWith('-') ? 'var(--success)' : 'var(--success)', fontWeight: 600 }}>{trend}</span>}
    </div>
    <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{sub}</div>
  </div>
);

const BodyweightChart = ({ light }) => {
  const W = 700, H = 140, PAD_L = 30, PAD_R = 8, PAD_T = 14, PAD_B = 22;
  const data = [62.6, 62.4, 62.5, 62.2, 61.9, 61.8, 61.6, 61.4];
  const max = 63, min = 61;
  const xs = data.map((_, i) => PAD_L + ((W - PAD_L - PAD_R) / (data.length - 1)) * i);
  const ys = data.map(v => PAD_T + (H - PAD_T - PAD_B) * (1 - (v - min) / (max - min)));
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${ys[i]}`).join(' ');
  const areaPath = `${linePath} L ${xs[xs.length-1]} ${H - PAD_B} L ${xs[0]} ${H - PAD_B} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D7FF3A" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#D7FF3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y axis labels */}
      {[63, 62, 61].map(v => {
        const y = PAD_T + (H - PAD_T - PAD_B) * (1 - (v - min) / (max - min));
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--line)" strokeDasharray="2 3" />
            <text x={4} y={y + 3} fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dim)">{v}</text>
          </g>
        );
      })}
      {/* X labels */}
      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((lbl, i) => (
        <text key={i} x={xs[i]} y={H - 6} fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dim)" textAnchor="middle">{lbl}</text>
      ))}
      <path d={areaPath} fill="url(#bw-grad)" />
      <path d={linePath} stroke="var(--lime)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r={i === data.length - 1 ? 4 : 2.5} fill="var(--lime)" stroke="var(--bg-1)" strokeWidth={i === data.length - 1 ? 2 : 1} />
      ))}
      {/* last value annotation */}
      <text x={xs[xs.length-1] - 8} y={ys[ys.length-1] - 10} fontSize="11" fontFamily="var(--font-mono)" fill="var(--lime)" textAnchor="end" fontWeight="700">61.4</text>
    </svg>
  );
};

const Heatmap = () => {
  // 13 weeks × 7 days
  const cells = [];
  let seed = 1;
  for (let w = 0; w < 13; w++) {
    for (let d = 0; d < 7; d++) {
      seed = (seed * 9301 + 49297) % 233280;
      const r = seed / 233280;
      const v = r < 0.45 ? 0 : r < 0.6 ? 0.3 : r < 0.78 ? 0.55 : r < 0.92 ? 0.8 : 1;
      cells.push({ w, d, v });
    }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3 }}>
      {Array.from({ length: 13 }).map((_, w) => (
        <div key={w} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
          {cells.filter(c => c.w === w).map((c, i) => (
            <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 2, background: c.v === 0 ? 'var(--bg-3)' : `rgba(215,255,58,${c.v})` }} />
          ))}
        </div>
      ))}
    </div>
  );
};

const NoteRow = ({ tag, date, text, color }) => (
  <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <span className="ta-mono" style={{ fontSize: 9, color, letterSpacing: '.1em', fontWeight: 700 }}>{tag}</span>
      <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>{date}</span>
    </div>
    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{text}</div>
  </div>
);

Object.assign(window, {
  SessionExecutionV3, SessionRestOverlayV3, WeekViewV3, CoachClientDetailV3,
});
