import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus, Trash2, Upload, X, Check, Clock, ArrowLeft,
  ExternalLink, LogOut, ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import { fileToDataUrl, shortId, type OrderItem, type Program, formatDate } from "@/lib/program";
import { THEMES, type ThemeId, getTheme } from "@/lib/themes";
import { Page, OrderList, chunkOrderItems, chunkObituary, measureObituaryChunks } from "./ProgramView";
import { createPendingPayment, createYocoCheckout } from "@/services/programService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/services/firebase";
import { signOut, onAuthStateChanged, deleteUser, type User } from "firebase/auth";
import eventMemorial from "@/assets/event-funeral.jpg";
import eventWedding from "@/assets/event-wedding.jpg";
import eventChurch from "@/assets/event-church.jpg";
import eventCelebration from "@/assets/event-celebration.jpg";
import heartViewLogo from "@/assets/heartview-logo.png";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";


const MAX_BYTES = 5 * 1024 * 1024;
const DRAFT_KEY = "create-draft";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_GALLERY = 4;

const MAX_GALLERY_IMAGE_B64_CHARS = 200_000;

interface DraftData {
  step: "theme" | "form";
  themeId: ThemeId;
  name: string;
  dob: string;
  dop: string;
  tribute: string;
  obituary: string;
  voteOfThanks: string;
  profilePhoto: string;
  gallery: string[];
  order: OrderItem[];
}

type PreviousProgram = {
  firestoreId: string;
  name: string;
  themeId: ThemeId;
  dob: string;
  dop: string;
  createdAt: number;
  profilePhoto?: string;
};

// ── Image compression helpers ─────────────────────────────────────────────────
const compressToFit = (src: string, maxDim: number, maxB64Chars: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);

      let quality = 0.8;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > maxB64Chars && quality > 0.2) {
        quality = Math.round((quality - 0.1) * 10) / 10;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      if (dataUrl.length > maxB64Chars) {
        canvas.width = Math.round(w / 2);
        canvas.height = Math.round(h / 2);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      }
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("could not load image"));
    img.src = src;
  });

const compressGalleryImage = async (file: File): Promise<string> => {
  const raw = await fileToDataUrl(file, 900);
  return compressToFit(raw, 600, MAX_GALLERY_IMAGE_B64_CHARS);
};

// ── Logo nav link ─────────────────────────────────────────────────────────────
const LogoLink = () => (
  <Link to="/" className="flex items-center gap-2">
    <img src={heartViewLogo} alt="HeartView" className="h-7 w-7" />
    <span className="font-semibold text-ink">
      heart<span className="text-terracotta">View</span>
    </span>
  </Link>
);

// ── Delete account modal ──────────────────────────────────────────────────────
const DeleteAccountModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-elegant backdrop-blur"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />
      <div className="p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Account removal</p>
          <h2 className="mt-2 font-serif text-3xl text-ink">Delete account?</h2>
          <p className="mt-4 text-sm leading-relaxed text-whisper">
            Your HeartView account and saved programs will no longer be accessible.
            This action cannot be undone.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-soft hover:bg-red-600"
          >
            Yes, delete my account
          </button>
          <button
            onClick={onCancel}
            className="rounded-full border border-border bg-ivory px-6 py-3 text-sm text-ink transition-soft hover:border-gold/40 hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Sign out modal ────────────────────────────────────────────────────────────
const SignOutModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-elegant backdrop-blur"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />
      <div className="p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/20 bg-cream">
          <LogOut className="h-7 w-7 text-gold" />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Account</p>
          <h2 className="mt-2 font-serif text-3xl text-ink">Sign out?</h2>
          <p className="mt-4 text-sm leading-relaxed text-whisper">
            Your draft will be saved. You can sign back in at any time to continue.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-soft hover:bg-ink/90"
          >
            Yes, sign me out
          </button>
          <button
            onClick={onCancel}
            className="rounded-full border border-border bg-ivory px-6 py-3 text-sm text-ink transition-soft hover:border-gold/40 hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Gallery limit modal ───────────────────────────────────────────────────────
const GalleryLimitModal = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-elegant backdrop-blur"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />
      <div className="p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
          <AlertCircle className="h-7 w-7 text-amber-500" />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Gallery limit reached</p>
          <h2 className="mt-2 font-serif text-2xl text-ink">4 photos maximum</h2>
          <p className="mt-4 text-sm leading-relaxed text-whisper">
            You can only upload up to <span className="font-medium text-ink">4 photos</span> in
            the memory gallery. Please remove an existing photo before adding a new one.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-soft hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Preview + Confirm modal ───────────────────────────────────────────────────
