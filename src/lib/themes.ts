import frameWhite from "@/assets/frame-roses-white.png";
import frameRed from "@/assets/frame-roses-red.png";
import framePink from "@/assets/frame-roses-pink.png";
import framePeach from "@/assets/frame-roses-peach.png";
import frameLavender from "@/assets/frame-roses-lavender.png";

export type ThemeId = "white" | "red" | "pink" | "peach" | "lavender";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  frame: string;
  accent: string;
  ink: string;
  soft: string;
  paper: string;
}

export const THEMES: Theme[] = [
  {
    id: "white",
    name: "White Roses",
    description: "Ivory roses with soft eucalyptus — timeless and serene.",
    frame: frameWhite,
    accent: "36 38% 48%",
    ink: "30 20% 22%",
    soft: "30 12% 45%",
    paper: "40 38% 98%",
  },
  {
    id: "red",
    name: "Burgundy Roses",
    description: "Deep burgundy roses with dusky greenery — rich and dignified.",
    frame: frameRed,
    accent: "350 45% 38%",
    ink: "350 20% 18%",
    soft: "350 10% 38%",
    paper: "30 25% 97%",
  },
  {
    id: "pink",
    name: "Blush Pink Roses",
    description: "Soft blush roses with babys-breath — gentle and romantic.",
    frame: framePink,
    accent: "10 45% 55%",
    ink: "20 22% 24%",
    soft: "20 12% 48%",
    paper: "20 40% 98%",
  },
  {
    id: "peach",
    name: "Peach Roses",
    description: "Warm peach roses with sage leaves — bright and tender.",
    frame: framePeach,
    accent: "25 60% 52%",
    ink: "25 22% 22%",
    soft: "25 12% 45%",
    paper: "30 45% 98%",
  },
  {
    id: "lavender",
    name: "Lavender Roses",
    description: "Tranquil lavender roses with eucalyptus — peaceful and graceful.",
    frame: frameLavender,
    accent: "265 28% 50%",
    ink: "260 18% 22%",
    soft: "260 10% 45%",
    paper: "270 35% 98%",
  },
];

export const getTheme = (id?: string): Theme =>
  THEMES.find((t) => t.id === id) || THEMES[0];
