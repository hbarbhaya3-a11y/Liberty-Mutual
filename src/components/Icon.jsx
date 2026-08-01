/* ============================================================================
   Icon — inline SVG icons used across the app.

   Single-file library so we don't depend on lucide/heroicons (no npm install,
   no bundle bloat). Stroke-based design at 24×24 viewBox, currentColor — so
   each icon picks up the surrounding text color and CSS-sized as needed.

   Usage:
     <Icon name="sense" size={18} />
     <Icon name="check" />            // defaults to size 16

   Add new icons by appending to PATHS below. Each entry is the path/element
   string that goes inside the <svg> tag.
   ========================================================================= */

const PATHS = {
  /* SENSE — radar / signal-watching (concentric arcs + a sweep line). */
  sense: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 12 L19 6" />
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M2 12a10 10 0 0 1 20 0" />
    </>
  ),

  /* HYPOTHESIZE — lightbulb (idea taking shape). */
  hypothesize: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c1 .7 1.5 1.9 1.5 3.1V18h5v-.2c0-1.2.5-2.4 1.5-3.1A7 7 0 0 0 12 2z" />
    </>
  ),

  /* TEST — flask / experiment. */
  test: (
    <>
      <path d="M10 2v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8V2" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <line x1="7" y1="16" x2="17" y2="16" />
    </>
  ),

  /* DEPLOY — send / push forward (paper-plane style arrow). */
  deploy: (
    <>
      <path d="m22 2-20 7 9 4 11-11z" />
      <path d="m11 13 4 9 7-20" />
    </>
  ),

  /* LEARN — refresh-cw / feedback cycle. */
  learn: (
    <>
      <polyline points="22 4 22 10 16 10" />
      <polyline points="2 20 2 14 8 14" />
      <path d="M3.5 9a9 9 0 0 1 14.85-3.36L22 10" />
      <path d="M20.5 15a9 9 0 0 1-14.85 3.36L2 14" />
    </>
  ),

  /* BRIEF — file-text (executive report). */
  brief: (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </>
  ),

  /* CHECK — completion marker. */
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),

  /* CHEVRON LEFT — sidebar collapse handle. */
  chevronLeft: (
    <polyline points="15 18 9 12 15 6" />
  ),

  /* CHEVRON RIGHT — sidebar expand handle. */
  chevronRight: (
    <polyline points="9 6 15 12 9 18" />
  ),

  /* CHEVRON DOWN — accordion-open marker. */
  chevronDown: (
    <polyline points="6 9 12 15 18 9" />
  ),

  /* X — disproven / failure / close. */
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),

  /* WARN — triangle alert (mixed-verdict callout). */
  warn: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),

  /* TREND DOWN — KPI declining (good when paired with "blocked", bad when paired with "NII"). */
  trendDown: (
    <>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </>
  ),

  /* UPLOAD — "stage for deploy" action; arrow-into-tray. */
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),

  /* INFO — small info circle for hover hints. */
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),

  /* STAR — hero recommended marker. */
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),

  /* PLAY — Run-style trigger button. */
  play: (
    <polygon points="6 4 20 12 6 20 6 4" />
  ),

  /* ARROW RIGHT — primary CTA chevron. */
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),

  /* ARROW LEFT — back navigation. */
  arrowLeft: (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),

  /* COMMAND key — for keyboard hint. */
  command: (
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  ),

  /* EYE — view content / inspect icon */
  eye: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    </>
  ),

  /* FILE TEXT — document / marketing content icon */
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>
  ),

  /* USER — customer / consumer icon */
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),

  /* MAIL — email icon */
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),

  /* PHONE — agent call icon */
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),

  /* SPARKLES — AI content recommendation icon */
  sparkles: (
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  ),
};

export default function Icon({ name, size = 16, className = "", strokeWidth = 2, fill = "none", ...rest }) {
  const path = PATHS[name];
  if (!path) {
    console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return (
    <svg
      className={"icon icon-" + name + (className ? " " + className : "")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "star" ? "currentColor" : fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
