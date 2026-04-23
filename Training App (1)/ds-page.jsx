// ds-page.jsx — Design System page contents (tokens + component library)

const DSPage = () => {
  const Sec = ({ title, children, cols = 1 }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
    </div>
  );

  const Swatch = ({ name, val, big }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: big ? 88 : 56, background: val, borderRadius: 10, border: '1px solid var(--line)' }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>{val}</div>
      </div>
    </div>
  );

  const TypeRow = ({ name, size, weight, sample = 'Levanta, respira, repite.' }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 110, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>{size}·{weight}</div>
      </div>
      <div style={{ fontSize: parseInt(size), fontWeight: weight, letterSpacing: '-.02em' }}>{sample}</div>
    </div>
  );

  return (
    <div className="ta-app" style={{ width: 1360, minHeight: 1800, padding: 40, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="logo" s={24} color="#0B0B0C" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.03em' }}>REGEN <span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>/ Design System</span></div>
          </div>
          <div style={{ color: 'var(--text-mute)', fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
            MVP de recomposición corporal. Dark primario con acento neón, tipografía sans de display + mono para métricas, componentes minimalistas de alta densidad para coach y hit-targets grandes para alumno.
          </div>
        </div>
        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.1em' }}>v0.1 · 04.2026</div>
      </div>

      {/* Grid: 3 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        {/* COL 1 — Colors & Type */}
        <div>
          <Sec title="Color · Brand" cols={2}>
            <Swatch name="Lime / primary" val="#D7FF3A" big />
            <Swatch name="Almost black" val="#0B0B0C" big />
          </Sec>
          <Sec title="Color · Surface" cols={3}>
            <Swatch name="bg" val="#0B0B0C" />
            <Swatch name="bg-1" val="#141417" />
            <Swatch name="bg-2" val="#1C1C20" />
            <Swatch name="bg-3" val="#26262C" />
            <Swatch name="line" val="#26262C" />
            <Swatch name="line-2" val="#33333A" />
          </Sec>
          <Sec title="Color · Semantic" cols={4}>
            <Swatch name="success" val="#6EE7A8" />
            <Swatch name="warn" val="#FFB547" />
            <Swatch name="danger" val="#FF5B5B" />
            <Swatch name="info" val="#7AB8FF" />
          </Sec>

          <Sec title="Typography">
            <div>
              <div style={{ display: 'flex', gap: 24, padding: '12px 0', borderBottom: '1px solid var(--line-2)', marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Sans · Display/UI</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em' }}>Space Grotesk</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Mono · Numbers</div>
                  <div className="ta-mono" style={{ fontSize: 28, fontWeight: 500 }}>JetBrains Mono</div>
                </div>
              </div>
              <TypeRow name="Display" size="34px" weight="700" />
              <TypeRow name="Title" size="22px" weight="700" />
              <TypeRow name="Heading" size="17px" weight="600" />
              <TypeRow name="Body" size="14px" weight="400" sample="Sets, reps, RPE, notas y descansos — lo necesario, nada más." />
              <TypeRow name="Caption" size="12px" weight="500" sample="Últimos 7 días · +3.2kg proyectado" />
            </div>
          </Sec>
        </div>

        {/* COL 2 — Radius, spacing, shadows, badges */}
        <div>
          <Sec title="Radius" cols={5}>
            {[4, 8, 12, 16, 20].map((r) => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: r }} />
                <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{r}px</div>
              </div>
            ))}
          </Sec>

          <Sec title="Spacing · 4-base">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {[4, 8, 12, 16, 20, 24, 32, 40, 48].map((s) => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: s, height: s, background: 'var(--lime)' }} />
                  <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{s}</div>
                </div>
              ))}
            </div>
          </Sec>

          <Sec title="Shadow">
            <div style={{ display: 'flex', gap: 16 }}>
              {[['sm', '0 1px 2px rgba(0,0,0,.4)'], ['md', '0 8px 24px rgba(0,0,0,.35)'], ['lg', '0 24px 48px rgba(0,0,0,.5)']].map(([n, v]) => (
                <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: '100%', height: 56, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: v }} />
                  <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>shadow-{n}</div>
                </div>
              ))}
            </div>
          </Sec>

          <Sec title="Badges" cols={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Badge tone="lime">Activo</Badge>
              <Badge tone="limeSoft">Completado</Badge>
              <Badge tone="success" icon="check">Enviado</Badge>
              <Badge tone="warn">In progress 48h</Badge>
              <Badge tone="danger">Sin entrenar 7d</Badge>
              <Badge tone="info">Nuevo comentario</Badge>
              <Badge tone="neutral">Borrador</Badge>
            </div>
          </Sec>

          <Sec title="Avatar & progress" cols={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <Avatar name="M L" size={44} tone="var(--lime)" />
              <Avatar name="J P" size={36} />
              <Avatar name="A G" size={28} />
              <Avatar name="R F" size={22} />
            </div>
            <Progress value={62} total={100} />
            <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>62% · sesión 4 de 6</div>
          </Sec>
        </div>

        {/* COL 3 — Buttons, inputs, card, tabs, state */}
        <div>
          <Sec title="Buttons">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <Button variant="primary" icon="play">Empezar sesión</Button>
              <Button variant="primary" size="sm">Guardar</Button>
              <Button variant="secondary" icon="plus">Nuevo</Button>
              <Button variant="outline">Filtrar</Button>
              <Button variant="ghost" iconRight="chevR">Ver más</Button>
              <Button variant="danger" icon="trash">Eliminar</Button>
              <Button variant="primary" size="xl" block icon="play" style={{ marginTop: 4 }}>CTA grande mobile</Button>
            </div>
          </Sec>

          <Sec title="Inputs" cols={2}>
            <Input label="Peso" value="82.5" suffix="kg" align="right" />
            <Input label="Reps" value="12" align="right" />
            <Input label="Nombre ejercicio" value="Sentadilla" />
            <Input label="Error" value="" placeholder="Requerido" error="Campo requerido" />
          </Sec>

          <Sec title="Number cells (set tracker)">
            <div style={{ display: 'flex', gap: 8 }}>
              <NumCell value="12" label="Reps" big />
              <NumCell value="82.5" label="Kg" big active />
              <NumCell value="7" label="RPE" big />
              <NumCell value="2" label="RIR" big />
            </div>
          </Sec>

          <Sec title="Tabs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Tabs tabs={['Plan', 'Historial', 'Métricas']} active="Plan" />
              <Tabs variant="pills" tabs={['Semana', 'Mes', 'Todo']} active="Semana" />
            </div>
          </Sec>

          <Sec title="Card">
            <Card pad={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Push A · Pecho/Hombro</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>5 ejercicios · 45–55 min</div>
                </div>
                <Badge tone="limeSoft">Hoy</Badge>
              </div>
              <Progress value={0} total={5} />
            </Card>
          </Sec>

          <Sec title="Empty / Loading / Error" cols={3}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg-1)' }}>
              <StateBlock kind="empty" title="Sin sesiones" body="Cuando empieces a entrenar, aparecerán acá." />
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg-1)' }}>
              <StateBlock kind="loading" title="Cargando…" />
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg-1)' }}>
              <StateBlock kind="error" title="No se pudo sincronizar" body="Revisá tu conexión." cta={<Button variant="secondary" size="sm" icon="reset">Reintentar</Button>} />
            </div>
          </Sec>
        </div>
      </div>

      {/* Table row — full width */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600, marginBottom: 14 }}>Table · desktop</div>
        <Table
          cols={[
            { key: 'name', label: 'Alumno', w: '2fr' },
            { key: 'plan', label: 'Plan activo', w: '2fr' },
            { key: 'adh', label: 'Adherencia', w: '1.2fr', mono: true },
            { key: 'last', label: 'Última sesión', w: '1.4fr', mono: true, mute: true },
            { key: 'status', label: '', w: '1fr', align: 'right' },
          ]}
          rows={[
            { name: 'María López', plan: 'Recomp · Semana 4/8', adh: '94%', last: 'Hace 1 día', status: <Badge tone="success">On track</Badge> },
            { name: 'Julián Pérez', plan: 'Hipertrofia · Semana 2/6', adh: '71%', last: 'Hace 3 días', status: <Badge tone="warn">Atención</Badge> },
            { name: 'Ana García', plan: 'Fuerza · Semana 6/12', adh: '48%', last: 'Hace 8 días', status: <Badge tone="danger">Inactiva</Badge> },
          ]}
        />
      </div>
    </div>
  );
};

Object.assign(window, { DSPage });
