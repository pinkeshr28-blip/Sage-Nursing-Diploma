// Hand-written to match supabase/migrations/0001_init.sql.
// If the schema changes, update this alongside the migration.

export type UserRole = "admin" | "assessor" | "candidate";
export type ItemStatus =
  | "not_started"
  | "uploaded"
  | "under_review"
  | "revision_needed"
  | "pass";
export type ItemSection = "preparation" | "knowledge" | "performance" | "reflection";
export type NotificationKind = "sage" | "coral" | "gold";
export type ProfileStatus = "invited" | "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      cohorts: {
        Row: { id: string; label: string; sort_order: number };
        Insert: { id: string; label: string; sort_order?: number };
        Update: Partial<{ id: string; label: string; sort_order: number }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          cohort_id: string | null;
          status: ProfileStatus;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: UserRole;
          cohort_id?: string | null;
          status?: ProfileStatus;
          invited_by?: string | null;
        };
        Update: Partial<{
          full_name: string | null;
          role: UserRole;
          cohort_id: string | null;
          status: ProfileStatus;
        }>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          title: string;
          sort_order: number;
          published: boolean;
          created_at: string;
        };
        Insert: { title: string; sort_order?: number; published?: boolean };
        Update: Partial<{ title: string; sort_order: number; published: boolean }>;
        Relationships: [];
      };
      unit_questions: {
        Row: {
          id: string;
          unit_id: string;
          section: "knowledge" | "performance";
          label: string;
          sort_order: number;
        };
        Insert: {
          unit_id: string;
          section: "knowledge" | "performance";
          label: string;
          sort_order?: number;
        };
        Update: Partial<{ label: string; sort_order: number }>;
        Relationships: [];
      };
      submission_items: {
        Row: {
          id: string;
          student_id: string;
          unit_id: string;
          section: ItemSection;
          question_id: string | null;
          status: ItemStatus;
          feedback: string | null;
          uploaded_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          overdue_reminder_sent_at: string | null;
          digest_sent_at: string | null;
        };
        Insert: {
          student_id: string;
          unit_id: string;
          section: ItemSection;
          question_id?: string | null;
          status?: ItemStatus;
          feedback?: string | null;
          uploaded_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<{
          status: ItemStatus;
          feedback: string | null;
          uploaded_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          overdue_reminder_sent_at: string | null;
          digest_sent_at: string | null;
        }>;
        Relationships: [];
      };
      iqa_samples: {
        Row: {
          id: string;
          student_id: string;
          unit_id: string;
          done_by: string;
          done_at: string;
        };
        Insert: { student_id: string; unit_id: string; done_by: string };
        Update: Partial<{ done_at: string }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          from_profile_id: string | null;
          to_profile_id: string | null;
          from_email: string;
          to_email: string;
          subject: string;
          body: string;
          kind: NotificationKind;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          from_profile_id?: string | null;
          to_profile_id?: string | null;
          from_email: string;
          to_email: string;
          subject: string;
          body: string;
          kind: NotificationKind;
        };
        Update: Partial<{
          from_profile_id: string | null;
          to_profile_id: string | null;
          from_email: string;
          to_email: string;
          subject: string;
          body: string;
          kind: NotificationKind;
          read_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
