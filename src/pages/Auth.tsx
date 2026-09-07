import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

const Auth = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "register" | "verify">("signin");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowUpdates, setAllowUpdates] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);


  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register") {
      if (!name.trim()) e.name = "Name is required.";
      if (!surname.trim()) e.surname = "Surname is required.";
    }
    if (!email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (mode === "register" && password.length < 6)
      e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    let navigated = false;

    try {
      if (mode === "register") {
        // Create account
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        const displayName = `${name.trim()} ${surname.trim()}`;

        // Set display name on Auth profile
        await updateProfile(credential.user, { displayName });

        // Send verification email
        await sendEmailVerification(credential.user);

        // Save user record to Firestore (non-critical)
        setDoc(doc(db, "users", credential.user.uid), {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim().toLowerCase(),
          marketingConsent: allowUpdates,
          createdAt: serverTimestamp(),
        }).catch(() => {/* non-critical — user is already in Auth */});

        // Sign them out immediately — they must verify first
        await signOut(auth);

        setMode("verify");
      } else {
        // Sign in
        const signInCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
     if (!signInCredential.user.emailVerified) {
          await signOut(auth);
          setMode("verify");
          return;
        }
        toast.success("Welcome back!");
        navigated = true;
        navigate("/create");
      }
    } catch (err: unknown) {
      if (navigated) return;
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use")
        setErrors({ email: "An account with this email already exists." });
      else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
        setErrors({ password: "Incorrect password." });
      else if (code === "auth/too-many-requests")
        toast.error("Too many attempts. Please try again later.");
      else
        toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const switchMode = (next: "signin" | "register") => {
    setMode(next);
    setErrors({});
    if (next === "signin") setAllowUpdates(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      // Sign in temporarily just to get the user object, then send verification
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (credential.user.emailVerified) {
        toast.success("Email already verified! You can sign in.");
        setMode("signin");
        await signOut(auth);
        return;
      }
      await sendEmailVerification(credential.user);
      await signOut(auth);
      toast.success("Verification email resent — check your inbox.");
      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Could not resend — please go back and sign in again.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait a moment before trying again.");
      } else {
        toast.error("Could not resend verification email. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-cream text-forest">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.12),transparent_45%)]" />

      <div className="container relative max-w-6xl px-4 py-5 md:px-6 md:py-8">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-secondary">
          <BackButton fallback="/" className="inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-secondary">
            Back home
          </BackButton>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Welcome to HeartView
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl md:text-6xl">
            {mode === "signin" ? (
              <>
                Welcome{" "}
                <span className="italic text-gold">back.</span>
              </>
            ) : mode === "register" ? (
              <>
                Create your{" "}
                <span className="italic text-gold">account.</span>
              </>
            ) : (
              <>
                Check your{" "}
                <span className="italic text-gold">email.</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-forest/70 md:text-lg">
            {mode === "signin"
              ? "Sign in and continue creating beautiful digital event programs."
              : mode === "register"
              ? "Just a few details and you'll be ready to begin creating your program."
              : "One last step before you can start creating."}
          </p>
        </div>

        {/* Auth card */}
        <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-cream-deep bg-cream/95 p-6 shadow-sm backdrop-blur md:p-8">

          {/* ── Verify screen ── */}
{mode === "verify" && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-deep">
                <Mail className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-forest">
                Verify your email
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-forest/60">
                We've sent a verification link to{" "}
                <span className="font-medium text-forest">{email}</span>.
                Please click the link in the email before signing in.
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs text-forest/40">
                Can't find it? Check your <span className="font-medium">junk</span> or{" "}
                <span className="font-medium">spam</span> folder.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="h-11 w-full max-w-xs rounded-full bg-secondary text-sm font-medium text-cream transition-all hover:bg-secondary/90 disabled:opacity-60"
                >
                  {resendLoading
                    ? "Sending…"
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend verification email"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setPassword(""); }}
                  className="text-sm text-secondary transition-colors hover:text-accent"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* ── Tabs + Form ── */}
          {mode !== "verify" && (
            <>
              {/* Tabs */}
              <div className="flex rounded-full bg-cream-deep p-1">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`flex-1 rounded-full py-2.5 text-sm transition-all duration-300 ${
                    mode === "signin"
                      ? "bg-cream text-forest shadow-sm"
                      : "text-forest/60 hover:text-forest"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`flex-1 rounded-full py-2.5 text-sm transition-all duration-300 ${
                    mode === "register"
                      ? "bg-cream text-forest shadow-sm"
                      : "text-forest/60 hover:text-forest"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="mt-8">
                {mode === "register" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Name */}
                    <div>
                      <Label className="font-serif text-base text-forest">
                        Name <span className="text-gold">*</span>
                      </Label>

                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                        <Input
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          placeholder="John"
                          className={`h-11 rounded-2xl border bg-cream pl-11 text-sm text-forest placeholder:text-whisper focus-visible:ring-gold ${
                            errors.name ? "border-red-400" : "border-cream-deep"
                          }`}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Surname */}
                    <div>
                      <Label className="font-serif text-base text-forest">
                        Surname <span className="text-gold">*</span>
                      </Label>

                      <div className="relative mt-2">
                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                        <Input
                          value={surname}
                          onChange={(e) => {
                            setSurname(e.target.value);
                            if (errors.surname) setErrors((prev) => ({ ...prev, surname: "" }));
                          }}
                          placeholder="Doe"
                          className={`h-11 rounded-2xl border bg-cream pl-11 text-sm text-forest placeholder:text-whisper focus-visible:ring-gold ${
                            errors.surname ? "border-red-400" : "border-cream-deep"
                          }`}
                        />
                      </div>
                      {errors.surname && (
                        <p className="mt-1 text-xs text-red-500">{errors.surname}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className={mode === "register" ? "mt-5" : ""}>
                  <Label className="font-serif text-base text-forest">
                    Email address <span className="text-gold">*</span>
                  </Label>

                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="you@example.com"
                      className={`h-11 rounded-2xl border bg-cream pl-11 text-sm text-forest placeholder:text-whisper focus-visible:ring-gold ${
                        errors.email ? "border-red-400" : "border-cream-deep"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <Label className="font-serif text-base text-forest">
                      Password <span className="text-gold">*</span>
                    </Label>

                    {mode === "signin" && (
                      <Link
                        to="/reset-password"
                        className="text-sm text-secondary transition-colors hover:text-accent"
                      >
                        Forgot?
                      </Link>
                    )}
                  </div>

                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="••••••••"
                      className={`h-11 rounded-2xl border bg-cream pl-11 pr-11 text-sm text-forest placeholder:text-whisper focus-visible:ring-gold ${
                        errors.password ? "border-red-400" : "border-cream-deep"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sage transition-colors hover:text-secondary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.password ? (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  ) : mode === "register" ? (
                    <p className="mt-2 text-xs text-forest/50">At least 6 characters.</p>
                  ) : null}
                </div>

                {mode === "register" && (
                  <div className="mt-6 flex items-start gap-3">
                    <input
                      id="updates"
                      type="checkbox"
                      checked={allowUpdates}
                      onChange={(e) => setAllowUpdates(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-cream-deep text-gold focus:ring-gold"
                    />
                    <Label
                      htmlFor="updates"
                      className="cursor-pointer text-sm leading-relaxed text-forest/70"
                    >
                      Keep me updated with HeartView news, feature releases, helpful tips,
                      and occasional special offers. Optional.
                    </Label>
                  </div>
                )}

                {/* Submit */}
                <div className="mt-8">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="h-12 w-full rounded-full bg-secondary text-sm font-medium text-cream transition-all hover:scale-[1.01] hover:bg-secondary/90 disabled:opacity-60"
                  >
                    {loading
                      ? mode === "signin"
                        ? "Signing in…"
                        : "Creating account…"
                      : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                  </Button>
                </div>

                <p className="mt-5 text-center text-xs text-forest/50">
                  By continuing you agree to our{" "}
                  <Link
                    to="/terms"
                    className="text-secondary transition-colors hover:text-accent"
                  >
                    terms and privacy policy
                  </Link>
                  .
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
