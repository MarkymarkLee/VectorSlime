"use client";

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build";
const MAX_PAGES = 8;
const PAGE_WIDTH = 1100;

export interface HomeworkPage {
  /** JPEG data URL, for the board. */
  dataUrl: string;
  /** Same image as base64 without the prefix, for the model. */
  base64: string;
  w: number;
  h: number;
}

export interface Homework {
  fileName: string;
  text: string;
  pages: HomeworkPage[];
  totalPages: number;
}

// Minimal shape of the pdf.js API we use (loaded from the CDN at runtime).
interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<PdfDoc> };
}
interface PdfDoc {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}
interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  getTextContent(): Promise<{ items: { str?: string; hasEOL?: boolean }[] }>;
  render(o: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> };
}

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    const url = `${PDFJS}/pdf.min.mjs`;
    pdfjsPromise = (import(/* webpackIgnore: true */ url) as Promise<PdfJs>).then((m) => {
      m.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
      return m;
    });
    pdfjsPromise.catch(() => (pdfjsPromise = null));
  }
  return pdfjsPromise;
}

function toPage(canvas: HTMLCanvasElement): HomeworkPage {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { dataUrl, base64: dataUrl.slice(dataUrl.indexOf(",") + 1), w: canvas.width, h: canvas.height };
}

export async function readHomework(file: File, onProgress?: (msg: string) => void): Promise<Homework> {
  if (file.type.startsWith("image/")) return readImage(file);
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a PDF or a photo of your homework.");
  }

  onProgress?.("Opening the PDF");
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const count = Math.min(doc.numPages, MAX_PAGES);
  const pages: HomeworkPage[] = [];
  const texts: string[] = [];

  for (let n = 1; n <= count; n++) {
    onProgress?.(`Reading page ${n} of ${count}`);
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    texts.push(`--- Page ${n} ---\n${content.items.map((i) => (i.str ?? "") + (i.hasEOL ? "\n" : " ")).join("").replace(/[ \t]+\n/g, "\n").trim()}`);

    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: PAGE_WIDTH / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    pages.push(toPage(canvas));
  }

  return { fileName: file.name, text: texts.join("\n\n"), pages, totalPages: doc.numPages };
}

async function readImage(file: File): Promise<Homework> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, PAGE_WIDTH / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { fileName: file.name, text: "", pages: [toPage(canvas)], totalPages: 1 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** True when the PDF has little or no text layer (scanned or photographed). */
export function needsVision(hw: Homework) {
  const letters = hw.text.replace(/--- Page \d+ ---/g, "").replace(/\s/g, "").length;
  return letters < 40 * hw.pages.length;
}
