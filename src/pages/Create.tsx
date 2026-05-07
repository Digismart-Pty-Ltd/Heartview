import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X, Check } from "lucide-react";
import { fileToDataUrl, saveProgram, shortId, type OrderItem, type Program } from "@/lib/program";
import { THEMES, type ThemeId, getTheme } from "@/lib/themes";
import { Page } from "./ProgramView";

const MAX_BYTES = 5 * 1024 * 1024;

const Create = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"theme" | "form">("theme");
  const [themeId, setThemeId] = useState<ThemeId>("white");

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
    const program: Program = {
      id: shortId(),
      themeId,
      name: name.trim(),
      subtitle: subtitle.trim(),
      dob, dop,
      profilePhoto,
      tribute: tribute.trim(),
      obituary: obituary.trim(),
      voteOfThanks: voteOfThanks.trim(),
      order: cleanOrder,
      gallery,
      createdAt: Date.now(),
    };
    try {
      saveProgram(program);
      toast.success("Program created");
      navigate(`/program/${program.id}`);
    } catch {
      toast.error("Could not save — images may be too large");
      setSubmitting(false);
    }
  };

  /* ---------------- Step 1: Theme picker ---------------- */
  if (step === "theme") {
    return (
      <div className="min-h-screen bg-gradient-warm py-10">
        <div className="container max-w-5xl">
          <Link to="/" className="text-sm text-whisper hover:text-gold">← Back</Link>

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
                        DOE
                      </p>
                      <p className="mt-1 font-serif text-lg italic md:text-xl" style={{ color: `hsl(${t.accent})` }}>
                        John
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
              onClick={() => setStep("form")}
              className="bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90"
            >
              Continue with {getTheme(themeId).name}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Step 2: Form ---------------- */
  const theme = getTheme(themeId);

  return (
    <div className="min-h-screen bg-gradient-warm py-10">
      <div className="container max-w-3xl">
        <button onClick={() => setStep("theme")} className="text-sm text-whisper hover:text-gold">
          ← Change theme
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Step 2 of 2</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Tell us about them</h1>
          <p className="mt-3 text-whisper">
            Theme: <span className="font-medium text-ink">{theme.name}</span>
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
              placeholder="Letsedi Joyce Nomaza" className="mt-2" maxLength={120} />
          </div>

          <div>
            <Label htmlFor="subtitle" className="font-serif text-lg text-ink">Subtitle</Label>
            <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Beloved wife, mother and grandmother" className="mt-2" maxLength={120} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="dob" className="font-serif text-lg text-ink">Date of birth *</Label>
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="dop" className="font-serif text-lg text-ink">Date of passing *</Label>
              <Input id="dop" type="date" value={dop} onChange={(e) => setDop(e.target.value)} className="mt-2" />
            </div>
          </div>

          {/* Cover tribute (short) */}
          <div>
            <Label htmlFor="tribute" className="font-serif text-lg text-ink">Cover tribute *</Label>
            <Textarea id="tribute" value={tribute} onChange={(e) => setTribute(e.target.value)}
              rows={3} maxLength={300}
              placeholder="A short line for the cover, e.g. Beloved wife, mother and grandmother."
              className="mt-2" />
          </div>

          {/* Obituary (long) */}
          <div>
            <Label htmlFor="obituary" className="font-serif text-lg text-ink">Obituary</Label>
            <Textarea id="obituary" value={obituary} onChange={(e) => setObituary(e.target.value)}
              rows={8} maxLength={3000}
              placeholder="Tell their life story — birthplace, schooling, family, career, memories…"
              className="mt-2" />
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
                    <Input type="time" value={item.time || ""} onChange={(e) => updateOrder(item.id, { time: e.target.value })}
                      aria-label="Time" />
                    <Input value={item.title} onChange={(e) => updateOrder(item.id, { title: e.target.value })}
                      placeholder="e.g. Opening & Welcome" maxLength={120} />
                    <Input value={item.by || ""} onChange={(e) => updateOrder(item.id, { by: e.target.value })}
                      placeholder="Led by (optional)" maxLength={80} />
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
              rows={4} maxLength={800} className="mt-2" />
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
                    className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-primary-foreground opacity-0 transition-soft group-hover:opacity-100"
                    aria-label="Remove">
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
