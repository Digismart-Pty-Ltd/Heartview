/// <reference types="vite/client" />

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  X,
  QrCode as QrCodeIcon,
  Share2,
  Download,
} from "lucide-react";
import { formatDate, type Program } from "@/lib/program";
import { auth } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { getTheme } from "@/lib/themes";
import crossDove from "@/assets/cross-dove.png";
import heartViewLogo from "@/assets/heartview-logo.png";
import { toast } from "sonner";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import QRCode from "qrcode";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";

// ── Order pagination ──────────────────────────────────────────────────────────
const ITEMS_PER_ORDER_PAGE = 6;

type OrderItem = { id: string; time?: string; title: string; by?: string };

export const chunkOrderItems = (
  items: OrderItem[],
  perPage = ITEMS_PER_ORDER_PAGE
): OrderItem[][] => {
  const chunks: OrderItem[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    chunks.push(items.slice(i, i + perPage));
  }
  return chunks.length ? chunks : [[]];
};

// ── Obituary pagination ───────────────────────────────────────────────────────
// Keep a simple export for the PDF page-id collector (downloadPdf still calls this)
export const chunkObituary = (text: string): string[] => {
  if (!text) return [text];
  // rough split so downloadPdf knows how many page ids to expect;
  // actual visual chunks come from useObituaryChunks below
  return text.match(/(.|[\r\n]){1,600}/g) ?? [text];
};

