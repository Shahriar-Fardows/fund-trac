"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, FileText } from "lucide-react";

/**
 * Renders a PDF (base64 data URL) as canvas images using pdf.js.
 * View-only: no download/print toolbar, right-click disabled.
 */
export default function PdfViewer({ data }: { data?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!data || !container) return;

    (async () => {
      try {
        setLoading(true);
        setError("");
        container.innerHTML = "";

        const pdfjs: any = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const b64 = data.includes("base64,") ? data.split("base64,")[1] : data;
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;

        const width = Math.max(container.clientWidth || 0, 1024);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.className = "rounded-lg shadow-sm mb-4 border border-zinc-200 select-none pointer-events-none";

          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError("Could not load the document."); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [data]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <FileText className="w-10 h-10 mb-2" />
        <p className="text-sm">No PDF uploaded.</p>
      </div>
    );
  }

  return (
    <div className="relative" onContextMenu={(e) => e.preventDefault()}>
      {loading && (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      )}
      {error && <p className="text-sm text-red-500 py-8 text-center">{error}</p>}
      <div ref={containerRef} className="select-none" />
    </div>
  );
}
