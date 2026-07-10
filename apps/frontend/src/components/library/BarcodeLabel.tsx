"use client";

import { useEffect, useState } from "react";
import { Printer, QrCode } from "lucide-react";
import { generateBarcodeDataUrl, generateQrDataUrl, printBarcodeLabels, BarcodeLabelItem } from "@/lib/barcode";
import { Button } from "@/components/ui/Button";

interface BarcodeLabelProps {
  item: BarcodeLabelItem;
}

/** Displays a catalog item's generated QR + Code128 barcode and lets staff print a label. */
export function BarcodeLabel({ item }: BarcodeLabelProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!item.barcode) return;
    let cancelled = false;
    Promise.all([generateQrDataUrl(item.barcode), generateBarcodeDataUrl(item.barcode)]).then(
      ([qr, barcode]) => {
        if (!cancelled) { setQrUrl(qr); setBarcodeUrl(barcode); }
      }
    );
    return () => { cancelled = true; };
  }, [item.barcode]);

  if (!item.barcode) {
    return <p className="text-xs text-slate-400">No barcode assigned to this item yet.</p>;
  }

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printBarcodeLabels([item]);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50">
        {qrUrl && <img src={qrUrl} alt="QR code" width={72} height={72} className="rounded bg-white p-1 border border-slate-200" />}
        <div className="flex-1 min-w-0">
          {barcodeUrl && <img src={barcodeUrl} alt="Barcode" className="max-w-full h-auto bg-white p-1 rounded border border-slate-200" />}
          <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">{item.barcode}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        icon={<Printer size={13} />}
        onClick={handlePrint}
        loading={printing}
      >
        Print Barcode Label
      </Button>
    </div>
  );
}

export function BarcodeSectionHeader() {
  return (
    <h3 className="font-semibold text-[var(--color-fg-default)] text-sm flex items-center gap-2">
      <QrCode size={16} /> Barcode / QR Label
    </h3>
  );
}
