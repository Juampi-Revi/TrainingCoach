/** Rutas que siguen existiendo, pero no se muestran en la navegación. */
const CLIENT_HIDDEN = [
  "/panel",
  "/comida",
  "/progreso",
  "/mensajes",
  "/notificaciones",
  "/comentarios",
  "/clasificacion",
  "/explorar",
  "/desafios",
  "/logros",
  "/onboarding",
  "/cuenta/wearable",
  "/cuenta/mediciones",
  "/cuenta/configuracion",
];

const COACH_HIDDEN = [
  "/coach/calendario",
  "/coach/mensajes",
  "/coach/notificaciones",
  "/coach/alumnos/grupos",
];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isHiddenClientPath(path: string) {
  return matches(path, CLIENT_HIDDEN);
}

export function isHiddenCoachPath(path: string) {
  return matches(path, COACH_HIDDEN);
}
