import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMoney } from "./pricing";
import fs from "fs";
import path from "path";

type SignInfo = {
  pdfFile?: string; // base64 data URL of the uploaded proposal PDF
  projectName?: string;
  clientName: string;
  signerName?: string;
  signerIp?: string;
  signatureImage?: string; // base64 data URL (png)
  signedAt?: Date | string;
  proposalNumber?: string;
  totalPrice?: number;
  discount?: number;
  currency?: string;
  clientEmail?: string;
};

function sanitize(t: string) {
  return (t || "").replace(/[^\x20-\x7E]/g, "");
}

function drawTypedCeoSignature(page: any, rColX: number, y: number, ceoName: string, helvOblique: any, helv: any) {
  // Typed handwritten signature text
  page.drawText(sanitize(ceoName), {
    x: rColX + 28,
    y: y + 78,
    size: 20,
    font: helvOblique,
    color: rgb(24 / 255, 24 / 255, 27 / 255), // Zinc 900
  });

  // Typed Signature Subtitle
  page.drawText("Counter-signed electronically", {
    x: rColX + 28,
    y: y + 50,
    size: 8,
    font: helv,
    color: rgb(161/255, 161/255, 170/255),
  });
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
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const page = doc.addPage([595.5, 842.25]);
  const { width: W, height: H } = page.getSize();
  const M = 40; // Margin
  const usableW = W - 2 * M; // 515.5
  
  // 1. Top Header Bar
  page.drawRectangle({
    x: 0,
    y: H - 80,
    width: W,
    height: 80,
    color: rgb(24 / 255, 24 / 255, 27 / 255), // Zinc 900
  });

  page.drawText("TEACHFOSYS", {
    x: M,
    y: H - 42,
    size: 16,
    font: helvBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("SIGNATURE CERTIFICATE", {
    x: M,
    y: H - 58,
    size: 9,
    font: helv,
    color: rgb(161 / 255, 161 / 255, 170 / 255), // Zinc 400
  });

  // Completed badge
  page.drawRectangle({
    x: W - M - 90,
    y: H - 50,
    width: 90,
    height: 22,
    color: rgb(16 / 255, 185 / 255, 129 / 255), // Emerald 500
  });

  page.drawText("COMPLETED", {
    x: W - M - 90 + 13,
    y: H - 43,
    size: 8,
    font: helvBold,
    color: rgb(1, 1, 1),
  });

  let y = H - 100;

  // 2. Proposal metadata / Audit trail block
  y -= 85;
  page.drawRectangle({
    x: M,
    y,
    width: usableW,
    height: 85,
    color: rgb(250 / 255, 250 / 255, 250 / 255), // Zinc 50
    borderColor: rgb(228 / 255, 228 / 255, 231 / 255), // Zinc 200
    borderWidth: 1,
  });

  // Section title inside info box
  page.drawText("DOCUMENT DETAILS & AUDIT TRAIL", {
    x: M + 15,
    y: y + 66,
    size: 8,
    font: helvBold,
    color: rgb(113 / 255, 113 / 255, 122 / 255), // Zinc 500
  });

  // Details
  const dateFormatted = p.signedAt ? new Date(p.signedAt).toLocaleString("en-GB") : new Date().toLocaleString("en-GB");
  const finalPrice = (p.totalPrice || 0) - (p.discount || 0);

  // Left col in metadata box
  page.drawText("Project:", { x: M + 15, y: y + 44, size: 9, font: helv, color: rgb(113/255, 113/255, 122/255) });
  page.drawText(sanitize(p.projectName || "N/A"), { x: M + 80, y: y + 44, size: 9, font: helvBold, color: rgb(9/255, 9/255, 11/255) });

  page.drawText("Proposal ID:", { x: M + 15, y: y + 26, size: 9, font: helv, color: rgb(113/255, 113/255, 122/255) });
  page.drawText(sanitize(p.proposalNumber || "N/A"), { x: M + 80, y: y + 26, size: 9, font: helvBold, color: rgb(9/255, 9/255, 11/255) });

  // Right col in metadata box
  page.drawText("Amount Paid:", { x: M + 280, y: y + 44, size: 9, font: helv, color: rgb(113/255, 113/255, 122/255) });
  page.drawText(formatMoney(finalPrice, p.currency || "USD"), { x: M + 360, y: y + 44, size: 9, font: helvBold, color: rgb(16/255, 185/255, 129/255) });

  page.drawText("Signed Date:", { x: M + 280, y: y + 26, size: 9, font: helv, color: rgb(113/255, 113/255, 122/255) });
  page.drawText(dateFormatted, { x: M + 360, y: y + 26, size: 9, font: helv, color: rgb(9/255, 9/255, 11/255) });

  // 3. Two-Column Signatures Section
  y -= 310;
  const colW = 242;
  const colGap = 31.5;

  // -- LEFT COLUMN: CLIENT SIGNATURE BOX --
  page.drawRectangle({
    x: M,
    y,
    width: colW,
    height: 285,
    color: rgb(250 / 255, 250 / 255, 250 / 255), // Zinc 50
    borderColor: rgb(228 / 255, 228 / 255, 231 / 255), // Zinc 200
    borderWidth: 1,
  });

  // Client signature header band
  page.drawRectangle({
    x: M,
    y: y + 255,
    width: colW,
    height: 30,
    color: rgb(240 / 255, 253 / 255, 244 / 255), // Emerald 50
  });
  page.drawLine({
    start: { x: M, y: y + 255 },
    end: { x: M + colW, y: y + 255 },
    thickness: 0.8,
    color: rgb(187 / 255, 247 / 255, 208 / 255), // Emerald 200
  });
  page.drawText("CLIENT SIGNATURE", {
    x: M + 12,
    y: y + 266,
    size: 9,
    font: helvBold,
    color: rgb(21 / 255, 128 / 255, 61 / 255), // Emerald 700
  });

  // Client details
  const drawLabelVal = (colX: number, startY: number, label: string, val: string) => {
    page.drawText(`${label}:`, { x: colX, y: startY, size: 8, font: helv, color: rgb(113/255, 113/255, 122/255) });
    page.drawText(sanitize(val), { x: colX + 65, y: startY, size: 8, font: helvBold, color: rgb(39/255, 39/255, 42/255) });
  };

  drawLabelVal(M + 12, y + 235, "Signer Name", p.signerName || p.clientName);
  drawLabelVal(M + 12, y + 217, "Email", p.clientEmail || "N/A");
  drawLabelVal(M + 12, y + 199, "Date/Time", dateFormatted);
  drawLabelVal(M + 12, y + 181, "IP Address", p.signerIp || "N/A");

  // Client signature image drawing inside the client box
  if (p.signatureImage && p.signatureImage.startsWith("data:image")) {
    try {
      const b64 = p.signatureImage.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      const img = p.signatureImage.includes("image/jpeg") ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const dims = img.scale(1);
      
      const maxImgW = colW - 24;
      const maxImgH = 100;
      const drawW = Math.min(maxImgW, dims.width || maxImgW);
      const drawH = dims.width ? (dims.height / dims.width) * drawW : 70;
      const finalH = Math.min(maxImgH, drawH);
      
      page.drawText("Signature Image:", { x: M + 12, y: y + 154, size: 8, font: helv, color: rgb(113/255, 113/255, 122/255) });
      page.drawImage(img, {
        x: M + 12 + (maxImgW - drawW) / 2, // Centered inside the signature area
        y: y + 35,
        width: drawW,
        height: finalH,
      });
    } catch {
      page.drawText("[Failed to render signature image]", { x: M + 12, y: y + 80, size: 8, font: helvOblique, color: rgb(239/255, 68/255, 68/255) });
    }
  }

  // -- RIGHT COLUMN: COMPANY REPRESENTATIVE SIGNATURE BOX --
  const rColX = M + colW + colGap; // 313.5
  page.drawRectangle({
    x: rColX,
    y,
    width: colW,
    height: 285,
    color: rgb(250 / 255, 250 / 255, 250 / 255), // Zinc 50
    borderColor: rgb(228 / 255, 228 / 255, 231 / 255), // Zinc 200
    borderWidth: 1,
  });

  // Company representative header band
  page.drawRectangle({
    x: rColX,
    y: y + 255,
    width: colW,
    height: 30,
    color: rgb(244 / 255, 244 / 255, 245 / 255), // Zinc 100
  });
  page.drawLine({
    start: { x: rColX, y: y + 255 },
    end: { x: rColX + colW, y: y + 255 },
    thickness: 0.8,
    color: rgb(228 / 255, 228 / 255, 231 / 255), // Zinc 200
  });
  page.drawText("COMPANY REPRESENTATIVE", {
    x: rColX + 12,
    y: y + 266,
    size: 9,
    font: helvBold,
    color: rgb(63 / 255, 63 / 255, 70 / 255), // Zinc 700
  });

  const ceoName = process.env.CEO_NAME || "Shahriar Fardows";
  const companyName = process.env.COMPANY_NAME || "TEACHFOSYS";

  drawLabelVal(rColX + 12, y + 235, "Representative", ceoName);
  drawLabelVal(rColX + 12, y + 217, "Title", `CEO, ${companyName}`);
  drawLabelVal(rColX + 12, y + 199, "Organization", companyName);
  drawLabelVal(rColX + 12, y + 181, "Status", "Authorized Signatory");

  // Counter signature signature drawing
  page.drawText("Signature:", { x: rColX + 12, y: y + 154, size: 8, font: helv, color: rgb(113/255, 113/255, 122/255) });
  
  // Typed counter signature card box
  page.drawRectangle({
    x: rColX + 12,
    y: y + 35,
    width: colW - 24,
    height: 100,
    color: rgb(1, 1, 1), // White
    borderColor: rgb(240/255, 240/255, 240/255),
    borderWidth: 1,
  });

  // Check for uploaded CEO hand-drawn signature image file
  let ceoSigImgBytes: Buffer | null = null;
  let ceoSigImgType: "png" | "jpg" = "png";

  try {
    const pngPath = path.join(process.cwd(), "lib", "assets", "ceo-signature.png");
    const jpgPath = path.join(process.cwd(), "lib", "assets", "ceo-signature.jpg");
    
    if (fs.existsSync(pngPath)) {
      ceoSigImgBytes = fs.readFileSync(pngPath);
      ceoSigImgType = "png";
    } else if (fs.existsSync(jpgPath)) {
      ceoSigImgBytes = fs.readFileSync(jpgPath);
      ceoSigImgType = "jpg";
    }
  } catch (err) {
    console.error("Failed to check/read CEO signature asset:", err);
  }

  if (ceoSigImgBytes) {
    try {
      const img = ceoSigImgType === "jpg" ? await doc.embedJpg(ceoSigImgBytes) : await doc.embedPng(ceoSigImgBytes);
      const dims = img.scale(1);
      
      const maxImgW = colW - 24;
      const maxImgH = 90;
      const drawW = Math.min(maxImgW, dims.width || maxImgW);
      const drawH = dims.width ? (dims.height / dims.width) * drawW : 70;
      const finalH = Math.min(maxImgH, drawH);
      
      page.drawImage(img, {
        x: rColX + 12 + (maxImgW - drawW) / 2, // Centered inside the signature area
        y: y + 35 + (100 - finalH) / 2,
        width: drawW,
        height: finalH,
      });
    } catch (embedErr) {
      console.error("Failed to embed CEO signature image:", embedErr);
      drawTypedCeoSignature(page, rColX, y, ceoName, helvOblique, helv);
    }
  } else {
    drawTypedCeoSignature(page, rColX, y, ceoName, helvOblique, helv);
  }

  // 4. Footer
  page.drawLine({
    start: { x: M, y: 50 },
    end: { x: W - M, y: 50 },
    thickness: 0.6,
    color: rgb(228 / 255, 228 / 255, 231 / 255), // Zinc 200
  });

  page.drawText("This certificate is an electronic record of signatures in accordance with international digital signing guidelines.", {
    x: M,
    y: 36,
    size: 7.5,
    font: helv,
    color: rgb(161 / 255, 161 / 255, 170 / 255), // Zinc 400
  });

  page.drawText("TEACHFOSYS · Teachfosys Finance", {
    x: W - M - 150,
    y: 36,
    size: 7.5,
    font: helvBold,
    color: rgb(113 / 255, 113 / 255, 122 / 255), // Zinc 505
  });

  const out = await doc.save();
  return Buffer.from(out).toString("base64");
}
