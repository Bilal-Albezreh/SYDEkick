/**
 * Supabase database types (align with DB schema).
 * personal_tasks includes course_id (nullable FK to courses).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      personal_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          is_completed: boolean;
          course_id: string | null;
          type: "personal" | "course_work";
          created_at: string;
          updated_at?: string;
          status?: string;
          grade?: number | null;
          notes?: string | null;
          completed_at?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          is_completed?: boolean;
          course_id?: string | null;
          type: "personal" | "course_work";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          is_completed?: boolean;
          course_id?: string | null;
          type?: "personal" | "course_work";
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          user_id: string | null;
          course_code: string | null;
          course_name: string | null;
          color: string | null;
          grading_rules: Json | null;
          term_id: string | null;
          target_grade: number | null;
          credits: number;
          term: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          course_code?: string | null;
          course_name?: string | null;
          color?: string | null;
          grading_rules?: Json | null;
          term_id?: string | null;
          target_grade?: number | null;
          credits?: number;
          term?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          course_code?: string | null;
          course_name?: string | null;
          color?: string | null;
          grading_rules?: Json | null;
          term_id?: string | null;
          target_grade?: number | null;
          credits?: number;
          term?: string | null;
        };
      };
      schedule_items: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
          start_time: string;
          end_time: string;
          location: string | null;
          type: "LEC" | "TUT" | "LAB" | "SEM";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
          start_time: string;
          end_time: string;
          location?: string | null;
          type: "LEC" | "TUT" | "LAB" | "SEM";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          day?: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
          start_time?: string;
          end_time?: string;
          location?: string | null;
          type?: "LEC" | "TUT" | "LAB" | "SEM";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type PersonalTaskRow = Database["public"]["Tables"]["personal_tasks"]["Row"];
export type PersonalTaskInsert = Database["public"]["Tables"]["personal_tasks"]["Insert"];
export type PersonalTaskUpdate = Database["public"]["Tables"]["personal_tasks"]["Update"];

export type ScheduleItemRow = Database["public"]["Tables"]["schedule_items"]["Row"];
export type ScheduleItemInsert = Database["public"]["Tables"]["schedule_items"]["Insert"];
export type ScheduleItemUpdate = Database["public"]["Tables"]["schedule_items"]["Update"];

// Extended type with course data joined
export interface ScheduleItemWithCourse extends ScheduleItemRow {
  course?: {
    course_code: string;
    course_name: string;
    color: string;
  };
}
