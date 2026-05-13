export type LendingStatus = "active" | "returned" | "overdue";
export type HoldStatus = "pending" | "available" | "fulfilled" | "cancelled";
export type FineStatus = "pending" | "paid" | "waived";

export interface CatalogItem {
  catalog_id: string;
  title: string;
  isbn?: string;
  authors: string[];
  publisher?: string;
  edition?: string;
  year?: number;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location?: string;
  barcode?: string;
  cover_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LendingTransaction {
  transaction_id: string;
  catalog_id: string;
  catalog_item?: CatalogItem;
  member_id: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: LendingStatus;
  created_at: string;
}

export interface HoldRequest {
  hold_id: string;
  catalog_id: string;
  catalog_item?: CatalogItem;
  member_id: string;
  request_date: string;
  status: HoldStatus;
  queue_position?: number;
}

export interface Wishlist {
  wishlist_id: string;
  member_id: string;
  catalog_id: string;
  catalog_item?: CatalogItem;
  added_at: string;
}

export interface Fine {
  fine_id: string;
  member_id: string;
  transaction_id: string;
  amount: number;
  reason: string;
  status: FineStatus;
  created_at: string;
  updated_at: string;
}

export interface CatalogSearchParams {
  query?: string;
  author?: string;
  isbn?: string;
  category?: string;
  availability?: "available" | "on_loan" | "all";
  year_from?: number;
  year_to?: number;
  page?: number;
  limit?: number;
}

export interface CatalogSearchResult {
  items: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface IssueBookRequest {
  catalog_id: string;
  member_id: string;
}

export interface ReturnBookRequest {
  transaction_id: string;
}

export interface LibrarianDashboardStats {
  on_loan: number;
  overdue: number;
  returns_today: number;
  holds_pending: number;
  fines_pending: number;
  total_fines_amount: number;
}
