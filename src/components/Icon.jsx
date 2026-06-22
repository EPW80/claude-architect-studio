// Inline SVG icon set. Pass `title` for an accessible label on meaningful icons;
// decorative icons can omit it (they're aria-hidden).
export const Icon = ({ d, size = 16, color = "currentColor", className = "", title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
  >
    {title ? <title>{title}</title> : null}
    <path d={d} />
  </svg>
);

export const icons = {
  database:
    "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 18c-4.41 0-8-1.79-8-4V9.91C5.5 11.17 8.56 12 12 12s6.5-.83 8-2.09V16c0 2.21-3.59 4-8 4zm0-8c-4.41 0-8-1.79-8-4s3.59-4 8-4 8 1.79 8 4-3.59 4-8 4z",
  cpu: "M9 3H5a2 2 0 0 0-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 0 1 2 2v4m-6-6v18m0 0H9m6 0h4a2 2 0 0 0 2-2v-4M3 9v6m18-6v6M3 15h6m12 0h-6",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  search: "M11 21a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm7-3 4 4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v3m0-12V3m8.66 9h-3m-13.32 0H1m15.07-5.07l-2.12 2.12M7.05 16.95l-2.12 2.12m14.14 0l-2.12-2.12M7.05 7.05L4.93 4.93",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  play: "M5 3l14 9-14 9V3z",
  stop: "M18 6H6v12h12V6z",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  refresh:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  arrow_right: "M5 12h14M12 5l7 7-7 7",
  external:
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z",
  git: "M9 18c-4.51.37-5.5-2.61-7-3m14 3a5 5 0 0 0-5-5c0-2.21 1.79-4 4-4s4 1.79 4 4a5 5 0 0 0-5 5zm-9 0V6m0 6a5 5 0 0 0 5-5 5 5 0 0 0-5-5",
};
