import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Share2 } from "lucide-react";

const sections = [
  {
    title: "1. Using Eventify",
    body: "Eventify provides tools to create, customise, share, and manage digital funeral programs. By accessing or using the platform, you agree to use the service respectfully, lawfully, and only for its intended purpose.",
  },
  {
    title: "2. Your content",
    body: "You retain ownership of all photos, names, tributes, videos, and other content uploaded to Eventify. By using the platform, you grant us permission to securely host and display this content solely for the purpose of providing the service.",
  },
  {
    title: "3. Payments & refunds",
    body: "Payments are processed securely during checkout. If a technical issue caused directly by Eventify prevents delivery of your program, please contact us within 14 days so we can assist or provide an appropriate refund where applicable.",
  },
  {
    title: "4. Privacy",
    body: "We only collect information necessary to operate Eventify, including account details and program content. Your personal information is never sold to third parties.",
  },
  {
    title: "5. Acceptable use",
    body: "You may not upload unlawful, abusive, harmful, misleading, or offensive content. Eventify reserves the right to remove content or suspend accounts where misuse, abuse, or violations occur.",
  },
  {
    title: "6. Service availability",
    body: "While we aim to keep Eventify available at all times, temporary downtime, maintenance, or interruptions may occasionally occur. We are not responsible for issues outside of our reasonable control.",
  },
  {
    title: "7. Changes to these terms",
    body: "We may update these Terms & Conditions from time to time. Continued use of Eventify after updates means you accept the revised terms.",
  },
  {
    title: "8. Contact",
    body: "If you have any questions regarding these Terms & Conditions, please contact us at hello@eventify.app.",
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.12),transparent_45%)]" />

      <div className="container relative max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-[#6c7a73] transition-colors hover:text-[#c77a52]">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c77a52]">
            The fine print
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-none text-[#1d4336] sm:text-6xl md:text-7xl">
            Terms &{" "}
            <span className="italic text-[#c77a52]">
              conditions.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-[#66756d] md:text-xl">
            These terms explain how Eventify works, how your content is
            handled, and the responsibilities shared between you and our
            platform.
          </p>

          <p className="mt-6 text-sm text-[#8b958f]">
            Last updated: 12 May 2026
          </p>
        </div>

        {/* Terms card */}
        <div className="mx-auto mt-20 max-w-5xl rounded-[2rem] border border-[#e6ddd0] bg-[#fbf8f3]/90 p-8 shadow-sm backdrop-blur md:p-12">
          <div className="mb-10 flex items-center gap-4">
            <div className="rounded-full bg-[#efe6da] p-4">
              <FileText className="h-6 w-6 text-[#c77a52]" />
            </div>

            <div>
              <h2 className="font-serif text-3xl text-[#1d4336]">
                Terms & Conditions
              </h2>

              <p className="mt-1 text-[#6d7a74]">
                Please read these terms carefully before using Eventify.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.title}
                className="border-b border-[#eee5d9] pb-8 last:border-none last:pb-0"
              >
                <h3 className="font-serif text-2xl text-[#1d4336]">
                  {section.title}
                </h3>

                <p className="mt-4 leading-relaxed text-[#66756d]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Bottom help section */}
          <div className="mt-14 rounded-3xl bg-[#f4ede3] p-6">
            <h3 className="font-serif text-2xl text-[#1d4336]">
              Need assistance?
            </h3>

            <p className="mt-3 max-w-2xl text-[#6d7a74]">
              If you have any questions regarding these terms or need
              help using Eventify, our team is here to assist you.
            </p>

            <Link
              to="/contact"
              className="mt-6 inline-flex items-center rounded-full bg-[#1d4336] px-6 py-3 text-sm font-medium text-white transition-all hover:scale-[1.01] hover:bg-[#16352b]"
            >
              Contact us
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-forest/10 bg-cream">
          <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-forest/60 md:flex-row">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />

              <span className="display-serif text-xl text-forest">
                Eventify
              </span>
            </div>

            <p className="text-center">
              © 2026 Eventify. Made with care in South Africa.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Terms;