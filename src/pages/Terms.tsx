import { Link } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { ArrowLeft, FileText, Share2 } from "lucide-react";
import heartViewLogo from "@/assets/heartview-logo.png";

const sections = [
  {
    title: "1. Using HeartView",
    body: "HeartView provides tools to create, customise, share, and manage digital event programs. By accessing or using the platform, you agree to use the service respectfully, lawfully, and only for its intended purpose.",
  },
  {
    title: "2. Your content",
    body: "You retain ownership of all photos, names, tributes, videos, and other content uploaded to HeartView. By using the platform, you grant us permission to securely host and display this content solely for the purpose of providing the service.",
  },
  {
    title: "3. Payments & refunds",
    body: "Payments are processed securely during checkout. If a technical issue caused directly by HeartView prevents delivery of your program, please contact us within 14 days so we can assist or provide an appropriate refund where applicable.",
  },
  {
    title: "4. Privacy",
    body: "We only collect information necessary to operate HeartView, including account details and program content. Your personal information is never sold to third parties.",
  },
  {
    title: "5. Acceptable use",
    body: "You may not upload unlawful, abusive, harmful, misleading, or offensive content. HeartView reserves the right to remove content or suspend accounts where misuse, abuse, or violations occur.",
  },
  {
    title: "6. Service availability",
    body: "While we aim to keep HeartView available at all times, temporary downtime, maintenance, or interruptions may occasionally occur. We are not responsible for issues outside of our reasonable control.",
  },
  {
    title: "7. Changes to these terms",
    body: "We may update these Terms & Conditions from time to time. Continued use of HeartView after updates means you accept the revised terms.",
  },
  {
    title: "8. Contact",
    body: "If you have any questions regarding these Terms & Conditions, please contact us at info@heartview.co.za",
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-forest/12 text-forest">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.06),transparent_45%)]" />

      <div className="container relative max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-forest/70 transition-colors hover:text-forest">
          <BackButton fallback="/" className="inline-flex items-center gap-2 text-sm text-forest/70 transition-colors hover:text-forest">
            Back
          </BackButton>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            The fine print
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-none text-forest sm:text-6xl md:text-7xl">
            Terms &{" "}
            <span className="italic text-gold">
              conditions.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-forest/70 md:text-xl">
            These terms explain how HeartView works, how your content is
            handled, and the responsibilities shared between you and our
            platform.
          </p>

          <p className="mt-6 text-sm text-forest/50">
            Last updated: 12 May 2026
          </p>
        </div>

        {/* Terms card */}
        <div className="mx-auto mt-20 max-w-5xl rounded-[2rem] border border-cream/10 bg-cream-deep/10 p-8 shadow-elegant backdrop-blur md:p-12">
          <div className="mb-10 flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-4">
              <FileText className="h-6 w-6 text-gold" />
            </div>

            <div>
              <h2 className="font-serif text-3xl text-forest">
                Terms & Conditions
              </h2>

              <p className="mt-1 text-forest/70">
                Please read these terms carefully before using HeartView.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.title}
                className="border-b border-cream/10 pb-8 last:border-none last:pb-0"
              >
                <h3 className="font-serif text-2xl text-forest">
                  {section.title}
                </h3>

                <p className="mt-4 leading-relaxed text-forest/70">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Bottom help section */}
          <div className="mt-14 rounded-3xl bg-white/10 p-6">
            <h3 className="font-serif text-2xl text-cream">
              Need assistance?
            </h3>

            <p className="mt-3 max-w-2xl text-cream/70">
              If you have any questions regarding these terms or need
              help using HeartView, our team is here to assist you.
            </p>

            <Link
              to="/contact"
              className="mt-6 inline-flex items-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-forest transition-all hover:-translate-y-0.5 hover:bg-gold-soft"
            >
              Contact us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Terms;