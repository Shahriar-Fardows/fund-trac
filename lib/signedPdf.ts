import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type SignInfo = {
  pdfFile?: string; // base64 data URL of the uploaded proposal PDF
  projectName?: string;
  clientName: string;
  signerName?: string;
  signerIp?: string;
  signatureImage?: string; // base64 data URL (png)
  signedAt?: Date | string;
};

function sanitize(t: string) {
  return (t || "").replace(/[^\x20-\x7E]/g, "");
}

/**
 * Takes the uploaded proposal PDF and appends a signature page
 * (signer name, date, IP and the drawn signature image). Returns base64.
 * If no PDF was uploaded, produces a standalone one-page signed document.
 */
export async function buildSignedPdfBase64(p: SignInfo): Promise<string> {
  let doc: PDFDocument;

  if (p.pdfFile && p.pdfFile.includes("base64,")) {
    try {
      const bytes = Buffer.from(p.pdfFile.split("base64,")[1], "base64");
      doc = await PDFDocument.load(bytes);
    } catch {
      doc = await PDFDocument.create();
    }
  } else {
    doc = await PDFDocument.create();
  }

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.5, 842.25]);
  const { width: W, height: H } = page.getSize();
  const M = 56;
  let y = H - 90;

  page.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: rgb(0.094, 0.094, 0.106) });
  page.drawText("SIGNATURE", { x: M, y: H - 44, size: 18, font: helvBold, color: rgb(1, 1, 1) });

  const line = (label: string, value: string, bold = false) => {
    y -= 22;
    page.drawText(`${label}: `, { x: M, y, size: 11, font: helv, color: rgb(0.45, 0.45, 0.45) });
    page.drawText(sanitize(value), { x: M + 90, y, size: 11, font: bold ? helvBold : helv, color: rgb(0.1, 0.1, 0.1) });
  };

  y -= 20;
  if (p.projectName) line("Project", p.projectName, true);
  line("Client", p.clientName);
  line("Signed by", p.signerName || p.clientName, true);
  const d = p.signedAt ? new Date(p.signedAt) : new Date();
  line("Date", d.toLocaleString("en-GB"));
  if (p.signerIp) line("IP Address", p.signerIp);

  // Signature image
  if (p.signatureImage && p.signatureImage.startsWith("data:image")) {
    try {
      const b64 = p.signatureImage.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      const img = p.signatureImage.includes("image/jpeg") ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const dims = img.scale(1);
      const drawW = Math.min(220, dims.width || 220);
      const drawH = dims.width ? (dims.height / dims.width) * drawW : 90;
      y -= drawH + 24;
      page.drawText("Signature:", { x: M, y: y + drawH + 6, size: 10, font: helv, color: rgb(0.45, 0.45, 0.45) });
      page.drawImage(img, { x: M, y, width: drawW, height: drawH });
    } catch {
      /* ignore */
    }
  }

  // Company representative (CEO) counter-signature.
  const ceoName = process.env.CEO_NAME;
  const companyName = process.env.COMPANY_NAME || "TEACHFOSYS";
  if (ceoName) {
    y -= 46;
    page.drawLine({ start: { x: M, y: y + 30 }, end: { x: M + 220, y: y + 30 }, thickness: 0.8, color: rgb(0.8, 0.8, 0.8) });
    // typed signature
    const sig = await doc.embedFont(StandardFonts.HelveticaOblique);
    page.drawText(sanitize(ceoName), { x: M, y: y + 38, size: 18, font: sig, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(sanitize(`${ceoName} — CEO, ${companyName}`), { x: M, y: y + 14, size: 10, font: helvBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText("Authorized signatory (Company)", { x: M, y, size: 9, font: helv, color: rgb(0.45, 0.45, 0.45) });
  }

  y -= 30;
  page.drawText("This document was electronically signed and is legally binding.", {
    x: M, y, size: 9, font: helv, color: rgb(0.5, 0.5, 0.5),
  });

  const out = await doc.save();
  return Buffer.from(out).toString("base64");
}
