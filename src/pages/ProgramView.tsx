/// <reference types="vite/client" />

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  ArrowLeft,
  Printer,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { formatDate, type Program } from "@/lib/program";
import { getTheme } from "@/lib/themes";
import crossDove from "@/assets/cross-dove.png";
import { toast } from "sonner";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import QRCode from "qrcode";

export const Page = ({
  id,
  frame,
  paper,
  accent,
  children,
}: {
  id?: string;
  frame: string;
  paper: string;
  accent: string;
  children: React.ReactNode;
}) => (
  <div
    id={id}
    className="relative mx-auto w-full overflow-hidden rounded-md shadow-paper print:shadow-none"
    style={{
      aspectRatio: "3 / 4",
      maxWidth: "880px",
      background: `hsl(${paper})`,
    }}
  >
    <div
      className="pointer-events-none absolute inset-3 rounded-sm"
      style={{ border: `1px solid hsl(${accent} / 0.55)` }}
    />
    <div
      className="pointer-events-none absolute inset-4 rounded-sm"
      style={{ border: `1px solid hsl(${accent} / 0.25)` }}
    />
    <img
      src={frame}
      alt=""
      aria-hidden
      className="pointer-events-none absolute -left-[2%] -top-[2%] h-[50%] w-[50%] select-none object-contain"
    />
    <img
      src={crossDove}
      alt=""
      aria-hidden
      className="pointer-events-none absolute right-[10%] top-[8%] h-[20%] w-auto select-none object-contain"
    />
    <img
      src={frame}
      alt=""
      aria-hidden
      className="pointer-events-none absolute -bottom-[2%] -right-[2%] h-[50%] w-[50%] rotate-180 select-none object-contain"
    />
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[14%] py-[14%] text-center">
      {children}
    </div>
  </div>
);

type OrderItem = { id: string; time?: string; title: string; by?: string };

