import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import jsPDF from "jspdf";

export async function generateBarcodeDataUrl(value: string): Promise<string> {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 14,
    margin: 8,
  });
  return canvas.toDataURL("image/png");
}

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 220, margin: 1 });
}

export interface BarcodeLabelItem {
  catalog_id: string;
  barcode: string;
  title: string;
  isbn?: string | null;
  shelf_location?: string | null;
}

const LABELS_PER_ROW = 2;
const LABELS_PER_COL = 6;
const LABELS_PER_PAGE = LABELS_PER_ROW * LABELS_PER_COL;
const LABEL_W = 90;
const LABEL_H = 40;
const GAP = 5;
const MARGIN_X = 10;
const MARGIN_Y = 12;

/** Generates a printable A4 sheet of QR + Code128 barcode labels, one per catalog item. */
export async function printBarcodeLabels(items: BarcodeLabelItem[]): Promise<void> {
  if (items.length === 0) return;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const idxOnPage = i % LABELS_PER_PAGE;

    if (i > 0 && idxOnPage === 0) doc.addPage();

    const col = idxOnPage % LABELS_PER_ROW;
    const row = Math.floor(idxOnPage / LABELS_PER_ROW);
    const x = MARGIN_X + col * (LABEL_W + GAP);
    const y = MARGIN_Y + row * (LABEL_H + GAP);

    const [qrData, barcodeData] = await Promise.all([
      generateQrDataUrl(item.barcode),
      generateBarcodeDataUrl(item.barcode),
    ]);

    doc.setDrawColor(200);
    doc.rect(x, y, LABEL_W, LABEL_H);
    doc.addImage(qrData, "PNG", x + 2, y + 2, 30, 30);
    doc.addImage(barcodeData, "PNG", x + 35, y + 5, 53, 16);

    doc.setFontSize(8);
    doc.setTextColor(30);
    doc.text(doc.splitTextToSize(item.title, LABEL_W - 37), x + 35, y + 25);
    if (item.isbn) doc.text(`ISBN: ${item.isbn}`, x + 35, y + 32);
    if (item.shelf_location) doc.text(`Shelf: ${item.shelf_location}`, x + 35, y + 37);
  }

  doc.save(`dkp-barcode-labels-${Date.now()}.pdf`);
}
