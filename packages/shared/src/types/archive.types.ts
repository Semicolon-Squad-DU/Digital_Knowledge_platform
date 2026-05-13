import { AccessTier } from "./user.types";

export type ArchiveItemStatus = "draft" | "review" | "published" | "archived";

export type FileType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "text/plain"
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/webp"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/ogg"
  | "video/mp4"
  | "video/webm"
  | "video/x-msvideo";

export interface ArchiveItem {
  item_id: string;
  title_en: string;
  title_bn?: string;
  description?: string;
  authors: string[];
  tags: Tag[];
  category: string;
  language: string;
  access_tier: AccessTier;
  status: ArchiveItemStatus;
  file_url: string;
  file_type: string;
  file_size: number;
  version: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ArchiveVersion {
  version_id: string;
  item_id: string;
  version_number: number;
  file_url: string;
  metadata_snapshot: Record<string, unknown>;
  changed_by: string;
  created_at: string;
}

export interface Tag {
  tag_id: string;
  name_en: string;
  name_bn?: string;
}

export interface ArchiveSearchParams {
  query?: string;
  category?: string;
  language?: string;
  access_tier?: AccessTier;
  file_type?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface ArchiveSearchResult {
  items: ArchiveItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateArchiveItemRequest {
  title_en: string;
  title_bn?: string;
  description?: string;
  authors: string[];
  tag_ids: string[];
  category: string;
  language: string;
  access_tier: AccessTier;
}
