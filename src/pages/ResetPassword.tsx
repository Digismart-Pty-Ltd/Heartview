import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Mail,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSending(true);

      // future backend logic

      setTimeout(() => {
        setSent(true);
        setSending(false);
      }, 1200);
    } catch {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.10),transparent_45%)]" />

      <div className="container relative max-w-5xl px-4 py-5 md:px-6 md:py-8">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-[#6c7a73] transition-colors hover:text-[#c77a52]">
          <Link to="/auth" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#c77a52]">
            Secure account recovery
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-[#1d4336] sm:text-5xl md:text-6xl">
            Reset your{" "}
            <span className="italic text-[#c77a52]">
              password.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#66756d] md:text-lg">
            Enter the email linked to your account and we'll send you
            a secure password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="mx-auto mt-12 max-w-xl rounded-[1.8rem] border border-[#e6ddd0] bg-[#fbf8f3]/90 p-6 shadow-sm backdrop-blur md:p-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c77a52]">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-8">
              {/* Email */}
              <div>
                <Label className="font-serif text-base text-[#1d4336]">
                  Email address
                </Label>

                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49f]" />

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border-[#ddd3c5] bg-[#fffdf9] pl-11 text-sm text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52]"
                  />
                </div>
              </div>

              {/* Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  size="lg"
                  disabled={sending}
                  className="h-12 w-full rounded-full bg-[#1d4336] text-sm font-medium text-white transition-all hover:bg-[#16352b]"
                >
                  {sending ? (
                    "Sending..."
                  ) : (
                    <>
                      Send reset link
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#efe6da]">
                <Mail className="h-6 w-6 text-[#c77a52]" />
              </div>

              <h2 className="mt-5 font-serif text-2xl text-[#1d4336]">
                Check your email
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d7a74]">
                If an account exists for{" "}
                <span className="font-medium text-[#1d4336]">
                  {email}
                </span>
                , we've sent a password reset link.
              </p>

              <Link
                to="/auth"
                className="mt-6 inline-block text-sm text-[#c77a52] transition-colors hover:text-[#b86d47]"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-forest/10 bg-cream">
          <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-forest/60 md:flex-row">
            <span className="display-serif text-lg text-forest">
              Eventify
            </span>

            <p className="text-center">
              © 2026 Eventify. Made with care in South Africa.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;