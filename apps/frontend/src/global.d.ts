// TypeScript declarations for CSS modules
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// jsPDF type augmentation
declare module "jspdf" {
  export interface jsPDF {
    setFont(fontName?: string | undefined, fontStyle?: string): jsPDF;
    setFontSize(size: number): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: any
    ): jsPDF;
    splitTextToSize(text: string, maxWidth: number): string[];
    addPage(): jsPDF;
    save(filename: string): jsPDF;
  }
}
