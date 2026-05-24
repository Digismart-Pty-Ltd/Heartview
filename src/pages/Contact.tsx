import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Send,
  Share2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const n = name.trim();
    const em = email.trim();
    const m = message.trim();

    if (!n || !em || !m) {
      return toast.error("Please fill in all fields");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return toast.error("Please enter a valid email address");
    }

    try {
      setSending(true);

      // future backend/email logic here

      toast.success("Message sent successfully");

      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.12),transparent_45%)]" />

      <div className="container relative max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-[#6c7a73] transition-colors hover:text-[#c77a52]">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        {/* Hero section */}
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c77a52]">
            A quiet line, always open
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-none text-[#1d4336] sm:text-6xl md:text-7xl">
            Talk to{" "}
            <span className="italic text-[#c77a52]">
              us.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-[#66756d] md:text-xl">
            Whether you need help creating a funeral program or have
            questions about sharing and printing, we're here to help
            you every step of the way.
          </p>
        </div>

        {/* Main content */}
        <div className="mx-auto mt-20 grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Contact card */}
          <div className="rounded-[2rem] border border-[#e6ddd0] bg-[#fbf8f3]/90 p-8 shadow-sm backdrop-blur md:p-10">
            <div>
              <h2 className="font-serif text-3xl text-[#1d4336]">
                Contact details
              </h2>

              <p className="mt-3 text-[#6d7a74]">
                We usually respond within one business day.
              </p>
            </div>

            <div className="mt-10 space-y-8">
              <div className="flex items-start gap-5">
                <div className="rounded-full bg-[#efe6da] p-4">
                  <Mail className="h-5 w-5 text-[#c77a52]" />
                </div>

                <div>
                  <p className="font-medium text-[#1d4336]">
                    Email
                  </p>

                  <a
                    href="mailto:hello@eventify.app"
                    className="mt-1 block text-sm text-[#6d7a74] transition-colors hover:text-[#c77a52]"
                  >
                    hello@eventify.app
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="rounded-full bg-[#efe6da] p-4">
                  <Phone className="h-5 w-5 text-[#c77a52]" />
                </div>

                <div>
                  <p className="font-medium text-[#1d4336]">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-[#6d7a74]">
                    +27 (0) 21 000 0000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="rounded-full bg-[#efe6da] p-4">
                  <MapPin className="h-5 w-5 text-[#c77a52]" />
                </div>

                <div>
                  <p className="font-medium text-[#1d4336]">
                    Location
                  </p>

                  <p className="mt-1 text-sm text-[#6d7a74]">
                    Johannesburg, South Africa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="rounded-[2rem] border border-[#e6ddd0] bg-[#fbf8f3]/90 p-8 shadow-sm backdrop-blur md:p-10"
          >
            <div>
              <Label
                htmlFor="name"
                className="font-serif text-lg text-[#1d4336]"
              >
                Your name
              </Label>

              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah M."
                maxLength={80}
                className="mt-3 h-12 rounded-2xl border-[#ddd3c5] bg-[#fffdf9] text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52]"
              />
            </div>

            <div className="mt-7">
              <Label
                htmlFor="email"
                className="font-serif text-lg text-[#1d4336]"
              >
                Email address
              </Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
                className="mt-3 h-12 rounded-2xl border-[#ddd3c5] bg-[#fffdf9] text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52]"
              />
            </div>

            <div className="mt-7">
              <Label
                htmlFor="message"
                className="font-serif text-lg text-[#1d4336]"
              >
                Message
              </Label>

              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={1000}
                placeholder="Tell us how we can help you..."
                className="mt-3 rounded-2xl border-[#ddd3c5] bg-[#fffdf9] text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52]"
              />

              <p className="mt-2 text-right text-xs text-[#8b958f]">
                {message.length} / 1000
              </p>
            </div>

            <div className="mt-10">
              <Button
                type="submit"
                size="lg"
                disabled={sending}
                className="h-14 w-full rounded-full bg-[#1d4336] text-base font-medium text-white transition-all hover:scale-[1.01] hover:bg-[#16352b]"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    Send message
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
     {/* FOOTER */}
      <footer className="border-t border-forest/10 bg-cream">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-forest/60 md:flex-row">
          <span className="display-serif text-xl text-forest">Eventify</span>
          <p className="text-center">© 2026 Eventify. Made with care in South Africa.</p>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Contact;