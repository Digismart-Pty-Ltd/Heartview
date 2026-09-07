import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Link } from "react-router-dom";
import { Lock, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast } from "sonner";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setSending(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";

      if (code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-cream text-forest">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.12),transparent_45%)]" />

      <div className="container relative max-w-5xl px-4 py-5 md:px-6 md:py-8">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-secondary">
          <BackButton
            fallback="/auth"
            className="inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-secondary"
          >
            Back to sign in
          </BackButton>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
            Secure account recovery
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl md:text-6xl">
            Reset your{" "}
            <span className="italic text-gold">password.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-forest/70 md:text-lg">
            Enter the email linked to your account and we'll send you a secure
            password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="mx-auto mt-12 max-w-xl rounded-[1.8rem] border border-cream-deep bg-cream/95 p-6 shadow-sm backdrop-blur md:p-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <div>
                <Label className="font-serif text-base text-forest">
                  Email address
                </Label>

                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border-cream-deep bg-cream pl-11 text-sm text-forest placeholder:text-whisper focus-visible:ring-gold"
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button
                  type="submit"
                  size="lg"
                  disabled={sending}
                  className="h-12 w-full rounded-full bg-secondary text-sm font-medium text-cream transition-all hover:bg-secondary/90"
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-deep">
                <Mail className="h-6 w-6 text-gold" />
              </div>

              <h2 className="mt-5 font-serif text-2xl text-forest">
                Check your email
              </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-forest/60">
                If an account exists for{" "}
                <span className="font-medium text-forest">{email}</span>, we've
                sent a password reset link.
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-forest/40">
                Can't find it? Check your <span className="font-medium">junk</span> or <span className="font-medium">spam</span> folder.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-sm text-forest/50 transition-colors hover:text-forest"
                >
                  Try a different email
                </button>
                <Link
                  to="/auth"
                  className="text-sm text-secondary transition-colors hover:text-accent"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
