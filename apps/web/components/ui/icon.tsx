import type { CSSProperties } from "react";

export type IconName =
  | "search" | "plus" | "check" | "chevR" | "chevL" | "chevD" | "chevUp"
  | "play" | "pause" | "timer" | "reset" | "flame" | "dumbbell"
  | "user" | "users" | "calendar" | "chart" | "msg" | "bell"
  | "alert" | "edit" | "trash" | "filter" | "more" | "x" | "logo"
  | "send" | "home" | "history" | "settings" | "star" | "book"
  | "eye" | "eyeOff" | "lock" | "sun" | "moon"
  | "image" | "repeat";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  search:   <path d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zM21 21l-4.3-4.3" />,
  plus:     <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  check:    <path d="M4 12l5 5L20 6" />,
  chevR:    <path d="M9 6l6 6-6 6" />,
  chevL:    <path d="M15 6l-6 6 6 6" />,
  chevD:    <path d="M6 9l6 6 6-6" />,
  chevUp:   <path d="M6 15l6-6 6 6" />,
  play:     <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />,
  pause:    <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></>,
  timer:    <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M9 2h6" /></>,
  reset:    <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  flame:    <path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3 0 2 1 3 2 3 0-3-1-4 1-8z" />,
  dumbbell: <><path d="M7 8v8M17 8v8M4 10v4M20 10v4" /><path d="M7 12h10" /></>,
  user:     <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  users:    <><circle cx="9" cy="8" r="4" /><path d="M2 21c1-4 3-6 7-6s6 2 7 6" /><path d="M16 4a4 4 0 1 1 0 8" /><path d="M18 21c0-3-1-5-3-6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  chart:    <><path d="M3 3v18h18" /><path d="M7 14l4-5 3 3 5-7" /></>,
  msg:      <path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12z" />,
  bell:     <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  alert:    <><path d="M12 2L1 21h22L12 2z" /><path d="M12 9v5M12 18h.01" /></>,
  edit:     <><path d="M4 20h4L20 8l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
  trash:    <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  filter:   <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
  more:     <><circle cx="6" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="18" cy="12" r="1.5" fill="currentColor" /></>,
  x:        <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  logo:     <><path d="M4 9v6M20 9v6M8 6v12M16 6v12M12 4v16" strokeWidth="2" /></>,
  send:     <path d="M4 12l16-8-6 18-3-7-7-3z" />,
  home:     <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9z" />,
  history:  <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v5l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.5-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.3a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5 0 .9.1 1.3l-2 1.5 2 3.5 2.3-.9a7 7 0 0 0 2.2 1.3L10 21h4l.4-2.3a7 7 0 0 0 2.2-1.3l2.3.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.3z" /></>,
  star:     <path d="M12 3l3 6 6 .9-4.3 4.3 1 6.3L12 17.8 6.3 20.5l1-6.3L3 9.9 9 9l3-6z" />,
  book:     <><path d="M4 4v16a2 2 0 0 0 2 2h14V4H6a2 2 0 0 0-2 2z" /><path d="M4 20h14" /></>,
  eye:      <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff:   <><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A11 11 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2" /><path d="M1 1l22 22" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  lock:     <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  sun:      <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon:     <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  repeat:   <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
};

export function Icon({ name, size = 18, color = "currentColor", style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