const ProgramView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isQrView = searchParams.get("qr") === "true";
  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "programs", id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Program;
          setProgram(data);
          if (data && Date.now() - data.createdAt < 10000) setShowShare(true);
        } else {
          setProgram(null);
        }
      },
      (error) => {
        console.error("Error fetching program:", error);
        setProgram(null);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (program) document.title = `In memory of ${program.name} — Eventify`;
  }, [program]);

  const openEditor = () => {
    if (!program) return;
    setEditItems(program.order.map((item) => ({ ...item })));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditItems([]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const deleteItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setEditItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), time: "", title: "", by: "" },
    ]);
  };

  const saveOrder = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "programs", id), { order: editItems });
      toast.success("Order of service updated");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!program) return;
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const pageIds = ["pdf-page-cover", "pdf-page-order"];
      if (program.obituary) pageIds.push("pdf-page-obituary");
      if (program.voteOfThanks) pageIds.push("pdf-page-vote");
      if (program.gallery.length > 0) pageIds.push("pdf-page-gallery");

      const canvases: HTMLCanvasElement[] = [];
      for (const pageId of pageIds) {
        const el = document.getElementById(pageId);
        if (!el) continue;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          width: el.offsetWidth,
          height: el.offsetHeight,
          scrollX: 0,
          scrollY: -window.scrollY,
        });
        canvases.push(canvas);
      }

      if (canvases.length === 0) {
        toast.error("Nothing to export");
        return;
      }

      const pdfW = canvases[0].width / 2;
      const pdfH = canvases[0].height / 2;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfW, pdfH],
      });

      canvases.forEach((canvas, i) => {
        if (i > 0) pdf.addPage([pdfW, pdfH]);
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      });

      pdf.save(`${program.name}-program.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  if (program === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm text-whisper">
        Loading…
      </div>
    );
  }
  if (program === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-warm px-6 text-center">
        <h1 className="font-serif text-3xl text-ink">Program not found</h1>
        <p className="text-whisper">
          This link may have expired or been entered incorrectly.
        </p>
        <Link to="/">
          <Button variant="outline">Return home</Button>
        </Link>
      </div>
    );
  }

  const theme = getTheme(program.themeId);
  const url = `${window.location.origin}/program/${id}?qr=true`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const downloadQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, { width: 500, margin: 2 });
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `${program.name}-qr-code.png`;
      link.click();
      toast.success("QR code downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate QR code");
    }
  };

  const year = (d: string) => (d ? new Date(d).getFullYear() : "");
  const accent = theme.accent;
  const ink = theme.ink;
  const soft = theme.soft;

  // ── Name order: given names (first names) first, surname last ────────────────
  const parts = program.name.trim().split(/\s+/);
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : program.name;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  // ── Build page list for QR book mode ────────────────────────────────────────
  type PageDef = { key: string; content: React.ReactNode };
  const pages: PageDef[] = [];

  pages.push({
    key: "cover",
    content: (
      <>
        <p
          className="font-serif text-xl italic md:text-2xl"
          style={{ color: `hsl(${accent})` }}
        >
          In loving memory of
        </p>
        {program.profilePhoto && (
          <div
            className="mx-auto mt-5 h-24 w-24 overflow-hidden rounded-full border-[3px] shadow-soft md:h-28 md:w-28"
            style={{ borderColor: `hsl(${accent} / 0.5)` }}
          >
            <img
              src={program.profilePhoto}
              alt={program.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {/* Given names displayed prominently first, surname below in italic */}
        <h1
          className="mt-6 font-serif text-3xl uppercase tracking-wide md:text-5xl"
          style={{ color: `hsl(${ink})` }}
        >
          {givenNames}
        </h1>
        {lastName && (
          <p
            className="mt-2 font-serif text-2xl italic md:text-3xl"
            style={{ color: `hsl(${accent})` }}
          >
            {lastName}
          </p>
        )}
        <p
          className="mt-6 font-serif text-sm italic md:text-base"
          style={{ color: `hsl(${soft})` }}
        >
          {formatDate(program.dob)} — {formatDate(program.dop)}
        </p>
        {program.subtitle && (
          <p
            className="mt-5 font-serif text-base italic md:text-lg"
            style={{ color: `hsl(${soft})` }}
          >
            {program.subtitle}
          </p>
        )}
        {!program.subtitle && program.tribute && (
          <p
            className="mt-5 font-serif text-base italic md:text-lg"
            style={{ color: `hsl(${soft})` }}
          >
            {program.tribute}
          </p>
        )}
      </>
    ),
  });

  pages.push({
    key: "order",
    content: (
      <>
        <h2
          className="font-serif text-3xl italic md:text-4xl"
          style={{ color: `hsl(${accent})` }}
        >
          Order Of Service
        </h2>
        <ul className="mt-6 w-full max-w-md space-y-2.5 text-left">
          {program.order.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 text-sm md:text-base"
            >
              <span
                className="font-mono text-xs tracking-wide"
                style={{ color: `hsl(${accent})` }}
              >
                {item.time || ""}
              </span>
              <span
                className="font-medium uppercase tracking-wide"
                style={{ color: `hsl(${ink})` }}
              >
                {item.title}
              </span>
              <span
                className="italic text-right"
                style={{ color: `hsl(${soft})` }}
              >
                {item.by || ""}
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  });

  if (program.obituary) {
    pages.push({
      key: "obituary",
      content: (
        <>
          <h2
            className="font-serif text-3xl italic md:text-4xl"
            style={{ color: `hsl(${accent})` }}
          >
            Obituary
          </h2>
          <div
            className="mt-5 max-h-full overflow-hidden whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
            style={{ color: `hsl(${ink})` }}
          >
            {program.obituary}
          </div>
        </>
      ),
    });
  }

  if (program.voteOfThanks) {
    pages.push({
      key: "vote",
      content: (
        <>
          <h2
            className="font-serif text-3xl italic md:text-4xl"
            style={{ color: `hsl(${accent})` }}
          >
            Vote Of Thanks
          </h2>
          <p
            className="mt-6 max-w-md whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
            style={{ color: `hsl(${soft})` }}
          >
            {program.voteOfThanks}
          </p>
        </>
      ),
    });
  }

  if (program.gallery.length > 0) {
    pages.push({
      key: "gallery",
      content: (
        <>
          <h2
            className="font-serif text-3xl italic md:text-4xl"
            style={{ color: `hsl(${accent})` }}
          >
            Cherished Moments
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {program.gallery.slice(0, 4).map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg shadow-soft"
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  const goToPage = (nextIndex: number) => {
    if (animating || nextIndex < 0 || nextIndex >= pages.length) return;
    setDirection(nextIndex > currentPage ? "right" : "left");
    setAnimating(true);
    setTimeout(() => {
      setCurrentPage(nextIndex);
      setAnimating(false);
      setDirection(null);
    }, 300);
  };

  // ── QR / Book view ──────────────────────────────────────────────────────────
  if (isQrView) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-warm px-4 py-8">
        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(60px); opacity: 0; }
            to   { transform: translateX(0);   opacity: 1; }
          }
          @keyframes slideInFromLeft {
            from { transform: translateX(-60px); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
          }
          .page-enter-right { animation: slideInFromRight 0.3s ease forwards; }
          .page-enter-left  { animation: slideInFromLeft  0.3s ease forwards; }
        `}</style>

        <div className="relative w-full max-w-sm">
          <div
            key={currentPage}
            className={
              animating
                ? direction === "right"
                  ? "page-enter-right"
                  : "page-enter-left"
                : ""
            }
          >
            <Page frame={theme.frame} paper={theme.paper} accent={accent}>
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0 || animating}
                  aria-label="Previous page"
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-md transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
                  style={{
                    background: `hsl(${theme.paper} / 0.85)`,
                    border: `1px solid hsl(${accent} / 0.3)`,
                    color: `hsl(${accent})`,
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pages.length - 1 || animating}
                  aria-label="Next page"
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-md transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
                  style={{
                    background: `hsl(${theme.paper} / 0.85)`,
                    border: `1px solid hsl(${accent} / 0.3)`,
                    color: `hsl(${accent})`,
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              {pages[currentPage].content}
            </Page>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              aria-label={`Go to page ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === currentPage ? "20px" : "8px",
                background:
                  i === currentPage
                    ? `hsl(${accent})`
                    : `hsl(${accent} / 0.3)`,
              }}
            />
          ))}
        </div>

        <p
          className="mt-3 font-serif text-sm italic"
          style={{ color: `hsl(${soft})` }}
        >
          Page {currentPage + 1} of {pages.length}
        </p>

        {currentPage === 0 && (
          <p className="mt-2 text-xs" style={{ color: `hsl(${soft} / 0.6)` }}>
            Use the arrows to turn pages
          </p>
        )}
      </div>
    );
  }

  // ── Normal view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-warm">
      {showShare && (
        <div className="border-b border-gold/20 bg-cream/60 print:hidden">
          <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-serif text-lg text-ink">
                Your program is ready to share
              </p>
              <p className="text-sm text-whisper">
                Anyone with this link can view it — no login needed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="hidden max-w-[260px] truncate rounded bg-background px-3 py-2 text-xs text-whisper md:inline-block">
                {url}
              </code>
              <Button
                onClick={copy}
                className="bg-ink text-primary-foreground hover:bg-ink/90"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top nav — "Back" goes to /create (Step 1 theme picker) */}
      <header className="container flex items-center justify-between py-5 print:hidden">
        <button
          onClick={() => navigate("/create")}
          className="flex items-center gap-2 text-sm text-whisper hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadPdf}
            disabled={pdfLoading}
          >
            <Printer className="mr-2 h-4 w-4" />
            {pdfLoading ? "Generating…" : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQRCode}
            className="border-gold/40"
          >
            Download QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="border-gold/40"
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Share
          </Button>
        </div>
      </header>

      <article className="container max-w-5xl space-y-10 pb-20 fade-in">
        {/* PAGE 1 — COVER */}
        <Page
          id="pdf-page-cover"
          frame={theme.frame}
          paper={theme.paper}
          accent={accent}
        >
          <p
            className="font-serif text-xl italic md:text-2xl"
            style={{ color: `hsl(${accent})` }}
          >
            In loving memory of
          </p>
          {program.profilePhoto && (
            <div
              className="mx-auto mt-5 h-24 w-24 overflow-hidden rounded-full border-[3px] shadow-soft md:h-28 md:w-28"
              style={{ borderColor: `hsl(${accent} / 0.5)` }}
            >
              <img
                src={program.profilePhoto}
                alt={program.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {/* Given names (first names) displayed first, surname below in italic */}
          <h1
            className="mt-6 font-serif text-3xl uppercase tracking-wide md:text-5xl"
            style={{ color: `hsl(${ink})` }}
          >
            {givenNames}
          </h1>
          {lastName && (
            <p
              className="mt-2 font-serif text-2xl italic md:text-3xl"
              style={{ color: `hsl(${accent})` }}
            >
              {lastName}
            </p>
          )}
          <p
            className="mt-6 font-serif text-sm italic md:text-base"
            style={{ color: `hsl(${soft})` }}
          >
            {formatDate(program.dob)} — {formatDate(program.dop)}
          </p>
          {program.subtitle && (
            <p
              className="mt-5 font-serif text-base italic md:text-lg"
              style={{ color: `hsl(${soft})` }}
            >
              {program.subtitle}
            </p>
          )}
          {!program.subtitle && program.tribute && (
            <p
              className="mt-5 font-serif text-base italic md:text-lg"
              style={{ color: `hsl(${soft})` }}
            >
              {program.tribute}
            </p>
          )}
        </Page>

        {/* PAGE 2 — ORDER OF SERVICE */}
        <Page
          id="pdf-page-order"
          frame={theme.frame}
          paper={theme.paper}
          accent={accent}
        >
          {isEditing ? (
            /* ── EDIT MODE ─────────────────────────────────────────────────── */
            <div className="flex w-full flex-col gap-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2
                  className="font-serif text-2xl italic"
                  style={{ color: `hsl(${accent})` }}
                >
                  Order Of Service
                </h2>
                <button
                  onClick={cancelEdit}
                  aria-label="Cancel editing"
                  className="rounded-full p-1 transition hover:opacity-60"
                  style={{ color: `hsl(${soft})` }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {editItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5"
                    style={{
                      background: `hsl(${accent} / 0.06)`,
                      border: `1px solid hsl(${accent} / 0.15)`,
                    }}
                  >
                    <input
                      value={item.time ?? ""}
                      onChange={(e) =>
                        updateItem(index, "time", e.target.value)
                      }
                      placeholder="Time"
                      className="w-14 shrink-0 rounded bg-transparent px-1 py-0.5 text-center font-mono text-xs outline-none focus:ring-1"
                      style={{ color: `hsl(${accent})` }}
                    />
                    <input
                      value={item.title}
                      onChange={(e) =>
                        updateItem(index, "title", e.target.value)
                      }
                      placeholder="Title"
                      className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-xs font-medium uppercase tracking-wide outline-none focus:ring-1"
                      style={{ color: `hsl(${ink})` }}
                    />
                    <input
                      value={item.by ?? ""}
                      onChange={(e) => updateItem(index, "by", e.target.value)}
                      placeholder="By"
                      className="w-20 shrink-0 rounded bg-transparent px-1 py-0.5 text-right text-xs italic outline-none focus:ring-1"
                      style={{ color: `hsl(${soft})` }}
                    />
                    <button
                      onClick={() => deleteItem(index)}
                      aria-label="Delete item"
                      className="shrink-0 rounded p-0.5 transition hover:opacity-60"
                      style={{ color: `hsl(${soft})` }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs transition hover:opacity-70"
                style={{
                  color: `hsl(${accent})`,
                  border: `1px dashed hsl(${accent} / 0.4)`,
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={cancelEdit}
                  className="rounded-md px-3 py-1.5 text-xs transition hover:opacity-60"
                  style={{ color: `hsl(${soft})` }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrder}
                  disabled={saving}
                  className="rounded-md px-4 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: `hsl(${accent})`,
                    color: `hsl(${theme.paper})`,
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ─────────────────────────────────────────────────── */
            <>
              <div className="flex items-center gap-2">
                <h2
                  className="font-serif text-3xl italic md:text-4xl"
                  style={{ color: `hsl(${accent})` }}
                >
                  Order Of Service
                </h2>
                <button
                  onClick={openEditor}
                  aria-label="Edit order of service"
                  className="print:hidden rounded-full p-1.5 transition hover:opacity-60"
                  style={{
                    color: `hsl(${accent})`,
                    background: `hsl(${accent} / 0.08)`,
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="mt-6 w-full max-w-md space-y-2.5 text-left">
                {program.order.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 text-sm md:text-base"
                  >
                    <span
                      className="font-mono text-xs tracking-wide"
                      style={{ color: `hsl(${accent})` }}
                    >
                      {item.time || ""}
                    </span>
                    <span
                      className="font-medium uppercase tracking-wide"
                      style={{ color: `hsl(${ink})` }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="italic text-right"
                      style={{ color: `hsl(${soft})` }}
                    >
                      {item.by || ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Page>

        {/* PAGE 3 — OBITUARY */}
        {program.obituary && (
          <Page
            id="pdf-page-obituary"
            frame={theme.frame}
            paper={theme.paper}
            accent={accent}
          >
            <h2
              className="font-serif text-3xl italic md:text-4xl"
              style={{ color: `hsl(${accent})` }}
            >
              Obituary
            </h2>
            <div
              className="mt-5 max-h-full overflow-hidden whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
              style={{ color: `hsl(${ink})` }}
            >
              {program.obituary}
            </div>
          </Page>
        )}

        {/* PAGE 4 — VOTE OF THANKS */}
        {program.voteOfThanks && (
          <Page
            id="pdf-page-vote"
            frame={theme.frame}
            paper={theme.paper}
            accent={accent}
          >
            <h2
              className="font-serif text-3xl italic md:text-4xl"
              style={{ color: `hsl(${accent})` }}
            >
              Vote Of Thanks
            </h2>
            <p
              className="mt-6 max-w-md whitespace-pre-line text-center text-sm leading-relaxed md:text-base"
              style={{ color: `hsl(${soft})` }}
            >
              {program.voteOfThanks}
            </p>
          </Page>
        )}

        {/* GALLERY */}
        {program.gallery.length > 0 && (
          <div
            id="pdf-page-gallery"
            className="mx-auto max-w-2xl rounded-2xl bg-card p-6 shadow-paper md:p-10"
          >
            <h2 className="text-center text-xs uppercase tracking-[0.3em] text-gold">
              Cherished moments
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {program.gallery.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-lg shadow-soft"
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-whisper print:hidden">
          {year(program.dob)} — {year(program.dop)} · Created with{" "}
          <Link to="/" className="text-gold hover:underline">
            Eventify
          </Link>
        </p>
      </article>
    </div>
  );
};

export default ProgramView;
