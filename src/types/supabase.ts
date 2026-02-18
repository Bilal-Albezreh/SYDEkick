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
      assessments: {
        Row: {
          id: string
          course_id: string
          user_id: string
          name: string
          weight: number
          score: number | null
          total_marks: number | null
          due_date: string | null
          is_completed: boolean | null
          group_tag: string | null
          created_at: string | null
          master_assessment_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          name: string
          weight: number
          score?: number | null
          total_marks?: number | null
          due_date?: string | null
          is_completed?: boolean | null
          group_tag?: string | null
          created_at?: string | null
          master_assessment_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          name?: string
          weight?: number
          score?: number | null
          total_marks?: number | null
          due_date?: string | null
          is_completed?: boolean | null
          group_tag?: string | null
          created_at?: string | null
          master_assessment_id?: string | null
          type?: string
          updated_at?: string | null
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
      calendar_events: {
        Row: {
          id: string
          user_id: string
          squad_id: string | null
          title: string
          description: string | null
          start_time: string
          end_time: string
          type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          squad_id?: string | null
          title: string
          description?: string | null
          start_time: string
          end_time: string
          type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          squad_id?: string | null
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          type?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      career_stats: {
        Row: {
          user_id: string
          rejected_count: number | null
          ghosted_count: number | null
          interview_count: number | null
          offer_count: number | null
          accepted_count: number | null
          pending_count: number | null
          updated_at: string | null
          no_offer_count: number | null
          oa_count: number | null
        }
        Insert: {
          user_id: string
          rejected_count?: number | null
          ghosted_count?: number | null
          interview_count?: number | null
          offer_count?: number | null
          accepted_count?: number | null
          pending_count?: number | null
          updated_at?: string | null
          no_offer_count?: number | null
          oa_count?: number | null
        }
        Update: {
          user_id?: string
          rejected_count?: number | null
          ghosted_count?: number | null
          interview_count?: number | null
          offer_count?: number | null
          accepted_count?: number | null
          pending_count?: number | null
          updated_at?: string | null
          no_offer_count?: number | null
          oa_count?: number | null
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: string | null
          completed_modules: Json | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: string | null
          completed_modules?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: string | null
          completed_modules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          user_id: string
          course_code: string
          course_name: string
          color: string
          grading_rules: Json | null
          created_at: string | null
          term_id: string | null
          target_grade: number | null
          squad_id: string | null
          master_course_id: string | null
          credits: number
          term: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_code: string
          course_name: string
          color: string
          grading_rules?: Json | null
          created_at?: string | null
          term_id?: string | null
          target_grade?: number | null
          squad_id?: string | null
          master_course_id?: string | null
          credits: number
          term?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_code?: string
          course_name?: string
          color?: string
          grading_rules?: Json | null
          created_at?: string | null
          term_id?: string | null
          target_grade?: number | null
          squad_id?: string | null
          master_course_id?: string | null
          credits?: number
          term?: string | null
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          duration_minutes: number
          objective_name: string | null
          linked_assessment_id: string | null
          is_completed: boolean | null
          started_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duration_minutes: number
          objective_name?: string | null
          linked_assessment_id?: string | null
          is_completed?: boolean | null
          started_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duration_minutes?: number
          objective_name?: string | null
          linked_assessment_id?: string | null
          is_completed?: boolean | null
          started_at?: string
          created_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          user_id: string | null
          company_name: string
          role_title: string
          status: string | null
          interview_date: string | null
          notes: string | null
          created_at: string | null
          type: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name: string
          role_title: string
          status?: string | null
          interview_date?: string | null
          notes?: string | null
          created_at?: string | null
          type?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string
          role_title?: string
          status?: string | null
          interview_date?: string | null
          notes?: string | null
          created_at?: string | null
          type?: string | null
        }
        Relationships: []
      }
      master_assessments: {
        Row: {
          id: string
          master_course_id: string
          title: string
          weight: number
          default_due_offset_days: number | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          master_course_id: string
          title: string
          weight: number
          default_due_offset_days?: number | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          master_course_id?: string
          title?: string
          weight?: number
          default_due_offset_days?: number | null
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      master_calendar_view: {
        Row: {
          template_id: string | null
          user_id: string | null
          squad_id: string | null
          squad_name: string | null
          display_title: string | null
          display_date: string | null
          type: string | null
          category: string | null
          description: string | null
          status: string | null
          grade: number | null
          is_personal: boolean | null
          is_archived: boolean | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      master_courses: {
        Row: {
          id: string
          squad_id: string
          master_term_id: string | null
          code: string
          name: string
          color: string | null
          default_credits: number | null
          description: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          squad_id: string
          master_term_id?: string | null
          code: string
          name: string
          color?: string | null
          default_credits?: number | null
          description?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          squad_id?: string
          master_term_id?: string | null
          code?: string
          name?: string
          color?: string | null
          default_credits?: number | null
          description?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      master_terms: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
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
          weekly_focus_minutes: number
          xp: number
          leaderboard_privacy: string | null
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
          leaderboard_privacy?: string | null
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
          leaderboard_privacy?: string | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
      squads: {
        Row: {
          id: string
          name: string
          owner_id: string
          invite_code: string
          description: string | null
          program: string | null
          term: string | null
          is_official: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          invite_code?: string
          description?: string | null
          program?: string | null
          term?: string | null
          is_official?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          invite_code?: string
          description?: string | null
          program?: string | null
          term?: string | null
          is_official?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_memberships: {
        Row: {
          id: string
          user_id: string
          squad_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          squad_id: string
          role: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          squad_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: []
      }
      squad_templates: {
        Row: {
          id: string
          squad_id: string
          title: string
          description: string | null
          due_date: string | null
          weight: number | null
          type: string
          category: string | null
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          title: string
          description?: string | null
          due_date?: string | null
          weight?: number | null
          type: string
          category?: string | null
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          weight?: number | null
          type?: string
          category?: string | null
          is_archived?: boolean
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
          squad_id?: string
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
          template_id: string
          status: string | null
          custom_title: string | null
          custom_date: string | null
          custom_weight: number | null
          grade: number | null
          notes: string | null
          completed_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          status?: string | null
          custom_title?: string | null
          custom_date?: string | null
          custom_weight?: number | null
          grade?: number | null
          notes?: string | null
          completed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          status?: string | null
          custom_title?: string | null
          custom_date?: string | null
          custom_weight?: number | null
          grade?: number | null
          notes?: string | null
          completed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          id: string
          user_id: string
          course_id: string
          day: string
          start_time: string
          end_time: string
          location: string | null
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          day: string
          start_time: string
          end_time: string
          location?: string | null
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          day?: string
          start_time?: string
          end_time?: string
          location?: string | null
          type?: string
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
      personal_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          is_completed: boolean
          course_id: string | null
          type: string
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
          type: string
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
          type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_my_squad_ids_secure: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
