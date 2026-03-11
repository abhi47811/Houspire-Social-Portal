import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_script_review: "Pending Review",
  script_changes_requested: "Changes Requested",
  script_approved: "Script Approved",
  shooting: "Shooting",
  pending_edit: "Pending Edit",
  editing: "Editing",
  pending_final_review: "Final Review",
  final_approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  tracking: "Tracking",
  archived: "Archived",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_script_review: "bg-yellow-100 text-yellow-700",
  script_changes_requested: "bg-red-100 text-red-700",
  script_approved: "bg-green-100 text-green-700",
  shooting: "bg-blue-100 text-blue-700",
  pending_edit: "bg-yellow-100 text-yellow-700",
  editing: "bg-purple-100 text-purple-700",
  pending_final_review: "bg-orange-100 text-orange-700",
  final_approved: "bg-green-100 text-green-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  published: "bg-emerald-100 text-emerald-700",
  tracking: "bg-teal-100 text-teal-700",
  archived: "bg-gray-100 text-gray-500",
};

export const PLATFORM_ICONS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "Linkedin",
  both: "Globe",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  script_writer: "Script Writer",
  reviewer_editor: "Reviewer / Editor",
  shooter: "Shooter",
};

export type SmRole = "admin" | "script_writer" | "reviewer_editor" | "shooter";
export type SmPlatform = "instagram" | "linkedin" | "both";
export type SmTaskStatus =
  | "draft"
  | "pending_script_review"
  | "script_changes_requested"
  | "script_approved"
  | "shooting"
  | "pending_edit"
  | "editing"
  | "pending_final_review"
  | "final_approved"
  | "scheduled"
  | "published"
  | "tracking"
  | "archived";

export interface SmUser {
  id: string;
  name: string;
  email: string;
  role: SmRole;
  avatar_url: string | null;
  auth_user_id: string | null;
  workspace_id: string | null;
  is_active: boolean;
  notification_prefs: Record<string, unknown> | null;
  created_at: string;
}

export interface SmTask {
  id: string;
  title: string;
  script_body: string | null;
  category: string | null;
  platform: SmPlatform;
  status: SmTaskStatus;
  current_owner_id: string | null;
  created_by: string | null;
  rejection_count: number;
  caption: string | null;
  hashtags: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  ig_post_id: string | null;
  li_post_id: string | null;
  linkedin_urn: string | null;
  sheets_synced_at: string | null;
  shoot_notes: string | null;
  reference_urls: string | null;
  cover_image_url: string | null;
  final_video_url: string | null;
  drive_link_raw: string | null;
  edit_review_link: string | null;
  created_at: string;
  updated_at: string;
  current_owner?: SmUser;
  creator?: SmUser;
}

export interface SmNotification {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  action_url: string | null;
  actor_id: string | null;
  group_key: string | null;
  is_archived: boolean;
  reference_id: string | null;
  created_at: string;
}

export interface SmActivity {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: SmUser;
}

export interface SmMedia {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  folder: string;
  tags: string[];
  alt_text: string | null;
  is_archived: boolean;
  uploaded_by: string | null;
  created_at: string;
}
