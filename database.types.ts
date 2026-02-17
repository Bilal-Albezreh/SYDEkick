export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          university_id: string | null
          program_id: string | null
          current_term_label: string | null
          is_approved: boolean
          is_anonymous: boolean
          is_participating: boolean
          // NEW COLUMNS
          weekly_focus_minutes: number
          xp: number
          leaderboard_privacy: "public" | "private" | "masked"
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          program_id?: string | null
          current_term_label?: string | null
          is_approved?: boolean
          is_anonymous?: boolean
          is_participating?: boolean
          weekly_focus_minutes?: number
          xp?: number
          leaderboard_privacy?: "public" | "private" | "masked"
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          program_id?: string | null
          current_term_label?: string | null
          is_approved?: boolean
          is_anonymous?: boolean
          is_participating?: boolean
          weekly_focus_minutes?: number
          xp?: number
          leaderboard_privacy?: "public" | "private" | "masked"
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_program_id_fkey"
            columns: ["program_id"]
            referencedRelation: "programs"
            referencedColumns: ["id"]
          }
        ]
      }
      terms: {
        Row: {
          id: string
          user_id: string
          label: string
          season: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          season: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          season?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          user_id: string
          term_id: string | null
          course_code: string
          course_name: string
          color: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          term_id?: string | null
          course_code: string
          course_name: string
          color: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          term_id?: string | null
          course_code?: string
          course_name?: string
          color?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_term_id_fkey"
            columns: ["term_id"]
            referencedRelation: "terms"
            referencedColumns: ["id"]
          }
        ]
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          name: string
          type: string
          weight: number
          total_marks: number
          due_date: string | null
          score: number | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          name: string
          type: string
          weight: number
          total_marks: number
          due_date?: string | null
          score?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          name?: string
          type?: string
          weight?: number
          total_marks?: number
          due_date?: string | null
          score?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }

      // --- ADDED TABLES ---

      focus_sessions: {
        Row: {
          id: string
          user_id: string
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duration: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duration?: number
          created_at?: string
        }
        Relationships: []
      }

      messages: {
        Row: {
          id: string
          content: string
          user_id: string
          squad_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          squad_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          squad_id?: string
          created_at?: string
        }
        Relationships: []
      }

      squads: {
        Row: {
          id: string
          name: string
          owner_id: string
          invite_code: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          invite_code?: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          invite_code?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }

      squad_memberships: {
        Row: {
          user_id: string
          squad_id: string
          role: "leader" | "member"
          joined_at: string
        }
        Insert: {
          user_id: string
          squad_id: string
          role?: "leader" | "member"
          joined_at?: string
        }
        Update: {
          user_id?: string
          squad_id?: string
          role?: "leader" | "member"
          joined_at?: string
        }
        Relationships: []
      }

      squad_templates: {
        Row: {
          id: string
          squad_id: string
          master_course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          master_course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          master_course_id?: string
          created_at?: string
        }
        Relationships: []
      }

      waitlist: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }

      preferences: {
        Row: {
          id: string
          user_id: string
          active_term_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          active_term_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          active_term_id?: string | null
        }
        Relationships: []
      }

      user_task_states: {
        Row: {
          id: string
          user_id: string
          task_id: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          status?: string
        }
        Relationships: []
      }

      master_calendar_view: {
        Row: {
          id: string
          user_id: string
          title: string
          due_date: string | null
          course_id: string
          type: string
          weight: number
        }
        Relationships: []
      }

      master_courses: {
        Row: {
          id: string
          code: string
          name: string
          title: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          title?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          title?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      master_assessments: {
        Row: {
          id: string
          master_course_id: string
          title: string
          weight: number
          default_due_offset_days: number
          type: string
          total_marks: number
          created_at: string
        }
        Insert: {
          id?: string
          master_course_id: string
          title: string
          weight: number
          default_due_offset_days: number
          type?: string
          total_marks?: number
          created_at?: string
        }
        Update: {
          id?: string
          master_course_id?: string
          title?: string
          weight?: number
          default_due_offset_days?: number
          type?: string
          total_marks?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_assessments_master_course_id_fkey"
            columns: ["master_course_id"]
            referencedRelation: "master_courses"
            referencedColumns: ["id"]
          }
        ]
      }
      universities: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          name: string
          university_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          university_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          university_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            referencedRelation: "universities"
            referencedColumns: ["id"]
          }
        ]
      }
      personal_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          is_completed: boolean
          course_id: string | null
          type: "personal" | "course_work"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean
          course_id?: string | null
          type: "personal" | "course_work"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean
          course_id?: string | null
          type?: "personal" | "course_work"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_tasks_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      schedule_items: {
        Row: {
          id: string
          user_id: string
          course_id: string
          day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
          start_time: string
          end_time: string
          location: string | null
          type: "LEC" | "TUT" | "LAB" | "SEM"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
          start_time: string
          end_time: string
          location?: string | null
          type: "LEC" | "TUT" | "LAB" | "SEM"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          day?: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
          start_time?: string
          end_time?: string
          location?: string | null
          type?: "LEC" | "TUT" | "LAB" | "SEM"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      career_stats: {
        Row: {
          user_id: string
          pending_count: number
          oa_count: number
          interview_count: number
          offer_count: number
          no_offer_count: number
          rejected_count: number
          ghosted_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          pending_count?: number
          oa_count?: number
          interview_count?: number
          offer_count?: number
          no_offer_count?: number
          rejected_count?: number
          ghosted_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          pending_count?: number
          oa_count?: number
          interview_count?: number
          offer_count?: number
          no_offer_count?: number
          rejected_count?: number
          ghosted_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          role_title: string | null
          interview_date: string | null
          status: string | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          role_title?: string | null
          interview_date?: string | null
          status?: string | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          role_title?: string | null
          interview_date?: string | null
          status?: string | null
          type?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for common queries
export type PersonalTaskRow = Database["public"]["Tables"]["personal_tasks"]["Row"];
export type PersonalTaskInsert = Database["public"]["Tables"]["personal_tasks"]["Insert"];
export type PersonalTaskUpdate = Database["public"]["Tables"]["personal_tasks"]["Update"];

export type ScheduleItemRow = Database["public"]["Tables"]["schedule_items"]["Row"];
export type ScheduleItemInsert = Database["public"]["Tables"]["schedule_items"]["Insert"];
export type ScheduleItemUpdate = Database["public"]["Tables"]["schedule_items"]["Update"];

export type AssessmentRow = Database["public"]["Tables"]["assessments"]["Row"];
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

export interface ScheduleItemWithCourse extends ScheduleItemRow {
  course?: {
    course_code: string;
    course_name: string;
    color: string;
  };
}
