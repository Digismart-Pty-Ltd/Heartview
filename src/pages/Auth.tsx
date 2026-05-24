import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

const Auth = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

        toast.success("Account created — welcome to Eventify!");
        navigated = true;
        navigate("/create");

        // Save user record to Firestore (after navigation — channel drop won't matter)
        setDoc(doc(db, "users", credential.user.uid), {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim().toLowerCase(),
          createdAt: serverTimestamp(),
        }).catch(() => {/* non-critical — user is already in Auth */});
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("Welcome back!");
        navigated = true;
        navigate("/create");
      }
    } catch (err: unknown) {
      if (navigated) return; // Auth succeeded, Firestore channel noise — ignore
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use")
        setErrors({ email: "An account with this email already exists." });
      else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
        setErrors({ password: "Incorrect email or password." });
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
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.10),transparent_45%)]" />

      <div className="container relative max-w-6xl px-4 py-5 md:px-6 md:py-8">
        {/* Back button */}
        <div className="mb-8 inline-flex items-center gap-2 text-sm text-[#6c7a73] transition-colors hover:text-[#c77a52]">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#c77a52]">
            Welcome to Eventify
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-[#1d4336] sm:text-5xl md:text-6xl">
            {mode === "signin" ? (
              <>
                Welcome{" "}
                <span className="italic text-[#c77a52]">back.</span>
              </>
            ) : (
              <>
                Create your{" "}
                <span className="italic text-[#c77a52]">account.</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#66756d] md:text-lg">
            {mode === "signin"
              ? "Sign in and continue creating beautiful digital memorial programs."
              : "Just a few details and you'll be ready to begin creating your program."}
          </p>
        </div>

        {/* Auth card */}
        <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-[#e6ddd0] bg-[#fbf8f3]/90 p-6 shadow-sm backdrop-blur md:p-8">
          {/* Tabs */}
          <div className="flex rounded-full bg-[#efe8df] p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-full py-2.5 text-sm transition-all duration-300 ${
                mode === "signin"
                  ? "bg-white text-[#1d4336] shadow-sm"
                  : "text-[#8b958f]"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-full py-2.5 text-sm transition-all duration-300 ${
                mode === "register"
                  ? "bg-white text-[#1d4336] shadow-sm"
                  : "text-[#8b958f]"
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
                  <Label className="font-serif text-base text-[#1d4336]">
                    Name <span className="text-[#c77a52]">*</span>
                  </Label>

                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49f]" />
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="John"
                      className={`h-11 rounded-2xl border bg-[#fffdf9] pl-11 text-sm text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52] ${
                        errors.name ? "border-red-400" : "border-[#ddd3c5]"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Surname */}
                <div>
                  <Label className="font-serif text-base text-[#1d4336]">
                    Surname <span className="text-[#c77a52]">*</span>
                  </Label>

                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49f]" />
                    <Input
                      value={surname}
                      onChange={(e) => {
                        setSurname(e.target.value);
                        if (errors.surname) setErrors((prev) => ({ ...prev, surname: "" }));
                      }}
                      placeholder="Doe"
                      className={`h-11 rounded-2xl border bg-[#fffdf9] pl-11 text-sm text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52] ${
                        errors.surname ? "border-red-400" : "border-[#ddd3c5]"
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
              <Label className="font-serif text-base text-[#1d4336]">
                Email address <span className="text-[#c77a52]">*</span>
              </Label>

              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49f]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="you@example.com"
                  className={`h-11 rounded-2xl border bg-[#fffdf9] pl-11 text-sm text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52] ${
                    errors.email ? "border-red-400" : "border-[#ddd3c5]"
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
                <Label className="font-serif text-base text-[#1d4336]">
                  Password <span className="text-[#c77a52]">*</span>
                </Label>

                {mode === "signin" && (
                  <Link
                    to="/reset-password"
                    className="text-sm text-[#c77a52] transition-colors hover:text-[#b86d47]"
                  >
                    Forgot?
                  </Link>
                )}
              </div>

              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49f]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className={`h-11 rounded-2xl border bg-[#fffdf9] pl-11 pr-11 text-sm text-[#1d4336] placeholder:text-[#9aa49f] focus-visible:ring-[#c77a52] ${
                    errors.password ? "border-red-400" : "border-[#ddd3c5]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa49f] transition-colors hover:text-[#c77a52]"
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
                <p className="mt-2 text-xs text-[#8b958f]">At least 6 characters.</p>
              ) : null}
            </div>

            {/* Submit */}
            <div className="mt-8">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 w-full rounded-full bg-[#1d4336] text-sm font-medium text-white transition-all hover:scale-[1.01] hover:bg-[#16352b] disabled:opacity-60"
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

            <p className="mt-5 text-center text-xs text-[#8b958f]">
              By continuing you agree to our{" "}
              <Link
                to="/terms"
                className="text-[#c77a52] transition-colors hover:text-[#b86d47]"
              >
                terms and privacy policy
              </Link>
              .
            </p>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-forest/10 bg-cream">
          <div className="container flex flex-col items-center justify-between gap-4 py-6 text-sm text-forest/60 md:flex-row">
            <span className="display-serif text-xl text-forest">Eventify</span>
            <p className="text-center">
              © 2026 Eventify. Made with care in South Africa.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
