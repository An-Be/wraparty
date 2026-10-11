// The one file to edit when spinning up a new tool from this template.
// Everything user-facing that names the tool reads from here.
export const site = {
  name: "Tool Template",
  description: "A tiny tool. One shared link, no login.",
  /** Shown in the footer. Keep it short. */
  tagline: "Tiny tools for keeping things fair.",
  /** Footer credit link. */
  author: { name: "Andrea", url: "https://andreaberrocal.com" },
  /** Browser UI color. Paper white keeps the monochrome look. */
  themeColor: "#ffffff",
  /** Browser UI color in dark mode; matches --color-paper there. */
  themeColorDark: "#0b0b0b",
  /**
   * Secret-link tools should stay out of search engines. Flip to true only for a
   * tool whose pages are meant to be public.
   */
  indexable: false,
} as const;