const PreviewConfirmModal = ({
  program,
  themeId,
  onConfirm,
  onBack,
  submitting,
}: {
  program: Omit<Program, "id" | "createdAt">;
  themeId: ThemeId;
  onConfirm: () => void;
  onBack: () => void;
  submitting: boolean;
}) => {
  const theme = getTheme(themeId);
  const accent = theme.accent;
  const ink = theme.ink;
  const soft = theme.soft;

const parts = program.name.trim().split(/\s+/);
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : program.name;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  const obituaryFontSize = "0.875rem";

  const obituaryProbeRef = useRef<HTMLDivElement>(null);
  const [obituaryChunks, setObituaryChunks] = useState<string[]>(
    program.obituary ? [program.obituary] : []
  );
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!program.obituary || !obituaryProbeRef.current) return;
    const el = obituaryProbeRef.current;
    const totalH = el.offsetHeight;
    const totalW = el.offsetWidth;
    if (!totalH || !totalW) return;
    const contentW = totalW * (1 - 0.18 * 2);
    const headingPx = totalW * 0.042;
    const availableH = totalH * (1 - 0.20 - 0.30) - headingPx - totalW * 0.02;
    const result = measureObituaryChunks(program.obituary, contentW, availableH);
    setObituaryChunks(result);
  }, [program.obituary, obituaryProbeRef]);

  type PageDef = { key: string; label: string; content: React.ReactNode };
  const pages: PageDef[] = [];

  // Cover
  pages.push({
    key: "cover",
    label: "Cover",
    content: (
      <>
        <p className="font-serif text-base italic md:text-xl" style={{ color: `hsl(${accent})` }}>
          In loving memory of
        </p>
        {program.profilePhoto && (
          <div
            className="mx-auto mt-3 h-32 w-32 shrink-0 overflow-hidden rounded-full border-[3px] shadow-soft md:h-40 md:w-40"
            style={{ borderColor: `hsl(${accent} / 0.5)` }}
          >
            <img
              src={program.profilePhoto}
              alt={program.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <h1
          className="mt-3 font-serif text-2xl uppercase tracking-wide md:text-4xl"
          style={{ color: `hsl(${ink})` }}
        >
          {givenNames}
        </h1>
        {lastName && (
          <p className="mt-1 font-serif text-xl italic md:text-2xl" style={{ color: `hsl(${accent})` }}>
            {lastName}
          </p>
        )}
        <p className="mt-3 font-serif text-xs italic md:text-sm" style={{ color: `hsl(${soft})` }}>
          {formatDate(program.dob)} — {formatDate(program.dop)}
        </p>
        {program.tribute && (
          <p className="mt-2 font-serif text-sm italic md:text-base" style={{ color: `hsl(${soft})` }}>
            {program.tribute}
          </p>
        )}
      </>
    ),
  });

  // Order of service — paginated, using the same shared OrderList component
  const orderChunks = chunkOrderItems(program.order);
  orderChunks.forEach((chunk, chunkIdx) => {
    pages.push({
      key: `order-${chunkIdx}`,
      label: chunkIdx === 0 ? "Order of Service" : `Order (cont. ${chunkIdx + 1})`,
      content: (
        <OrderList
          chunk={chunk}
          chunkIdx={chunkIdx}
          accent={accent}
          ink={ink}
          soft={soft}
        />
      ),
    });
  });

  // Obituary
// Obituary — paginated
 if (program.obituary) {
    obituaryChunks.forEach((chunk, chunkIdx) => {
      pages.push({
        key: `obituary-${chunkIdx}`,
        label: chunkIdx === 0 ? "Obituary" : `Obituary (cont. ${chunkIdx + 1})`,
        content: (
          <>
            <h2
              className="font-serif text-3xl italic md:text-4xl"
              style={{ color: `hsl(${accent})` }}
            >
              {chunkIdx === 0 ? "Obituary" : "Obituary (cont.)"}
            </h2>
            <div
              className="mt-5 w-full overflow-hidden whitespace-pre-line text-left leading-relaxed"
              style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
            >
              {chunk}
            </div>
          </>
        ),
      });
    });
  }

  // Vote of thanks
  if (program.voteOfThanks) {
    pages.push({
      key: "vote",
      label: "Vote of Thanks",
      content: (
        <>
          <h2
            className="font-serif text-3xl italic md:text-4xl"
            style={{ color: `hsl(${accent})` }}
          >
            Vote Of Thanks
          </h2>
          <p
            className="mt-5 w-full whitespace-pre-line text-left leading-relaxed"
            style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
          >
            {program.voteOfThanks}
          </p>
        </>
      ),
    });
  }

  // Gallery
  if (program.gallery.length > 0) {
    pages.push({
      key: "gallery",
      label: "Gallery",
      content: (
        <>
          <h2
            className="font-serif text-3xl italic md:text-4xl"
            style={{ color: `hsl(${accent})` }}
          >
            Cherished Moments
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {program.gallery.slice(0, MAX_GALLERY).map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg shadow-soft">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  return (
<div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-warm">
      {/* Invisible probe for obituary measurement */}
      <div
        ref={obituaryProbeRef}
        aria-hidden
        className="pointer-events-none fixed opacity-0"
        style={{ aspectRatio: "3 / 4", width: "880px", top: "-9999px", left: "-9999px" }}
      />
            {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="container flex max-w-3xl items-center justify-between py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-whisper transition-soft hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to edit
          </button>
          <LogoLink />
          <span className="text-xs text-whisper">
            Page {currentPage + 1} of {pages.length}
          </span>
        </div>
      </div>

      <div className="container max-w-3xl flex-1 py-8">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Almost there</p>
          <h1 className="mt-2 font-serif text-3xl text-ink md:text-4xl">Review your program</h1>
          <p className="mt-2 mx-auto max-w-md text-sm leading-relaxed text-whisper">
            This is exactly what your guests will see. Once you generate the link, you can only
            edit the <span className="font-medium text-ink">order of service</span> — so please
            check everything carefully.
          </p>
        </div>

        {/* Warning banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <span className="font-semibold">Please review carefully.</span> After generating your
            share link, only the order of service can be edited. Names, dates, photos, obituary
            and tribute are permanent.
          </p>
        </div>

        {/* Page tabs */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {pages.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setCurrentPage(i)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-soft ${
                i === currentPage
                  ? "bg-ink text-primary-foreground"
                  : "border border-border bg-card text-whisper hover:border-gold/40 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Page preview */}
        <div className="relative">
          <Page frame={theme.frame} paper={theme.paper} accent={accent}>
            {pages[currentPage].content}
          </Page>
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-soft hover:border-gold/40 hover:shadow-elegant md:-left-6"
            >
              <ChevronLeft className="h-4 w-4 text-ink" />
            </button>
          )}
          {currentPage < pages.length - 1 && (
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-soft hover:border-gold/40 hover:shadow-elegant md:-right-6"
            >
              <ChevronRight className="h-4 w-4 text-ink" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === currentPage ? "20px" : "8px",
                background:
                  i === currentPage ? `hsl(${accent})` : `hsl(${accent} / 0.25)`,
              }}
            />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-paper">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full border-border sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Go back &amp; edit
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="w-full bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1"
            >
              {submitting ? "Creating your program…" : "✓ Confirm & generate share link"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Previously view ───────────────────────────────────────────────────────────
const PreviouslyView = ({ onBack, user }: { onBack: () => void; user: User | null }) => {
  const [programs, setPrograms] = useState<PreviousProgram[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) { setPrograms([]); setLoading(false); return; }
        const q = query(collection(db, "programs"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const now = Date.now();
        const results: PreviousProgram[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Program & { userId?: string };
          if (
            typeof data.name !== "string" ||
            typeof data.themeId !== "string" ||
            !THEMES.some((t) => t.id === data.themeId) ||
            typeof data.dob !== "string" ||
            typeof data.dop !== "string" ||
            typeof data.createdAt !== "number"
          ) return;
          const themeId = data.themeId as ThemeId;
          if (now - data.createdAt < NINETY_DAYS_MS) {
            results.push({
              firestoreId: doc.id,
              name: data.name,
              themeId,
              dob: data.dob,
              dop: data.dop,
              createdAt: data.createdAt,
              profilePhoto: data.profilePhoto,
            });
          }
        });
        results.sort((a, b) => b.createdAt - a.createdAt);
        setPrograms(results);
      } catch (err) {
        console.error(err);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const daysRemaining = (createdAt: number) => {
    const elapsed = Date.now() - createdAt;
    return Math.max(0, Math.ceil((NINETY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000)));
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteUser(user);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign in again before deleting your account.");
      } else {
        toast.error("Could not delete account");
      }
      setConfirmDelete(false);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-10">
      {confirmDelete && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div className="container max-w-4xl">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-whisper transition-soft hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <LogoLink />
          <div className="hidden items-center gap-3 sm:flex">
            {user && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            )}
            <button
              onClick={async () => {
                try { await signOut(auth); toast.success("Signed out"); navigate("/auth"); }
                catch { toast.error("Could not sign out"); }
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
            >
              <LogOut className="h-4 w-4 text-gold" /> Sign out
            </button>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="mt-3 flex flex-wrap items-center gap-3 sm:hidden">
          {user && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          )}
          <button
            onClick={async () => {
              try { await signOut(auth); toast.success("Signed out"); navigate("/auth"); }
              catch { toast.error("Could not sign out"); }
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
          >
            <LogOut className="h-4 w-4 text-gold" /> Sign out
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Previously created</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Your programs</h1>
          {user && (
            <p className="mt-2 text-sm text-whisper">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
            </p>
          )}
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-whisper">
            Saved to your account for up to 90 days. Sign in on any device to access them.
          </p>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
              <p className="text-whisper">Loading your programs…</p>
            </div>
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
              <p className="text-whisper">
                Sign in to see your previously created programs across all your devices.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="mt-6 rounded-full bg-ink px-8 text-primary-foreground hover:bg-ink/90"
              >
                Sign in
              </Button>
            </div>
          ) : !programs || programs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
              <p className="text-whisper">
                Nothing here yet — your created programs will appear in this list.
              </p>
              <Button
                onClick={onBack}
                className="mt-6 rounded-full bg-ink px-8 text-primary-foreground hover:bg-ink/90"
              >
                Choose a theme
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((prog) => {
                const theme = getTheme(prog.themeId);
                const parts = prog.name.trim().split(/\s+/);
                const givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : prog.name;
                const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
                const days = daysRemaining(prog.createdAt);
                const isExpiringSoon = days <= 14;
                return (
                  <button
                    key={prog.firestoreId}
                    type="button"
                    onClick={() => navigate(`/program/${prog.firestoreId}`)}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-paper transition-soft hover:border-gold/50 hover:shadow-elegant"
                  >
                    <div className="p-3">
                      <Page frame={theme.frame} paper={theme.paper} accent={theme.accent}>
                        {prog.profilePhoto && (
                          <div
                            className="mx-auto mb-3 h-12 w-12 overflow-hidden rounded-full border-2"
                            style={{ borderColor: `hsl(${theme.accent} / 0.5)` }}
                          >
                            <img
                              src={prog.profilePhoto}
                              alt={prog.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <p
                          className="font-serif text-sm italic"
                          style={{ color: `hsl(${theme.accent})` }}
                        >
                          In loving memory of
                        </p>
                        <p
                          className="mt-2 font-serif text-xl uppercase tracking-wide"
                          style={{ color: `hsl(${theme.ink})` }}
                        >
                          {givenNames}
                        </p>
                        {lastName && (
                          <p
                            className="mt-1 font-serif text-base italic"
                            style={{ color: `hsl(${theme.accent})` }}
                          >
                            {lastName}
                          </p>
                        )}
                        <p
                          className="mt-2 font-serif text-xs italic"
                          style={{ color: `hsl(${theme.soft})` }}
                        >
                          {formatDate(prog.dob)} — {formatDate(prog.dop)}
                        </p>
                      </Page>
                    </div>
                    <div className="border-t border-border px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-base text-ink">{prog.name}</p>
                          <p className="mt-0.5 text-xs text-whisper">
                            {theme.name} ·{" "}
                            {new Date(prog.createdAt).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-whisper opacity-0 transition-soft group-hover:opacity-100" />
                      </div>
                      <div className="mt-2">
                        {isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3 w-3" />
                            Expires in {days} day{days !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-cream px-2 py-0.5 text-xs text-whisper">
                            <Clock className="h-3 w-3" />
                            {days} days remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-whisper/70">
          Programs are linked to your account and accessible from any device. Programs are
          permanently deleted after 90 days.
        </p>
      </div>
    </div>
  );
};

// ── Event type data ───────────────────────────────────────────────────────────
const EVENT_TYPES = [
  {
    key: "memorial",
    label: "Memorial Services",
    description: "Dignified programs honouring loved ones with grace and warmth.",
    count: "5 templates",
    active: true,
    image: eventMemorial,
  },
  {
    key: "weddings",
    label: "Weddings",
    description: "Elegant programs for your special day, from ceremony to reception.",
    count: "0 templates",
    active: false,
    image: eventWedding,
  },
  {
    key: "church",
    label: "Church Services",
    description: "Organised service programs with hymns, readings, and outlines.",
    count: "0 templates",
    active: false,
    image: eventChurch,
  },
  {
    key: "celebrations",
    label: "Celebrations",
    description: "Vibrant programs for birthdays, graduations, and joyful gatherings.",
    count: "0 templates",
    active: false,
    image: eventCelebration,
  },
];

const DragCropModal = ({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const CIRCLE_SIZE = 280;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      // Center image initially
      const scale = Math.max(CIRCLE_SIZE / img.naturalWidth, CIRCLE_SIZE / img.naturalHeight);
      const initZoom = scale;
      setZoom(initZoom);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  const clampOffset = (ox: number, oy: number, z: number, img: HTMLImageElement) => {
    const drawW = img.naturalWidth * z;
    const drawH = img.naturalHeight * z;
    const maxX = (drawW - CIRCLE_SIZE) / 2;
    const maxY = (drawH - CIRCLE_SIZE) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const s = CIRCLE_SIZE;
    canvas.width = s;
    canvas.height = s;
    ctx.clearRect(0, 0, s, s);
    const drawW = imgEl.naturalWidth * zoom;
    const drawH = imgEl.naturalHeight * zoom;
    const x = s / 2 - drawW / 2 - offset.x;
    const y = s / 2 - drawH / 2 - offset.y;
    ctx.drawImage(imgEl, x, y, drawW, drawH);
  }, [imgEl, offset, zoom]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current || !imgEl) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const next = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom, imgEl);
    setOffset(next);
  };
  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragStart.current && imgEl) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.mx;
      const dy = t.clientY - dragStart.current.my;
      const next = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom, imgEl);
      setOffset(next);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!imgEl) return;
    e.preventDefault();
    const minZ = Math.max(CIRCLE_SIZE / imgEl.naturalWidth, CIRCLE_SIZE / imgEl.naturalHeight);
    const newZoom = Math.max(minZ, Math.min(3, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
    setOffset((o) => clampOffset(o.x, o.y, newZoom, imgEl));
  };

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!imgEl) return;
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    setOffset((o) => clampOffset(o.x, o.y, newZoom, imgEl));
  };

  const handleConfirm = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
    const compressed = await compressToFit(dataUrl, 800, 150_000);
    onConfirm(compressed);
  };

  const minZoom = imgEl
    ? Math.max(CIRCLE_SIZE / imgEl.naturalWidth, CIRCLE_SIZE / imgEl.naturalHeight)
    : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-elegant backdrop-blur"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />
        <div className="p-6">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-gold mb-1">
            Crop photo
          </p>
          <p className="text-center text-sm text-whisper mb-5">
            Drag to reposition · scroll or pinch to zoom
          </p>

          {/* Circle crop area */}
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-full border-2 border-gold/60 shadow-soft"
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, cursor: dragging ? "grabbing" : "grab" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => { dragStart.current = null; }}
              onWheel={onWheel}
            >
              <canvas
                ref={canvasRef}
                width={CIRCLE_SIZE}
                height={CIRCLE_SIZE}
                style={{ display: "block", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="mt-5 flex items-center gap-3 px-2">
            <span className="text-xs text-whisper">−</span>
            <input
              type="range"
              min={minZoom}
              max={minZoom * 3}
              step={0.001}
              value={zoom}
              onChange={handleZoomSlider}
              className="flex-1 h-2 cursor-pointer appearance-none rounded-full bg-secondary accent-gold"
            />
            <span className="text-xs text-whisper">+</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-soft hover:opacity-90"
            >
              Apply crop
            </button>
            <button
              onClick={onCancel}
              className="rounded-full border border-border bg-ivory px-6 py-3 text-sm text-ink transition-soft hover:border-gold/40 hover:bg-cream"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ── Main Create component ─────────────────────────────────────────────────────
const Create = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"events" | "theme" | "form" | "preview" | "previously">("events");
  const [previousCreateView, setPreviousCreateView] = useState<"events" | "theme">("events");
  const [themeId, setThemeId] = useState<ThemeId>("white");
  const [selectedEvent, setSelectedEvent] = useState<string>(
    () => EVENT_TYPES.find((et) => et.active)?.key ?? "memorial"
  );

  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
 const [confirmDeleteMain, setConfirmDeleteMain] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [showGalleryLimit, setShowGalleryLimit] = useState(false);

    useInactivityLogout();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dop, setDop] = useState("");
  const [tribute, setTribute] = useState("");
  const [obituary, setObituary] = useState("");
  const [voteOfThanks, setVoteOfThanks] = useState(
    "The family wishes to thank everyone for your love, prayers and support during this difficult time. Your presence and kindness are deeply appreciated. May God bless you all."
  );
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropRawSrc, setCropRawSrc] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([
    { id: crypto.randomUUID(), time: "10:00", title: "Opening & Welcome", by: "" },
    { id: crypto.randomUUID(), time: "10:10", title: "Hymn", by: "" },
    { id: crypto.randomUUID(), time: "10:20", title: "Opening Prayer", by: "" },
    { id: crypto.randomUUID(), time: "10:30", title: "Tributes", by: "" },
    { id: crypto.randomUUID(), time: "11:00", title: "Sermon", by: "" },
    { id: crypto.randomUUID(), time: "11:30", title: "Vote of Thanks", by: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);



useEffect(() => {
    if (currentUser === undefined) return;
    if (currentUser === null) { navigate("/auth", { replace: true }); return; }
    if (!currentUser.emailVerified) {
      signOut(auth).then(() => navigate("/auth", { replace: true }));
    }
  }, [currentUser, navigate]);

useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: DraftData = JSON.parse(saved);
        if (draft.step === "form") setView("form");
        else setView("theme");
        setThemeId(draft.themeId);
        setName(draft.name);
        setDob(draft.dob);
        setDop(draft.dop);
        setTribute(draft.tribute);
        setObituary(draft.obituary);
        setVoteOfThanks(draft.voteOfThanks);
        setProfilePhoto(draft.profilePhoto);
        setGallery((draft.gallery ?? []).slice(0, MAX_GALLERY));
        setOrder(draft.order);
        setHasDraft(true);
        // toast.info("Draft restored from previous session");
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [view]);

 useEffect(() => {
    if (!draftLoaded) return;
if (view === "previously" || view === "events" || view === "preview" || view === "theme") return;
    const draft: DraftData = {
      step: view as "theme" | "form",
      themeId, name, dob, dop, tribute, obituary,
      voteOfThanks, profilePhoto, gallery, order,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [view, themeId, name, dob, dop, tribute, obituary, voteOfThanks, profilePhoto, gallery, order, draftLoaded]);
const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setName("");
    setDob("");
    setDop("");
    setTribute("");
    setObituary("");
    setVoteOfThanks("The family wishes to thank everyone for your love, prayers and support during this difficult time. Your presence and kindness are deeply appreciated. May God bless you all.");
    setProfilePhoto("");
    setGallery([]);
    setOrder([
      { id: crypto.randomUUID(), time: "10:00", title: "Opening & Welcome", by: "" },
      { id: crypto.randomUUID(), time: "10:10", title: "Hymn", by: "" },
      { id: crypto.randomUUID(), time: "10:20", title: "Opening Prayer", by: "" },
      { id: crypto.randomUUID(), time: "10:30", title: "Tributes", by: "" },
      { id: crypto.randomUUID(), time: "11:00", title: "Sermon", by: "" },
      { id: crypto.randomUUID(), time: "11:30", title: "Vote of Thanks", by: "" },
    ]);
    setThemeId("white");
    toast.success("Draft cleared");
  };

const handleSignOut = () => setConfirmSignOut(true);

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      await deleteUser(currentUser);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign in again before deleting your account.");
      } else {
        toast.error("Could not delete account");
      }
      setConfirmDeleteMain(false);
      console.error(error);
    }
  };

const handleProfile = async (file?: File) => {
  if (!file) return;
  if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
  try {
    toast.info("Processing photo…");
    const raw = await fileToDataUrl(file, 1200);
    setCropRawSrc(raw);
    setShowCropModal(true);
  } catch {
    toast.error("Could not process image — please try a different file");
  }
};

  const handleGallery = async (files: FileList | null) => {
    if (!files) return;
    if (gallery.length >= MAX_GALLERY) {
      setShowGalleryLimit(true);
      return;
    }
    const remaining = MAX_GALLERY - gallery.length;
    const selected = Array.from(files);
    if (selected.length > remaining) setShowGalleryLimit(true);
    const list = selected.slice(0, remaining);
    const results: string[] = [];
    for (const f of list) {
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is over 5 MB`); continue; }
      if (!f.type.startsWith("image/")) continue;
      try {
        const compressed = await compressGalleryImage(f);
        results.push(compressed);
      } catch {
        toast.error(`Could not process ${f.name}`);
      }
    }
    if (results.length > 0) setGallery((g) => [...g, ...results]);
  };

  const updateOrder = (id: string, patch: Partial<OrderItem>) =>
    setOrder((o) => o.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addOrder = () =>
    setOrder((o) => [...o, { id: crypto.randomUUID(), title: "", by: "" }]);
  const removeOrder = (id: string) =>
    setOrder((o) => o.filter((i) => i.id !== id));

const handlePreview = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return toast.error("Please enter the full name");
  if (!dob || !dop) return toast.error("Please enter both dates");
  if (!tribute.trim()) return toast.error("Please add a short tribute");
  const cleanOrder = order.filter((i) => i.title.trim());
  if (cleanOrder.length === 0) return toast.error("Please add at least one order of service item");
  setOrder(cleanOrder);
  setView("preview");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  // Confirming the preview starts a Yoco checkout for R149. The program
  // itself is only created server-side (finalizePayment) once the webhook
  // confirms the payment succeeded.
  const handleConfirm = async () => {
    if (!name.trim() || !dob || !dop || !tribute.trim()) return;
    const cleanOrder = order.filter((i) => i.title.trim());
    if (cleanOrder.length === 0) return;
    setSubmitting(true);

    const safeGallery: string[] = [];
    for (const src of gallery.slice(0, MAX_GALLERY)) {
      if (src.length > MAX_GALLERY_IMAGE_B64_CHARS) {
        try {
          safeGallery.push(await compressToFit(src, 600, MAX_GALLERY_IMAGE_B64_CHARS));
        } catch { /* skip */ }
      } else {
        safeGallery.push(src);
      }
    }

    const programDraft: Omit<Program, "id" | "createdAt"> & { userId?: string } = {
      themeId,
      name: name.trim(),
      dob,
      dop,
      profilePhoto,
      tribute: tribute.trim(),
      obituary: obituary.trim(),
      voteOfThanks: voteOfThanks.trim(),
      order: cleanOrder,
      gallery: safeGallery,
      ...(currentUser ? { userId: currentUser.uid } : {}),
    };

    try {
      const { paymentId } = await createPendingPayment(programDraft);
      localStorage.setItem("pending-payment-id", paymentId);
      const { redirectUrl } = await createYocoCheckout(paymentId);
      window.location.href = redirectUrl;
      // Note: we intentionally don't setSubmitting(false) or navigate here —
      // the browser is about to leave for Yoco's hosted checkout page.
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Could not start payment. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm text-whisper">
        Loading…
      </div>
    );
  }

  // ── Previously view ───────────────────────────────────────────────────────
  if (view === "previously") {
    return (
      <PreviouslyView onBack={() => setView(previousCreateView)} user={currentUser} />
    );
  }

  // ── Preview + confirm view ────────────────────────────────────────────────
  if (view === "preview") {
    const previewProgram = {
      themeId,
      name: name.trim(),
      dob,
      dop,
      profilePhoto,
      tribute: tribute.trim(),
      obituary: obituary.trim(),
      voteOfThanks: voteOfThanks.trim(),
      order: order.filter((i) => i.title.trim()),
      gallery: gallery.slice(0, MAX_GALLERY),
    };
    return (
      <PreviewConfirmModal
        program={previewProgram as Omit<Program, "id" | "createdAt">}
        themeId={themeId}
        onConfirm={handleConfirm}
        onBack={() => setView("form")}
        submitting={submitting}
      />
    );
  }

  // ── Step 0: Event type picker ─────────────────────────────────────────────
  if (view === "events") {
    return (
      <div className="min-h-screen bg-gradient-warm py-10">
     {confirmDeleteMain && (
          <DeleteAccountModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setConfirmDeleteMain(false)}
          />
        )}
        {confirmSignOut && (
          <SignOutModal
            onConfirm={async () => {
              try { await signOut(auth); toast.success("Signed out"); navigate("/auth"); }
              catch { toast.error("Could not sign out"); }
              finally { setConfirmSignOut(false); }
            }}
            onCancel={() => setConfirmSignOut(false)}
          />
        )}
        <div className="container max-w-5xl">
          {/* Desktop top bar */}
          <div className="hidden items-center justify-between sm:flex">
            <Link to="/" className="text-sm text-whisper transition-soft hover:text-gold">
              ← Back
            </Link>
            <LogoLink />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPreviousCreateView("events"); setView("previously"); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
              >
                <Clock className="h-4 w-4 text-gold" /> Previously created
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setConfirmDeleteMain(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>
                  <button
                    onClick={() => setConfirmSignOut(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-ink shadow-sm transition-soft hover:border-red-300 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              )}
            </div>
          </div>
          {currentUser && (
            <p className="mt-2 hidden text-right text-xs text-whisper sm:block">
              Signed in as <span className="font-medium text-ink">{currentUser.email}</span>
            </p>
          )}

          {/* Mobile top bar */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-sm text-whisper transition-soft hover:text-gold">
                ← Back
              </Link>
              <LogoLink />
            </div>
            <div className="mt-3 flex flex-col items-end gap-2">
              <button
                onClick={() => { setPreviousCreateView("events"); setView("previously"); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
              >
                <Clock className="h-4 w-4 text-gold" /> Previously created
              </button>
              {currentUser && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDeleteMain(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>
                  <button
                    onClick={() => setConfirmSignOut(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-red-300 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
              {currentUser && (
                <p className="text-xs text-whisper">
                  Signed in as <span className="font-medium text-ink">{currentUser.email}</span>
                </p>
              )}
            </div>
          </div>
{hasDraft && (
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-gold/30 bg-cream/60 px-5 py-3">
              <span className="text-sm text-ink">📝 You have an unfinished program draft.</span>
              <button
                onClick={clearDraft}
                className="text-sm text-red-500 underline hover:no-underline"
              >
                Clear draft
              </button>
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-gold">Event Types</p>
            <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">For Every Occasion</h1>
            <p className="mx-auto mt-3 max-w-lg text-whisper">
              Purpose-built templates designed for life's most important moments.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EVENT_TYPES.map((et) => {
              const isSelected = selectedEvent === et.key;
              return (
                <button
                  key={et.key}
                  type="button"
                  onClick={() => {
                    if (!et.active) return;
                    setSelectedEvent(et.key);
                    setView("theme");
                    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                  }}
                  disabled={!et.active}
                  className={`group relative overflow-hidden rounded-2xl transition-soft ${
                    et.active
                      ? isSelected
                        ? "border-2 border-gold shadow-elegant"
                        : "border border-border hover:border-gold/50 hover:shadow-elegant"
                      : "cursor-not-allowed border border-border"
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                    <img
                      src={et.image}
                      alt={et.label}
                      className={`h-full w-full object-cover transition-transform duration-700 ${
                        et.active ? "group-hover:scale-105" : "brightness-50"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {isSelected && (
                      <span className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-sm">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    {!et.active && (
                      <div className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                        Coming soon
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="mb-3 inline-block rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-gold backdrop-blur-sm">
                        {et.count}
                      </span>
                      <h3 className="font-serif text-xl font-semibold leading-tight text-white">
                        {et.label}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                        {et.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                setView("theme");
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }}
              className="bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Continue with{" "}
              {EVENT_TYPES.find((et) => et.key === selectedEvent)?.label ?? "Memorial Services"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Theme picker ──────────────────────────────────────────────────
  if (view === "theme") {
    return (
      <div className="min-h-screen bg-gradient-warm py-10">
   {confirmDeleteMain && (
          <DeleteAccountModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setConfirmDeleteMain(false)}
          />
        )}
        {confirmSignOut && (
          <SignOutModal
            onConfirm={async () => {
              try { await signOut(auth); toast.success("Signed out"); navigate("/auth"); }
              catch { toast.error("Could not sign out"); }
              finally { setConfirmSignOut(false); }
            }}
            onCancel={() => setConfirmSignOut(false)}
          />
        )}

        <div className="container max-w-5xl">
          {/* Desktop top bar */}
          <div className="hidden items-center justify-between sm:flex">
            <button
              onClick={() => setView("events")}
              className="text-sm text-whisper transition-soft hover:text-gold"
            >
              ← Back
            </button>
            <LogoLink />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPreviousCreateView("theme"); setView("previously"); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
              >
                <Clock className="h-4 w-4 text-gold" /> Previously created
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setConfirmDeleteMain(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-ink shadow-sm transition-soft hover:border-red-300 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              )}
            </div>
          </div>
          {currentUser && (
            <p className="mt-2 hidden text-right text-xs text-whisper sm:block">
              Signed in as <span className="font-medium text-ink">{currentUser.email}</span>
            </p>
          )}

          {/* Mobile top bar */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView("events")}
                className="text-sm text-whisper transition-soft hover:text-gold"
              >
                ← Back
              </button>
              <LogoLink />
            </div>
            <div className="mt-3 flex flex-col items-end gap-2">
              <button
                onClick={() => { setPreviousCreateView("theme"); setView("previously"); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-gold/50"
              >
                <Clock className="h-4 w-4 text-gold" /> Previously created
              </button>
              {currentUser && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDeleteMain(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm transition-soft hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>
                  <button
                    onClick={() => setConfirmSignOut(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm transition-soft hover:border-red-300 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
              {currentUser && (
                <p className="text-xs text-whisper">
                  Signed in as <span className="font-medium text-ink">{currentUser.email}</span>
                </p>
              )}
            </div>
          </div>

         {hasDraft && (
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-gold/30 bg-cream/60 px-5 py-3">
              <span className="text-sm text-ink">📝 You have an unfinished program draft.</span>
              <button
                onClick={clearDraft}
                className="text-sm text-red-500 underline hover:no-underline"
              >
                Clear draft
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-gold">Step 1 of 2</p>
            <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Choose your theme</h1>
            <p className="mt-3 text-whisper">
              Pick a template — you can preview the full design before filling in details.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setThemeId(t.id);
                    setView("form");
                    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                  }}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-card text-left shadow-paper transition-soft ${
                    active ? "border-gold shadow-elegant" : "border-border hover:border-gold/50"
                  }`}
                >
                  <div className="p-3">
                    <Page frame={t.frame} paper={t.paper} accent={t.accent}>
                      <p
                        className="font-serif text-base italic md:text-lg"
                        style={{ color: `hsl(${t.accent})` }}
                      >
                        In loving memory of
                      </p>
                      <p
                        className="mt-4 font-serif text-2xl uppercase tracking-wide md:text-3xl"
                        style={{ color: `hsl(${t.ink})` }}
                      >
                        John
                      </p>
                      <p
                        className="mt-1 font-serif text-lg italic md:text-xl"
                        style={{ color: `hsl(${t.accent})` }}
                      >
                        Doe
                      </p>
                      <p
                        className="mt-3 font-serif text-xs italic md:text-sm"
                        style={{ color: `hsl(${t.soft})` }}
                      >
                        1952 — 2025
                      </p>
                    </Page>
                  </div>
                  <div className="border-t border-border p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xl text-ink">{t.name}</h3>
                      {active && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-whisper">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                setView("form");
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }}
              className="bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Continue with {getTheme(themeId).name}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────
  const theme = getTheme(themeId);

  return (
    <div className="min-h-screen bg-gradient-warm py-10">
{showGalleryLimit && <GalleryLimitModal onClose={() => setShowGalleryLimit(false)} />}
      {showCropModal && cropRawSrc && (
        <DragCropModal
          src={cropRawSrc}
          onConfirm={(dataUrl) => {
            setProfilePhoto(dataUrl);
            setShowCropModal(false);
            setCropRawSrc("");
            toast.success("Photo cropped");
          }}
          onCancel={() => {
            setShowCropModal(false);
            setCropRawSrc("");
          }}
        />
      )}

      <div className="container max-w-3xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView("theme")}
            className="text-sm text-whisper hover:text-gold"
          >
            ← Change theme
          </button>
          <LogoLink />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Step 2 of 2</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Tell us about them</h1>
          <p className="mt-3 text-whisper">
            Theme: <span className="font-medium text-ink">{theme.name}</span>
          </p>
        </div>

        <form
          onSubmit={handlePreview}
          className="mt-10 space-y-8 rounded-2xl bg-card p-6 shadow-paper md:p-10"
        >
          {/* Profile photo */}
          <div>
            <Label className="font-serif text-2xl text-ink">Profile portrait</Label>
            <div className="mt-6 grid gap-8 lg:grid-cols-[auto_1fr]">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-cream">
                {profilePhoto ? (
             <img
                    src={profilePhoto}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-whisper">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
              </div>

              <div className="space-y-5">
                <div>
                  <input
                    id="profile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProfile(e.target.files?.[0])}
                  />
                  <Label htmlFor="profile">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gold/40 text-base"
                      asChild
                    >
                      <span>{profilePhoto ? "Replace photo" : "Upload photo"}</span>
                    </Button>
                  </Label>
                  <p className="mt-2 text-sm text-whisper">Optional — JPG or PNG, up to 5 MB</p>
                </div>

              {profilePhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gold/40 text-base"
                    onClick={() => {
                      setCropRawSrc(profilePhoto);
                      setShowCropModal(true);
                    }}
                  >
                    Edit crop
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="font-serif text-lg text-ink">
              Full name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Letsedi Joyce Nomaza"
              className="mt-2 w-full min-w-0"
              maxLength={120}
              autoComplete="name"
              autoCorrect="on"
              autoCapitalize="words"
              spellCheck
            />
          </div>

          {/* Dates */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="dob" className="font-serif text-lg text-ink">
                Date of birth *
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-2 w-full min-w-0"
                autoComplete="bday"
              />
            </div>
            <div>
              <Label htmlFor="dop" className="font-serif text-lg text-ink">
                Date of passing *
              </Label>
              <Input
                id="dop"
                type="date"
                value={dop}
                onChange={(e) => setDop(e.target.value)}
                className="mt-2 w-full min-w-0"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Cover tribute */}
          <div>
            <Label htmlFor="tribute" className="font-serif text-lg text-ink">
              Cover tribute *
            </Label>
            <Textarea
              id="tribute"
              value={tribute}
              onChange={(e) => setTribute(e.target.value)}
              rows={3}
              maxLength={130}
              placeholder="A short line for the cover, e.g. Beloved wife, mother and grandmother."
              className="mt-2 w-full min-w-0"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
            />
            <p className="mt-1 text-xs text-whisper">{tribute.length} / 130</p>
          </div>

          {/* Obituary */}
          <div>
            <Label htmlFor="obituary" className="font-serif text-lg text-ink">
              Obituary
            </Label>
            <Textarea
              id="obituary"
              value={obituary}
              onChange={(e) => setObituary(e.target.value)}
              rows={8}
              maxLength={6000}
              placeholder="Tell their life story — birthplace, schooling, family, career, memories…"
              className="mt-2 w-full min-w-0"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
            />
            <p className="mt-1 text-xs text-whisper">{obituary.length} / 6000</p>
          </div>

          {/* Order of service */}
          <div>
            <Label className="font-serif text-lg text-ink">Order of service *</Label>
            <p className="mt-1 text-sm text-whisper">
              Add each item in the order it will take place.
            </p>
            <div className="mt-4 space-y-3">
              {order.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-ivory p-3"
                >
                  <span className="mt-2 w-6 text-center font-serif text-gold">{idx + 1}</span>
                  <div className="min-w-0 flex-1 grid gap-2 md:grid-cols-[100px_2fr_1fr]">
                    <Input
                      type="time"
                      value={item.time || ""}
                      onChange={(e) => updateOrder(item.id, { time: e.target.value })}
                      aria-label="Time"
                      className="w-full min-w-0"
                    />
                    <Input
                      value={item.title}
                      onChange={(e) => updateOrder(item.id, { title: e.target.value })}
                      placeholder="e.g. Opening & Welcome"
                      maxLength={120}
                      autoComplete="off"
                      autoCorrect="on"
                      autoCapitalize="words"
                      spellCheck
                      className="w-full min-w-0"
                    />
                    <Input
                      value={item.by || ""}
                      onChange={(e) => updateOrder(item.id, { by: e.target.value })}
                      placeholder="Led by (optional)"
                      maxLength={80}
                      autoComplete="off"
                      autoCorrect="on"
                      autoCapitalize="words"
                      spellCheck
                      className="w-full min-w-0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrder(item.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-whisper" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addOrder}
              className="mt-3 border-gold/40"
            >
              <Plus className="mr-2 h-4 w-4" /> Add item
            </Button>
          </div>

          {/* Vote of thanks */}
          <div>
            <Label htmlFor="vot" className="font-serif text-lg text-ink">
              Vote of thanks
            </Label>
            <Textarea
              id="vot"
              value={voteOfThanks}
              onChange={(e) => setVoteOfThanks(e.target.value)}
              rows={4}
              maxLength={800}
              className="mt-2"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
            />
          </div>

          {/* Gallery */}
          <div>
            <Label className="font-serif text-lg text-ink">Memory gallery</Label>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-whisper">Optional — up to {MAX_GALLERY} photos.</p>
              <span
                className={`text-xs font-medium ${
                  gallery.length >= MAX_GALLERY ? "text-amber-600" : "text-whisper"
                }`}
              >
                {gallery.length} / {MAX_GALLERY}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-4">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-primary-foreground opacity-0 transition-soft group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {gallery.length < MAX_GALLERY && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/40 bg-cream/40 text-whisper transition-soft hover:bg-cream">
                  <Plus className="h-5 w-5" />
                  <span className="mt-1 text-xs">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleGallery(e.target.files)}
                  />
                </label>
              )}
              {gallery.length >= MAX_GALLERY && (
                <button
                  type="button"
                  onClick={() => setShowGalleryLimit(true)}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-amber-500 transition-soft hover:bg-amber-100"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span className="mt-1 text-xs">Limit reached</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Preview my program →
            </Button>
            <p className="mt-3 text-center text-xs text-whisper">
              You'll review everything before your share link is generated.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;