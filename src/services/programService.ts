import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// ── Slug generator ────────────────────────────────────────────────────────────
// Produces a readable URL like "john-doe-2025-k3f9"
function makeSlug(name: string, dop: string): string {
  const year = dop ? new Date(dop).getFullYear() : Date.now();
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")   // strip non-alphanumeric (handles SA names safely)
    .trim()
    .replace(/\s+/g, "-")           // spaces → hyphens
    .slice(0, 35);                  // cap length
  const suffix = Math.random().toString(36).slice(2, 6); // 4-char random e.g. "k3f9"
  return `${base}-${year}-${suffix}`;
}

// ── Collision guard ───────────────────────────────────────────────────────────
// Extremely unlikely but if the slug already exists, append an extra suffix.
async function uniqueSlug(name: string, dop: string): Promise<string> {
  let slug = makeSlug(name, dop);
  const existing = await getDoc(doc(db, "programs", slug));
  if (existing.exists()) {
    // Append an extra 4 random chars and try once more
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

// ── Main export ───────────────────────────────────────────────────────────────
// NOTE: Payments are currently paused. Create.tsx now calls this directly
// instead of going through the finalizePayment Cloud Function, so every
// program created here is treated as already paid & published — there is
// no separate payment step to flip these flags later.
// TODO: once payments resume, set these back to `false` here and let
// finalizePayment (or the webhook) flip them to `true` on confirmed payment.
export const createProgramInFirestore = async (program: any): Promise<string> => {
  try {
    const slug = await uniqueSlug(program.name ?? "program", program.dop ?? "");

    await setDoc(doc(db, "programs", slug), {
      ...program,
      id: slug,
      // Keep createdAt as a number (Date.now()) from the caller — do NOT overwrite
      // with new Date() as that produces a Firestore Timestamp which breaks
      // the 90-day numeric comparison in the Previously view.
      createdAt: typeof program.createdAt === "number" ? program.createdAt : Date.now(),
      published: true,
      paid: true,
    });

    return slug;
  } catch (error) {
    console.error("Firestore Error:", error);
    throw error;
  }
};



export const createPendingPayment = async (programDraft: any) => {
  const fn = httpsCallable(functions, "createPendingPayment");
  const res = await fn({ programDraft });
  return res.data as { paymentId: string };
};

export const createYocoCheckout = async (paymentId: string) => {
  const fn = httpsCallable(functions, "createYocoCheckout");
  const res = await fn({ paymentId });
  return res.data as { redirectUrl: string };
};