// coach-screens.jsx — 7 pantallas Coach (desktop, 1240x820)

const DESK_W = 1240;
const DESK_H = 820;

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD
// ─────────────────────────────────────────────────────────────
const CoachDashboard = () => {
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="dashboard"
        title="Dashboard"
        subtitle="Miércoles 24 de abril · 9:41"
        actions={<>
          <Button variant="outline" size="sm" icon="filter">Filtros</Button>
          <Button size="sm" icon="plus">Nuevo alumno</Button>
        </>}
      >
        <div style={{ padding: 28 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KPI label="Alumnos activos" value="28" trend="+2" hint="esta semana" />
            <KPI label="Adherencia promedio" value="76" unit="%" trend="+4%" hint="vs sem. pasada" />
            <KPI label="Sesiones hoy" value="14" trend="" hint="6 completas · 2 en curso" />
            <KPI label="Comentarios pendientes" value="9" trend="−3" hint="últimas 24h" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
            {/* Alumnos activos */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Alumnos con alertas</div>
                <Button variant="ghost" size="sm" iconRight="chevR">Ver todos</Button>
              </div>
              <Table
                cols={[
                  { key: 'name', label: 'Alumno', w: '2fr' },
                  { key: 'plan', label: 'Plan', w: '2fr' },
                  { key: 'adh', label: 'Adh.', w: '.8fr', mono: true },
                  { key: 'last', label: 'Última ses.', w: '1.2fr', mono: true },
                  { key: 'alert', label: 'Alerta', w: '1.4fr' },
                ]}
                rows={[
                  { name: rowName('Ana García', '#FF5B5B'), plan: <span style={{ color: 'var(--text-mute)' }}>Fuerza · S6/12</span>, adh: '48%', last: 'Hace 8d', alert: <Badge tone="danger" icon="alert">Sin entrenar 7d</Badge> },
                  { name: rowName('Julián Pérez', '#FFB547'), plan: <span style={{ color: 'var(--text-mute)' }}>Hipertrofia · S2/6</span>, adh: '71%', last: 'Hace 3d', alert: <Badge tone="warn">Sesión abierta 48h</Badge> },
                  { name: rowName('Rocío Fernández', '#7AB8FF'), plan: <span style={{ color: 'var(--text-mute)' }}>Recomp · S1/8</span>, adh: '100%', last: 'Hoy', alert: <Badge tone="info" icon="msg">3 comentarios</Badge> },
                  { name: rowName('Diego Moreno', '#FFB547'), plan: <span style={{ color: 'var(--text-mute)' }}>Recomp · S3/8</span>, adh: '58%', last: 'Hace 4d', alert: <Badge tone="warn">RPE alto sostenido</Badge> },
                ]}
              />
            </div>

            {/* Side column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Adherence chart */}
              <Card pad={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Adherencia semanal</div>
                    <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>76<span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 2 }}>%</span></div>
                  </div>
                  <Tabs variant="pills" tabs={['7d', '30d']} active="7d" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {[58, 72, 65, 81, 69, 84, 76].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: `${h}%`, background: i === 6 ? 'var(--lime)' : 'var(--bg-3)', borderRadius: 4 }} />
                      <span className="ta-mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>{['L','M','X','J','V','S','D'][i]}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick actions / pending */}
              <Card pad={16}>
                <div style={{ fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 10 }}>Para revisar hoy</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { i: 'msg', t: 'Comentario de Rocío F.', s: 'Press militar · hace 14min', tone: 'info' },
                    { i: 'check', t: 'Sesión completa · María L.', s: 'Push A · +2 PRs · hace 1h', tone: 'success' },
                    { i: 'alert', t: 'Julián P. dejó sesión abierta', s: 'Pull A · hace 2 días', tone: 'warn' },
                    { i: 'star', t: 'PR de Santiago R.', s: 'Peso muerto 150×5 · hace 3h', tone: 'limeSoft' },
                  ].map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 4px', borderBottom: i === 3 ? 'none' : '1px solid var(--line)', alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={it.i} s={14} color={'var(--lime)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</div>
                        <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>{it.s}</div>
                      </div>
                      <Icon name="chevR" s={14} color="var(--text-mute)" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

function rowName(name, color) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar name={name} size={30} tone={color} />
      <div style={{ fontWeight: 600 }}>{name}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. ATHLETES LIST
// ─────────────────────────────────────────────────────────────
const CoachAthletes = () => {
  const rows = [
    { name: 'María López', plan: 'Recomposición · S4/8', adh: '94%', last: 'Hace 1 día', next: 'Hoy · Push A', tag: 'On track', tone: 'success' },
    { name: 'Julián Pérez', plan: 'Hipertrofia · S2/6', adh: '71%', last: 'Hace 3 días', next: 'Hoy · Legs B', tag: 'Atención', tone: 'warn' },
    { name: 'Ana García', plan: 'Fuerza · S6/12', adh: '48%', last: 'Hace 8 días', next: '—', tag: 'Inactiva', tone: 'danger' },
    { name: 'Rocío Fernández', plan: 'Recomp · S1/8', adh: '100%', last: 'Hoy', next: 'Jue · Upper', tag: 'On track', tone: 'success' },
    { name: 'Diego Moreno', plan: 'Recomp · S3/8', adh: '58%', last: 'Hace 4 días', next: 'Hoy · Full Body', tag: 'Atención', tone: 'warn' },
    { name: 'Santiago Rivas', plan: 'Fuerza · S8/12', adh: '89%', last: 'Ayer', next: 'Mañ · Deadlift', tag: 'On track', tone: 'success' },
    { name: 'Lucía Beltrán', plan: 'Hipertrofia · S5/8', adh: '82%', last: 'Ayer', next: 'Hoy · Pull A', tag: 'On track', tone: 'success' },
    { name: 'Matías Ortiz', plan: 'Recomp · S2/8', adh: '66%', last: 'Hace 2 días', next: 'Jue · Push B', tag: 'On track', tone: 'success' },
  ];
  const colors = ['#FF5B5B', '#FFB547', '#7AB8FF', 'var(--lime)', '#D7FF3A', '#6EE7A8'];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="athletes"
        title="Alumnos"
        subtitle="28 activos · 2 pausados · 1 de prueba"
        actions={<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280, height: 36, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '0 12px' }}>
            <Icon name="search" s={14} color="var(--text-mute)" />
            <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>Buscar alumno por nombre…</span>
            <div style={{ flex: 1 }} />
            <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 4 }}>⌘K</span>
          </div>
          <Button size="sm" icon="plus">Invitar</Button>
        </>}
      >
        <div style={{ padding: 28 }}>
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Tabs tabs={['Todos (28)', 'On track (19)', 'Atención (6)', 'Inactivos (3)']} active="Todos (28)" />
            <div style={{ flex: 1 }} />
            <Button variant="outline" size="sm" icon="filter">Plan</Button>
            <Button variant="outline" size="sm">Ordenar · Adherencia ↓</Button>
          </div>

          <Table
            cols={[
              { key: 'name', label: 'Alumno', w: '2fr' },
              { key: 'plan', label: 'Plan activo', w: '2fr' },
              { key: 'adh', label: 'Adherencia', w: '1.2fr' },
              { key: 'last', label: 'Última sesión', w: '1fr', mono: true, mute: true },
              { key: 'next', label: 'Próxima', w: '1.2fr', mono: true, mute: true },
              { key: 'tag', label: '', w: '1fr', align: 'right' },
            ]}
            rows={rows.map((r, i) => ({
              name: rowName(r.name, colors[i % colors.length]),
              plan: r.plan,
              adh: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, maxWidth: 80 }}>
                    <Progress value={parseInt(r.adh)} total={100} color={r.tone === 'danger' ? 'var(--danger)' : r.tone === 'warn' ? 'var(--warn)' : 'var(--lime)'} height={4} />
                  </div>
                  <span className="ta-mono" style={{ fontSize: 12, fontWeight: 600, width: 34 }}>{r.adh}</span>
                </div>
              ),
              last: r.last,
              next: r.next,
              tag: <Badge tone={r.tone}>{r.tag}</Badge>,
            }))}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 12, color: 'var(--text-mute)' }}>
            <span>Mostrando 1–8 de 28</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={paginBtn()}><Icon name="chevL" s={12} /></button>
              <button style={paginBtn(true)} className="ta-mono">1</button>
              <button style={paginBtn()} className="ta-mono">2</button>
              <button style={paginBtn()} className="ta-mono">3</button>
              <button style={paginBtn()}><Icon name="chevR" s={12} /></button>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

