export interface OrderItem {
  id: string;
  title: string;
  by?: string;
}

export interface Program {
  id: string;
  themeId: string;
  name: string;
  subtitle?: string; // e.g. "Beloved wife, mother and grandmother"
  dob: string;
  dop: string;
  profilePhoto?: string; // data URL
  tribute: string; // short cover tribute / dates strap
  obituary?: string; // longer life story
  voteOfThanks?: string;
  order: OrderItem[];
  gallery: string[]; // data URLs
  createdAt: number;
}

const KEY = "eventify_programs";

export function loadAll(): Record<string, Program> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProgram(p: Program) {
  const all = loadAll();
  all[p.id] = p;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getProgram(id: string): Program | null {
  return loadAll()[id] || null;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function fileToDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
