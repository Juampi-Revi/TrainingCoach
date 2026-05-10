# DESIGN.md — Sistema de Diseño

> Toda la UI del frontend **debe** usar estas variables CSS. Nunca hardcodear valores.

---

## Tokens de Color

### Modo Oscuro (default)
```css
--bg:        #0B0B0C;   /* fondo principal */
--bg-1:      #141417;   /* superficie elevada */
--bg-2:      #1C1C20;   /* input / card inner */
--bg-3:      #26262C;   /* hover / selected */
--line:      #26262C;   /* bordes */
--line-2:    #33333A;   /* bordes secundarios */
--text:      #F5F5F4;   /* texto principal */
--text-mute: #8D8D94;   /* texto secundario */
--text-dim:  #6E6E76;   /* texto terciario */
--lime:      #D7FF3A;   /* accent primario */
--lime-600:  #BEE52D;
--lime-200:  #EEFFA8;
--success:   #6EE7A8;
--warn:      #FFB547;
--danger:    #FF5B5B;
--info:      #7AB8FF;
--sleep:     #A78BFA;
```

### Modo Claro
```css
--bg:        #F8F8F6;
--bg-1:      #FFFFFF;
--bg-2:      #F0F0EE;
--bg-3:      #E4E4E0;
--line:      #E4E4E0;
--line-2:    #D4D4CE;
--text:      #0B0B0C;
--text-mute: #6B6B72;
--text-dim:  #7E7E86;
--accent-text: #4A5B00;  /* verde oscuro para texto sobre lime */
--sleep:     #7C3AED;
```

---

## Espaciado

```css
--s-1: 4px;   --s-2: 8px;   --s-3: 12px;  --s-4: 16px;
--s-5: 20px;  --s-6: 24px;  --s-8: 32px;  --s-10: 40px; --s-12: 48px;
```

---

## Border Radius

```css
--r-xs: 4px;  --r-sm: 8px;  --r-md: 12px;  --r-lg: 16px;  --r-xl: 20px;
```

---

## Fuentes

```css
--font-sans: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
```

---

## Sombras

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,.4);
--shadow-md: 0 8px 24px rgba(0,0,0,.35);
--shadow-lg: 0 24px 48px rgba(0,0,0,.5);
```

---

## Reglas

1. **Usar variables, nunca hex hardcoded** → `color: var(--lime)` no `#D7FF3A`
2. **Spacing consistente** → `padding: var(--s-4)` no `padding: 16px`
3. **Radius según escala** → `border-radius: var(--r-md)` no `border-radius: 12px`
4. **Fuentes del sistema** → usar `var(--font-sans)` para texto, `var(--font-mono)` para código/números

## UI/UX Standards

### Iconos vs Emojis
- **Usar Icon component** (`@/components/ui/icon`) para todos los elementos visuales
- **Prohibido usar emojis** en la interfaz

### Iconos disponibles
```typescript
// Progress y stats
"trophy" | "chart" | "trendingUp" | "trendingDown" | "minus" | "activity"
"dumbbell" | "fire" | "flame" | "bolt" | "star" | "target"
"scale" | "footprint" | "heart" | "watch"

// Acciones
"plus" | "check" | "edit" | "trash" | "x" | "refresh"
"chevR" | "chevL" | "chevD" | "chevUp"

// Estados
"bell" | "bellOff" | "alert" | "info" | "lock"
```

### Layout mobile-first
```css
/* Mobile: padding 16px */
.progreso-page { padding: 16px; }
.card { padding: 16px; border-radius: 14px; }

/* Tablet 768px+: padding 28px */
@media (min-width: 768px) {
  .progreso-page { padding: 48px 28px 24px; }
  .card { padding: 24px; border-radius: 18px; }
}

/* Desktop 1200px+: padding 48px */
@media (min-width: 1200px) {
  .progreso-page { padding: 48px 48px 24px; }
}
```

### Estructura de página
1. Header con título + subtítulo (padding bottom)
2. Section wrapper con padding
3. Grid de cards (1 columna mobile, 2+ desktop)
4. Cards ocupan 100% del viewport width hasta max-width

### Cards y componentes
- Background: `var(--bg-1)`
- Border: `1px solid var(--line)`
- Border-radius: `var(--r-md)` (14px mobile, `var(--r-lg)` (18px) desktop)
- Padding: `var(--s-4)` (16px mobile), `var(--s-6)` (24px) desktop
- Header con icono + título

### Settings lists (Cuenta / Perfil)
- Para pantallas de configuración tipo “lista de opciones”, usar el patrón de `/cuenta` y `/cuenta/perfil`
- Estructura:
  - `profile-banner` arriba (avatar + nombre + email)
  - `card-cuenta` como contenedor
  - `card-cuenta-row` para cada opción (left: icon+label, right: value+chevron)
  - `card-editor` inline debajo del row cuando hay edición (inputs + botones)
- Navegación:
  - “Cerrar sesión” vive en `/cuenta` (pantalla de menú), no dentro de subpantallas como `/cuenta/perfil`

### Tipografía
- Títulos de página: `20px` mobile, `28px` desktop, `font-weight: 800`
- Subtítulos: `12px` mobile, `14px` desktop
- Labels: uppercase, `9-11px`, `letter-spacing: 0.05-0.1em`
- Valores numéricos: `font-mono`, `font-weight: 600`
- Stats grandes: `18-20px` mobile, `24-32px` desktop

---

## Clases utilitarias existentes

```css
.ta-app       /* wrapper principal de la app */
.ta-mono      /* texto monospace con tabular-nums */
.ta-row       /* fila con hover state */
.ta-nav-item  /* item de navegación */
```
