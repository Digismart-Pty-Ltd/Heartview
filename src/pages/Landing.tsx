import heroImage from "@/assets/hero-lilies.jpg";
import oliveBranch from "@/assets/olive-branch.png";
import frameWhite from "@/assets/frame-roses-white.png";
import crossDove from "@/assets/cross-dove.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import {
  Heart,
  Share2,
  Sparkles,
  Check,
  QrCode,
  Smartphone,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Preview", href: "#preview" },
  { label: "Pricing", href: "#pricing" },
];

const Landing = () => {
  useReveal();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-cream text-forest">
      {/* FLOATING NAV */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6">
        <nav
          className={`glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-6 ${
            scrolled ? "shadow-elegant" : ""
          }`}
        >
          <Link to="/" className="flex items-center gap-2">
            <span className="display-serif text-xl tracking-tight sm:text-2xl">Eventify</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-forest/70 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="relative transition-colors hover:text-forest after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-terracotta after:transition-all after:duration-300 hover:after:w-full"
              >
                {n.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button size="sm" className="rounded-full bg-forest text-cream hover:bg-forest-deep">
                Get started <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        <div
          className={`glass-nav mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl transition-all duration-500 md:hidden ${
            open ? "max-h-96 opacity-100" : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 p-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-forest/80 transition-colors hover:bg-forest/5"
              >
                {n.label}
              </a>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full rounded-full bg-forest text-cream hover:bg-forest-deep">
                Get started <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pt-28 sm:pt-32">
        <div className="container grid gap-12 py-12 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-16 lg:py-28">
          <div className="space-y-7 lg:col-span-7">
            <div className="animate-fade-up flex items-center gap-3">
              <span className="rule" />
              <p className="eyebrow">Digital event programs · Est. 2026</p>
            </div>

            <h1 className="animate-fade-up-delay-1 display-serif text-4xl leading-[1] text-forest sm:text-5xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.95]">
              Honour every<br />
              <em className="italic text-terracotta">moment</em> with<br />
              grace.
            </h1>

            <p className="animate-fade-up-delay-2 max-w-xl text-base leading-relaxed text-forest/70 sm:text-lg">
              Beautiful digital programs for funerals, memorials, and gatherings
              that matter. Crafted in minutes. Shared in seconds. Remembered always.
            </p>

            <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-full bg-forest text-cream shadow-elegant transition-transform hover:-translate-y-0.5 hover:bg-forest-deep">
                  Create your program <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="#preview">
                <Button size="lg" variant="outline" className="rounded-full border-forest/30 text-forest hover:bg-forest/5">
                  See an example
                </Button>
              </a>
            </div>

            <div className="animate-fade-up-delay-3 flex flex-wrap items-stretch gap-4 pt-4 sm:gap-6 sm:pt-6">
              {[
                { v: "R35", l: "one-time" },
                { v: "2 min", l: "to create" },
                { v: "∞", l: "shares" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 sm:gap-6">
                  {i > 0 && <span className="h-10 w-px bg-forest/15" />}
                  <div>
                    <p className="display-serif text-2xl text-forest sm:text-3xl">{s.v}</p>
                    <p className="eyebrow mt-1">{s.l}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="reveal animate-float-slow relative overflow-hidden rounded-sm shadow-elegant">
              <img
                src={heroImage}
                alt="White lilies and eucalyptus"
                className="h-[360px] w-full object-cover sm:h-[460px] lg:h-[560px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/30 via-transparent to-transparent" />
            </div>

            <div className="reveal absolute -bottom-4 -left-2 max-w-[220px] bg-cream p-4 shadow-elegant sm:-bottom-6 sm:-left-6 sm:max-w-[260px] sm:p-6">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                <p className="eyebrow">In loving memory</p>
              </div>
              <p className="mt-3 display-serif text-base italic leading-snug text-forest sm:text-lg">
                "A life beautifully remembered."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST MARQUEE */}
      <section className="border-y border-forest/10 bg-cream-deep/40">
        <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-5 text-sm text-forest/60 sm:gap-x-10 sm:py-6">
          {["Funerals", "Memorials", "Celebrations of life", "Memorial services", "Gatherings"].map((w, i, arr) => (
            <span key={w} className="flex items-center gap-4 sm:gap-10">
              <span className="display-serif italic">{w}</span>
              {i < arr.length - 1 && <span className="h-1 w-1 rounded-full bg-forest/30" />}
            </span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container py-16 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="reveal lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="rule" />
              <p className="eyebrow">The process</p>
            </div>
            <h2 className="mt-6 display-serif text-3xl leading-tight text-forest sm:text-4xl md:text-5xl">
              Three quiet steps,<br />
              <em className="italic text-terracotta">one</em> lasting tribute.
            </h2>
          </div>
          <div className="reveal lg:col-span-6 lg:col-start-7">
            <p className="text-base leading-relaxed text-forest/70 sm:text-lg">
              We've removed every friction so you can focus on what matters —
              the people, the memories, the moment.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-forest/10 sm:mt-16 md:grid-cols-3">
          {[
            { n: "01", t: "Compose", d: "Add names, dates, and the story you wish to tell. Our editor guides you with care.", icon: Sparkles },
            { n: "02", t: "Curate", d: "Layer in photographs, readings, hymns, and the order of service. Make it unmistakably theirs.", icon: Check },
            { n: "03", t: "Share", d: "A private link or printed QR code. Family and friends arrive with a tap.", icon: Share2 },
          ].map((s) => (
            <div key={s.n} className="reveal group bg-cream p-8 transition-colors duration-500 hover:bg-cream-deep/30 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="display-serif text-5xl text-terracotta/50 transition-transform duration-500 group-hover:scale-110">{s.n}</span>
                <s.icon className="h-5 w-5 text-forest/40 transition-transform duration-500 group-hover:rotate-12" />
              </div>
              <h3 className="mt-8 display-serif text-2xl text-forest sm:mt-10">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-forest/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="bg-forest text-cream">
        <div className="container grid gap-12 py-16 sm:py-24 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="reveal lg:col-span-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-cream/30" />
              <p className="eyebrow text-cream/60">A glimpse</p>
            </div>
            <h2 className="mt-6 display-serif text-3xl leading-tight sm:text-4xl md:text-6xl">
              Mobile-first.<br />
              <em className="italic text-gold">Beautifully</em> so.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-cream/70 sm:text-lg">
              Designed to feel like a fine printed program — but living in every
              guest's pocket. Typography that breathes. Imagery that honours.
            </p>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
              {[
                "Refined editorial typography",
                "Photo galleries & video tributes",
                "Order of service & readings",
                "Guest book & condolence wall",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-cream/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal lg:col-span-6">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              <div className="animate-float-slow relative aspect-[3/4] overflow-hidden rounded-sm bg-cream shadow-elegant">
                <img src={frameWhite} alt="" aria-hidden className="pointer-events-none absolute -left-[2%] -top-[2%] h-[50%] w-[50%] object-contain" />
                <img src={crossDove} alt="" aria-hidden className="pointer-events-none absolute right-[10%] top-[8%] h-[20%] w-auto object-contain" />
                <img src={frameWhite} alt="" aria-hidden className="pointer-events-none absolute -bottom-[2%] -right-[2%] h-[50%] w-[50%] rotate-180 object-contain" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center text-forest">
                  <p className="display-serif italic text-terracotta">In loving memory of</p>
                  <p className="mt-8 display-serif text-3xl uppercase tracking-wide">DOE</p>
                  <p className="mt-1 display-serif text-xl italic text-terracotta">John</p>
                  <p className="mt-6 text-xs italic text-forest/60">1952 — 2025</p>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-4 flex w-36 flex-col items-center gap-2 bg-cream p-4 text-center shadow-elegant sm:-bottom-8 sm:-right-8 sm:w-44 sm:p-5">
                <QrCode className="h-8 w-8 text-forest sm:h-10 sm:w-10" />
                <p className="eyebrow text-forest/60">Scan to view</p>
                <p className="display-serif text-sm italic text-forest">Instant access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container py-16 sm:py-24">
        <div className="reveal mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="divider-ornament">
            <img src={oliveBranch} alt="" className="h-8 w-auto opacity-60" />
          </div>
          <p className="eyebrow mt-6">One price · No surprises</p>
          <h2 className="mt-4 display-serif text-3xl text-forest sm:text-4xl md:text-5xl">
            Simple, <em className="italic text-terracotta">honest</em> pricing.
          </h2>
        </div>

        <div className="reveal mx-auto grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-forest/15 bg-forest/10 md:grid-cols-2">
          <div className="bg-cream p-8 sm:p-12">
            <p className="eyebrow">Eventify Program</p>
            <p className="mt-6">
              <span className="display-serif text-6xl text-forest sm:text-7xl">R35</span>
              <span className="ml-2 text-sm text-forest/50">ZAR</span>
            </p>
            <p className="mt-4 text-sm text-forest/70">
              One-time payment. No subscription. Yours forever.
            </p>
            <Link to="/auth" className="mt-8 inline-block">
              <Button size="lg" className="rounded-full bg-forest text-cream transition-transform hover:-translate-y-0.5 hover:bg-forest-deep">
                Begin your program <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="bg-cream p-8 sm:p-12">
            <ul className="space-y-4">
              {[
                "Full digital funeral program",
                "Custom link & printable QR code",
                "Mobile-perfect on every device",
                "Unlimited photos & edits",
                "Guest condolence wall",
                "Lifetime access — no expiry",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-forest">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-deep text-cream">
        <div className="container py-16 text-center sm:py-24">
          <div className="reveal flex items-center justify-center gap-3">
            <Smartphone className="h-4 w-4 text-gold" />
            <p className="eyebrow text-cream/60">Begin today</p>
          </div>
          <h2 className="reveal mx-auto mt-6 max-w-3xl display-serif text-4xl leading-tight sm:text-5xl md:text-7xl">
            No stress. <em className="italic text-gold">No printing.</em><br />
            Just remembrance.
          </h2>
          <p className="reveal mx-auto mt-6 max-w-xl text-base text-cream/70 sm:text-lg">
            Create something worthy of the moment — in the time it takes to make tea.
          </p>
          <Link to="/auth" className="reveal mt-8 inline-block sm:mt-10">
            <Button size="lg" className="rounded-full bg-cream text-forest transition-transform hover:-translate-y-0.5 hover:bg-cream/90">
              Create your program <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-forest/10 bg-cream">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-forest/60 md:flex-row">
          <span className="display-serif text-xl text-forest">Eventify</span>
          <p className="text-center">© 2026 Eventify. Made with care in South Africa.</p>
  <div className="flex gap-6">
  <Link to="/terms" className="hover:text-forest">
    Privacy
  </Link>

  <Link to="/terms" className="hover:text-forest">
    Terms
  </Link>

  <Link to="/contact" className="hover:text-forest">
    Contact
  </Link>
</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
