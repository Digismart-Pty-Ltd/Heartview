import heroImage from "@/assets/hero-lilies.jpg";
import oliveBranch from "@/assets/olive-branch.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Share2, Sparkles, Check, QrCode, Smartphone, Mail } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Decorative background ornaments */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-primary-glow/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cream/40 blur-3xl" />
      </div>

      <div className="relative">
        {/* Nav */}
        <header className="container flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold shadow-soft">
              <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-serif text-2xl tracking-wide text-ink">Eventify</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#pricing" className="hidden text-sm text-whisper hover:text-ink md:inline-block">
              Pricing
            </a>
            <Link to="/create">
              <Button className="bg-ink text-primary-foreground hover:bg-ink/90">Create program</Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="container grid gap-10 py-10 lg:grid-cols-12 lg:items-center lg:gap-16 lg:py-16">
          <div className="fade-in space-y-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              A digital tribute
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] text-ink text-balance md:text-6xl lg:text-7xl">
              Honour a life,<br />
              beautifully <em className="text-gold">remembered</em>.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-whisper">
              Eventify lets you create a heartfelt digital funeral program in minutes —
              then share it with family and friends through a single, gentle link.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/create">
                <Button size="lg" className="bg-gradient-gold text-primary-foreground shadow-elegant hover:opacity-90">
                  Create a program
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="border-gold/40 text-ink hover:bg-cream">
                  How it works
                </Button>
              </a>
            </div>

            {/* Pricing strip */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gold/20 bg-card/70 px-5 py-4 text-sm shadow-soft backdrop-blur">
              <span className="font-serif text-2xl text-ink">R35</span>
              <span className="text-whisper">minimum payment to publish &amp; share</span>
              <span className="hidden h-4 w-px bg-border md:inline-block" />
              <span className="inline-flex items-center gap-1.5 text-whisper">
                <Check className="h-4 w-4 text-gold" /> Demo pricing
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="absolute -left-6 -top-6 hidden h-24 w-24 rounded-full border border-gold/30 lg:block" />
            <div className="absolute -bottom-6 -right-6 hidden h-32 w-32 rounded-full border border-gold/20 lg:block" />
            <div className="overflow-hidden rounded-[2rem] border border-gold/20 shadow-elegant">
              <img
                src={heroImage}
                alt="White lilies and eucalyptus on an ivory background"
                width={1600}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Floating quote card */}
            <div className="absolute -bottom-8 left-4 hidden max-w-[260px] rounded-2xl border border-gold/20 bg-card/95 p-5 shadow-paper backdrop-blur md:block">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">In loving memory</p>
              <p className="mt-2 font-serif text-base italic leading-relaxed text-ink">
                "Those we love don't go away — they walk beside us every day."
              </p>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="container py-10">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur md:grid-cols-4">
            {[
              { icon: Smartphone, label: "Mobile-friendly" },
              { icon: Share2, label: "One-link sharing" },
              { icon: QrCode, label: "QR-ready" },
              { icon: Mail, label: "No accounts" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-gold">
                  <t.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-ink">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="container py-20">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="divider-ornament mb-6">
              <img src={oliveBranch} alt="" width={48} height={32} className="h-8 w-auto opacity-80" />
            </div>
            <h2 className="font-serif text-4xl text-ink md:text-5xl">A gentle, simple journey</h2>
            <p className="mt-4 text-whisper">Three steps. No accounts. No printing.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Heart, title: "Share their story", text: "Add their name, dates, a portrait, and a tribute message that honours their life.", step: "01" },
              { icon: Sparkles, title: "We craft the page", text: "Your details flow into a respectful, mobile-ready program — designed with care.", step: "02" },
              { icon: Share2, title: "Share the link", text: "A unique link is yours instantly. Send it by message, email, or to a wider circle.", step: "03" },
            ].map((s, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-soft transition-soft hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="absolute right-6 top-4 font-serif text-6xl text-gold/15 transition-soft group-hover:text-gold/25">
                  {s.step}
                </span>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-soft">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-serif text-2xl text-ink">{s.title}</h3>
                <p className="text-whisper">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container pb-20">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gold/30 bg-gradient-warm shadow-elegant">
            <div className="grid items-center gap-8 p-10 md:grid-cols-[1.1fr_1fr] md:p-14">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Simple, gentle pricing</p>
                <h2 className="mt-3 font-serif text-4xl text-ink">One small fee. A lasting tribute.</h2>
                <p className="mt-4 text-whisper">
                  Create your program for free. A minimum payment of <span className="font-medium text-ink">R35</span> is
                  required at publish to share your unique link with family and friends.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-ink">
                  {["Unlimited views", "Mobile-optimised page", "Shareable link & QR", "Lifetime access"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-gold/30 bg-card/80 p-8 text-center shadow-paper backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Minimum</p>
                <p className="mt-3 font-serif text-6xl text-ink">
                  R35<span className="text-2xl text-whisper">.00</span>
                </p>
                <p className="mt-1 text-sm text-whisper">per published program · demo pricing</p>
                <Link to="/create" className="mt-6 inline-block w-full">
                  <Button size="lg" className="w-full bg-ink text-primary-foreground hover:bg-ink/90">
                    Begin a program
                  </Button>
                </Link>
                <p className="mt-3 text-xs text-whisper">Pay only when you're ready to share.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60 bg-cream/40">
          <div className="container flex flex-col items-center gap-2 py-8 text-sm text-whisper md:flex-row md:justify-between">
            <p>© {new Date().getFullYear()} Eventify. Made with care.</p>
            <p className="font-serif italic">In remembrance, always.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
