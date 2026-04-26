# UI/UX Review — TrainingApp (REGEN)

_Reviewed: 2026-04-24 | Reviewer: Claude (Sonnet 4.6) | Scope: full web frontend_

---

## Summary

The app has a coherent visual identity: dark-first palette, lime accent (#D7FF3A), Space Grotesk + JetBrains Mono, and a clear token system. The coach side is a solid desktop tool. The client session page is the most complex and most-used screen, and it carries the heaviest usability debt. Key themes across the whole product: touch targets on mobile are systematically under Apple/Google's 44 px minimum; the session page blends navigation chrome, data entry, and exercise list in a single scroll without clear zones; terminology is split between Spanish and English (warm-up / calentamiento, workouts / entrenamientos) without a consistent policy; and there are no `aria-label` attributes anywhere in the codebase, making the app inaccessible to screen-reader users.

---

## Critical Issues

### Issue 1: Set-entry inputs lack labels and `inputMode` on the session page

**Current State:** The three data-entry inputs (reps, kg, effort) in the active set row use `type="number" inputMode="decimal"` and `placeholder="—"`. There is no visible label. Column headers (Serie / Reps / Kg / RPE) are 10 px uppercase text sitting 8–14 px above the input row, visually detached from the inputs that they label.

**Problem:** When the keyboard opens on iOS/Android the header row scrolls out of sight. The user is left with three identical-looking number fields and no label to tell them apart. A placeholder of "—" communicates nothing. The `type="number"` attribute on effort (RPE/RIR) may also trigger a spinner control on some Android browsers instead of a decimal pad.

**Recommendation:**
- Add persistent floating or in-field labels to each input: `Reps`, `Kg`, `RPE` (or `RIR`). These can be small (10–11 px) and sit above the value inside the field border.
- Alternatively, embed a 2-letter prefix badge inside each input (e.g. "RP" for reps) so the label never disappears.
- Use `inputMode="numeric"` for reps (integers only) and `inputMode="decimal"` for kg and effort; drop `type="number"` entirely to avoid browser-native stepper controls.

**Impact:** Every client, every set, every workout session. This is the single highest-traffic interaction in the entire product.

---

### Issue 2: Fixed bottom CTA bar is invisible behind the native keyboard

**Current State:** The "Guardar serie" button is `position: fixed; bottom: 0` with `padding-bottom: 28px`. On iOS Safari, when the keyboard is open, this button is occluded by the keyboard and the bottom safe-area handling doesn't compensate.

**Problem:** The primary action — saving a set — is hidden behind the keyboard at the exact moment the user has just finished typing into the fields. The user must dismiss the keyboard to tap the button, adding friction to the most-repeated action in the app.

**Recommendation:**
- Move the "Guardar serie" button to immediately below the input row (non-fixed), so it scrolls with the content and stays visible above the keyboard. On iOS this is the standard pattern for forms.
- Or use `env(safe-area-inset-bottom)` and pair it with `@supports` for a sticky bar that accounts for both keyboard and home indicator.
- Add a keyboard `Done`/return-key shortcut: `onKeyDown` → `Enter` on any input → trigger `logSet()`.

**Impact:** Affects every set logged on a mobile device (the primary form factor for this screen).

---

### Issue 3: Touch targets on the session exercise list are below the 44 px minimum

**Current State:** Each exercise button in the exercise list has `padding: "10px 12px"`. With a font size of 14 px and single-line text, the effective tap height is approximately 34–36 px.

**Problem:** Apple HIG and Google Material both require 44 × 44 px minimum touch targets. On 36 px rows with narrow vertical padding, users frequently mis-tap adjacent exercises. Mis-tapping during an active workout is high-stakes — it could cause the user to navigate away, losing unsaved draft input.

**Recommendation:**
- Increase row padding to `"13px 12px"` (yields ~44 px total with 14 px text + line-height).
- Alternatively keep the visual padding and add `min-height: 44px` to the button element with `align-items: center`.
- The warmup toggle button in the coach workout editor (`width: 22, height: 22`) is also critically small — increase to at least 36 × 36 px.

**Impact:** Coach and client exercise lists. Daily-use touchpoints on every page that shows exercises.

---

### Issue 4: "Volver" navigation on the session page destroys unsaved draft

**Current State:** The "Volver" button at the top-left of the session page calls `router.push("/semana")` unconditionally. There is no confirmation dialog. The draft set values (reps, kg, effort) are stored only in component state.

**Problem:** A user who accidentally taps the back button while mid-entry loses their draft data. On a mobile screen where the back gesture may be triggered unintentionally, this is a real risk. Nielsen heuristic #3 (User control and freedom) requires an easy undo or at minimum a warning.

**Recommendation:**
- Before navigating away from an active session, show a bottom-sheet confirmation: "¿Salir de la sesión? Tus series guardadas se conservan." with "Salir" and "Quedarse" options.
- Store the draft in `sessionStorage` keyed by `sessionId` so it survives accidental navigations.
- On mount, restore the draft from `sessionStorage` and auto-populate the input fields.

**Impact:** Any unguarded navigation during a workout session risks frustrating the user and discouraging data logging.

---

### Issue 5: Deleting a set uses `window.confirm()` — coach workout uses it for exercise deletion too

**Current State:** `deleteSet` and `handleDelete` in the coach workout editor both call `confirm("¿Eliminar...?")`. `window.confirm` is blocked in cross-origin iframes, visually inconsistent across browsers, not styleable, and blocked by some mobile PWA shells.

**Problem:** The browser native confirm dialog breaks the visual language of the app, can feel alarming (especially mid-workout for the client), and may not fire at all in certain deployment contexts (standalone PWA mode on iOS). It also blocks the main thread.

**Recommendation:**
- Replace with a custom bottom-sheet (mobile) or inline destructive-confirm pattern (desktop): show the "Eliminar" button, on first tap show "¿Confirmar? Esto no se puede deshacer" with a red confirm button.
- For set deletion during a session, consider a swipe-to-delete gesture on the row instead of a modal.

**Impact:** All destructive actions across the product.

---

## High Priority Improvements

### H1: No progress indicator during an active session

**Current State:** The session page shows `completedExs / session.exercises.length` nowhere. There is a "Finalizar sesión" button only when all exercises are done. There is no global progress bar or percentage.

**Problem:** The user cannot at a glance know how far through the workout they are, which increases anxiety and reduces motivation during longer sessions. Nielsen heuristic #1 (Visibility of system status).

**Recommendation:**
- Add a thin (3–4 px) lime progress bar at the top of the screen: `width: ${(completedExs / total) * 100}%`.
- Show `Ejercicio X de Y` in the subtitle line already present (it exists as `Ej {currentExIdx + 1}/{session.exercises.length}`) but make it more prominent — currently it is 11 px uppercase muted text buried under the workout title.

---

### H2: The rest timer is a full-screen overlay that blocks content

**Current State:** `RestTimerOverlay` uses `position: fixed; inset: 0; background: rgba(0,0,0,.55)` — it covers the entire screen with 55% opacity. The user cannot see their set log, cannot tap the exercise list, and cannot see the next exercise.

**Problem:** During rest the user often wants to review the previous set, check the next exercise, or add a session note. A full-screen opaque overlay prevents all of this.

**Recommendation:**
- Replace with a non-blocking persistent banner at the top of the screen (below the header bar): `position: sticky; top: 0; z-index: 50`. Show `Descansando 1:23 · Saltear →` in a lime-tinted strip.
- Keep the large countdown visible but as a sticky element, not an overlay.
- This follows the pattern used by most native gym apps (Strong, Hevy, etc.).

---

### H3: The effort toggle (RPE / RIR) is placed below the input row it controls

**Current State:** The effort toggle (`<Tabs variant="pills" tabs={["RPE", "RIR"]} />`) sits at the bottom of the set entry section, under all logged sets. The column header for the effort column still says whichever mode is active, but the toggle is visually disconnected from the inputs above it.

**Problem:** The user must scroll down, toggle the mode, and scroll back up. Worse, the column header only updates in the grid — so if the user is mid-entry and the page is partially scrolled, they may not notice which mode is active.

**Recommendation:**
- Move the RPE/RIR toggle to the right of the column header: `[Serie] [Reps] [Kg] [RPE ↔ RIR]` — make the header itself the toggle.
- Or inline the toggle as a small chip inside the effort input when it has focus.

---

### H4: The coach workout template editor is desktop-only, but coaches likely check it on mobile

**Current State:** The exercise table uses a 10-column CSS grid with `gridTemplateColumns: "32px 22px 2.2fr 60px 90px 90px 80px 1fr 26px 32px"`. No mobile fallback is implemented. On screens below 768 px, the coach sidebar is hidden but the table is not adapted — it overflows horizontally.

**Problem:** Coaches who need to make quick edits on their phone cannot use the workout editor. The `@media (max-width: 767px)` breakpoint hides the sidebar but doesn't collapse the table into cards or a readable mobile layout.

**Recommendation:**
- Add a mobile card layout for each exercise row below 768 px: exercise name on top, then a 2×2 grid of sets/reps/effort/rest fields, with the action buttons at the right edge.
- The right inspector panel should stack below the table on mobile, not sit beside it.

---

### H5: The exercise library filter chips generate raw DB values (en) as options

**Current State:** `muscleOptions` is built from `exercises.map((e) => e.primaryMuscle)`. When an exercise has `primaryMuscle: "chest"`, the filter chip renders the raw English key "chest" unless a `MUSCLE_LABEL` lookup hits. The lookup only applies inside the badge, not to the chip label when the raw value is used as the filter button key.

**Problem:** If the API returns an unrecognized muscle key, it silently displays as-is (e.g., "full_body", "forearms") in the filter chips. This is inconsistent with the Spanish UI.

**Recommendation:**
- Apply `MUSCLE_LABEL[m] ?? m` to the chip label itself, not just to the display text. This is almost done but the chip uses `{m === "Todos" ? "Todos" : (MUSCLE_LABEL[m] ?? m)}` which is correct — verify the API never returns values outside the known set, and add a fallback `capitalize` transform for unknown keys.
- Pre-define the muscle list (already done in the exercises form as `MUSCLES`) and use it as the canonical source for filter options, not derived from current data.

---

### H6: The week strip calendar days are not linked to workout cards

**Current State:** The 7-day week strip in `SemanaPage` is purely decorative. It shows day letters and date numbers with today highlighted in lime. The workout cards below do not indicate which day they're scheduled for.

**Problem:** The user cannot tell whether today's workout is on a specific day of the week vs. just "next in line". The week strip and the workout cards are visually disconnected — the strip implies a calendar but tapping a day does nothing.

**Recommendation:**
- Either: remove the week strip (it adds no actionable information in its current form) and dedicate the space to the workout card.
- Or: wire each day cell to show a dot indicator below the date number when a workout is scheduled on that day (green if completed, lime if today's, muted otherwise). Make day cells tappable to jump to that day's workout.

---

## Medium Priority Enhancements

### M1: Terminology inconsistency across the product

The app mixes Spanish and English without a consistent policy:

| Screen | English used | Spanish equivalent used elsewhere |
|---|---|---|
| Coach workout editor table header | "Rest", "Gr." | "Descanso", "Grupo" used in other labels |
| Coach workout detail | `warm-up` (in warmup card) | `Calentamiento` (everywhere else) |
| Session page warmup card | "Calentamiento" | — |
| Session detail page | `Warm-up` | — |
| Exercise notes badge | `alert` icon (!) | Used for notes, not alerts |
| Media tab in exercise form | `"info" / "media"` | Both shown in Spanish elsewhere |

**Recommendation:** Adopt a single rule: all user-facing text is in Spanish. English is allowed only for technical/metric abbreviations (RPE, RIR, kg, sets). Audit every hardcoded string. Create a `strings.ts` constants file as the single source of truth.

---

### M2: No empty-state handling when an exercise has no sets logged yet

**Current State:** The sets log grid renders nothing above the active-new-set row when `ex.sets.length === 0`. The column headers (Serie / Reps / Kg / RPE) are still shown, creating a table with just one data row (the active input row).

**Problem:** On first use of an exercise, the context looks sparse and confusing — just three empty boxes with "—" placeholders and a header row for one input row. The user may not understand that the column headers map to the fields.

**Recommendation:**
- When `ex.sets.length === 0`, show a subtle instruction line: `"Ingresá tu primera serie"` in `var(--text-dim)` font size 12, above the active row. This collapses automatically once the first set is logged.

---

### M3: Session notes are hidden by default and easy to miss

**Current State:** Session notes are behind a toggle button ("Agregar nota de sesión") placed after the exercise list but before the bottom CTA. The toggle is styled as a plain text button with a small icon.

**Problem:** Clients are unlikely to discover this feature spontaneously. When a session note exists, the button label changes to "Notas de sesión" — but this is easy to overlook.

**Recommendation:**
- On the completion screen (`/sesion/[id]/completada`), the notes field is already prominent. However, mid-session notes should be more discoverable.
- Add the notes textarea as a persistent bottom-of-content section (not collapsible) with a single textarea that saves `onBlur` — just like the completion screen pattern but smaller.

---

### M4: The `sm` Button size (height: 32 px) is used heavily in coach pages and is below the 44 px touch target requirement

**Current State:** Buttons with `size="sm"` have `height: 32`. These appear in table rows, section footers, and the page-level action bars in coach pages.

**Problem:** 32 px is 12 px below the recommended minimum on touch screens. Coach pages are mobile-accessible and the coach may use their phone.

**Recommendation:**
- Increase `sm` to `height: 36` and supplement with a transparent hit-area extension via `padding` or a pseudo-element — the visual size stays compact but the tap area is larger.
- Alternatively, reserve `size="sm"` strictly for desktop-only contexts and use `size="md"` (40 px) as the minimum for mobile-accessible buttons.

---

### M5: Progress page chart is custom SVG with no axis labels or tooltips

**Current State:** The weight chart is a hand-rolled SVG line chart. It shows only `minWeight` and `maxWeight` labels at the bottom corners. There are no date labels, grid lines, or data point tooltips.

**Problem:** The user cannot identify the date of any specific data point. Trends are visible but not actionable — the user cannot tell "when did I hit my lowest point" without cross-referencing the list below.

**Recommendation:**
- Add a `title` element to each SVG circle for browser tooltip support.
- Add 3–4 date labels along the x-axis at equal intervals.
- Alternatively, replace the custom SVG with a lightweight chart library (`recharts`, `chart.js`) that provides interaction out of the box. Given the small scope (weight only), a custom solution with date tooltips on tap/hover is reasonable.

---

### M6: The coach exercise library system exercises (isSystem: true) are not clickable but give no visual hint they're read-only

**Current State:** System exercises have `cursor: "default"` and do not trigger the edit modal. The only visual difference is the absence of the "Propio" badge and the edit icon overlay.

**Problem:** A coach who doesn't notice the edit icon overlay may repeatedly tap a system exercise expecting a modal and get no feedback. Nielsen heuristic #4 (Consistency and standards) — interactive and non-interactive items should be visually distinguishable.

**Recommendation:**
- Add a lock icon or a "Sistema" badge (`tone="neutral"`) to system exercise cards.
- On click of a system exercise, show a lightweight tooltip or toast: "Este ejercicio es del sistema y no se puede editar. Podés crear una copia."

---

### M7: The offline queue banner does not communicate sync status clearly

**Current State:** When `offlineCount > 0`, the banner reads `"{n} serie(s) pendiente(s) · se sincronizarán al reconectar"` with a "Reintentar" button. When online, there is no banner at all.

**Problem:** When the flush is in progress, there is no visual feedback. When it succeeds, the banner disappears but the user might miss the transition. If partial sync occurs (some items fail), the banner count simply decreases — the user doesn't know which sets failed.

**Recommendation:**
- Show a brief "Sincronizado ✓" success banner for 2 seconds after a successful flush (similar to the existing `lastSaved` pattern).
- During flush, disable the "Reintentar" button and show a spinner. This prevents double-submission.

---

## Low Priority Suggestions

### L1: The media lightbox navigation buttons use abbreviated text "← Ant." and "Sig. →"

The abbreviation "Ant." (Anterior) and "Sig." (Siguiente) are non-standard. Prefer `←` / `→` icon-only buttons with `aria-label="Anterior"` / `aria-label="Siguiente"`, or write the full words.

---

### L2: The energy rating 1–10 scale on the completion screen has no legend

Ten lime blocks labelled 1–10 with no explanation of what the scale means (1 = exhausted? 10 = peak?). Add a two-label legend: `Agotado · 1` at the left and `Explosivo · 10` at the right, or add a subtitle: "¿Cómo te sentiste físicamente?".

---

### L3: The `GroupBadge` dropdown for supersets has no keyboard navigation

The coach workout editor's group badge is a custom dropdown triggered by `onClick`. It cannot be opened, navigated, or closed with keyboard alone. Add `onKeyDown` handlers: `Enter`/`Space` to open, `ArrowDown`/`ArrowUp` to navigate, `Escape` to close, `Enter` to select. This also applies to the warmup toggle button (renders as a plain `button` element but has no `role` or `aria-*`).

---

### L4: The coach alumnos (client) page shows "Alumno" label in Spanish for the sidebar section header but "alumnos" URL

The URL `/coach/alumnos` mixes Spanish with the English coach convention elsewhere (e.g. `/coach/workouts`). More importantly: the sidebar item for the client layout reads "Alumno" (singular, lowercase) in dim text — it looks like a section label but it's actually the role indicator. Either remove it (the context is clear from the navigation) or make it a proper section label styled consistently with other section headers.

---

### L5: The login page "Registrate" link uses Rioplatense Spanish (vos conjugation) but elsewhere "Ingresar" uses neutral Spanish

Decide on one register: either full Rioplatense (`Registrate`, `Olvidaste`, `entrená`) or neutral Latin-American Spanish throughout. Currently the login page, the week page ("descansá", "Buen trabajo"), and other pages are consistently Rioplatense, but a few labels use neutral forms. Keep it consistent.

---

### L6: The `select` element for muscle group in the exercise form is not styled

The `<select>` inside the muscle field inherits browser default styling. On iOS Safari, this renders as a native picker which is fine, but on Android it looks inconsistent with the rest of the form. Consider a custom `<select>` wrapper or a segmented button group (given there are only 11 options).

---

### L7: No `aria-label` on any icon-only button in the codebase

All icon-only buttons (the back arrow on the session page, the × close button in the lightbox, the trash icon in the workout editor, the swap icon on the exercise card, etc.) have no `aria-label` or `title` attribute accessible to screen readers. This makes the product non-functional for screen-reader users.

**Minimum fix:** Add `aria-label` to every interactive element that does not have visible text. Example:
```tsx
<button aria-label="Cerrar" onClick={onClose}>
  <Icon name="x" size={14} />
</button>
```

---

## Positive Observations

- **Token system is clean and consistently applied.** All spacing, radii, and colors come from CSS variables. The visual language is coherent end-to-end.
- **Offline support is a differentiator.** Having a localStorage queue and automatic flush on reconnect is a meaningful feature for gym environments with unreliable wifi. It is implemented thoughtfully.
- **The warmup card on the session page is well-considered.** Surfacing warmup info as a dismissible card at the top of the session (not buried in the exercise list) is smart.
- **Superset grouping with color coding is visually clear.** The GROUP_COLORS system (lime/blue/amber/etc.) consistently applied across both the coach editor and the client session view is a good information design decision.
- **The completion screen has good motivational flow.** Showing volume and set stats immediately after finishing, combined with the energy rating prompt, creates a satisfying end to the session.
- **The coach dashboard's alert table** (inactive clients) is a useful at-a-glance tool that surfaces the most actionable information first.
- **The `StateBlock` component** provides consistent loading/empty/error states throughout the app, preventing blank screens.
- **Font choices are appropriate.** Space Grotesk for body/headings and JetBrains Mono for numbers/data creates a clear visual hierarchy between informational and metric content.
