// client-screens.jsx — 8 pantallas Alumno (mobile, 320x680)

const PHONE_W = 320;
const PHONE_H = 680;

// ─────────────────────────────────────────────────────────────
// 1. HOME / SEMANA
// ─────────────────────────────────────────────────────────────
const ClientHome = () => {
  const days = [
    { d: 'L', n: 22, done: true },
    { d: 'M', n: 23, done: true },
    { d: 'X', n: 24, done: false, today: true },
    { d: 'J', n: 25, done: false },
    { d: 'V', n: 26, done: false },
    { d: 'S', n: 27, done: false },
    { d: 'D', n: 28, done: false, rest: true },
  ];
  const workouts = [
    { day: 'Hoy · Mié 24', title: 'Push A', sub: 'Pecho · Hombro · Tríceps', dur: '50 min', exs: 6, status: 'today' },
    { day: 'Jue 25', title: 'Pull A', sub: 'Espalda · Bíceps', dur: '45 min', exs: 5, status: 'up' },
    { day: 'Vie 26', title: 'Legs A', sub: 'Cuádriceps · Glúteo', dur: '55 min', exs: 6, status: 'up' },
    { day: 'Sáb 27', title: 'Upper B', sub: 'Pecho · Espalda', dur: '40 min', exs: 5, status: 'up' },
  ];
  return (
    <Phone>
      <div style={{ padding: '48px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', letterSpacing: '.04em' }}>Hola, María</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>Semana 4 <span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>/ 8</span></div>
          </div>
          <div style={{ position: 'relative' }}>
            <Avatar name="María López" size={36} tone="var(--lime)" />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, background: 'var(--danger)', border: '2px solid var(--bg)' }} />
          </div>
        </div>

        {/* Week strip */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {days.map((d, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 0',
              background: d.today ? 'var(--lime)' : 'var(--bg-1)',
              color: d.today ? '#0B0B0C' : (d.rest ? 'var(--text-dim)' : 'var(--text)'),
              border: `1px solid ${d.today ? 'var(--lime)' : 'var(--line)'}`,
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em' }}>{d.d}</span>
              <span className="ta-mono" style={{ fontSize: 14, fontWeight: 600 }}>{d.n}</span>
              {d.done ? <div style={{ width: 4, height: 4, borderRadius: 2, background: d.today ? '#0B0B0C' : 'var(--success)' }} /> :
                d.rest ? <div style={{ fontSize: 8, opacity: .6, fontFamily: 'var(--font-mono)' }}>REST</div> :
                <div style={{ width: 4, height: 4, borderRadius: 2, background: 'transparent' }} />}
            </div>
          ))}
        </div>

        {/* Weekly summary card */}
        <div style={{
          display: 'flex', gap: 12, padding: 14, background: 'var(--bg-1)',
          border: '1px solid var(--line)', borderRadius: 12, marginBottom: 20,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Adherencia</div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>2<span style={{ color: 'var(--text-mute)' }}>/4</span></div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Vol. total</div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>14.2<span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 2 }}>tn</span></div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Racha</div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="flame" s={16} color="var(--lime)" />12
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Próximo entreno</div>
      </div>

      <div style={{ padding: '0 20px 110px' }}>
        {/* Today card — BIG */}
        <div style={{
          padding: 18, borderRadius: 14, background: 'var(--lime)', color: '#0B0B0C',
          marginBottom: 10, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', opacity: .7 }}>HOY · MIÉ 24</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>Push A</div>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: .75, marginBottom: 18 }}>Pecho · Hombro · Tríceps · 6 ej · 50 min</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button size="lg" variant="primary" icon="play" style={{ background: '#0B0B0C', color: 'var(--lime)', flex: 1 }}>Empezar</Button>
            <Button size="lg" variant="ghost" style={{ background: 'rgba(11,11,12,.08)', color: '#0B0B0C', border: '1px solid rgba(11,11,12,.2)' }}>Ver</Button>
          </div>
        </div>

        {/* Upcoming */}
        {workouts.slice(1).map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 14, borderRadius: 12, background: 'var(--bg-1)',
            border: '1px solid var(--line)', marginBottom: 8,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>
              <Icon name="dumbbell" s={18} color="var(--text-mute)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{w.day}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>{w.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }} className="ta-ellipsis">{w.sub}</div>
            </div>
            <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>{w.dur}</div>
          </div>
        ))}
      </div>

      <MobileTabBar active="home" />
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. WORKOUT DETAIL
// ─────────────────────────────────────────────────────────────
const ClientWorkoutDetail = () => {
  const exs = [
    { name: 'Press banca barra', scheme: '4 × 6-8 @ RPE 8', rest: '120s', tag: 'Compuesto' },
    { name: 'Press militar mancuernas', scheme: '3 × 8-10 @ RIR 2', rest: '90s' },
    { name: 'Aperturas polea alta', scheme: '3 × 12-15 @ RIR 1', rest: '60s' },
    { name: 'Elevaciones laterales', scheme: '4 × 12-15 @ RIR 0-1', rest: '45s', note: 'Drop-set en la última serie' },
    { name: 'Copas (tríceps)', scheme: '3 × 10-12 @ RPE 8', rest: '60s' },
    { name: 'Press francés con mancuerna', scheme: '3 × 12-15 @ RIR 1', rest: '45s' },
  ];
  return (
    <Phone>
      <div style={{ padding: '44px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" s={18} />
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" s={18} />
        </div>
      </div>

      <div style={{ padding: '8px 20px 16px' }}>
        <Badge tone="limeSoft">Hoy · Mié 24</Badge>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.03em', marginTop: 10, lineHeight: 1.05 }}>Push A</div>
        <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>Pecho · Hombro · Tríceps</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-mute)' }}>
            <Icon name="timer" s={14} />50 min
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-mute)' }}>
            <Icon name="dumbbell" s={14} />6 ejercicios
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-mute)' }}>
            <Icon name="flame" s={14} />Alto
          </div>
        </div>
      </div>

      {/* Warmup */}
      <div style={{ margin: '0 20px 16px', padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, borderLeft: '3px solid var(--lime)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>Warm-up</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
          5' movilidad de hombro + 2 series de 10 reps press con 40% del peso de trabajo. Foco en retracción escapular.
        </div>
      </div>

      <div style={{ padding: '0 20px 140px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Ejercicios · 6</div>
        {exs.map((ex, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i === exs.length - 1 ? 'none' : '1px solid var(--line)' }}>
            <div className="ta-mono" style={{ fontSize: 13, color: 'var(--text-dim)', width: 22, fontWeight: 500 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{ex.name}</div>
              <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 3 }}>{ex.scheme} · descanso {ex.rest}</div>
              {ex.note && <div style={{ fontSize: 11, color: 'var(--lime)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="alert" s={11} />{ex.note}</div>}
            </div>
            {ex.tag && <Badge tone="neutral" size="sm">{ex.tag}</Badge>}
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 28px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
      }}>
        <Button size="xl" block icon="play" style={{ fontSize: 17 }}>Iniciar sesión</Button>
      </div>
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. SESSION IN PROGRESS
// ─────────────────────────────────────────────────────────────
const ClientSessionInProgress = () => {
  const sets = [
    { n: 1, reps: 8, kg: 60, rpe: 7, done: true },
    { n: 2, reps: 8, kg: 65, rpe: 8, done: true },
    { n: 3, reps: 7, kg: 65, rpe: 8.5, done: true, active: false },
    { n: 4, reps: '—', kg: 65, rpe: '—', done: false, active: true },
  ];
  return (
    <Phone>
      {/* Rest timer banner (prominent, fixed) */}
      <div style={{
        position: 'absolute', top: 36, left: 0, right: 0, zIndex: 25,
        margin: '4px 12px', padding: '10px 14px', borderRadius: 12,
        background: 'var(--lime)', color: '#0B0B0C',
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(215,255,58,.2)',
      }}>
        <Icon name="timer" s={20} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', opacity: .6 }}>DESCANSO</div>
          <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, marginTop: 2 }}>01:24<span style={{ fontSize: 11, opacity: .5, marginLeft: 6 }}>/ 02:00</span></div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,11,12,.1)', border: 'none', color: '#0B0B0C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pause" s={16} />
          </button>
          <button style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,11,12,.1)', border: 'none', color: '#0B0B0C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="reset" s={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '108px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Push A · Ej 1 de 6</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>Press banca barra</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="msg" s={16} />
        </div>
      </div>
      <div className="ta-mono" style={{ padding: '0 20px', fontSize: 11, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>4 × 6-8 @ RPE 8</span>
        <span style={{ color: 'var(--success)', fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--success)' }} />
          GUARDADO · 9:42
        </span>
      </div>

      {/* Sets */}
      <div style={{ padding: '18px 16px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 32px', gap: 6, padding: '0 4px 8px', fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
          <div>Set</div><div style={{ textAlign: 'center' }}>Reps</div><div style={{ textAlign: 'center' }}>Kg</div><div style={{ textAlign: 'center' }}>RPE</div><div />
        </div>
        {sets.map((s) => (
          <div key={s.n} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 32px', gap: 6, alignItems: 'center',
            padding: '8px 4px', background: s.active ? 'var(--bg-1)' : 'transparent',
            border: s.active ? '1px solid var(--lime)' : '1px solid transparent',
            borderRadius: 10, marginBottom: 4,
          }}>
            <div className="ta-mono" style={{
              width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.done ? 'var(--success)' : 'var(--bg-2)',
              color: s.done ? '#0B0B0C' : 'var(--text-mute)', fontSize: 11, fontWeight: 600,
            }}>{s.done ? <Icon name="check" s={12} /> : s.n}</div>
            <div className={'ta-mono'} style={{ textAlign: 'center', background: s.active ? 'var(--bg-2)' : 'transparent', border: s.active ? '1px solid var(--line-2)' : 'none', borderRadius: 8, padding: '8px 0', fontSize: 17, fontWeight: 600, color: s.done ? 'var(--text)' : s.active ? 'var(--text-mute)' : 'var(--text-dim)' }}>{s.reps}</div>
            <div className={'ta-mono'} style={{ textAlign: 'center', background: s.active ? 'var(--bg-2)' : 'transparent', border: s.active ? '1px solid var(--line-2)' : 'none', borderRadius: 8, padding: '8px 0', fontSize: 17, fontWeight: 600, color: s.done ? 'var(--text)' : s.active ? 'var(--text-mute)' : 'var(--text-dim)' }}>{s.kg}</div>
            <div className={'ta-mono'} style={{ textAlign: 'center', background: s.active ? 'var(--bg-2)' : 'transparent', border: s.active ? '1px solid var(--line-2)' : 'none', borderRadius: 8, padding: '8px 0', fontSize: 17, fontWeight: 600, color: s.done ? 'var(--text)' : s.active ? 'var(--text-mute)' : 'var(--text-dim)' }}>{s.rpe}</div>
            <div style={{ textAlign: 'right' }}>
              {s.done && <Icon name="check" s={14} color="var(--success)" />}
            </div>
          </div>
        ))}

        {/* Esfuerzo toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Esfuerzo</span>
          <Tabs variant="pills" tabs={['RPE', 'RIR']} active="RPE" />
        </div>

        {/* Note field */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <Icon name="edit" s={14} color="var(--text-mute)" />
          <span style={{ fontSize: 12, color: 'var(--text-mute)', flex: 1 }}>Nota del set (opcional)…</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 28px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        display: 'flex', gap: 8,
      }}>
        <Button size="xl" variant="secondary" style={{ width: 64 }} icon="timer"></Button>
        <Button size="xl" icon="check" style={{ flex: 1, fontSize: 16 }}>Completar set</Button>
      </div>
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. SESSION COMPLETED
// ─────────────────────────────────────────────────────────────
const ClientSessionCompleted = () => {
  const energy = 7;
  return (
    <Phone>
      <div style={{ padding: '52px 20px 8px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="check" s={30} color="#0B0B0C" />
        </div>
        <div style={{ fontSize: 11, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>Sesión completa</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 6 }}>Push A</div>
        <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 2 }}>Mié 24 · 9:15 → 10:08 · 53 min</div>
      </div>

      {/* Summary grid */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Card pad={12}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Volumen</div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>4.820<span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 4 }}>kg</span></div>
            <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>+240 vs prev</div>
          </Card>
          <Card pad={12}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Sets</div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>20<span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 4 }}>/ 20</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>6 ejercicios</div>
          </Card>
          <Card pad={12}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>RPE medio</div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>7.8</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>Target 8</div>
          </Card>
          <Card pad={12}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>PRs</div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="star" s={16} color="var(--lime)" />2
            </div>
            <div style={{ fontSize: 11, color: 'var(--lime)', marginTop: 2 }}>Banca · Militar</div>
          </Card>
        </div>
      </div>

      {/* Energy 1-10 */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Energía · ¿cómo te fue?</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 40, borderRadius: 7,
              background: i < energy ? 'var(--lime)' : 'var(--bg-2)',
              border: `1px solid ${i < energy ? 'var(--lime)' : 'var(--line-2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: i < energy ? '#0B0B0C' : 'var(--text-dim)',
            }}>{i + 1}</div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 6 }}>Nota para el coach</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            Hombro izquierdo un poco cargado en laterales. Dormí bien (7h), buena energía.
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 20px 28px', display: 'flex', gap: 8 }}>
        <Button size="lg" variant="secondary" icon="reset" style={{ flex: 1 }}>Repetir sesión</Button>
        <Button size="lg" style={{ flex: 1 }}>Listo</Button>
      </div>
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. COMMENTS THREAD (session)
// ─────────────────────────────────────────────────────────────
const ClientComments = () => {
  const msgs = [
    { who: 'coach', name: 'Nico · Coach', time: 'ayer 20:14', text: 'Vi la sesión, buen ritmo. Pero en press banca el 3er set bajaste a 7 reps. ¿Técnica o fatiga?', avatar: '#7AB8FF' },
    { who: 'me', name: 'Vos', time: 'ayer 21:02', text: 'Fatiga. Descansé 90s en vez de 2\'. La próxima banco los 2\' completos.', avatar: 'var(--lime)' },
    { who: 'coach', name: 'Nico · Coach', time: 'ayer 21:10', text: 'Perfecto. Para laterales, probá bajar a 10-12 reps y subir peso. Menos RIR, más estímulo.', avatar: '#7AB8FF' },
    { who: 'me', name: 'Vos', time: 'hoy 10:12', text: 'Anotado. Lo aplico el viernes.', avatar: 'var(--lime)' },
  ];
  return (
    <Phone>
      {/* Header */}
      <div style={{ padding: '44px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevL" s={18} />
          </div>
          <Tabs variant="pills" tabs={['Sesión', 'Por ejercicio']} active="Sesión" />
          <div style={{ width: 36 }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em', marginTop: 4, paddingLeft: 4 }}>Push A · Mié 24</div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', paddingLeft: 4, marginTop: 2 }}>Thread con Nico · Coach</div>
      </div>

      <div style={{ padding: '16px 14px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* context pill */}
        <div style={{ alignSelf: 'center', padding: '4px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 999, fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
          Comentarios · sesión completa
        </div>

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: m.who === 'me' ? 'row-reverse' : 'row' }}>
            <Avatar name={m.name} size={28} tone={m.avatar} />
            <div style={{ maxWidth: 230 }}>
              <div style={{ fontSize: 10, color: 'var(--text-mute)', marginBottom: 3, display: 'flex', gap: 6, justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span>·</span>
                <span className="ta-mono">{m.time}</span>
              </div>
              <div style={{
                padding: '10px 12px',
                background: m.who === 'me' ? 'var(--lime)' : 'var(--bg-1)',
                color: m.who === 'me' ? '#0B0B0C' : 'var(--text)',
                border: m.who === 'me' ? 'none' : '1px solid var(--line)',
                borderRadius: m.who === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: 14, lineHeight: 1.45, fontWeight: 500,
              }}>{m.text}</div>
            </div>
          </div>
        ))}

        {/* contextual quote */}
        <div style={{ alignSelf: 'flex-start', marginLeft: 36, padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderLeft: '2px solid var(--lime)', borderRadius: '8px 8px 8px 0', maxWidth: 230 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Referencia · Elevaciones laterales</div>
          <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>4 × 15 @ 6kg · RIR 0</div>
        </div>
      </div>

      {/* Composer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 14px 28px',
        background: 'var(--bg)', borderTop: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 44, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 22, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
            Responder a Nico…
          </div>
          <button style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--lime)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B0B0C' }}>
            <Icon name="send" s={18} />
          </button>
        </div>
      </div>
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 6. HISTORY (lista de sesiones)
// ─────────────────────────────────────────────────────────────
const ClientHistory = () => {
  const items = [
    { date: 'Mié 24 abr', title: 'Push A', mins: 53, vol: '4.820', rpe: 7.8, prs: 2, energy: 7, badge: 'lime' },
    { date: 'Lun 22 abr', title: 'Legs A', mins: 61, vol: '7.240', rpe: 8.2, prs: 0, energy: 6, badge: 'limeSoft' },
    { date: 'Sáb 20 abr', title: 'Pull A', mins: 48, vol: '5.110', rpe: 7.5, prs: 1, energy: 8, badge: 'limeSoft' },
    { date: 'Jue 18 abr', title: 'Push A', mins: 55, vol: '4.580', rpe: 8.0, prs: 0, energy: 5, badge: 'limeSoft' },
    { date: 'Mar 16 abr', title: 'Legs A', mins: 58, vol: '6.980', rpe: 7.9, prs: 1, energy: 7, badge: 'limeSoft' },
  ];
  return (
    <Phone>
      <div style={{ padding: '48px 20px 14px' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>Historial</div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>28 sesiones · últimos 30 días</div>
      </div>
      <div style={{ padding: '0 20px 8px' }}>
        <Tabs variant="pills" tabs={['Semana', 'Mes', 'Todo']} active="Mes" />
      </div>

      {/* Tiny chart */}
      <div style={{ padding: '10px 20px 12px' }}>
        <div style={{ padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Volumen semanal · tn</div>
              <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>14.2 <span style={{ fontSize: 11, color: 'var(--success)' }}>+8%</span></div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>Abr</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 54 }}>
            {[52, 68, 45, 72, 60, 85, 78, 92].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 7 ? 'var(--lime)' : 'var(--bg-3)', borderRadius: 3 }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 110px' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line)', alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: it.badge === 'lime' ? 'var(--lime)' : 'var(--bg-2)',
              border: `1px solid ${it.badge === 'lime' ? 'var(--lime)' : 'var(--line)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: it.badge === 'lime' ? '#0B0B0C' : 'var(--lime)',
            }}>
              <Icon name="check" s={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{it.date}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>{it.title}</div>
              <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{it.mins}' · {it.vol}kg · RPE {it.rpe}</div>
            </div>
            {it.prs > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', background: 'rgba(215,255,58,.12)', border: '1px solid rgba(215,255,58,.3)', borderRadius: 999 }}>
                <Icon name="star" s={11} color="var(--lime)" />
                <span className="ta-mono" style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 600 }}>{it.prs}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <MobileTabBar active="history" />
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 7. EXERCISE COMMENTS (contextual)
// ─────────────────────────────────────────────────────────────
const ClientExerciseComments = () => {
  const exs = [
    { name: 'Press banca barra', count: 2, last: 'Nico: "buen ritmo"' },
    { name: 'Press militar mancuernas', count: 0 },
    { name: 'Aperturas polea alta', count: 1, last: 'Vos: "probé nuevo ángulo"' },
    { name: 'Elevaciones laterales', count: 3, last: 'Nico: "bajá reps, sumá kg"', active: true },
    { name: 'Copas', count: 0 },
    { name: 'Press francés con mancuerna', count: 1, last: 'Nico: "buena progresión"' },
  ];
  return (
    <Phone>
      <div style={{ padding: '44px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevL" s={18} />
          </div>
          <Tabs variant="pills" tabs={['Sesión', 'Por ejercicio']} active="Por ejercicio" />
          <div style={{ width: 36 }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em', marginTop: 4, paddingLeft: 4 }}>Push A · Mié 24</div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', paddingLeft: 4, marginTop: 2 }}>Elegí un ejercicio para comentar</div>
      </div>

      <div style={{ padding: '14px 16px 28px' }}>
        {exs.map((ex, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: 12, marginBottom: 8,
            background: ex.active ? 'var(--bg-1)' : 'transparent',
            border: `1px solid ${ex.active ? 'var(--lime)' : 'var(--line)'}`,
            borderRadius: 12,
          }}>
            <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', width: 18, paddingTop: 2, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
              {ex.last && <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 3 }} className="ta-ellipsis">{ex.last}</div>}
              {!ex.last && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, fontStyle: 'italic' }}>Sin comentarios</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {ex.count > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: ex.active ? 'var(--lime)' : 'var(--bg-2)', borderRadius: 999 }}>
                  <Icon name="msg" s={11} color={ex.active ? '#0B0B0C' : 'var(--text-mute)'} />
                  <span className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: ex.active ? '#0B0B0C' : 'var(--text)' }}>{ex.count}</span>
                </div>
              ) : (
                <Icon name="plus" s={14} color="var(--text-mute)" />
              )}
              <Icon name="chevR" s={14} color="var(--text-mute)" />
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 8. EMPTY / FIRST TIME
// ─────────────────────────────────────────────────────────────
const ClientEmpty = () => (
  <Phone>
    <div style={{ padding: '48px 20px 14px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-mute)', letterSpacing: '.04em' }}>Hola, María</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>Bienvenida</div>
    </div>

    <div style={{ padding: '8px 20px 0' }}>
      <div style={{
        padding: 20, borderRadius: 16,
        background: 'linear-gradient(180deg, var(--bg-1), var(--bg))',
        border: '1px solid var(--line)',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="dumbbell" s={24} color="#0B0B0C" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>Tu plan todavía no está listo</div>
        <div style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.5, marginTop: 6 }}>
          Nico está armando tu programa de recomposición. Te llega una notificación apenas esté.
        </div>

        {/* steps */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Onboarding completado', done: true },
            { label: 'Medidas iniciales', done: true },
            { label: 'Plan en revisión', done: false, active: true },
            { label: 'Plan activo', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: s.done ? 'var(--lime)' : s.active ? 'transparent' : 'var(--bg-2)',
                border: `1px solid ${s.done ? 'var(--lime)' : s.active ? 'var(--lime)' : 'var(--line-2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.done && <Icon name="check" s={13} color="#0B0B0C" />}
                {s.active && <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--lime)', animation: 'ta-pulse 1.5s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontSize: 14, fontWeight: s.active ? 600 : 500, color: s.done || s.active ? 'var(--text)' : 'var(--text-mute)' }}>{s.label}</div>
              {s.active && <Badge tone="limeSoft" size="sm">En curso</Badge>}
            </div>
          ))}
        </div>
      </div>
    </div>

    <style>{`@keyframes ta-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }`}</style>

    <div style={{ padding: '16px 20px 0' }}>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Mientras tanto</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, alignItems: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="msg" s={16} color="var(--lime)" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Mandale un mensaje a Nico</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>Dudas sobre el plan</div>
          </div>
          <Icon name="chevR" s={14} color="var(--text-mute)" />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, alignItems: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="book" s={16} color="var(--lime)" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Guía de técnica básica</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>5 videos cortos</div>
          </div>
          <Icon name="chevR" s={14} color="var(--text-mute)" />
        </div>
      </div>
    </div>

    <MobileTabBar active="home" />
  </Phone>
);

Object.assign(window, {
  ClientHome, ClientWorkoutDetail, ClientSessionInProgress,
  ClientSessionCompleted, ClientComments, ClientHistory,
  ClientExerciseComments, ClientEmpty,
});
