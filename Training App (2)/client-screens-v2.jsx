// client-screens-v2.jsx — Versiones v2 de pantallas Alumno
// Mejoras: supersets, calentamiento, media viewer, energy 1-5, resumen rich

const PHONE_W2 = 320;
const PHONE_H2 = 680;

// ─────────────────────────────────────────────────────────────
// V2 · Workout detail · con supersets, warmup + thumbs
// ─────────────────────────────────────────────────────────────
const ClientWorkoutDetailV2 = () => {
  const ROW = (n, r, i, w, ss, m) => ({ name: n, sets: r, intensity: i, weight: w, ss, media: m });
  const blocks = [
    { kind: 'warmup', minutes: 8, items: ['5 min cinta · zona 2', 'Movilidad hombros', 'Press barra vacía 2×10'] },
    { kind: 'ex', ex: ROW('Press banca barra', '4 × 6-8', 'RPE 8', '72.5 kg', null, true) },
    { kind: 'ex', ex: ROW('Press militar mancuernas', '3 × 8-10', 'RIR 2', '24 kg', null, true) },
    { kind: 'superset', group: 'A', rest: 60, rounds: 3, items: [
      ROW('Aperturas polea alta', '3 × 12-15', 'RIR 1', 'pin 8', 'A', true),
      ROW('Press francés mancuerna', '3 × 12', 'RIR 1', '14 kg', 'A', false),
    ]},
    { kind: 'ex', ex: ROW('Elevaciones laterales', '4 × 12-15', 'RIR 0-1', '8 kg', null, true) },
  ];

  return (
    <PhoneV2>
      {/* Header con bg */}
      <div style={{ position: 'relative', background: 'linear-gradient(180deg, #1c1c20 0%, var(--bg) 100%)', padding: '52px 18px 14px', borderBottom: '1px solid var(--line)' }}>
        <button style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(11,11,12,.5)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', position: 'absolute', top: 50, left: 14 }}>
          <Icon name="chevL" s={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.1em', fontWeight: 700 }}>HOY · DÍA 12 / 56</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.1 }}>Push A · Pecho/Hombro</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--text-mute)' }}>
          <span>~50 min</span><span>·</span><span>5 ejercicios</span><span>·</span><span>1 biserie</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {blocks.map((b, i) => {
          if (b.kind === 'warmup') return (
            <div key={i} style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderLeft: '3px solid var(--warn)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="timer" s={14} color="var(--warn)" />
                <span className="ta-mono" style={{ fontSize: 9, color: 'var(--warn)', letterSpacing: '.1em', fontWeight: 700 }}>CALENTAMIENTO · {b.minutes} MIN</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.5 }}>{b.items.join(' · ')}</div>
            </div>
          );
          if (b.kind === 'superset') return (
            <div key={i} style={{ background: 'rgba(215,255,58,.04)', border: '1px solid var(--lime)', borderRadius: 10, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 8px' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--lime)', color: '#0B0B0C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{b.group}</div>
                <span className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.1em', fontWeight: 700 }}>BISERIE · {b.rounds} RONDAS · {b.rest}s DESC</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {b.items.map((ex, j) => <ExRowMobile key={j} ex={ex} compact />)}
              </div>
            </div>
          );
          return <ExRowMobile key={i} ex={b.ex} />;
        })}
      </div>

      <div style={{ padding: 14, paddingBottom: 18, background: 'linear-gradient(180deg, transparent, var(--bg) 30%)', borderTop: '1px solid var(--line)' }}>
        <Button size="xl" block icon="play">Empezar entrenamiento</Button>
      </div>
    </PhoneV2>
  );
};

const ExRowMobile = ({ ex, compact }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? 8 : '10px 12px', background: compact ? 'transparent' : 'var(--bg-1)', border: compact ? 'none' : '1px solid var(--line)', borderRadius: 10 }}>
    {ex.media ? (
      <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 7, background: 'linear-gradient(135deg, #2a2a2e, #1a1a1d)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', flexShrink: 0 }}>
        <Icon name="play" s={14} />
      </div>
    ) : (
      <div style={{ width: 38, height: 38, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexShrink: 0 }}>
        <Icon name="dumbbell" s={16} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: 'var(--text)' }}>{ex.name}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
        <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text)', fontWeight: 600 }}>{ex.sets}</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>·</span>
        <span className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', fontWeight: 600 }}>{ex.intensity}</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>·</span>
        <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{ex.weight}</span>
      </div>
    </div>
    <Icon name="chevR" s={14} color="var(--text-dim)" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// V2 · Sesión en progreso · estado normal
