import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowLeft, Printer } from "lucide-react";
import { getProgram, formatDate, type Program } from "@/lib/program";
import { toast } from "sonner";
import oliveBranch from "@/assets/olive-branch.png";

const ProgramView = () => {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!id) return;
    setProgram(getProgram(id));
    // Show share banner only if just created (within ~10s)
    const p = getProgram(id);
    if (p && Date.now() - p.createdAt < 10_000) setShowShare(true);
  }, [id]);

  useEffect(() => {
    if (program) document.title = `In memory of ${program.name} — Eventify`;
  }, [program]);

  if (program === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-warm text-whisper">Loading…</div>;
  }

  if (program === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-warm px-6 text-center">
        <h1 className="font-serif text-3xl text-ink">Program not found</h1>
        <p className="text-whisper">This link may have expired or been entered incorrectly.</p>
        <Link to="/"><Button variant="outline">Return home</Button></Link>
      </div>
    );
  }

  const url = window.location.href;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const year = (d: string) => (d ? new Date(d).getFullYear() : "");

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Share banner (after creation) */}
      {showShare && (
        <div className="border-b border-gold/20 bg-cream/60 print:hidden">
          <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-serif text-lg text-ink">Your program is ready to share</p>
              <p className="text-sm text-whisper">Anyone with this link can view it — no login needed.</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="hidden max-w-[260px] truncate rounded bg-background px-3 py-2 text-xs text-whisper md:inline-block">{url}</code>
              <Button onClick={copy} className="bg-ink text-primary-foreground hover:bg-ink/90">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top nav */}
      <header className="container flex items-center justify-between py-5 print:hidden">
        <Link to="/" className="flex items-center gap-2 text-sm text-whisper hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Eventify
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={copy} className="border-gold/40">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Share
          </Button>
        </div>
      </header>

      {/* Program */}
      <article className="container max-w-2xl pb-20 fade-in">
        <div className="overflow-hidden rounded-2xl bg-card shadow-paper">
          {/* Cover */}
          <section className="px-6 pb-10 pt-12 text-center md:px-12 md:pt-16">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">In loving memory</p>

            {program.profilePhoto && (
              <div className="mx-auto mt-8 h-44 w-44 overflow-hidden rounded-full border-4 border-gold/40 shadow-soft md:h-56 md:w-56">
                <img src={program.profilePhoto} alt={program.name} className="h-full w-full object-cover" />
              </div>
            )}

            <h1 className="mt-8 font-serif text-4xl leading-tight text-ink md:text-5xl">{program.name}</h1>

            <p className="mt-3 font-serif text-xl italic text-whisper">
              {year(program.dob)} — {year(program.dop)}
            </p>

            <div className="mx-auto mt-6 flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-gold/50" />
              <img src={oliveBranch} alt="" className="h-6 w-auto opacity-70" />
              <span className="h-px w-16 bg-gold/50" />
            </div>

            <p className="mt-6 text-sm text-whisper">
              {formatDate(program.dob)} <span className="mx-2 text-gold">·</span> {formatDate(program.dop)}
            </p>
          </section>

          {/* Tribute */}
          <section className="border-t border-border/60 px-6 py-12 md:px-12">
            <h2 className="text-center text-xs uppercase tracking-[0.3em] text-gold">A tribute</h2>
            <p className="mt-6 whitespace-pre-line text-center font-serif text-xl leading-relaxed text-ink md:text-2xl">
              {program.tribute}
            </p>
          </section>

          {/* Order of service */}
          <section className="border-t border-border/60 bg-cream/40 px-6 py-12 md:px-12">
            <h2 className="text-center text-xs uppercase tracking-[0.3em] text-gold">Order of service</h2>
            <ol className="mx-auto mt-8 max-w-md space-y-4">
              {program.order.map((item, i) => (
                <li key={item.id} className="flex gap-4 border-b border-border/60 pb-3 last:border-0">
                  <span className="font-serif text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-serif text-lg text-ink">{item.title}</p>
                    {item.by && <p className="text-sm italic text-whisper">{item.by}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Gallery */}
          {program.gallery.length > 0 && (
            <section className="border-t border-border/60 px-6 py-12 md:px-12">
              <h2 className="text-center text-xs uppercase tracking-[0.3em] text-gold">Cherished moments</h2>
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {program.gallery.map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-lg shadow-soft">
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <section className="border-t border-border/60 px-6 py-10 text-center md:px-12">
            <p className="font-serif text-lg italic text-whisper">
              "Those we love don't go away, they walk beside us every day."
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-whisper print:hidden">
          Created with <Link to="/" className="text-gold hover:underline">Eventify</Link>
        </p>
      </article>
    </div>
  );
};

export default ProgramView;