export function measureObituaryChunks(
  text: string,
  contentWidthPx: number,
  availableHeightPx: number
): string[] {
  if (!text || contentWidthPx <= 0 || availableHeightPx <= 0) return [text];

  const probe = document.createElement("div");
  probe.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    visibility: hidden;
    pointer-events: none;
    width: ${contentWidthPx}px;
    font-size: 0.875rem;
    line-height: 1.625;
    white-space: pre-line;
    text-align: center;
    word-break: break-word;
  `;
  document.body.appendChild(probe);

  const tokens = text.split(/(\s+)/);
  const chunks: string[] = [];
  let current = "";

  for (const token of tokens) {
    const candidate = current + token;
    probe.textContent = candidate;
if (probe.scrollHeight > availableHeightPx && current.trim()) {
          chunks.push(current.trim());
      current = token;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  document.body.removeChild(probe);
  return chunks.length ? chunks : [text];
}

function useObituaryChunks(obituary: string, probeRef: React.RefObject<HTMLDivElement>): string[] {
  const [chunks, setChunks] = useState<string[]>([obituary]);

  useEffect(() => {
    if (!obituary) return;

    const measure = () => {
      // probeRef is a hidden div with the same aspect-ratio as a Page but
      // sized to match the *actual* viewport width so measurements are accurate
      // on both desktop and mobile / QR view.
      const probe = probeRef.current;
      if (!probe) return;

      const totalW = probe.offsetWidth;
      const totalH = probe.offsetHeight;
      if (!totalW || !totalH) return;

  const contentW = totalW * (1 - 0.18 * 2);
      const headingPx = 36 * 1.2 + 20;
      // Matches tightPadding: pt-[12%] pb-[18%]
const availableH = totalH * (1 - 0.12 - 0.18) - headingPx * 0.6;

      const result = measureObituaryChunks(obituary, contentW, availableH);
      setChunks(result);

      console.log("probe", totalW, totalH, "contentW", contentW, "availableH", availableH, "lineH", 0.875 * 1.625 * 16, "fits", Math.floor(availableH / (0.875 * 1.625 * 16)));
    };

    
    // Wait for layout so the probe has real dimensions
    const raf = requestAnimationFrame(() => setTimeout(measure, 50));
    return () => cancelAnimationFrame(raf);
  }, [obituary, probeRef]);

  return chunks;
}


// ── Shared OrderList — used in EVERY context (static, QR, preview) ────────────
export const OrderList = ({
  chunk,
  chunkIdx,
  accent,
  ink,
  soft,
}: {
  chunk: OrderItem[];
  chunkIdx: number;
  accent: string;
  ink: string;
  soft: string;
}) => (
  <>
    <h2
      className="font-serif text-3xl italic md:text-4xl"
      style={{ color: `hsl(${accent})` }}
    >
      {chunkIdx === 0 ? "Order Of Service" : "Order Of Service (cont.)"}
    </h2>
    <ul className="mt-6 w-full max-w-md space-y-3 text-left">
      {chunk.map((item) => (
        <li key={item.id} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-xs tracking-wide"
              style={{ color: `hsl(${accent})` }}
            >
              {item.time || ""}
            </span>
            {item.by && (
              <span className="text-xs italic" style={{ color: `hsl(${soft})` }}>
                {item.by}
              </span>
            )}
          </div>
          <span
            className="font-medium uppercase tracking-wide text-sm md:text-base"
            style={{ color: `hsl(${ink})` }}
          >
            {item.title}
          </span>
        </li>
      ))}
    </ul>
  </>
);

// ── Page frame ────────────────────────────────────────────────────────────────
export const Page = ({
  id,
  frame,
  paper,
  accent,
  children,
  tightPadding,
}: {
  id?: string;
  frame: string;
  paper: string;
  accent: string;
  children: React.ReactNode;
  tightPadding?: boolean;
}) => (
  <div
    id={id}
   className="relative mx-auto w-full overflow-hidden rounded-md shadow-paper print:shadow-none"
style={{ aspectRatio: "3 / 4", maxWidth: "880px", transform: "translateZ(0)", backfaceVisibility: "hidden" } as React.CSSProperties}
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
      crossOrigin="anonymous"
      className="pointer-events-none absolute -left-[5%] -top-[5%] h-[38%] w-[38%] select-none object-contain"
    />
    <img
      src={crossDove}
      alt=""
      aria-hidden
      crossOrigin="anonymous"
      className="pointer-events-none absolute right-[10%] top-[8%] h-[20%] w-auto select-none object-contain"
    />
    <img
      src={frame}
      alt=""
      aria-hidden
      crossOrigin="anonymous"
      className="pointer-events-none absolute -bottom-[5%] -right-[5%] h-[38%] w-[38%] rotate-180 select-none object-contain"
    />
<div className={`relative z-10 flex h-full w-full flex-col items-center justify-start overflow-hidden px-[18%] text-center ${tightPadding ? "pt-[12%] pb-[18%]" : "pt-[20%] pb-[30%]"}`} style={{ transform: "translateZ(0)" }}>
    {children}
</div>
  </div>
);

// ── Styled QR download ────────────────────────────────────────────────────────
const downloadStyledQRCode = async (url: string, programName: string) => {
  try {
    const size = 600;
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, url, {
      width: size,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#fffef9" },
      errorCorrectionLevel: "H",
    });

    const pad = 40;
    const labelH = 80;
    const out = document.createElement("canvas");
    out.width = size + pad * 2;
    out.height = size + pad * 2 + labelH;
    const ctx = out.getContext("2d")!;

    ctx.fillStyle = "#fffef9";
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.strokeStyle = "rgba(181,125,42,0.35)";
    ctx.lineWidth = 2;
    const r = 20;
    ctx.beginPath();
    ctx.roundRect(8, 8, out.width - 16, out.height - 16, r);
    ctx.stroke();

    ctx.strokeStyle = "rgba(181,125,42,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 14, out.width - 28, out.height - 28, r - 4);
    ctx.stroke();

    ctx.drawImage(qrCanvas, pad, pad, size, size);

    const logoSize = 72;
    const cx = pad + size / 2;
    const cy = pad + size / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fffef9";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(181,125,42,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = heartViewLogo;
    });

    const labelY = pad + size + 16;
    ctx.fillStyle = "rgba(90,80,70,0.6)";
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "0.08em";
    ctx.fillText("SCAN TO VIEW PROGRAM", out.width / 2, labelY + 18);

    ctx.fillStyle = "#2c2416";
    ctx.font = "600 18px Georgia, serif";
    ctx.fillText(programName, out.width / 2, labelY + 44);

    ctx.fillStyle = "rgba(181,125,42,0.7)";
    ctx.font = "italic 12px Georgia, serif";
    ctx.fillText("heartView", out.width / 2, labelY + 66);

    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = `${programName}-qr-code.png`;
    link.click();
    toast.success("QR code downloaded");
  } catch (error) {
    console.error(error);
    toast.error("Failed to generate QR code");
  }
};

// ── Main component ────────────────────────────────────────────────────────────
const ProgramView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isQrView = searchParams.get("qr") === "true";
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const [program, setProgram] = useState<Program | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
const [pdfLoading, setPdfLoading] = useState(false);
  useInactivityLogout();

  const obituaryProbeRef = useRef<HTMLDivElement>(null);
  const obituaryChunks = useObituaryChunks(program?.obituary ?? "", obituaryProbeRef);


  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  const LogoLink = () => (
    <Link to="/" className="flex items-center gap-2">
      <img src={heartViewLogo} alt="HeartView" className="h-7 w-7" />
      <span className="font-semibold text-ink">
        heart<span className="text-terracotta">View</span>
      </span>
    </Link>
  );

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

  // ── Generate & save share preview image (runs once, right after creation) ──
useEffect(() => {
  const generateShareImage = async () => {
    if (!id || !program) return;
    if ((program as any).shareImageUrl) return; // already generated
    if (!showShare) return; // only run in the "just created" window

    // Wait a tick so the cover Page has fully rendered with images loaded
    await new Promise((r) => setTimeout(r, 800));

    const el = document.getElementById("pdf-page-cover");
    if (!el) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      const imgRef = storageRef(storage, `share-images/${id}.png`);
      await uploadBytes(imgRef, blob);
      const url = await getDownloadURL(imgRef);

      await updateDoc(doc(db, "programs", id), { shareImageUrl: url });
    } catch (err) {
      console.error("Failed to generate share image:", err);
    }
  };

  generateShareImage();
}, [id, program, showShare]);

  useEffect(() => {
    if (program) document.title = `In memory of ${program.name} — HeartView`;
  }, [program]);

  const explicitEdit = searchParams.get("edit") === "true";
  const canEdit =
    explicitEdit ||
    (!!currentUser && !!program && (program as any).userId === currentUser.uid);

  const openEditor = () => {
    if (!program) return;
    setEditItems(program.order.map((item) => ({ ...item })));
    setIsEditing(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-page-order");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
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
  const newItem = {
    id: crypto.randomUUID(),
    time: "",
    title: "",
    by: "",
  };

  setEditItems((prev) => [...prev, newItem]);

  setTimeout(() => {
    const container = document.getElementById(
      "order-service-editor"
    );

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, 100);
};

  const saveOrder = async () => {
    if (!id) return;
    const cleanItems = editItems.filter((i) => i.title.trim());
    if (cleanItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "programs", id), { order: cleanItems });
      setIsEditing(false);
      toast.success("✓ Order of service updated successfully", {
        description: `${cleanItems.length} item${cleanItems.length !== 1 ? "s" : ""} saved.`,
        duration: 4000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not save changes — please try again");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!program) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const iosPdfWindow = isIOS ? window.open("about:blank", "_blank") : null;
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // Collect all order page IDs — supports multi-page order
      const orderChunks = chunkOrderItems(program.order);
      const orderPageIds = orderChunks.map((_, i) =>
        i === 0 ? "pdf-page-order" : `pdf-page-order-${i}`
      );

      const pageIds = ["pdf-page-cover", ...orderPageIds];
if (program.obituary) {
        obituaryChunks.forEach((_, i) => {
          pageIds.push(i === 0 ? "pdf-page-obituary" : `pdf-page-obituary-${i}`);
        });
      }
            if (program.voteOfThanks) pageIds.push("pdf-page-vote");
      if (program.gallery.length > 0) pageIds.push("pdf-page-gallery");

      const canvases: HTMLCanvasElement[] = [];
      for (const pageId of pageIds) {
        const el = document.getElementById(pageId);
        if (!el) continue;
const canvas = await html2canvas(el, {
  scale: 2,
  useCORS: true,
  allowTaint: false,
  backgroundColor: "#ffffff",
  scrollX: -window.scrollX,
  scrollY: -window.scrollY,
  logging: false,
  imageTimeout: 0,
  onclone: (_clonedDoc, clonedEl) => {
  clonedEl.querySelectorAll("img").forEach((img: HTMLImageElement) => {
    img.style.display = "block";
    img.style.visibility = "visible";
    img.crossOrigin = "anonymous";
  });

  // html2canvas ignores CSS object-fit, so replace tagged images
  // with pre-cropped canvases so they render correctly in the PDF.
  clonedEl.querySelectorAll<HTMLImageElement>("img[data-cover]").forEach((img) => {
    const w = img.offsetWidth || img.clientWidth;
    const h = img.offsetHeight || img.clientHeight;
    if (!w || !h) return;

    const cvs = document.createElement("canvas");
    cvs.width = w;
    cvs.height = h;
    const ctx2 = cvs.getContext("2d");
    if (!ctx2) return;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx2.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    cvs.style.cssText = img.style.cssText;
    cvs.style.borderRadius = getComputedStyle(img).borderRadius;
    img.parentNode?.replaceChild(cvs, img);
  });
},
        });
        canvases.push(canvas);
      }

      if (canvases.length === 0) {
        toast.error("Nothing to export");
        return;
      }

  // Use A4 proportions in points (595 × 794 pt)
      const PDF_W = 595;
      const PDF_H = 794;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      canvases.forEach((canvas, i) => {
        if (i > 0) pdf.addPage();
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        // Fit canvas into A4 preserving aspect ratio, centered
        const canvasAspect = canvas.width / canvas.height;
        const pageAspect = PDF_W / PDF_H;
        let drawW = PDF_W;
        let drawH = PDF_H;
        let offsetX = 0;
        let offsetY = 0;
        if (canvasAspect > pageAspect) {
          drawH = PDF_W / canvasAspect;
          offsetY = (PDF_H - drawH) / 2;
        } else {
          drawW = PDF_H * canvasAspect;
          offsetX = (PDF_W - drawW) / 2;
        }
        pdf.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
      });
      
      if (isIOS) {
        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `${program.name}-program.pdf`;
        const shareNavigator = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { files: File[]; title?: string }) => Promise<void>;
        };
        const pdfFile = new File([blob], fileName, { type: "application/pdf" });

        if (shareNavigator.share && shareNavigator.canShare?.({ files: [pdfFile] })) {
          iosPdfWindow?.close();
          try {
            await shareNavigator.share({
              files: [pdfFile],
              title: fileName,
            });
            toast.success("PDF ready to save");
          } catch (shareError) {
            if ((shareError as DOMException).name === "AbortError") {
              toast.info("PDF sharing canceled");
            } else {
              window.location.href = blobUrl;
              toast.success("PDF opened — tap Share, then Save to Files");
            }
          }
        } else if (iosPdfWindow) {
          iosPdfWindow.location.href = blobUrl;
          toast.success("PDF opened — tap Share, then Save to Files");
        } else {
          window.location.href = blobUrl;
          toast.success("PDF opened — tap Share, then Save to Files");
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        pdf.save(`${program.name}-program.pdf`);
        toast.success("PDF downloaded");
      }

    } catch (err) {
      console.error(err);
      iosPdfWindow?.close();
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Loading / not found ───────────────────────────────────────────────────
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
  const shareUrl = `${window.location.origin}/program/${program.id || id}`;
  const qrUrl = `${shareUrl}?qr=true`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const year = (d: string) => (d ? new Date(d).getFullYear() : "");
  const accent = theme.accent;
  const ink = theme.ink;
  const soft = theme.soft;

  const parts = program.name.trim().split(/\s+/);
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(" ") : program.name;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

 const obituaryFontSize = "0.875rem";

  // ── Cover content (reused in both QR and static views) ───────────────────
  const coverContent = (
    <>
      <p className="font-serif text-base italic md:text-xl" style={{ color: `hsl(${accent})` }}>
        In loving memory of
      </p>
      {program.profilePhoto && (
        <div
         className="mx-auto mt-3 shrink-0 overflow-hidden border-[3px] shadow-soft"
style={{ width: "112px", height: "140px", borderRadius: "50%", borderColor: `hsl(${accent} / 0.5)` }}
        >
          <img
  src={program.profilePhoto}
  alt={program.name}
  data-cover=""
  className="h-full w-full object-cover"
  crossOrigin="anonymous"
  style={{ objectFit: "cover", objectPosition: "50% 50%" }}
/>
        </div>
      )}
      <h1
        className="mt-3 font-serif text-2xl uppercase tracking-wide md:text-4xl"
        style={{ color: `hsl(${ink})` }}
      >
        {givenNames}
      </h1>
      {lastName && (
        <p className="mt-1 font-serif text-xl italic md:text-2xl" style={{ color: `hsl(${accent})` }}>
          {lastName}
        </p>
      )}
      <p className="mt-3 font-serif text-xs italic md:text-sm" style={{ color: `hsl(${soft})` }}>
        {formatDate(program.dob)} — {formatDate(program.dop)}
      </p>
      {program.tribute && (
        <p className="mt-2 font-serif text-sm italic md:text-base" style={{ color: `hsl(${soft})` }}>
          {program.tribute}
        </p>
      )}
    </>
  );

  // ── Build QR page list ────────────────────────────────────────────────────
  type PageDef = { key: string; content: React.ReactNode };
  const pages: PageDef[] = [];

  pages.push({ key: "cover", content: coverContent });

  // Paginated order of service
  chunkOrderItems(program.order).forEach((chunk, chunkIdx) => {
    pages.push({
      key: `order-${chunkIdx}`,
      content: (
        <OrderList
          chunk={chunk}
          chunkIdx={chunkIdx}
          accent={accent}
          ink={ink}
          soft={soft}
        />
      ),
    });
  });

if (program.obituary) {
    obituaryChunks.forEach((chunk, chunkIdx) => {
      pages.push({
        key: `obituary-${chunkIdx}`,
        content: (
          <>
            <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
              {chunkIdx === 0 ? "Obituary" : "Obituary (cont.)"}
            </h2>
            <div
            className="mt-5 w-full whitespace-pre-line text-left leading-relaxed"
              style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
            >
              {chunk}
            </div>
          </>
        ),
      });
    });
  }
  if (program.voteOfThanks) {
    pages.push({
      key: "vote",
      content: (
        <>
          <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
            Vote Of Thanks
          </h2>
          <p
            className="mt-5 w-full whitespace-pre-line text-left leading-relaxed"
            style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
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
          <h2 className="font-serif text-3xl italic md:text-4xl" style={{ color: `hsl(${accent})` }}>
            Cherished Moments
          </h2>
          <div
            className="mt-6 grid grid-cols-2 gap-3"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            {program.gallery.slice(0, 4).map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg shadow-soft">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
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

  // ── QR / book view ────────────────────────────────────────────────────────
 if (isQrView) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-warm px-4 py-8">
        {/* Probe must be present in QR view too for measurement to work */}
    <div
          ref={obituaryProbeRef}
          aria-hidden
          className="pointer-events-none fixed opacity-0"
          style={{ aspectRatio: "3 / 4", width: "min(384px, 100vw - 2rem)", top: "-9999px", left: "-9999px" }}
        />
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
              {/* Nav arrows rendered inside the page frame */}
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

        {/* Dot indicators */}
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
                  i === currentPage ? `hsl(${accent})` : `hsl(${accent} / 0.3)`,
              }}
            />
          ))}
        </div>

        <p className="mt-3 font-serif text-sm italic" style={{ color: `hsl(${soft})` }}>
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

  // ── Normal (desktop / print) view ─────────────────────────────────────────
  const orderChunks = chunkOrderItems(program.order);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {showShare && (
        <div className="border-b border-gold/20 bg-cream/60 print:hidden">
          <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-serif text-lg text-ink">Your program is ready to share</p>
              <p className="text-sm text-whisper">
                Anyone with this link can view it — no login needed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="hidden max-w-[260px] truncate rounded bg-background px-3 py-2 text-xs text-whisper md:inline-block">
                {qrUrl}
              </code>
            </div>
          </div>
        </div>
      )}

      <header className="container flex flex-col items-start gap-3 py-5 print:hidden md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between md:w-auto md:gap-12">
          <BackButton
            fallback="/create"
            className="text-sm text-whisper transition-colors hover:text-gold"
          >
            Back
          </BackButton>
          <LogoLink />
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={openEditor}
                className="border-gold/40"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit order
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={downloadPdf} disabled={pdfLoading}>
              <Download className="mr-2 h-4 w-4" />
              {pdfLoading ? "Generating…" : "Download PDF"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadStyledQRCode(qrUrl, program.name)}
              className="border-gold/40"
            >
              <QrCodeIcon className="mr-2 h-4 w-4" />
              Download QR
            </Button>
            <Button variant="outline" size="sm" onClick={copy} className="border-gold/40">
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Share
            </Button>
          </div>
        </div>
      </header>

  {/* Invisible probe — measures available obituary content height */}
    <div
        ref={obituaryProbeRef}
        aria-hidden
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] opacity-0"
        style={{ aspectRatio: "3 / 4", width: "min(880px, 100vw - 2rem)" }}
      />

      <article className="container max-w-5xl space-y-10 pb-20 fade-in">

        {/* PAGE 1 — COVER */}
        <Page id="pdf-page-cover" frame={theme.frame} paper={theme.paper} accent={accent}>
          {coverContent}
        </Page>

        {/* PAGE(S) — ORDER OF SERVICE (auto-paginated) */}
        {orderChunks.map((chunk, chunkIdx) => (
          <Page
            key={`order-${chunkIdx}`}
            id={chunkIdx === 0 ? "pdf-page-order" : `pdf-page-order-${chunkIdx}`}
            frame={theme.frame}
            paper={theme.paper}
            accent={accent}
            tightPadding
          >
            {/* Edit UI only shown on the first order page */}
            {chunkIdx === 0 && isEditing ? (
              <div className="flex w-full flex-col gap-3 overflow-visible">
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

<div
  className="flex flex-col gap-2 overflow-y-auto pr-2"
  style={{
    maxHeight: window.innerWidth < 768 ? "180px" : "420px",
  }}
>                  {editItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1.5 rounded-md px-3 py-2"
                      style={{
                        background: `hsl(${accent} / 0.06)`,
                        border: `1px solid hsl(${accent} / 0.2)`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={item.time ?? ""}
                          onChange={(e) => updateItem(index, "time", e.target.value)}
                          className="flex-1 rounded border px-2 py-1 font-mono text-xs outline-none focus:ring-1"
                          style={{
                            color: `hsl(${accent})`,
                            borderColor: `hsl(${accent} / 0.3)`,
                            background: `hsl(${accent} / 0.04)`,
                          }}
                        />
                        <button
                          onClick={() => deleteItem(index)}
                          aria-label="Delete item"
                          className="shrink-0 rounded p-1 transition hover:opacity-60"
                          style={{ color: `hsl(${soft})` }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        value={item.title}
                        onChange={(e) => updateItem(index, "title", e.target.value)}
                        placeholder="e.g. Opening & Welcome"
                        className="w-full rounded border px-2 py-1.5 text-xs font-medium uppercase tracking-wide outline-none focus:ring-1"
                        style={{
                          color: `hsl(${ink})`,
                          borderColor: `hsl(${accent} / 0.3)`,
                          background: `hsl(${accent} / 0.04)`,
                        }}
                      />
                      <input
                        value={item.by ?? ""}
                        onChange={(e) => updateItem(index, "by", e.target.value)}
                        placeholder="Led by (optional)"
                        className="w-full rounded border px-2 py-1 text-xs italic outline-none focus:ring-1"
                        style={{
                          color: `hsl(${soft})`,
                          borderColor: `hsl(${accent} / 0.2)`,
                          background: `hsl(${accent} / 0.04)`,
                        }}
                      />
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

<div
  className="sticky bottom-0 flex justify-end gap-2 pt-2 pb-2"
  style={{
    background: `hsl(${theme.paper})`,
  }}
>                  <button
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
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <OrderList
                chunk={chunk}
                chunkIdx={chunkIdx}
                accent={accent}
                ink={ink}
                soft={soft}
              />
            )}
          </Page>
        ))}

        {/* PAGE — OBITUARY */}
 {/* PAGE(S) — OBITUARY (auto-paginated) */}
        {program.obituary && obituaryChunks.map((chunk, chunkIdx) => (
          <Page
            key={`obituary-${chunkIdx}`}
            id={chunkIdx === 0 ? "pdf-page-obituary" : `pdf-page-obituary-${chunkIdx}`}
            frame={theme.frame}
            paper={theme.paper}
            accent={accent}
            tightPadding
          >
            <h2
              className="font-serif text-3xl italic md:text-4xl"
              style={{ color: `hsl(${accent})` }}
            >
              {chunkIdx === 0 ? "Obituary" : "Obituary (cont.)"}
            </h2>
            <div
              className="mt-5 w-full whitespace-pre-line text-left leading-relaxed"
              style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
            >
              {chunk}
            </div>
          </Page>
        ))}

        {/* PAGE — VOTE OF THANKS */}
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
              className="mt-5 w-full whitespace-pre-line text-left leading-relaxed"
              style={{ color: `hsl(${ink})`, fontSize: obituaryFontSize }}
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
            <div
              className="mt-6 grid gap-3"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              {program.gallery.slice(0, 4).map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg shadow-soft">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    crossOrigin="anonymous"
                    data-cover=""
                    className="h-full w-full object-cover"
                    style={{ objectFit: "cover", objectPosition: "50% 50%" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-whisper print:hidden">
          {year(program.dob)} — {year(program.dop)} · Created with{" "}
          <Link to="/" className="text-gold hover:underline">
            HeartView
          </Link>
        </p>
      </article>
    </div>
  );
};

export default ProgramView;