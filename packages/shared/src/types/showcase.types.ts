export type ProjectStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "published"
  | "archived";

export interface StudentProject {
  project_id: string;
  title: string;
  abstract: string;
  team_members: TeamMember[];
  advisor_id: string;
  advisor?: { name: string; email: string };
  semester: string;
  department: string;
  technologies: string[];
  report_url?: string;
  video_url?: string;
  source_code_url?: string;
  thumbnail_url?: string;
  status: ProjectStatus;
  advisor_comments?: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  name: string;
  student_id?: string;
  email?: string;
  role?: string;
}

export interface ShowcaseFilterParams {
  department?: string;
  semester?: string;
  technology?: string;
  advisor_id?: string;
  query?: string;
  page?: number;
  limit?: number;
}