// ─────────────────────────────────────────────────────────────
const ClientSessionV2 = () => {
  return (
    <PhoneV2>
      <SessionHeader exNum={3} exTotal={5} title="Aperturas polea alta" subtitle="A · BISERIE · 3 series · RIR 1" exit />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Media viewer */}
        <div style={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, #1f1f23, #0f0f12)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(215,255,58,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="play" s={22} color="#0B0B0C" />
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', background: 'rgba(11,11,12,.7)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', fontWeight: 700 }}>0:18</span>
          </div>
          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 4 }}>
            <button style={{ padding: '4px 8px', background: 'rgba(11,11,12,.7)', backdropFilter: 'blur(8px)', border: '1px solid var(--line-2)', borderRadius: 5, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Técnica</button>
            <button style={{ padding: '4px 8px', background: 'rgba(11,11,12,.4)', border: '1px solid var(--line-2)', borderRadius: 5, color: 'var(--text-mute)', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Alternativas</button>
          </div>
        </div>

        {/* Sets tracker */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sets</div>
            <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--lime)' }} />Autosave</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SetRowV2 n={1} kg="pin 8" reps="14" rir="1" done />
            <SetRowV2 n={2} kg="pin 8" reps="13" rir="1" done />
            <SetRowV2 n={3} kg="pin 8" reps="—" rir="—" active />
          </div>

          <div style={{ marginTop: 14, padding: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 4 }}>NOTA DEL COACH</div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>Subir explosivo, bajar 3s. Mantené leve flexión de codo.</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, background: 'var(--bg)' }}>
        <Button variant="secondary" size="lg" style={{ flex: '0 0 auto', paddingLeft: 14, paddingRight: 14 }}><Icon name="chevL" s={16} /></Button>
        <Button size="lg" block>Guardar set 3</Button>
        <Button variant="secondary" size="lg" style={{ flex: '0 0 auto', paddingLeft: 14, paddingRight: 14 }}><Icon name="chevR" s={16} /></Button>
      </div>
    </PhoneV2>
  );
};

const SessionHeader = ({ exNum, exTotal, title, subtitle, exit }) => (
  <div style={{ position: 'relative', padding: '50px 14px 12px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
    {exit && (
      <button style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', position: 'absolute', top: 48, left: 12 }}>
        <Icon name="x" s={14} />
      </button>
    )}
    <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, textAlign: 'center', marginTop: 6 }}>EJERCICIO {exNum} / {exTotal}</div>
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
      {Array.from({ length: exTotal }).map((_, i) => (
        <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: i < exNum - 1 ? 'var(--lime)' : i === exNum - 1 ? 'var(--lime)' : 'var(--bg-3)' }} />
      ))}
    </div>
    <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em', textAlign: 'center', marginTop: 8 }}>{title}</div>
    <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textAlign: 'center', marginTop: 2 }}>{subtitle}</div>
  </div>
);

const SetRowV2 = ({ n, kg, reps, rir, done, active, rest }) => {
  const bg = done ? 'var(--bg-1)' : active ? 'rgba(215,255,58,.06)' : 'var(--bg-1)';
  const bd = done ? 'var(--line)' : active ? 'var(--lime)' : 'var(--line)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 56px 22px', gap: 6, alignItems: 'center', padding: '10px 10px', background: bg, border: `1px solid ${bd}`, borderRadius: 9 }}>
      <div className="ta-mono" style={{ fontSize: 11, color: done ? 'var(--text-dim)' : 'var(--lime)', fontWeight: 700 }}>SET {n}</div>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="ta-mono" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{kg}</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>kg</span>
      </div>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="ta-mono" style={{ fontSize: 13, color: reps === '—' ? 'var(--text-dim)' : 'var(--text)', fontWeight: 600 }}>{reps}</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>rep</span>
      </div>
      <div style={{ textAlign: 'center', padding: '3px 0', background: rir === '—' ? 'transparent' : 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 6 }}>
        <span className="ta-mono" style={{ fontSize: 11, color: rir === '—' ? 'var(--text-dim)' : 'var(--lime)', fontWeight: 700 }}>{rir === '—' ? '—' : `RIR ${rir}`}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {done ? <Icon name="check" s={14} color="var(--success)" /> : null}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// V2 · Sesión · estado REST TIMER prominente
