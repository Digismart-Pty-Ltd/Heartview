import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { fileToDataUrl, saveProgram, shortId, type OrderItem, type Program } from "@/lib/program";

const MAX_BYTES = 5 * 1024 * 1024;

const Create = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dop, setDop] = useState("");
  const [tribute, setTribute] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([
    { id: crypto.randomUUID(), title: "Welcome & Opening Prayer", by: "" },
    { id: crypto.randomUUID(), title: "Hymn", by: "" },
    { id: crypto.randomUUID(), title: "Eulogy", by: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleProfile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return toast.error("Photo must be under 5 MB");
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    try {
      setProfilePhoto(await fileToDataUrl(file, 800));
    } catch {
      toast.error("Could not read image");
    }
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
    if (!tribute.trim()) return toast.error("Please add a tribute message");
    const cleanOrder = order.filter((i) => i.title.trim());
    if (cleanOrder.length === 0) return toast.error("Please add at least one order of service item");

    setSubmitting(true);
    const program: Program = {
      id: shortId(),
      name: name.trim(),
      dob, dop,
      profilePhoto,
      tribute: tribute.trim(),
      order: cleanOrder,
      gallery,
      createdAt: Date.now(),
    };
    try {
      saveProgram(program);
      toast.success("Program created");
      navigate(`/program/${program.id}`);
    } catch (err) {
      toast.error("Could not save — images may be too large");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-10">
      <div className="container max-w-3xl">
        <Link to="/" className="text-sm text-whisper hover:text-gold">← Back</Link>

        <div className="mt-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Create a program</p>
          <h1 className="mt-3 font-serif text-4xl text-ink md:text-5xl">Tell us about them</h1>
          <p className="mt-3 text-whisper">Each detail you share becomes part of their tribute.</p>
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
                <input
                  id="profile" type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleProfile(e.target.files?.[0])}
                />
                <Label htmlFor="profile">
                  <Button type="button" variant="outline" className="border-gold/40" asChild>
                    <span>{profilePhoto ? "Replace photo" : "Upload photo"}</span>
                  </Button>
                </Label>
                <p className="mt-2 text-xs text-whisper">JPG or PNG, up to 5 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="font-serif text-lg text-ink">Full name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Margaret Anne Wells" className="mt-2" maxLength={120} />
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

          {/* Tribute */}
          <div>
            <Label htmlFor="tribute" className="font-serif text-lg text-ink">Tribute / obituary *</Label>
            <Textarea
              id="tribute" value={tribute} onChange={(e) => setTribute(e.target.value)}
              rows={6} maxLength={2500}
              placeholder="A few words remembering their life, love, and legacy…"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-whisper">{tribute.length} / 2500</p>
          </div>

          {/* Order of service */}
          <div>
            <Label className="font-serif text-lg text-ink">Order of service *</Label>
            <p className="mt-1 text-sm text-whisper">Add each item in the order it will take place.</p>
            <div className="mt-4 space-y-3">
              {order.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-ivory p-3">
                  <span className="mt-2 w-6 text-center font-serif text-gold">{idx + 1}</span>
                  <div className="flex-1 grid gap-2 md:grid-cols-[2fr_1fr]">
                    <Input
                      value={item.title}
                      onChange={(e) => updateOrder(item.id, { title: e.target.value })}
                      placeholder="e.g. Hymn — Amazing Grace"
                      maxLength={120}
                    />
                    <Input
                      value={item.by || ""}
                      onChange={(e) => updateOrder(item.id, { by: e.target.value })}
                      placeholder="Led by (optional)"
                      maxLength={80}
                    />
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

          {/* Gallery */}
          <div>
            <Label className="font-serif text-lg text-ink">Memory gallery</Label>
            <p className="mt-1 text-sm text-whisper">Optional — up to 5 additional photos.</p>
            <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-5">
              {gallery.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
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
            <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90">
              {submitting ? "Creating…" : "Create program & get share link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
