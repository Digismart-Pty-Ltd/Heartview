import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Lock,
  LogOut,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";

const ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "eventify-admin-session";

type ActivityItem = {
  type: "user" | "published";
  title: string;
  date: string;
  ago: string;
  timestamp: number;
};

type NewestUser = {
  initials: string;
  name: string;
  joined: string;
  date: string;
};

const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const formatActivityDate = (ms: number): string =>
  new Date(ms).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const toMs = (val: unknown): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === "object" && val !== null) {
    const v = val as Record<string, unknown>;
    if (typeof v.toMillis === "function") return (v as Timestamp).toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000;
  }
  return 0;
};

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalPrograms, setTotalPrograms] = useState<number | null>(null);
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [newestUsers, setNewestUsers] = useState<NewestUser[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setPassword("");
    setError(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // ── Users ────────────────────────────────────────────────────────────
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers: { name: string; createdAt: number }[] = [];

        usersSnap.forEach((doc) => {
          const d = doc.data();
          const fullName =
            d.name && d.surname
              ? `${d.name} ${d.surname}`
              : d.name || d.displayName || d.email || "Unknown";
          const ms = toMs(d.createdAt);
          console.log("[Admin] user:", fullName, "→ ms:", ms);
          allUsers.push({ name: fullName, createdAt: ms });
        });

        allUsers.sort((a, b) => b.createdAt - a.createdAt);
        setTotalUsers(allUsers.length);
        setNewUsersThisWeek(allUsers.filter((u) => u.createdAt > oneWeekAgo).length);
        setNewestUsers(
          allUsers.slice(0, 3).map((u) => ({
            initials: getInitials(u.name),
            name: u.name,
            joined: u.createdAt ? `Joined ${timeAgo(u.createdAt)}` : "Recently joined",
            date: u.createdAt ? formatActivityDate(u.createdAt) : "—",
          }))
        );

        // ── Programs ─────────────────────────────────────────────────────────
        const programsSnap = await getDocs(collection(db, "programs"));
        const allPrograms: { name: string; createdAt: number }[] = [];

        programsSnap.forEach((doc) => {
          const d = doc.data();
          const ms = toMs(d.createdAt);
          console.log("[Admin] program:", d.name, "→ ms:", ms);
          allPrograms.push({ name: d.name || "Unknown", createdAt: ms });
        });

        allPrograms.sort((a, b) => b.createdAt - a.createdAt);
        setTotalPrograms(allPrograms.length);

        // ── Merge activity ────────────────────────────────────────────────────
        const activity: ActivityItem[] = [
          ...allUsers.slice(0, 10).map((u) => ({
            type: "user" as const,
            title: `New user signed up — ${u.name}`,
            date: formatActivityDate(u.createdAt),
            ago: timeAgo(u.createdAt),
            timestamp: u.createdAt,
          })),
          ...allPrograms.slice(0, 10).map((p) => ({
            type: "published" as const,
            title: `${p.name} · Program published · Paid R35`,
            date: formatActivityDate(p.createdAt),
            ago: timeAgo(p.createdAt),
            timestamp: p.createdAt,
          })),
        ];

        activity.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivity(activity.slice(0, 10));
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const revenue =
    totalPrograms !== null
      ? `R ${(totalPrograms * 35).toLocaleString("en-ZA")}`
      : "—";

  // ─── Login view ───────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.10),transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-[#5d6a63] transition-colors hover:text-[#c77a52]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
            <span className="display-serif text-xl text-forest">Eventify</span>
          </div>

          <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
            <div className="w-full max-w-md rounded-[2.5rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-8 shadow-sm md:p-10">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e3d8]">
                  <Lock className="h-6 w-6 text-[#1d4336]" />
                </div>
              </div>
              <h2 className="mt-6 text-center font-serif text-3xl text-[#17352b]">
                Admin sign in
              </h2>
              <p className="mt-2 text-center text-sm text-[#61726a]">
                Enter your admin password to continue.
              </p>
              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[#43544c]">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={`h-12 rounded-full border px-5 bg-[#f6f1e8] text-[#17352b] placeholder:text-[#a8b5ae] focus-visible:ring-[#1d4336] ${
                      error
                        ? "border-red-400 focus-visible:ring-red-400"
                        : "border-[#ddd3c5]"
                    }`}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-500">
                      Incorrect password. Please try again.
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleLogin}
                  className="h-12 w-full rounded-full bg-[#17352b] text-white hover:bg-[#1d4336]"
                >
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d4336]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(194,122,82,0.10),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#5d6a63] transition-colors hover:text-[#c77a52]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
          <span className="display-serif text-xl text-forest">Eventify</span>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-11 rounded-full border-[#d8cfbf] bg-[#fbf8f3] px-6 text-sm text-[#42524b] hover:bg-[#f2ece2]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Hero */}
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#4f665d]">Admin</p>
          <h2 className="mt-3 font-serif text-5xl leading-none text-[#17352b] sm:text-6xl md:text-7xl">
            Dashboard{" "}
            <span className="italic text-[#e58d6c]">overview</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#51635b] md:text-lg">
            A quiet snapshot of activity across Eventify.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-[#43544c]">Total users</p>
              <div className="rounded-full bg-[#e8e3d8] p-3">
                <Users className="h-5 w-5 text-[#1d4336]" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-5xl text-[#17352b]">
              {loading ? "…" : (totalUsers ?? "—")}
            </h3>
            <p className="mt-1 text-sm text-[#586860]">
              {!loading && `+${newUsersThisWeek} this week`}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-[#43544c]">Programs published</p>
              <div className="rounded-full bg-[#e8e3d8] p-3">
                <FileText className="h-5 w-5 text-[#1d4336]" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-5xl text-[#17352b]">
              {loading ? "…" : (totalPrograms ?? "—")}
            </h3>
            <p className="mt-1 text-sm text-[#586860]">Across Eventify</p>
          </div>

          <div className="rounded-[2rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-[#43544c]">Revenue</p>
              <div className="rounded-full bg-[#e8e3d8] p-3">
                <DollarSign className="h-5 w-5 text-[#1d4336]" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-4xl text-[#17352b] md:text-5xl">
              {loading ? "…" : revenue}
            </h3>
            <p className="mt-2 text-sm text-[#586860]">
              {!loading && `${totalPrograms ?? 0} programs × R35 (estimated)`}
            </p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-10 rounded-[2.5rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-3xl text-[#17352b]">Recent activity</h3>
            <span className="text-xs uppercase tracking-[0.35em] text-[#5d6a63]">Live</span>
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#61726a]">Loading activity…</p>
            ) : recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#61726a]">No activity yet.</p>
            ) : (
              recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-[#ddd3c5] py-5 last:border-none"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ece7dd]">
                      {item.type === "user" ? (
                        <Users className="h-4 w-4 text-[#17352b]" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-[#17352b]" />
                      )}
                    </div>
                    <div>
                      <p className="text-base text-[#17352b] md:text-lg">{item.title}</p>
                      <p className="mt-1 text-sm text-[#61726a]">{item.date}</p>
                    </div>
                  </div>
                  <p className="hidden text-sm text-[#61726a] md:block">{item.ago}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Newest users */}
        <div className="mt-10 rounded-[2.5rem] border border-[#ddd3c5] bg-[#fbf8f3]/90 p-5 shadow-sm md:p-8">
          <h3 className="font-serif text-3xl text-[#17352b]">Newest users</h3>
          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#61726a]">Loading users…</p>
            ) : newestUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#61726a]">No users yet.</p>
            ) : (
              newestUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-[2rem] border border-[#ddd3c5] bg-[#f8f4ed] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8e3d8] text-base text-[#17352b]">
                      {user.initials}
                    </div>
                    <div>
                      <p className="text-lg text-[#17352b]">{user.name}</p>
                      <p className="mt-1 text-sm text-[#61726a]">{user.joined}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#61726a]">{user.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-[#ddd3c5]">
          <div className="flex flex-col items-center justify-between gap-4 py-6 text-sm text-[#6d7a74] md:flex-row">
            <span className="display-serif text-xl text-forest">Eventify</span>
            <p className="text-center">© 2026 Eventify. Admin dashboard.</p>
            <div className="flex gap-5">
              <Link to="/" className="transition-colors hover:text-[#c77a52]">Website</Link>
              <Link to="/contact" className="transition-colors hover:text-[#c77a52]">Contact</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Admin;