// ─────────────────────────────────────────────────────────────
const ClientSessionRestV2 = () => (
  <PhoneV2>
    <SessionHeader exNum={3} exTotal={5} title="Aperturas polea alta" subtitle="A · BISERIE · 3 series · RIR 1" exit />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, background: 'radial-gradient(circle at 50% 40%, rgba(215,255,58,.08), transparent 60%)' }}>
      <div className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', letterSpacing: '.15em', fontWeight: 700 }}>DESCANSO</div>

      {/* Big timer ring */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--bg-2)" strokeWidth="6" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--lime)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 92}`} strokeDashoffset={`${2 * Math.PI * 92 * 0.4}`} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div className="ta-mono" style={{ fontSize: 56, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1 }}>0:36</div>
          <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.1em' }}>DE 1:00</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Button size="md" variant="secondary">−15s</Button>
        <Button size="md" variant="secondary" icon="pause">Pausar</Button>
        <Button size="md" variant="secondary">+15s</Button>
      </div>

      <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, textAlign: 'center', maxWidth: 240 }}>
        <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 4 }}>SIGUIENTE · A2</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Press francés mancuerna</div>
        <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>3 × 12 · RIR 1 · 14 kg</div>
      </div>
    </div>

    <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--line)' }}>
      <Button size="lg" block>Saltar descanso</Button>
    </div>
  </PhoneV2>
);

// ─────────────────────────────────────────────────────────────
// V2 · Sesión completada · con energy 1-5 + resumen
// ─────────────────────────────────────────────────────────────
const ClientSessionCompleteV2 = () => (
  <PhoneV2>
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ padding: '60px 18px 20px', background: 'linear-gradient(180deg, rgba(215,255,58,.12) 0%, var(--bg) 100%)', borderBottom: '1px solid var(--line)' }}>
        <div className="ta-mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.15em', fontWeight: 700 }}>SESIÓN COMPLETADA</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.1 }}>Push A</div>
        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>HOY · 18:45 — 19:38 · 53 MIN</div>

        {/* Big stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
          <StatV2 label="VOLUMEN" value="6.840" unit="kg" />
          <StatV2 label="SETS" value="14/14" />
          <StatV2 label="PR" value="+1" accent />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Energy */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>¿CÓMO TE SENTISTE?</div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, marginBottom: 10 }}>Energía durante el entrenamiento</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const sel = n === 4;
              return (
                <button key={n} style={{
                  flex: 1, height: 56, borderRadius: 9,
                  background: sel ? 'var(--lime)' : 'var(--bg-2)',
                  border: `1px solid ${sel ? 'var(--lime)' : 'var(--line-2)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  cursor: 'pointer', color: sel ? '#0B0B0C' : 'var(--text-mute)',
                }}>
                  <span className="ta-mono" style={{ fontSize: 16, fontWeight: 700 }}>{n}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '.05em' }}>{['BAJA','','MEDIA','','ALTA'][n-1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top sets */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>DESTACADOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Highlight label="Press banca" value="75 kg × 7" tag="PR" />
            <Highlight label="Aperturas polea" value="3 × 14 reps" tag="+1 rep" />
          </div>
        </div>
      </div>
    </div>

    <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
      <Button variant="secondary" size="lg" style={{ flex: 1 }}>Ver detalle</Button>
      <Button size="lg" style={{ flex: 1.4 }}>Confirmar</Button>
    </div>
  </PhoneV2>
);

const StatV2 = ({ label, value, unit, accent }) => (
  <div style={{ background: 'var(--bg-1)', border: `1px solid ${accent ? 'var(--lime)' : 'var(--line)'}`, borderRadius: 10, padding: '10px 8px', textAlign: 'left' }}>
    <div className="ta-mono" style={{ fontSize: 8, color: accent ? 'var(--lime)' : 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
      <span className="ta-mono" style={{ fontSize: 22, fontWeight: 700, color: accent ? 'var(--lime)' : 'var(--text)', letterSpacing: '-.02em' }}>{value}</span>
      {unit && <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{unit}</span>}
    </div>
  </div>
);

const Highlight = ({ label, value, tag }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
      <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{value}</div>
    </div>
    <Badge tone="lime">{tag}</Badge>
  </div>
);

// PhoneV2 wrapper minimal — re-uses iOS frame from main file via window.IOSDevice if available
const PhoneV2 = ({ children }) => (
  <div style={{ width: PHONE_W2, height: PHONE_H2, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 24, position: 'relative', border: '1px solid var(--line)' }} className="ta-app">
    {/* Status bar */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 38, padding: '12px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, color: 'var(--text)' }}>
      <span className="ta-mono" style={{ fontSize: 12, fontWeight: 600 }}>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <span style={{ fontSize: 9 }}>●●●●</span>
        <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke="currentColor" /><rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" /><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
      </div>
    </div>
    {children}
    {/* Home indicator */}
    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 110, height: 4, borderRadius: 2, background: 'var(--text)', opacity: 0.55 }} />
  </div>
);

Object.assign(window, {
  ClientWorkoutDetailV2, ClientSessionV2, ClientSessionRestV2, ClientSessionCompleteV2
});
