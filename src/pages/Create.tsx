import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X, Check, Clock, ArrowLeft, ExternalLink, LogOut } from "lucide-react";
import { fileToDataUrl, shortId, type OrderItem, type Program, formatDate } from "@/lib/program";
import { THEMES, type ThemeId, getTheme } from "@/lib/themes";
import { Page } from "./ProgramView";
import { createProgramInFirestore } from "@/services/programService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/services/firebase";
import { signOut, onAuthStateChanged, deleteUser, type User } from "firebase/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const DRAFT_KEY = "create-draft";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

interface DraftData {
  step: "theme" | "form";
  themeId: ThemeId;
  name: string;
  subtitle: string;
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
      {/* top glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-gold" />

      <div className="p-8">
        {/* icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>

        {/* heading */}
        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Account removal
          </p>

          <h2 className="mt-2 font-serif text-3xl text-ink">
            Delete account?
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-whisper">
            Your Eventify account and saved programs will no longer be accessible.
            This action cannot be undone.
          </p>
        </div>

        {/* buttons */}
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

// ── Previously view ──────────────────────────────────────────────────────────
const PreviouslyView = ({ onBack, user }: { onBack: () => void; user: User | null }) => {
  const [programs, setPrograms] = useState<PreviousProgram[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setPrograms([]);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "programs"),
          where("userId", "==", user.uid)
        );
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
          ) {
            return;
          }

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
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-whisper hover:text-gold transition-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {/* Delete account */}
            {user && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm hover:border-red-300 hover:bg-red-50 transition-soft"
              >
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            )}

            {/* Sign out */}
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  toast.success("Signed out");
                  navigate("/auth");
                } catch (error) {
                  console.error(error);
                  toast.error("Could not sign out");
                }
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm hover:border-gold/50 transition-soft"
            >
              <LogOut className="h-4 w-4 text-gold" /> Sign out
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Previously created</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Your programs</h1>
          {user && (
            <p className="mt-2 text-sm text-whisper">
              Signed in as <span className="text-ink font-medium">{user.email}</span>
            </p>
          )}
          <p className="mt-3 max-w-md mx-auto text-whisper text-sm leading-relaxed">
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
                // Given names first, surname below
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
                            <img src={prog.profilePhoto} alt={prog.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <p className="font-serif text-sm italic" style={{ color: `hsl(${theme.accent})` }}>
                          In loving memory of
                        </p>
                        {/* Given names first */}
                        <p className="mt-2 font-serif text-xl uppercase tracking-wide" style={{ color: `hsl(${theme.ink})` }}>
                          {givenNames}
                        </p>
                        {lastName && (
                          <p className="mt-1 font-serif text-base italic" style={{ color: `hsl(${theme.accent})` }}>
                            {lastName}
                          </p>
                        )}
                        <p className="mt-2 font-serif text-xs italic" style={{ color: `hsl(${theme.soft})` }}>
                          {formatDate(prog.dob)} — {formatDate(prog.dop)}
                        </p>
                      </Page>
                    </div>

                    <div className="border-t border-border px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-base text-ink">{prog.name}</p>
                          <p className="mt-0.5 text-xs text-whisper">
                            {theme.name} · {new Date(prog.createdAt).toLocaleDateString("en-ZA", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-whisper opacity-0 transition-soft group-hover:opacity-100" />
                      </div>

                      <div className="mt-2">
                        {isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            Expires in {days} day{days !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-xs text-whisper border border-border">
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

        <p className="mt-8 text-center text-xs text-whisper/70 leading-relaxed max-w-lg mx-auto">
          Programs are linked to your account and accessible from any device. Programs are permanently deleted after 90 days.
        </p>
      </div>
    </div>
  );
};

// ── Main Create component ─────────────────────────────────────────────────────
const Create = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"theme" | "form" | "previously">("theme");
  const [themeId, setThemeId] = useState<ThemeId>("white");

  // Auth state — undefined = still resolving, null = signed out, User = signed in
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [confirmDeleteMain, setConfirmDeleteMain] = useState(false);

  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dob, setDob] = useState("");
  const [dop, setDop] = useState("");
  const [tribute, setTribute] = useState("");
  const [obituary, setObituary] = useState("");
  const [voteOfThanks, setVoteOfThanks] = useState(
    "The family wishes to thank everyone for your love, prayers and support during this difficult time. Your presence and kindness are deeply appreciated. May God bless you all."
  );
  const [profilePhoto, setProfilePhoto] = useState<string>("");
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

  // ── Track auth state ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // null when signed out, User when signed in
    });
    return () => unsub();
  }, []);

  // ── Auth guard: redirect to /auth once we know the user is not signed in ─────
  useEffect(() => {
    // undefined means Firebase hasn't resolved yet — wait for it
    if (currentUser === undefined) return;
    if (currentUser === null) {
      navigate("/auth", { replace: true });
    }
  }, [currentUser, navigate]);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: DraftData = JSON.parse(saved);
        if (draft.step !== "previously" as never) setView(draft.step);
        setThemeId(draft.themeId);
        setName(draft.name);
        setSubtitle(draft.subtitle);
        setDob(draft.dob);
        setDop(draft.dop);
        setTribute(draft.tribute);
        setObituary(draft.obituary);
        setVoteOfThanks(draft.voteOfThanks);
        setProfilePhoto(draft.profilePhoto);
        setGallery(draft.gallery);
        setOrder(draft.order);
        setDraftLoaded(true);
        toast.info("Draft restored from previous session");
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!draftLoaded) return;
    if (view === "previously") return;
    const draft: DraftData = {
      step: view as "theme" | "form",
      themeId, name, subtitle, dob, dop, tribute, obituary,
      voteOfThanks, profilePhoto, gallery, order,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [view, themeId, name, subtitle, dob, dop, tribute, obituary, voteOfThanks, profilePhoto, gallery, order, draftLoaded]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Draft cleared");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Signed out");
      navigate("/auth");
    } catch {
      toast.error("Could not sign out");
    }
  };

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
    if (file.size > MAX_BYTES) return toast.error("Photo must be under 5 MB");
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    try { setProfilePhoto(await fileToDataUrl(file, 800)); } catch { toast.error("Could not read image"); }
  };

  const handleGallery = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - gallery.length;
    const list = Array.from(files).slice(0, remaining);
    const results: string[] = [];
    for (const f of list) {
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is over 5 MB`); continue; }
      if (!f.type.startsWith("image/")) continue;
      try { results.push(await fileToDataUrl(f, 1200)); } catch { /* skip */ }
    }
    setGallery((g) => [...g, ...results]);
  };

  const updateOrder = (id: string, patch: Partial<OrderItem>) =>
    setOrder((o) => o.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addOrder = () => setOrder((o) => [...o, { id: crypto.randomUUID(), title: "", by: "" }]);
  const removeOrder = (id: string) => setOrder((o) => o.filter((i) => i.id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter the full name");
    if (!dob || !dop) return toast.error("Please enter both dates");
    if (!tribute.trim()) return toast.error("Please add a short tribute");
    const cleanOrder = order.filter((i) => i.title.trim());
    if (cleanOrder.length === 0) return toast.error("Please add at least one order of service item");

    setSubmitting(true);

    const program: Program & { userId?: string } = {
      id: shortId(),
      themeId,
      name: name.trim(),
      subtitle: subtitle.trim(),
      dob,
      dop,
      profilePhoto,
      tribute: tribute.trim(),
      obituary: obituary.trim(),
      voteOfThanks: voteOfThanks.trim(),
      order: cleanOrder,
      gallery,
      createdAt: Date.now(),
      ...(currentUser ? { userId: currentUser.uid } : {}),
    };

    try {
      const firestoreId = await createProgramInFirestore(program);
      toast.success("Program created");
      navigate(`/program/${firestoreId}`);
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      toast.error("Could not save program");
      setSubmitting(false);
    }
  };

  // ── Loading state while Firebase resolves auth ───────────────────────────────
  if (currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm text-whisper">
        Loading…
      </div>
    );
  }

  // ── Previously view ──────────────────────────────────────────────────────────
  if (view === "previously") {
    return <PreviouslyView onBack={() => setView("theme")} user={currentUser} />;
  }

  // ── Step 1: Theme picker ──────────────────────────────────────────────────────
  if (view === "theme") {
    return (
      <div className="min-h-screen bg-gradient-warm py-10">
        {confirmDeleteMain && (
          <DeleteAccountModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setConfirmDeleteMain(false)}
          />
        )}
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-sm text-whisper hover:text-gold">
              ← Back
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("previously")}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink shadow-sm hover:border-gold/50 transition-soft"
              >
                <Clock className="h-4 w-4 text-gold" />
                Previously
              </button>

              {currentUser ? (
                <>
                  {/* Delete account — opens modal */}
                  <button
                    onClick={() => setConfirmDeleteMain(true)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-red-500 shadow-sm hover:border-red-300 hover:bg-red-50 transition-soft"
                  >
                    <Trash2 className="h-4 w-4" /> Delete account
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-ink shadow-sm hover:border-red-300 hover:text-red-600 transition-soft"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Signed-in indicator */}
          {currentUser && (
            <p className="mt-3 text-right text-xs text-whisper">
              Signed in as <span className="text-ink font-medium">{currentUser.email}</span>
            </p>
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
                  onClick={() => setThemeId(t.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-card text-left shadow-paper transition-soft ${
                    active ? "border-gold shadow-elegant" : "border-border hover:border-gold/50"
                  }`}
                >
                  <div className="p-3">
                    <Page frame={t.frame} paper={t.paper} accent={t.accent}>
                      <p className="font-serif text-base italic md:text-lg" style={{ color: `hsl(${t.accent})` }}>
                        In loving memory of
                      </p>
                      <p className="mt-4 font-serif text-2xl uppercase tracking-wide md:text-3xl" style={{ color: `hsl(${t.ink})` }}>
                        John
                      </p>
                      <p className="mt-1 font-serif text-lg italic md:text-xl" style={{ color: `hsl(${t.accent})` }}>
                        Doe
                      </p>
                      <p className="mt-3 font-serif text-xs italic md:text-sm" style={{ color: `hsl(${t.soft})` }}>
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
              onClick={() => setView("form")}
              className="bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Continue with {getTheme(themeId).name}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────────
  const theme = getTheme(themeId);

  return (
    <div className="min-h-screen bg-gradient-warm py-10">
      <div className="container max-w-3xl">
        <button onClick={() => setView("theme")} className="text-sm text-whisper hover:text-gold">
          ← Change theme
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Step 2 of 2</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Tell us about them</h1>
          <p className="mt-3 text-whisper">
            Theme: <span className="font-medium text-ink">{theme.name}</span>
            {draftLoaded && (
              <span className="ml-4 inline-flex items-center gap-2 text-xs text-gold">
                <span>📝 Draft loaded</span>
                <button onClick={clearDraft} className="underline hover:no-underline" title="Clear draft and start fresh">
                  Clear
                </button>
              </span>
            )}
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-8 rounded-2xl bg-card p-6 shadow-paper md:p-10">
          {/* Profile photo */}
          <div>
            <Label className="font-serif text-lg text-ink">Profile portrait</Label>
            <div className="mt-3 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-cream">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-whisper">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <input id="profile" type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleProfile(e.target.files?.[0])} />
                <Label htmlFor="profile">
                  <Button type="button" variant="outline" className="border-gold/40" asChild>
                    <span>{profilePhoto ? "Replace photo" : "Upload photo"}</span>
                  </Button>
                </Label>
                <p className="mt-2 text-xs text-whisper">Optional — JPG or PNG, up to 5 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="font-serif text-lg text-ink">Full name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Letsedi Joyce Nomaza" className="mt-2" maxLength={120}
              autoComplete="name" autoCorrect="on" autoCapitalize="words" spellCheck />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor="subtitle" className="font-serif text-lg text-ink">Subtitle</Label>
            <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Beloved wife, mother and grandmother" className="mt-2" maxLength={120}
              autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck />
          </div>

          {/* Dates */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="dob" className="font-serif text-lg text-ink">Date of birth *</Label>
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-2" autoComplete="bday" />
            </div>
            <div>
              <Label htmlFor="dop" className="font-serif text-lg text-ink">Date of passing *</Label>
              <Input id="dop" type="date" value={dop} onChange={(e) => setDop(e.target.value)} className="mt-2" autoComplete="off" />
            </div>
          </div>

          {/* Cover tribute */}
          <div>
            <Label htmlFor="tribute" className="font-serif text-lg text-ink">Cover tribute *</Label>
            <Textarea id="tribute" value={tribute} onChange={(e) => setTribute(e.target.value)}
              rows={3} maxLength={300} placeholder="A short line for the cover, e.g. Beloved wife, mother and grandmother."
              className="mt-2" autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck />
          </div>

          {/* Obituary */}
          <div>
            <Label htmlFor="obituary" className="font-serif text-lg text-ink">Obituary</Label>
            <Textarea id="obituary" value={obituary} onChange={(e) => setObituary(e.target.value)}
              rows={8} maxLength={3000} placeholder="Tell their life story — birthplace, schooling, family, career, memories…"
              className="mt-2" autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck />
            <p className="mt-1 text-xs text-whisper">{obituary.length} / 3000</p>
          </div>

          {/* Order of service */}
          <div>
            <Label className="font-serif text-lg text-ink">Order of service *</Label>
            <p className="mt-1 text-sm text-whisper">Add each item in the order it will take place.</p>
            <div className="mt-4 space-y-3">
              {order.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-ivory p-3">
                  <span className="mt-2 w-6 text-center font-serif text-gold">{idx + 1}</span>
                  <div className="flex-1 grid gap-2 md:grid-cols-[100px_2fr_1fr]">
                    <Input type="time" value={item.time || ""} onChange={(e) => updateOrder(item.id, { time: e.target.value })} aria-label="Time" />
                    <Input value={item.title} onChange={(e) => updateOrder(item.id, { title: e.target.value })}
                      placeholder="e.g. Opening & Welcome" maxLength={120} autoComplete="off" autoCorrect="on" autoCapitalize="words" spellCheck />
                    <Input value={item.by || ""} onChange={(e) => updateOrder(item.id, { by: e.target.value })}
                      placeholder="Led by (optional)" maxLength={80} autoComplete="off" autoCorrect="on" autoCapitalize="words" spellCheck />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOrder(item.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-whisper" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addOrder} className="mt-3 border-gold/40">
              <Plus className="mr-2 h-4 w-4" /> Add item
            </Button>
          </div>

          {/* Vote of thanks */}
          <div>
            <Label htmlFor="vot" className="font-serif text-lg text-ink">Vote of thanks</Label>
            <Textarea id="vot" value={voteOfThanks} onChange={(e) => setVoteOfThanks(e.target.value)}
              rows={4} maxLength={800} className="mt-2" autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck />
          </div>

          {/* Gallery */}
          <div>
            <Label className="font-serif text-lg text-ink">Memory gallery</Label>
            <p className="mt-1 text-sm text-whisper">Optional — up to 5 additional photos.</p>
            <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-5">
              {gallery.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-primary-foreground opacity-0 transition-soft group-hover:opacity-100" aria-label="Remove">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {gallery.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/40 bg-cream/40 text-whisper transition-soft hover:bg-cream">
                  <Plus className="h-5 w-5" />
                  <span className="mt-1 text-xs">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGallery(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <Button type="submit" size="lg" disabled={submitting}
              className="w-full bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90">
              {submitting ? "Creating…" : "Create program & get share link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
