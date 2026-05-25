export interface Document {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  institution: string;
  discipline: string;
  doi: string;
  citations: number;
  date: string;
  type: "Journal" | "Conference" | "Thesis" | "Dataset" | "Report" | "Preprint";
  keywords: string[];
}

export interface SavedNote {
  documentId: string;
  note: string;
  lastUpdated: string;
}
