import { BackButton } from "@/components/BackButton";
import {
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "info@heartview.co.za";

const Contact = () => {
  const openMailClient = () => {
    const subject = "Message from website contact page";
    const body = "Hi Heartview team,\n\n";

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  };

  return (
    <div className="min-h-screen bg-secondary/12 text-forest">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.06),transparent_45%)]" />

      <div className="container relative max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-forest/70 transition-colors hover:text-secondary">
          <BackButton
            fallback="/"
            className="inline-flex items-center gap-2 text-sm text-forest/70 transition-colors hover:text-secondary"
          >
            Back
          </BackButton>
        </div>

        {/* Hero section */}
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            A quiet line, always open
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-none text-forest sm:text-6xl md:text-7xl">
            Talk to{" "}
            <span className="italic text-gold">us.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-forest/70 md:text-xl">
            Whether you need help creating a funeral program or have questions
            about sharing and printing, we're here to help you every step of
            the way.
          </p>
        </div>

        {/* Main content */}
        <div className="mx-auto mt-20 max-w-2xl">
          <div className="rounded-[2rem] border border-cream/10 bg-cream-deep/10 p-8 shadow-elegant backdrop-blur md:p-10 text-center">
            <div className="mx-auto w-fit rounded-full bg-white/10 p-5">
              <Mail className="h-8 w-8 text-gold" />
            </div>

            <h2 className="mt-6 font-serif text-3xl text-forest">
              Send us an email
            </h2>
            <p className="mt-3 text-forest/70">
              Click below to open your email app with our address ready to go.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 block text-sm text-forest/70 transition-colors hover:text-secondary"
            >
              {CONTACT_EMAIL}
            </a>

            <div className="mt-10">
              <Button
                type="button"
                size="lg"
                onClick={openMailClient}
                className="h-14 w-full rounded-full bg-primary text-cream font-medium shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Open email
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;