import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { Link } from "react-router-dom";
import heartViewLogo from "@/assets/heartview-logo.png";
import {
  ArrowLeft,
  DollarSign,
  Download,
  FileText,
  Lock,
  LogOut,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";

const ADMIN_PASSWORD = "heartview-admin-2026"; // Change this to your desired admin password
const ADMIN_SESSION_KEY = "heartview-admin-session";
const PROGRAM_PRICE = 149;

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

type UserTableRow = {
  name: string;
  surname: string;
  email: string;
  date: string;
  marketingConsent: boolean;
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
if (typeof v.toMillis === "function") return (v as unknown as Timestamp).toMillis();
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
  const [allUsersTable, setAllUsersTable] = useState<UserTableRow[]>([]);
  const [loading, setLoading] = useState(false);

const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = allUsersTable.map((u) => ({
      Name: u.name,
      Surname: u.surname,
      Email: u.email,
      Joined: u.date,
      "Marketing Consent": u.marketingConsent ? "Yes" : "No",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `heartview-users-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
     const allUsers: { name: string; surname: string; email: string; marketingConsent: boolean; createdAt: number }[] = [];

        usersSnap.forEach((doc) => {
          const d = doc.data();
          const fullName =
            d.name && d.surname
              ? `${d.name} ${d.surname}`
              : d.name || d.displayName || d.email || "Unknown";
          const ms = toMs(d.createdAt);
          console.log("[Admin] user:", fullName, "→ ms:", ms);
          allUsers.push({
            name: d.name || fullName,
            surname: d.surname || "",
            email: d.email || "",
            marketingConsent: d.marketingConsent === true,
            createdAt: ms,
          });
        });

    // Deduplicate by email — keep the most recent record per address
        const seenEmails = new Map<string, typeof allUsers[0]>();
        for (const u of allUsers) {
          const key = u.email.trim().toLowerCase();
          if (!key) continue;
          const existing = seenEmails.get(key);
          if (!existing || u.createdAt > existing.createdAt) {
            seenEmails.set(key, u);
          }
        }
        const dedupedUsers = Array.from(seenEmails.values());
        dedupedUsers.sort((a, b) => b.createdAt - a.createdAt);
        // Replace allUsers references below with dedupedUsers
        allUsers.length = 0;
        allUsers.push(...dedupedUsers);

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
        setAllUsersTable(
          allUsers.map((u) => ({
            name: u.name,
            surname: u.surname,
            email: u.email,
            date: u.createdAt ? formatActivityDate(u.createdAt) : "—",
            marketingConsent: u.marketingConsent,
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
            title: `${p.name} · Program published · Paid R${PROGRAM_PRICE}`,
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
      ? `R${(totalPrograms * PROGRAM_PRICE).toLocaleString("en-ZA")}`
      : "—";

  // ─── Login view ───────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen overflow-hidden bg-cream text-forest">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.12),transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={heartViewLogo}
                alt="HeartView"
                className="h-8 w-8 sm:h-9 sm:w-9"
              />
              <span className="text-lg font-semibold tracking-tight text-forest sm:text-xl">
                heart<span className="text-terracotta">View</span>
              </span>
            </Link>
          </div>

          <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
            <div className="w-full max-w-md rounded-[2.5rem] border border-cream-deep bg-cream/95 p-8 shadow-sm md:p-10">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-deep">
                  <Lock className="h-6 w-6 text-forest" />
                </div>
              </div>
              <h2 className="mt-6 text-center font-serif text-3xl text-forest">
                Admin sign in
              </h2>
              <p className="mt-2 text-center text-sm text-forest/70">
                Enter your admin password to continue.
              </p>
              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-forest">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={`h-12 rounded-full border px-5 bg-cream text-forest placeholder:text-whisper focus-visible:ring-forest ${
                      error
                        ? "border-red-400 focus-visible:ring-red-400"
                        : "border-cream-deep"
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
                  className="h-12 w-full rounded-full bg-forest text-cream hover:bg-forest-deep"
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
    <div className="min-h-screen overflow-hidden bg-cream text-forest">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(24,67,127,0.12),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <BackButton
            fallback="/"
            className="inline-flex items-center gap-2 text-sm text-forest/60 transition-colors hover:text-gold"
          >
            Back to site
          </BackButton>
<Link to="/" className="flex items-center gap-2">
            <img src={heartViewLogo} alt="HeartView" className="h-7 w-7" />
            <span className="font-semibold text-forest">
              heart<span className="text-terracotta">View</span>
            </span>
          </Link>          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-11 rounded-full border-cream-deep bg-cream px-6 text-sm text-forest hover:bg-cream-deep/80"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Hero */}
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.35em] text-forest/60">Admin</p>
          <h2 className="mt-3 font-serif text-5xl leading-none text-forest sm:text-6xl md:text-7xl">
            Dashboard{" "}
            <span className="italic text-gold">overview</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-forest/70 md:text-lg">
            A quiet snapshot of activity across HeartView.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-cream-deep bg-cream/95 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-forest">Total users</p>
              <div className="rounded-full bg-cream-deep p-3">
                <Users className="h-5 w-5 text-forest" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-5xl text-forest">
              {loading ? "…" : (totalUsers ?? "—")}
            </h3>
            <p className="mt-1 text-sm text-forest/60">
              {!loading && `+${newUsersThisWeek} this week`}
            </p>
          </div>

          <div className="rounded-[2rem] border border-cream-deep bg-cream/95 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-forest">Programs published</p>
              <div className="rounded-full bg-cream-deep p-3">
                <FileText className="h-5 w-5 text-forest" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-5xl text-forest">
              {loading ? "…" : (totalPrograms ?? "—")}
            </h3>
            <p className="mt-1 text-sm text-forest/60">Across HeartView</p>
          </div>

          <div className="rounded-[2rem] border border-cream-deep bg-cream/95 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-lg text-forest">Revenue</p>
              <div className="rounded-full bg-cream-deep p-3">
                <DollarSign className="h-5 w-5 text-forest" />
              </div>
            </div>
            <h3 className="mt-10 font-serif text-4xl text-forest md:text-5xl">
              {loading ? "…" : revenue}
            </h3>
            <p className="mt-2 text-sm text-forest/60">
              {!loading && `${totalPrograms ?? 0} programs × R${PROGRAM_PRICE} (estimated)`}
            </p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-10 rounded-[2.5rem] border border-cream-deep bg-cream/95 p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-3xl text-forest">Recent activity</h3>
            <span className="text-xs uppercase tracking-[0.35em] text-forest/60">Live</span>
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-forest/60">Loading activity…</p>
            ) : recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-forest/60">No activity yet.</p>
            ) : (
              recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-cream-deep py-5 last:border-none"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep">
                      {item.type === "user" ? (
                        <Users className="h-4 w-4 text-forest" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-forest" />
                      )}
                    </div>
                    <div>
                      <p className="text-base text-forest md:text-lg">{item.title}</p>
                      <p className="mt-1 text-sm text-forest/60">{item.date}</p>
                    </div>
                  </div>
                  <p className="hidden text-sm text-forest/60 md:block">{item.ago}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Newest users */}
{/* All users table */}
        <div className="mt-10 rounded-[2.5rem] border border-cream-deep bg-cream/95 p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-3xl text-forest">All users</h3>
            {allUsersTable.length > 0 && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 rounded-full border border-cream-deep bg-cream px-4 py-2 text-sm text-forest shadow-sm transition hover:bg-cream-deep/80"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </button>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-forest/60">Loading users…</p>
            ) : allUsersTable.length === 0 ? (
              <p className="py-8 text-center text-sm text-forest/60">No users yet.</p>
            ) : (
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-cream-deep text-left text-xs uppercase tracking-[0.2em] text-forest/50">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Surname</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Marketing</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsersTable.map((user, index) => (
                    <tr
                      key={index}
                      className="border-b border-cream-deep/60 last:border-none"
                    >
                      <td className="py-4 pr-4 text-forest">{user.name}</td>
                      <td className="py-4 pr-4 text-forest">{user.surname}</td>
                      <td className="py-4 pr-4 text-forest/70">{user.email}</td>
                      <td className="py-4 pr-4 text-forest/60">{user.date}</td>
                      <td className="py-4">
                        {user.marketingConsent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-2.5 py-1 text-xs font-medium text-forest/40">
                            — No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-cream-deep">
          <div className="flex flex-col items-center justify-between gap-4 py-6 text-sm text-forest/60 md:flex-row">
<Link to="/" className="flex items-center gap-2">
            <img src={heartViewLogo} alt="HeartView" className="h-7 w-7" />
            <span className="font-semibold text-forest">
              heart<span className="text-terracotta">View</span>
            </span>
          </Link>            <p className="text-center">© 2026 HeartView. Admin dashboard.</p>
            <div className="flex gap-5">
              <Link to="/" className="transition-colors hover:text-gold">Website</Link>
              <Link to="/contact" className="transition-colors hover:text-gold">Contact</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Admin;
