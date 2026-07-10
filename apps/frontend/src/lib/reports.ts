import jsPDF from "jspdf";

/** Converts tabular data into a downloadable CSV file. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Renders a simple paginated tabular report to a downloadable PDF. */
export function downloadReportPdf(filename: string, title: string, headers: string[], rows: (string | number)[][]): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const marginX = 10;
  let y = 15;

  doc.setFontSize(14);
  doc.text(title, marginX, y);
  y += 8;
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toISOString().split("T")[0]}`, marginX, y);
  y += 6;

  const colWidth = (297 - marginX * 2) / headers.length;
  const rowHeight = 6;
  const pageBottom = 200;

  const drawHeader = () => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => doc.text(h, marginX + i * colWidth, y));
    y += rowHeight;
    doc.setFont("helvetica", "normal");
  };

  drawHeader();
  for (const row of rows) {
    if (y > pageBottom) {
      doc.addPage();
      y = 15;
      drawHeader();
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? "").slice(0, 28), marginX + i * colWidth, y);
    });
    y += rowHeight;
  }

  doc.save(filename);
}
