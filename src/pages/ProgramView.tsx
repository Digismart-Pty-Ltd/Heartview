import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowLeft, Printer } from "lucide-react";
import { getProgram, formatDate, type Program } from "@/lib/program";
import { getTheme } from "@/lib/themes";
import { toast } from "sonner";

/** A single framed "page" of the program. */
const Page = ({ frame, paper, accent, children }: { frame: string; paper: string; accent: string; children: React.ReactNode }) => (
  <div
    className="relative mx-auto w-full overflow-hidden rounded-md shadow-paper print:shadow-none"
    style={{
      aspectRatio: "3 / 4",
      maxWidth: "640px",
      background: `hsl(${paper})`,
    }}
  >
    {/* Gold double border */}
    <div
      className="pointer-events-none absolute inset-3 rounded-sm"
      style={{ border: `1px solid hsl(${accent} / 0.55)` }}
    />
    <div
      className="pointer-events-none absolute inset-4 rounded-sm"
      style={{ border: `1px solid hsl(${accent} / 0.25)` }}
    />
    {/* Top-left rose corner */}
    <img
      src={frame}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 h-[38%] w-[38%] select-none object-contain"
    />
    {/* Bottom-right rose corner (rotated) */}
    <img
      src={frame}
      alt=""
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 h-[38%] w-[38%] rotate-180 select-none object-contain"
    />
    {/* Inner content */}
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[14%] py-[16%] text-center">
      {children}
    </div>
  </div>
);

const ProgramView = () => {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!id) return;
    const p = getProgram(id);
    setProgram(p);
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

  const theme = getTheme(program.themeId);
  const url = window.location.href;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Could not copy"); }
  };

  const year = (d: string) => (d ? new Date(d).getFullYear() : "");
  const accent = theme.accent;
  const ink = theme.ink;
  const soft = theme.soft;

  // Split name: first line is family/last name (caps), second line is given names (italic).
  const parts = program.name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts[parts.length - 1] : program.name;
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Share banner */}
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

      {/* Pages */}
      <article className="container max-w-3xl space-y-10 pb-20 fade-in">
        {/* PAGE 1 — COVER */}
        <Page frame={theme.frame} paper={theme.paper}>
          <p className="font-serif text-xl italic md:text-2xl" style={{ color: `hsl(${accent})` }}>
            In loving memory of
          </p>

          {program.profilePhoto && (
            <div
              className="mx-auto mt-5 h-24 w-24 overflow-hidden rounded-full border-[3px] shadow-soft md:h-28 md:w-28"
              style={{ borderColor: `hsl(${accent} / 0.5)` }}
            >
              <img src={program.profilePhoto} alt={program.name} className="h-full w-full object-cover" />
            </div>
          )}

          <h1
            className="mt-6 font-serif text-3xl uppercase tracking-wide md:text-5xl"
            style={{ color: `hsl(${ink})` }}
          >
            {lastName}
          </h1>
          {givenNames && (
            <p
              className="mt-2 font-serif text-2xl italic md:text-3xl"
              style={{ color: `hsl(${accent})` }}
            >
              {givenNames}
            </p>
          )}

          <p className="mt-6 font-serif text-sm italic md:text-base" style={{ color: `hsl(${soft})` }}>
            {formatDate(program.dob)} — {formatDate(program.dop)}
          </p>

          {program.subtitle && (
            <p className="mt-5 font-serif text-base italic md:text-lg" style={{ color: `hsl(${soft})` }}>
              {program.subtitle}
            </p>
          )}
          {!program.subtitle && program.tribute && (
            <p className="mt-5 font-serif text-base italic md:text-lg" style={{ color: `hsl(${soft})` }}>
              {program.tribute}
            </p>
          )}
        </Page>

        {/* PAGE 2 — ORDER OF SERVICE */}
        <Page frame={theme.frame} paper={theme.paper}>
          <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
            Order Of Service
          </h2>

          <ul className="mt-6 w-full max-w-md space-y-2.5 text-left">
            {program.order.map((item) => (
              <li key={item.id} className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 text-sm md:text-base">
                <span className="font-mono text-xs tracking-wide" style={{ color: `hsl(${accent})` }}>
                  {item.time || ""}
                </span>
                <span className="font-medium uppercase tracking-wide" style={{ color: `hsl(${ink})` }}>
                  {item.title}
                </span>
                <span className="italic text-right" style={{ color: `hsl(${soft})` }}>
                  {item.by || ""}
                </span>
              </li>
            ))}
          </ul>
        </Page>

        {/* PAGE 3 — OBITUARY (only if provided) */}
        {program.obituary && (
          <Page frame={theme.frame} paper={theme.paper}>
            <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
              Obituary
            </h2>
            <div
              className="mt-5 max-h-full overflow-hidden whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
              style={{ color: `hsl(${ink})` }}
            >
              {program.obituary}
            </div>
          </Page>
        )}

        {/* PAGE 4 — VOTE OF THANKS */}
        {program.voteOfThanks && (
          <Page frame={theme.frame} paper={theme.paper}>
            <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
              Vote Of Thanks
            </h2>
            <p
              className="mt-6 max-w-md whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
              style={{ color: `hsl(${soft})` }}
            >
              {program.voteOfThanks}
            </p>
          </Page>
        )}

        {/* Gallery (extra, no frame to avoid clutter) */}
        {program.gallery.length > 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 shadow-paper md:p-10">
            <h2 className="text-center text-xs uppercase tracking-[0.3em] text-gold">Cherished moments</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {program.gallery.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg shadow-soft">
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-whisper print:hidden">
          {year(program.dob)} — {year(program.dop)} · Created with{" "}
          <Link to="/" className="text-gold hover:underline">Eventify</Link>
        </p>
      </article>
    </div>
  );
};

export default ProgramView;
