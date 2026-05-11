import heroImage from "@/assets/hero-lilies.jpg";
import oliveBranch from "@/assets/olive-branch.png";
import frameWhite from "@/assets/frame-roses-white.png";
import crossDove from "@/assets/cross-dove.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart,
  Share2,
  Sparkles,
  Check,
  QrCode,
  Smartphone,
  ArrowUpRight,
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-cream text-forest">
      {/* NAV */}
      <header className="border-b border-forest/10">
        <nav className="container flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="display-serif text-2xl tracking-tight">Eventify</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-forest/70 md:flex">
            <a href="#how" className="hover:text-forest">How it works</a>
            <a href="#preview" className="hover:text-forest">Preview</a>
            <a href="#pricing" className="hover:text-forest">Pricing</a>
            <a href="#voices" className="hover:text-forest">Voices</a>
          </div>
          <Link to="/create">
            <Button className="bg-forest text-cream hover:bg-forest-deep">
              Get started <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container grid gap-12 py-20 lg:grid-cols-12 lg:items-center lg:gap-16 lg:py-28">
          <div className="animate-fade-up space-y-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="rule" />
              <p className="eyebrow">Digital event programs · Est. 2026</p>
            </div>

            <h1 className="display-serif text-5xl leading-[0.95] text-forest md:text-7xl lg:text-[5.5rem]">
              Honour every<br />
              <em className="italic text-terracotta">moment</em> with<br />
              grace.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-forest/70">
              Beautiful digital programs for funerals, memorials, and gatherings
              that matter. Crafted in minutes. Shared in seconds. Remembered always.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/create">
                <Button size="lg" className="bg-forest text-cream hover:bg-forest-deep">
                  Create your program <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="#preview">
                <Button size="lg" variant="outline" className="border-forest/30 text-forest hover:bg-forest/5">
                  See an example
                </Button>
              </a>
            </div>

            <div className="flex items-stretch gap-6 pt-6">
              {[
                { v: "R35", l: "one-time" },
                { v: "2 min", l: "to create" },
                { v: "∞", l: "shares" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <span className="h-10 w-px bg-forest/15" />}
                  <div>
                    <p className="display-serif text-3xl text-forest">{s.v}</p>
                    <p className="eyebrow mt-1">{s.l}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-sm shadow-elegant">
              <img
                src={heroImage}
                alt="White lilies and eucalyptus"
                className="h-[560px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/30 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-6 -left-6 max-w-[260px] bg-cream p-6 shadow-elegant">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                <p className="eyebrow">In loving memory</p>
              </div>
              <p className="mt-3 display-serif text-lg italic leading-snug text-forest">
                "A life beautifully remembered."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST MARQUEE */}
      <section className="border-y border-forest/10 bg-cream-deep/40">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-6 text-sm text-forest/60">
          {["Funerals", "Memorials", "Celebrations of life", "Weddings", "Gatherings"].map((w, i, arr) => (
            <span key={w} className="flex items-center gap-10">
              <span className="display-serif italic">{w}</span>
              {i < arr.length - 1 && <span className="h-1 w-1 rounded-full bg-forest/30" />}
            </span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="rule" />
              <p className="eyebrow">The process</p>
            </div>
            <h2 className="mt-6 display-serif text-4xl leading-tight text-forest md:text-5xl">
              Three quiet steps,<br />
              <em className="italic text-terracotta">one</em> lasting tribute.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="text-lg leading-relaxed text-forest/70">
              We've removed every friction so you can focus on what matters —
              the people, the memories, the moment.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-px bg-forest/10 md:grid-cols-3">
          {[
            { n: "01", t: "Compose", d: "Add names, dates, and the story you wish to tell. Our editor guides you with care.", icon: Sparkles },
            { n: "02", t: "Curate", d: "Layer in photographs, readings, hymns, and the order of service. Make it unmistakably theirs.", icon: Check },
            { n: "03", t: "Share", d: "A private link or printed QR code. Family and friends arrive with a tap.", icon: Share2 },
          ].map((s) => (
            <div key={s.n} className="group bg-cream p-10 transition-colors hover:bg-cream-deep/30">
              <div className="flex items-center justify-between">
                <span className="display-serif text-5xl text-terracotta/50">{s.n}</span>
                <s.icon className="h-5 w-5 text-forest/40" />
              </div>
              <h3 className="mt-10 display-serif text-2xl text-forest">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-forest/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="bg-forest text-cream">
        <div className="container grid gap-16 py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-cream/30" />
              <p className="eyebrow text-cream/60">A glimpse</p>
            </div>
            <h2 className="mt-6 display-serif text-4xl leading-tight md:text-6xl">
              Mobile-first.<br />
              <em className="italic text-gold">Beautifully</em> so.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">
              Designed to feel like a fine printed program — but living in every
              guest's pocket. Typography that breathes. Imagery that honours.
            </p>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
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

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md">
              {/* Editorial program mockup */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-cream shadow-elegant">
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

              <div className="absolute -bottom-8 -right-8 flex w-44 flex-col items-center gap-2 bg-cream p-5 text-center shadow-elegant">
                <QrCode className="h-10 w-10 text-forest" />
                <p className="eyebrow text-forest/60">Scan to view</p>
                <p className="display-serif text-sm italic text-forest">Instant access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="divider-ornament">
            <img src={oliveBranch} alt="" className="h-8 w-auto opacity-60" />
          </div>
          <p className="eyebrow mt-6">One price · No surprises</p>
          <h2 className="mt-4 display-serif text-4xl text-forest md:text-5xl">
            Simple, <em className="italic text-terracotta">honest</em> pricing.
          </h2>
        </div>

        <div className="mx-auto grid max-w-4xl gap-px overflow-hidden rounded-sm border border-forest/15 bg-forest/10 md:grid-cols-2">
          <div className="bg-cream p-12">
            <p className="eyebrow">Eventify Program</p>
            <p className="mt-6">
              <span className="display-serif text-7xl text-forest">R35</span>
              <span className="ml-2 text-sm text-forest/50">ZAR</span>
            </p>
            <p className="mt-4 text-sm text-forest/70">
              One-time payment. No subscription. Yours forever.
            </p>
            <Link to="/create" className="mt-8 inline-block">
              <Button size="lg" className="bg-forest text-cream hover:bg-forest-deep">
                Begin your program <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="bg-cream p-12">
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

      {/* VOICES */}
      <section id="voices" className="border-y border-forest/10 bg-cream-deep/30">
        <div className="container py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="rule" />
              <p className="eyebrow">Words from families</p>
              <span className="rule" />
            </div>
            <h2 className="mt-6 display-serif text-4xl text-forest md:text-5xl">
              Carried with <em className="italic text-terracotta">care</em>.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { q: "This made organising the funeral program effortless. Everyone could access it instantly — even family overseas.", a: "Sarah M.", r: "Cape Town" },
              { q: "Affordable, dignified, and beautifully made. The QR code on the printed cards was perfect for sharing.", a: "Thabo K.", r: "Johannesburg" },
              { q: "The design felt timeless — like something we'd keep on the shelf. Truly, highly recommend.", a: "Lerato P.", r: "Durban" },
            ].map((t, i) => (
              <figure key={i} className="bg-cream p-8 shadow-soft">
                <span className="display-serif text-6xl leading-none text-terracotta/40">"</span>
                <blockquote className="-mt-4 display-serif text-lg leading-snug italic text-forest">
                  {t.q}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-forest/10 pt-4">
                  <Heart className="h-3 w-3 text-terracotta" />
                  <span className="text-sm font-medium text-forest">{t.a}</span>
                  <span className="text-xs text-forest/50">· {t.r}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-deep text-cream">
        <div className="container py-24 text-center">
          <div className="flex items-center justify-center gap-3">
            <Smartphone className="h-4 w-4 text-gold" />
            <p className="eyebrow text-cream/60">Begin today</p>
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl display-serif text-5xl leading-tight md:text-7xl">
            No stress. <em className="italic text-gold">No printing.</em><br />
            Just remembrance.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/70">
            Create something worthy of the moment — in the time it takes to make tea.
          </p>
          <Link to="/create" className="mt-10 inline-block">
            <Button size="lg" className="bg-cream text-forest hover:bg-cream/90">
              Create your program <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-forest/10 bg-cream">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-forest/60 md:flex-row">
          <span className="display-serif text-xl text-forest">Eventify</span>
          <p>© 2026 Eventify. Made with care in South Africa.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-forest">Privacy</a>
            <a href="#" className="hover:text-forest">Terms</a>
            <a href="#" className="hover:text-forest">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
