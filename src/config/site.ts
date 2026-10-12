// The one file to edit when spinning up a new tool from this template.
// Everything user-facing that names the tool reads from here.
export const site = {
  name: "Wraparty",
  description: "Daily connection games. Link two people through movies (more modes coming). One pair a day, same for everyone.",
  /** Shown in the footer. Keep it short. */
  tagline: "New pairs every day at midnight UTC.",
  /** Footer credit link. */
  author: { name: "Andrea", url: "https://andreaberrocal.com" },
  /** Browser UI color. Paper white keeps the monochrome look. */
  themeColor: "#ffffff",
  /** Browser UI color in dark mode; matches --color-paper there. */
  themeColorDark: "#0b0b0b",
  /** A public daily game: its pages are meant to be found and shared. */
  indexable: true,
} as const;
