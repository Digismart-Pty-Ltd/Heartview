import frameRoses from "@/assets/frame-roses.png";
import frameBlush from "@/assets/frame-blush.png";
import frameSage from "@/assets/frame-sage.png";

export type ThemeId = "roses" | "blush" | "sage";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  frame: string;
  /** HSL values (no hsl()) used as CSS vars on the program */
  accent: string;     // gold/title color
  ink: string;        // body text
  soft: string;       // soft body text
  paper: string;      // page background
}

export const THEMES: Theme[] = [
  {
    id: "roses",
    name: "White Roses",
    description: "Classic white roses with eucalyptus and a gold dove & cross.",
    frame: frameRoses,
    accent: "36 38% 48%",
    ink: "30 20% 22%",
    soft: "30 12% 45%",
    paper: "40 38% 98%",
  },
  {
    id: "blush",
    name: "Soft Blush",
    description: "Romantic blush and ivory roses with a delicate gold frame.",
    frame: frameBlush,
    accent: "20 35% 52%",
    ink: "20 22% 24%",
    soft: "20 12% 48%",
    paper: "20 40% 98%",
  },
  {
    id: "sage",
    name: "Sage Greenery",
    description: "Botanical eucalyptus and olive — minimal and serene.",
    frame: frameSage,
    accent: "90 22% 38%",
    ink: "100 15% 18%",
    soft: "100 10% 38%",
    paper: "80 30% 98%",
  },
];

export const getTheme = (id?: string): Theme =>
  THEMES.find((t) => t.id === id) || THEMES[0];
