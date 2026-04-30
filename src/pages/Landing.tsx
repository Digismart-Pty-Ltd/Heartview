import heroImage from "@/assets/hero-lilies.jpg";
import oliveBranch from "@/assets/olive-branch.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Share2, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-wide text-ink">Eventify</span>
        </Link>
        <Link to="/create">
          <Button variant="ghost" className="text-ink hover:text-gold">Create program</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="container grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="fade-in space-y-7">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">A digital tribute</p>
          <h1 className="font-serif text-5xl leading-[1.05] text-ink text-balance md:text-6xl lg:text-7xl">
            Honour a life,<br />
            beautifully <em className="text-gold">shared</em>.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-whisper">
            Eventify lets you create a heartfelt digital funeral program in minutes —
            then share it with family and friends through a single, gentle link.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
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
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl shadow-elegant">
            <img
              src={heroImage}
              alt="White lilies and eucalyptus on an ivory background"
              width={1600}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
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
            { icon: Heart, title: "Share their story", text: "Add their name, dates, a portrait, and a tribute message that honours their life." },
            { icon: Sparkles, title: "We craft the page", text: "Your details flow into a respectful, mobile-ready program — designed with care." },
            { icon: Share2, title: "Share the link", text: "A unique link is yours instantly. Send it by message, email, or to a wider circle." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-8 shadow-soft transition-soft hover:shadow-elegant">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-serif text-2xl text-ink">{s.title}</h3>
              <p className="text-whisper">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample preview */}
      <section className="container pb-20">
        <div className="overflow-hidden rounded-3xl bg-card shadow-paper">
          <div className="grid items-center gap-10 p-10 md:grid-cols-2 md:p-16">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gold">Sample preview</p>
              <h2 className="mt-3 font-serif text-4xl text-ink">A keepsake on every device</h2>
              <p className="mt-4 text-whisper">
                Each program is mobile-first and easy to read — designed to feel like a printed
                order of service, gently reimagined for the screen.
              </p>
              <Link to="/create" className="mt-8 inline-block">
                <Button className="bg-ink text-primary-foreground hover:bg-ink/90">Begin a program</Button>
              </Link>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-[2rem] border-8 border-ink/90 bg-ivory p-6 shadow-elegant">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold">In loving memory</p>
                  <h3 className="mt-3 font-serif text-3xl text-ink">Margaret Anne Wells</h3>
                  <p className="mt-1 text-sm italic text-whisper">1942 — 2026</p>
                  <div className="my-5 mx-auto h-px w-16 bg-gold/60" />
                  <p className="font-serif text-base italic leading-relaxed text-whisper">
                    "Those we love don't go away, they walk beside us every day."
                  </p>
                </div>
              </div>
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
  );
};

export default Landing;