function paginBtn(active) {
  return {
    width: 28, height: 28, borderRadius: 6,
    background: active ? 'var(--bg-3)' : 'var(--bg-1)',
    border: '1px solid var(--line)', color: active ? 'var(--text)' : 'var(--text-mute)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)', fontSize: 12, cursor: 'pointer',
  };
}

// ─────────────────────────────────────────────────────────────
// 3. ATHLETE DETAIL
// ─────────────────────────────────────────────────────────────
const CoachAthleteDetail = () => {
  const sessions = [
    { date: '24 Abr', title: 'Push A', mins: 53, vol: '4.820kg', rpe: 7.8, status: 'done', prs: 2 },
    { date: '22 Abr', title: 'Legs A', mins: 61, vol: '7.240kg', rpe: 8.2, status: 'done', prs: 0 },
    { date: '20 Abr', title: 'Pull A', mins: 48, vol: '5.110kg', rpe: 7.5, status: 'done', prs: 1 },
    { date: '18 Abr', title: 'Push A', mins: 55, vol: '4.580kg', rpe: 8.0, status: 'done', prs: 0 },
    { date: '16 Abr', title: 'Legs A', mins: 58, vol: '6.980kg', rpe: 7.9, status: 'done', prs: 1 },
    { date: '14 Abr', title: 'Pull A', mins: 0, vol: '—', rpe: '—', status: 'skip', prs: 0 },
    { date: '12 Abr', title: 'Full Body', mins: 52, vol: '6.120kg', rpe: 8.1, status: 'done', prs: 2 },
  ];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="athletes"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Alumnos <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>María López</span></span>}
        subtitle="31 años · Objetivo: Recomposición · Coach desde oct 2025"
        actions={<>
          <Button variant="outline" size="sm" icon="msg">Mensaje</Button>
          <Button variant="outline" size="sm" icon="edit">Editar plan</Button>
          <Button size="sm" icon="plus">Nueva sesión</Button>
        </>}
      >
        <div style={{ padding: '0 28px' }}>
          {/* Header block */}
          <div style={{ display: 'flex', gap: 20, padding: '20px 0 24px', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
            <Avatar name="María López" size={72} tone="var(--lime)" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>María López</div>
                <Badge tone="success">On track</Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 3 }}>maria.lopez@mail · +54 9 11 5555 · Plan Recomp 8 semanas · semana 4</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <Badge tone="neutral">Sin lesiones</Badge>
                <Badge tone="neutral">5 días/sem</Badge>
                <Badge tone="neutral">Hombro derecho · cuidar</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, paddingLeft: 24, borderLeft: '1px solid var(--line)' }}>
              {[
                { l: 'Adherencia 30d', v: '94%' },
                { l: 'Sesiones', v: '14' },
                { l: 'PRs mes', v: '6' },
                { l: 'RPE medio', v: '7.9' },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{m.l}</div>
                  <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, padding: '18px 0 0' }}>
            <Tabs tabs={['Plan activo', 'Historial', 'Métricas', 'Notas', 'Archivos']} active="Plan activo" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, padding: '18px 0 28px' }}>
            {/* Timeline */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sesiones recientes</div>
                <Button variant="ghost" size="sm" iconRight="chevR">Ver todo</Button>
              </div>
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 1, background: 'var(--line)' }} />
                {sessions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -20, top: 14, width: 12, height: 12, borderRadius: 6, background: s.status === 'skip' ? 'var(--bg-2)' : 'var(--lime)', border: `2px solid ${s.status === 'skip' ? 'var(--line-2)' : 'var(--lime)'}`}} />
                    <div style={{ flex: 1, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', width: 54 }}>{s.date}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: s.status === 'skip' ? 'var(--text-mute)' : 'var(--text)' }}>
                          {s.title}
                          {s.status === 'skip' && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>· saltada</span>}
                        </div>
                        {s.status === 'done' && (
                          <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.mins}' · {s.vol} · RPE {s.rpe}</div>
                        )}
                      </div>
                      {s.prs > 0 && <Badge tone="limeSoft" icon="star">{s.prs} PR</Badge>}
                      <Icon name="chevR" s={14} color="var(--text-mute)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card pad={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Plan activo</div>
                  <Badge tone="limeSoft">S4/8</Badge>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>Recomposición · 8 sem</div>
                <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>5 días/sem · Upper/Lower split</div>
                <Progress value={4} total={8} style={{ marginTop: 14 }} />
                <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 6 }}>Semana 4 de 8 · 50% completo</div>
              </Card>

              <Card pad={16}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Peso corporal · 4 sem</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="ta-mono" style={{ fontSize: 24, fontWeight: 600 }}>62.4</span>
                  <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>kg</span>
                  <span style={{ fontSize: 12, color: 'var(--danger)', marginLeft: 4 }}>−0.8kg</span>
                </div>
                <svg width="100%" height="48" viewBox="0 0 200 48" style={{ marginTop: 10 }}>
                  <polyline fill="none" stroke="var(--lime)" strokeWidth="1.5" points="0,10 25,14 50,12 75,20 100,18 125,28 150,26 175,34 200,32" />
                  <polyline fill="rgba(215,255,58,.08)" stroke="none" points="0,10 25,14 50,12 75,20 100,18 125,28 150,26 175,34 200,32 200,48 0,48" />
                </svg>
              </Card>

              <Card pad={16}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Notas del coach</div>
                <div style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.55 }}>
                  Semana 4: subir intensidad en push, mantener volumen en legs. Revisar técnica en remo invertido.
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. SESSION DETAIL (con comentarios)
// ─────────────────────────────────────────────────────────────
const CoachSessionDetail = () => {
  const exs = [
    { name: 'Press banca barra', sets: [[8, 60, 7], [8, 65, 8], [7, 65, 8.5], [6, 65, 9]], target: '4 × 6-8 @ RPE 8', comments: 2 },
    { name: 'Press militar mancuernas', sets: [[10, 18, 7], [9, 18, 8], [8, 18, 8.5]], target: '3 × 8-10 @ RIR 2', comments: 0 },
    { name: 'Aperturas polea alta', sets: [[15, 12, 7], [14, 12, 8], [12, 12, 8.5]], target: '3 × 12-15 @ RIR 1', comments: 0, selected: true },
    { name: 'Elevaciones laterales', sets: [[15, 6, 8], [15, 6, 8.5], [13, 6, 9], [10, 5, 9]], target: '4 × 12-15 @ RIR 0-1', comments: 3, flag: 'Drop-set ok' },
  ];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="athletes"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>María López <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>Push A · Mié 24 abr</span></span>}
        subtitle="Completada · 9:15 → 10:08 · 53 min · Volumen 4.820 kg · RPE medio 7.8"
        actions={<>
          <Button variant="outline" size="sm" icon="chevL">Sesión anterior</Button>
          <Button variant="outline" size="sm" iconRight="chevR">Siguiente</Button>
          <Button size="sm" icon="check">Marcar revisada</Button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100% - 0px)' }}>
          {/* Left: exercises + sets */}
          <div style={{ padding: '20px 20px 20px 28px', overflow: 'auto', borderRight: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <Badge tone="success" icon="check">Completa</Badge>
              <Badge tone="limeSoft" icon="star">+2 PR (Banca, Militar)</Badge>
              <Badge tone="warn" icon="alert">RPE último set 9 (target 8)</Badge>
            </div>

            {exs.map((ex, ei) => (
              <div key={ei} style={{
                marginBottom: 12, padding: 16, background: 'var(--bg-1)',
                border: `1px solid ${ex.selected ? 'var(--lime)' : 'var(--line)'}`,
                borderRadius: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', width: 22, fontWeight: 600 }}>{String(ei + 1).padStart(2, '0')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</div>
                    <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>Target · {ex.target}</div>
                  </div>
                  {ex.flag && <Badge tone="info" size="sm">{ex.flag}</Badge>}
                  <Button variant="ghost" size="sm" icon="msg">{ex.comments > 0 ? ex.comments : 'Comentar'}</Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {ex.sets.map((s, si) => {
                    const [reps, kg, rpe] = s;
                    const over = rpe > 8.5;
                    return (
                      <div key={si} style={{
                        padding: 10, background: 'var(--bg-2)',
                        border: `1px solid ${over ? 'rgba(255,181,71,.4)' : 'var(--line)'}`,
                        borderRadius: 8,
                      }}>
                        <div className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 600 }}>SET {si + 1}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                          <span className="ta-mono" style={{ fontSize: 15, fontWeight: 600 }}>{reps}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>×</span>
                          <span className="ta-mono" style={{ fontSize: 15, fontWeight: 600 }}>{kg}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>kg</span>
                        </div>
                        <div className="ta-mono" style={{ fontSize: 10, color: over ? 'var(--warn)' : 'var(--text-mute)', marginTop: 2 }}>RPE {rpe}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: thread */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-1)' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Comentarios</div>
                <Tabs variant="pills" tabs={['Sesión (4)', 'Ejercicios (5)']} active="Sesión (4)" />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { who: 'coach', text: 'Vi la sesión, buen ritmo. Pero en press banca el 3er set bajaste a 7 reps. ¿Técnica o fatiga?', time: 'ayer 20:14' },
                { who: 'client', text: 'Fatiga. Descansé 90s en vez de 2\'. La próxima banco los 2\' completos.', time: 'ayer 21:02', quote: 'Press banca barra · Set 3' },
                { who: 'coach', text: 'Perfecto. Para laterales, probá bajar a 10-12 reps y subir peso. Menos RIR, más estímulo.', time: 'ayer 21:10' },
                { who: 'client', text: 'Anotado. Lo aplico el viernes.', time: 'hoy 10:12' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.who === 'coach' ? 'row-reverse' : 'row' }}>
                  <Avatar name={m.who === 'coach' ? 'Nico Álvarez' : 'María López'} size={28} tone={m.who === 'coach' ? 'var(--lime)' : '#7AB8FF'} />
                  <div style={{ maxWidth: 260 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-mute)', marginBottom: 4, textAlign: m.who === 'coach' ? 'right' : 'left' }}>
                      <span style={{ fontWeight: 600 }}>{m.who === 'coach' ? 'Vos' : 'María'}</span> · <span className="ta-mono">{m.time}</span>
                    </div>
                    {m.quote && (
                      <div className="ta-mono" style={{ padding: '4px 8px', fontSize: 10, color: 'var(--lime)', background: 'rgba(215,255,58,.08)', borderLeft: '2px solid var(--lime)', borderRadius: '4px 4px 0 0', marginBottom: 0 }}>
                        ↳ {m.quote}
                      </div>
                    )}
                    <div style={{
                      padding: '10px 12px',
                      background: m.who === 'coach' ? 'var(--lime)' : 'var(--bg-2)',
                      color: m.who === 'coach' ? '#0B0B0C' : 'var(--text)',
                      borderRadius: m.who === 'coach' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                      fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                      border: m.who === 'client' ? '1px solid var(--line)' : 'none',
                    }}>{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
              <div style={{ padding: 10, background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Escribí un feedback para María…</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button variant="ghost" size="sm" icon="edit" style={{ padding: '0 8px' }}>Ref. ejercicio</Button>
                  <div style={{ flex: 1 }} />
                  <Button size="sm" icon="send">Enviar</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. PLANS LIST
// ─────────────────────────────────────────────────────────────
const CoachPlans = () => {
  const plans = [
    { name: 'Recomposición 8 sem', goal: 'Recomp', days: 5, weeks: 8, assigned: 12, tone: 'lime' },
    { name: 'Hipertrofia intermedio', goal: 'Hipertrofia', days: 4, weeks: 6, assigned: 8, tone: 'neutral' },
    { name: 'Fuerza 12 semanas', goal: 'Fuerza', days: 4, weeks: 12, assigned: 5, tone: 'neutral' },
    { name: 'Full body principiantes', goal: 'Recomp', days: 3, weeks: 4, assigned: 3, tone: 'neutral' },
    { name: 'Cut agresivo 6 sem', goal: 'Recomp', days: 5, weeks: 6, assigned: 0, tone: 'neutral', draft: true },
  ];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="plans"
        title="Planes"
        subtitle="5 activos · 1 borrador"
        actions={<>
          <Button variant="outline" size="sm">Importar</Button>
          <Button size="sm" icon="plus">Nuevo plan</Button>
        </>}
      >
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {plans.map((p, i) => (
              <div key={i} style={{
                padding: 18, background: 'var(--bg-1)',
                border: `1px solid ${p.tone === 'lime' ? 'var(--lime)' : 'var(--line)'}`,
                borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14,
                opacity: p.draft ? 0.65 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Badge tone={p.tone === 'lime' ? 'lime' : 'neutral'}>{p.goal}</Badge>
                    {p.draft && <Badge tone="neutral" style={{ marginLeft: 6 }}>Borrador</Badge>}
                  </div>
                  <Icon name="more" s={16} color="var(--text-mute)" />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2 }}>{p.name}</div>
                  <div className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 6 }}>{p.days} días/sem · {p.weeks} semanas · {p.days * p.weeks} sesiones</div>
                </div>

                <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                  {Array.from({ length: p.weeks }).map((_, wi) => (
                    <div key={wi} style={{ flex: 1, height: 18, background: wi < 3 ? 'var(--lime)' : 'var(--bg-3)', borderRadius: 3, opacity: wi < 3 ? 1 : .6 }} />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.assigned > 0 ? (
                      <>
                        <div style={{ display: 'flex' }}>
                          {['M L','J P','A G'].slice(0, Math.min(3, p.assigned)).map((n, ai) => (
                            <div key={ai} style={{ marginLeft: ai === 0 ? 0 : -6 }}><Avatar name={n} size={22} tone={['#7AB8FF','#FFB547','#FF5B5B'][ai]} /></div>
                          ))}
                        </div>
                        <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>+{Math.max(0, p.assigned - 3)} asignados</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sin asignar</span>
                    )}
                  </div>
                  <Icon name="chevR" s={14} color="var(--text-mute)" />
                </div>
              </div>
            ))}
            {/* New plan slot */}
            <div style={{
              padding: 18, borderRadius: 14, border: '1px dashed var(--line-2)',
              background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, minHeight: 220, color: 'var(--text-mute)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" s={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Crear plan</div>
              <div style={{ fontSize: 11 }}>Desde cero o desde template</div>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 6. PLAN DETAIL (weeks grid)
// ─────────────────────────────────────────────────────────────
const CoachPlanDetail = () => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const workouts = [
    // week 1..8
    ['Push A', 'Legs A', null, 'Pull A', 'Upper B', null, 'Rest'],
    ['Push A', 'Legs A', null, 'Pull A', 'Upper B', null, 'Rest'],
    ['Push A', 'Legs A', null, 'Pull A', 'Upper B', null, 'Rest'],
    ['Push B', 'Legs B', null, 'Pull B', 'Upper C', null, 'Rest'],
    ['Push B', 'Legs B', null, 'Pull B', 'Upper C', null, 'Rest'],
    ['Push B', 'Legs B', null, 'Pull B', 'Upper C', null, 'Rest'],
    ['Deload', 'Deload', null, 'Deload', 'Deload', null, 'Rest'],
    ['Test', 'Test', null, 'Test', 'Test', null, 'Rest'],
  ];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="plans"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Planes <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>Recomposición 8 semanas</span></span>}
        subtitle="5 días/sem · 40 sesiones · 12 alumnos asignados · Última edición hace 2d"
        actions={<>
          <Button variant="outline" size="sm" icon="users">Asignar</Button>
          <Button variant="outline" size="sm">Duplicar</Button>
          <Button size="sm" icon="edit">Editar</Button>
        </>}
      >
        <div style={{ padding: 28 }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, fontSize: 11, color: 'var(--text-mute)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--lime)' }} />Fase acumulación</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#FFB547' }} />Intensificación</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bg-3)' }} />Deload</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#7AB8FF' }} />Test</div>
            <div style={{ flex: 1 }} />
            <Tabs variant="pills" tabs={['Semanas', 'Calendar', 'Volumen']} active="Semanas" />
          </div>

          {/* Grid header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
            <div />
            {days.map((d) => (
              <div key={d} className="ta-mono" style={{ fontSize: 10, color: 'var(--text-mute)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, padding: '6px 0' }}>{d}</div>
            ))}
          </div>

          {workouts.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
              <div style={{ padding: '10px 10px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="ta-mono" style={{ color: 'var(--text-mute)', fontSize: 10 }}>S{wi + 1}</span>
                <span style={{ fontSize: 11 }}>{wi < 3 ? 'Acum.' : wi < 6 ? 'Intens.' : wi === 6 ? 'Deload' : 'Test'}</span>
              </div>
              {week.map((w, di) => {
                if (!w) return <div key={di} style={{ height: 50, background: 'var(--bg)', border: '1px dashed var(--line)', borderRadius: 8 }} />;
                if (w === 'Rest') return <div key={di} style={{ height: 50, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>Rest</div>;
                const phase = wi < 3 ? 'lime' : wi < 6 ? 'warn' : wi === 6 ? 'neutral' : 'info';
                const colors = {
                  lime: { bg: 'rgba(215,255,58,.1)', b: 'rgba(215,255,58,.3)', t: 'var(--lime)' },
                  warn: { bg: 'rgba(255,181,71,.1)', b: 'rgba(255,181,71,.3)', t: 'var(--warn)' },
                  neutral: { bg: 'var(--bg-2)', b: 'var(--line-2)', t: 'var(--text-mute)' },
                  info: { bg: 'rgba(122,184,255,.1)', b: 'rgba(122,184,255,.3)', t: 'var(--info)' },
                }[phase];
                const curr = wi === 3 && di === 2;
                return (
                  <div key={di} style={{
                    height: 50, padding: '8px 10px', borderRadius: 8,
                    background: curr ? 'var(--lime)' : colors.bg,
                    border: `1px solid ${curr ? 'var(--lime)' : colors.b}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
                    color: curr ? '#0B0B0C' : 'var(--text)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{w}</div>
                    <div className="ta-mono" style={{ fontSize: 10, opacity: .7 }}>{w === 'Deload' ? '60% vol' : w === 'Test' ? '1RM' : '5-6 ej'}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </DesktopShell>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 7. WORKOUT TEMPLATE EDITOR
// ─────────────────────────────────────────────────────────────
const CoachTemplateEditor = () => {
  const exs = [
    { name: 'Press banca barra', sets: 4, reps: '6-8', rpe: 'RPE 8', rest: 120, note: '' },
    { name: 'Press militar mancuernas', sets: 3, reps: '8-10', rpe: 'RIR 2', rest: 90, note: '' },
    { name: 'Aperturas polea alta', sets: 3, reps: '12-15', rpe: 'RIR 1', rest: 60, note: '' },
    { name: 'Elevaciones laterales', sets: 4, reps: '12-15', rpe: 'RIR 0-1', rest: 45, note: 'Drop-set último' },
    { name: 'Copas (tríceps)', sets: 3, reps: '10-12', rpe: 'RPE 8', rest: 60, note: '' },
    { name: 'Press francés con mancuerna', sets: 3, reps: '12-15', rpe: 'RIR 1', rest: 45, note: '' },
  ];
  return (
    <div style={{ width: DESK_W, height: DESK_H }}>
      <DesktopShell
        active="templates"
        title={<span style={{ color: 'var(--text-mute)', fontWeight: 500 }}>Templates <span style={{ margin: '0 8px' }}>/</span> <span style={{ color: 'var(--text)', fontWeight: 700 }}>Push A</span></span>}
        subtitle="Template · usado en Recomp 8s, Hipertrofia Int · guardado hace 3 min"
        actions={<>
          <Button variant="outline" size="sm">Vista previa</Button>
          <Button variant="outline" size="sm">Descartar</Button>
          <Button size="sm" icon="check">Guardar</Button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100%' }}>
          <div style={{ padding: 28, overflow: 'auto' }}>
            {/* Title block */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Badge tone="lime">Push</Badge>
                <Badge tone="neutral">Intermedio</Badge>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em' }}>Push A</div>
              <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>Pecho · Hombro · Tríceps · ~50 min</div>
            </div>

            {/* Warmup */}
            <div style={{ padding: 14, background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--line)', borderLeft: '3px solid var(--lime)', marginBottom: 20 }}>
              <div className="ta-mono" style={{ fontSize: 10, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 6 }}>Warm-up notes</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                5' movilidad de hombro + 2 series de 10 reps press con 40% del peso de trabajo. Foco en retracción escapular.
              </div>
            </div>

            {/* Exercises table */}
            <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Ejercicios · 6</div>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '28px 2.2fr 60px 90px 90px 80px 80px 32px', padding: '10px 14px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, gap: 8 }}>
                <div>#</div>
                <div>Ejercicio</div>
                <div style={{ textAlign: 'center' }}>Sets</div>
                <div style={{ textAlign: 'center' }}>Reps</div>
                <div style={{ textAlign: 'center' }}>Esfuerzo</div>
                <div style={{ textAlign: 'center' }}>Rest</div>
                <div>Nota</div>
                <div />
              </div>
              {exs.map((ex, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 2.2fr 60px 90px 90px 80px 80px 32px', padding: '10px 14px', borderBottom: i === exs.length - 1 ? 'none' : '1px solid var(--line)', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="more" s={12} color="var(--text-dim)" style={{ cursor: 'grab' }} />
                  </div>
                  <div style={{ fontWeight: 500 }}>{ex.name}</div>
                  <div className="ta-mono" style={{ textAlign: 'center' }}>{ex.sets}</div>
                  <div className="ta-mono" style={{ textAlign: 'center' }}>{ex.reps}</div>
                  <div className="ta-mono" style={{ textAlign: 'center', color: 'var(--text-mute)' }}>{ex.rpe}</div>
                  <div className="ta-mono" style={{ textAlign: 'center', color: 'var(--text-mute)' }}>{ex.rest}s</div>
                  <div style={{ fontSize: 11, color: ex.note ? 'var(--lime)' : 'var(--text-dim)' }} className="ta-ellipsis">{ex.note || '—'}</div>
                  <Icon name="trash" s={13} color="var(--text-dim)" />
                </div>
              ))}
              <div style={{ padding: 10, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
                <Button variant="ghost" size="sm" icon="plus">Añadir ejercicio</Button>
              </div>
            </div>
          </div>

          {/* Right inspector */}
          <div style={{ background: 'var(--bg-1)', borderLeft: '1px solid var(--line)', padding: 20, overflow: 'auto' }}>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 12 }}>Propiedades</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Nombre" value="Push A" />
              <Input label="Split" value="Pecho · Hombro · Tríceps" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase' }}>Tipo</span>
                <Tabs variant="pills" tabs={['Push', 'Pull', 'Legs', 'Upper', 'Full']} active="Push" />
              </div>
              <Input label="Duración estimada" value="50" suffix="min" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase' }}>Intensidad</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Baja','Media','Alta'].map((v, i) => (
                    <div key={v} style={{
                      flex: 1, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
                      background: i === 2 ? 'var(--lime)' : 'var(--bg-2)', color: i === 2 ? '#0B0B0C' : 'var(--text-mute)',
                      border: `1px solid ${i === 2 ? 'var(--lime)' : 'var(--line-2)'}`,
                    }}>{v}</div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: 10 }}>Usado en</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="calendar" s={14} color="var(--lime)" />
                    <span style={{ flex: 1 }}>Recomp 8 semanas</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>×6</span>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="calendar" s={14} color="var(--lime)" />
                    <span style={{ flex: 1 }}>Hipertrofia intermedio</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>×4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesktopShell>
    </div>
  );
};

Object.assign(window, {
  CoachDashboard, CoachAthletes, CoachAthleteDetail,
  CoachSessionDetail, CoachPlans, CoachPlanDetail, CoachTemplateEditor,
});
