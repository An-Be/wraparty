// The one file to edit when spinning up a new tool from this template.
// Everything user-facing that names the tool reads from here.
export const site = {
  name: "Wraparty",
  description: "A new game every day. Connect two people through the movies they made or were in, with more games on the way.",
  /** Shown in the footer. Keep it short. */
  tagline: "New pairs every day at midnight UTC.",
  /** The brand line: hub headline and share-card copy. */
  slogan: "A new game every day.",
  /** "More from the same shelf" on the hub: sibling apps, no author line. */
  shelf: [
    { name: "Tab Math", line: "Split the check from one photo.", url: "https://tabmath.com" },
    { name: "TagYourTurn", line: "Whose turn is it today?", url: "https://tagyourturn.com" },
  ],
  /** Browser UI color. Paper white keeps the monochrome look. */
  themeColor: "#ffffff",
  /** Browser UI color in dark mode; matches --color-paper there. */
  themeColorDark: "#0b0b0b",
  /** A public daily game: its pages are meant to be found and shared. */
  indexable: true,
} as const;
