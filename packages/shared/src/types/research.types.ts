export type ResearchOutputType =
  | "journal_article"
  | "conference_paper"
  | "thesis"
  | "dataset"
  | "technical_report"
  | "book_chapter";

export interface ResearchOutput {
  output_id: string;
  title: string;
  abstract?: string;
  authors: ResearchAuthor[];
  keywords: string[];
  doi?: string;
  dkp_identifier: string;
  file_url?: string;
  output_type: ResearchOutputType;
  lab_id?: string;
  lab?: Lab;
  published_date?: string;
  journal_name?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchAuthor {
  name: string;
  email?: string;
  affiliation?: string;
  is_corresponding?: boolean;
}

export interface Lab {
  lab_id: string;
  name: string;
  description?: string;
  head_researcher_id: string;
  head_researcher?: { name: string; email: string };
  members: LabMember[];
  created_at: string;
}

export interface LabMember {
  user_id: string;
  name: string;
  role: string;
  joined_at: string;
}

export interface CitationExport {
  bibtex: string;
  apa: string;
  mla: string;
}
