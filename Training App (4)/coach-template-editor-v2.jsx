// coach-template-editor-v2.jsx — Editor de workout template (desktop)
// Drag-reorder · Targets · Supersets A/B/C · Calentamiento · Alternativas · Media

const SS_COL = { A: 'var(--lime)', B: '#7AB8FF', C: '#FFB547', D: '#FF8B8B', E: '#C084FC' };

const CoachTemplateEditorV2 = () => {
  // Selected exercise highlighted in inspector
  const blocks = [
    { id: 'w', kind: 'warmup', minutes: 8, items: ['5 min cinta · zona 2', 'Movilidad hombros', 'Press barra vacía 2×10'] },
    { id: 'e1', kind: 'ex', name: 'Press banca barra', muscle: 'Pecho', sets: 4, reps: '6-8', intensity: 'RPE 8', rest: 120, media: 2, alts: 2 },
    { id: 'e2', kind: 'ex', name: 'Press militar mancuernas', muscle: 'Hombro', sets: 3, reps: '8-10', intensity: 'RIR 2', rest: 90, media: 1, alts: 1 },
    { id: 'ss1', kind: 'superset', group: 'A', label: 'BISERIE A', items: [
      { id: 'e3', name: 'Aperturas polea alta', muscle: 'Pecho', sets: 3, reps: '12-15', intensity: 'RIR 1', rest: 60, media: 1, alts: 1, selected: true },
      { id: 'e4', name: 'Press francés mancuerna', muscle: 'Tríceps', sets: 3, reps: '12', intensity: 'RIR 1', rest: 60, media: 0, alts: 0 },
    ]},
    { id: 'e5', kind: 'ex', name: 'Elevaciones laterales', muscle: 'Hombro', sets: 4, reps: '12-15', intensity: 'RIR 0-1', rest: 45, media: 1, alts: 0 },
  ];

  return (
    <div style={{ width: 1240, height: 820 }}>
      <DesktopShell
        active="templates"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Templates <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>Push A</span></span>}
        actions={<>
          <Badge tone="warn">Borrador</Badge>
          <Button variant="secondary" size="sm">Vista previa</Button>
          <Button size="sm" icon="check">Guardar</Button>
        </>}
      >
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* CENTER: editor */}
          <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>Push A</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge tone="neutral">Fuerza</Badge>
                <Badge tone="neutral">Pecho</Badge>
                <Badge tone="neutral">+ tag</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>
              <span>~50 min estimado</span>
              <span>·</span>
              <span>5 ejercicios + warmup</span>
              <span>·</span>
              <span>1 biserie</span>
              <span>·</span>
              <span style={{ color: 'var(--text)' }}>Última edición hace 2h</span>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <Button size="sm" icon="plus" variant="secondary">Ejercicio</Button>
              <Button size="sm" variant="secondary"><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--lime)', marginRight: 4 }} />Crear superset</Button>
              <Button size="sm" variant="ghost" icon="timer">Editar warmup</Button>
              <div style={{ flex: 1 }} />
              <Button size="sm" variant="ghost" icon="reset">Histórico</Button>
            </div>

            {/* Block list */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blocks.map((b) => {
                if (b.kind === 'warmup') {
                  return (
                    <div key={b.id} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderLeft: '3px solid var(--warn)', borderRadius: 10 }}>
                      <div style={{ width: 22, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="more" s={14} style={{ transform: 'rotate(90deg)' }} />
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="timer" s={18} color="#0B0B0C" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="ta-mono" style={{ fontSize: 9, color: 'var(--warn)', letterSpacing: '.1em', fontWeight: 700 }}>FASE 1 · CALENTAMIENTO</span>
                          <span className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{b.minutes} min</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{b.items.join(' · ')}</div>
                      </div>
                      <Button variant="ghost" size="sm" icon="edit">Editar</Button>
                    </div>
                  );
                }
                if (b.kind === 'superset') {
                  return (
                    <div key={b.id} style={{ padding: 10, background: 'rgba(215,255,58,.04)', border: `1px solid ${SS_COL[b.group]}`, borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: SS_COL[b.group], color: '#0B0B0C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{b.group}</div>
                        <span className="ta-mono" style={{ fontSize: 10, color: SS_COL[b.group], letterSpacing: '.1em', fontWeight: 700 }}>{b.label} · 2 EJERCICIOS · DESC 60s × 3 RONDAS</span>
                        <div style={{ flex: 1 }} />
                        <button style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--line-2)', borderRadius: 6, color: 'var(--text-mute)', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer' }}>Disolver</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {b.items.map((ex) => (
                          <ExRow key={ex.id} ex={ex} grouped />
                        ))}
                      </div>
                    </div>
                  );
                }
                return <ExRow key={b.id} ex={b} />;
              })}

              {/* Add row */}
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', background: 'transparent', border: '1px dashed var(--line-2)', borderRadius: 10, color: 'var(--text-mute)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                <Icon name="plus" s={14} /> Agregar ejercicio
              </button>
            </div>
          </div>

          {/* RIGHT: Inspector */}
          <aside style={{ width: 340, borderLeft: '1px solid var(--line)', background: 'var(--bg-1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>EDITAR EJERCICIO</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>Aperturas polea alta</div>
              </div>
              <button style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}><Icon name="x" s={14} /></button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Group */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>SUPERSET / GRUPO</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[null, 'A', 'B', 'C', 'D', 'E'].map((g) => (
                    <button key={g || 'none'} style={{
                      flex: 1, height: 36, borderRadius: 8,
                      background: g === 'A' ? SS_COL.A : 'var(--bg-2)',
                      border: `1px solid ${g === 'A' ? SS_COL.A : 'var(--line-2)'}`,
                      color: g === 'A' ? '#0B0B0C' : g ? SS_COL[g] : 'var(--text-mute)',
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>{g || '—'}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 6, lineHeight: 1.4 }}>En Grupo A junto con Press francés mancuerna.</div>
              </div>

              {/* Warmup toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Marcar como calentamiento</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>Va en la fase 1, sin tracking de RPE</div>
                </div>
                <div style={{ width: 36, height: 22, borderRadius: 11, background: 'var(--bg-3)', border: '1px solid var(--line-2)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: 8, background: 'var(--text-mute)' }} />
                </div>
              </div>

              {/* Targets */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8 }}>OBJETIVO</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input label="Series" defaultValue="3" align="right" />
                  <Input label="Reps" defaultValue="12-15" align="right" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase' }}>Tipo</span>
                    <div style={{ display: 'flex', marginTop: 6, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 8 }}>
                      {['RPE', 'RIR', '—'].map((t) => (
                        <button key={t} style={{ flex: 1, padding: '6px 0', borderRadius: 6, background: t === 'RIR' ? 'var(--bg-3)' : 'transparent', border: 'none', color: t === 'RIR' ? 'var(--text)' : 'var(--text-mute)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <Input label="Valor" defaultValue="1" align="right" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Input label="Descanso (s)" defaultValue="60" align="right" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 6 }}>NOTA TÉCNICA</div>
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.45, minHeight: 60 }}>
                  Subir explosivo, bajar controlado 3 seg. Mantener leve flexión de codo.
                </div>
              </div>

              {/* Media */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>MEDIA · 1</span>
                  <button style={{ fontSize: 11, color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>+ subir</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', width: 76, height: 76, borderRadius: 8, background: 'linear-gradient(135deg, #2a2a2e, #1a1a1d)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
                    <Icon name="play" s={20} />
                    <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '1px 5px', background: 'rgba(11,11,12,.85)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--lime)', fontWeight: 700 }}>0:20</div>
                  </div>
                  <button style={{ width: 76, height: 76, borderRadius: 8, background: 'transparent', border: '1px dashed var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', cursor: 'pointer' }}>
                    <Icon name="plus" s={18} />
                  </button>
                </div>
              </div>

              {/* Alternatives */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.1em', fontWeight: 700 }}>ALTERNATIVAS · 1 / 3</span>
                  <button style={{ fontSize: 11, color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>+ agregar</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #2a2a2e, #1a1a1d)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
                    <Icon name="dumbbell" s={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Cruces polea baja</div>
                    <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>PECHO · si polea alta ocupada</div>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-mute)', cursor: 'pointer' }}><Icon name="trash" s={13} /></button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DesktopShell>
    </div>
  );
};

// Exercise row used inside editor
const ExRow = ({ ex, grouped }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '20px 44px 1fr 110px 90px 90px 80px',
    gap: 12, alignItems: 'center', padding: '10px 12px',
    background: ex.selected ? 'rgba(215,255,58,.06)' : 'var(--bg-1)',
    border: `1px solid ${ex.selected ? 'var(--lime)' : 'var(--line)'}`,
    borderRadius: 8,
  }}>
    <div style={{ color: 'var(--text-dim)', display: 'flex', justifyContent: 'center', cursor: 'grab' }}>
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2" cy="3" r="1.2"/><circle cx="2" cy="7" r="1.2"/><circle cx="2" cy="11" r="1.2"/><circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="7" r="1.2"/><circle cx="8" cy="11" r="1.2"/></svg>
    </div>
    <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #2a2a2e, #1a1a1d)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>
      <Icon name="dumbbell" s={18} />
      {ex.media > 0 && <div style={{ position: 'absolute', bottom: 2, right: 2, padding: '0 3px', background: 'rgba(11,11,12,.85)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1 }}><Icon name="play" s={7} color="var(--lime)" /><span className="ta-mono" style={{ fontSize: 7, color: 'var(--lime)', fontWeight: 700 }}>{ex.media}</span></div>}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{ex.name}</div>
      <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{ex.muscle.toUpperCase()}{ex.alts > 0 && ` · ${ex.alts} alt`}</div>
    </div>
    <div className="ta-mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', color: 'var(--text)' }}>{ex.sets} × {ex.reps}</div>
    <div className="ta-mono" style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'var(--lime)' }}>{ex.intensity}</div>
    <div className="ta-mono" style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', color: 'var(--text-mute)' }}>{ex.rest}s</div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
      <button style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--line-2)', color: 'var(--text-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="edit" s={13} /></button>
      <button style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--line-2)', color: 'var(--text-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="more" s={13} /></button>
    </div>
  </div>
);

Object.assign(window, { CoachTemplateEditorV2 });
