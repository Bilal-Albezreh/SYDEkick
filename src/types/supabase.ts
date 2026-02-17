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
                    full_name: string | null
                    avatar_url: string | null
                    is_approved: boolean
                    is_anonymous: boolean
                    is_participating: boolean
                    weekly_focus_minutes: number
                    xp: number
                    leaderboard_privacy: string | null
                    display_name: string | null
                    program_id: string | null
                    university_id: string | null
                    current_term_label: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    is_approved?: boolean
                    is_anonymous?: boolean
                    is_participating?: boolean
                    weekly_focus_minutes?: number
                    xp?: number
                    leaderboard_privacy?: string | null
                    display_name?: string | null
                    program_id?: string | null
                    university_id?: string | null
                    current_term_label?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    is_approved?: boolean
                    is_anonymous?: boolean
                    is_participating?: boolean
                    weekly_focus_minutes?: number
                    xp?: number
                    leaderboard_privacy?: string | null
                    display_name?: string | null
                    program_id?: string | null
                    university_id?: string | null
                    current_term_label?: string | null
                    created_at?: string
                    updated_at?: string
                }
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
                    squad_id: string | null
                    master_course_id: string | null
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
                    squad_id?: string | null
                    master_course_id?: string | null
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
                    squad_id?: string | null
                    master_course_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            assessments: {
                Row: {
                    id: string
                    user_id: string
                    course_id: string
                    name: string
                    weight: number
                    score: number | null
                    total_marks: number
                    due_date: string
                    is_completed: boolean
                    group_tag: string | null
                    type: string
                    description: string | null
                    master_assessment_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    course_id: string
                    name: string
                    weight: number
                    score?: number | null
                    total_marks: number
                    due_date: string
                    is_completed?: boolean
                    group_tag?: string | null
                    type: string
                    description?: string | null
                    master_assessment_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    course_id?: string
                    name?: string
                    weight?: number
                    score?: number | null
                    total_marks?: number
                    due_date?: string
                    is_completed?: boolean
                    group_tag?: string | null
                    type?: string
                    description?: string | null
                    master_assessment_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
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
            }
            programs: {
                Row: {
                    id: string
                    university_id: string
                    name: string
                    code: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    university_id: string
                    name: string
                    code: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    university_id?: string
                    name?: string
                    code?: string
                    created_at?: string
                }
            }
            master_courses: {
                Row: {
                    id: string
                    squad_id: string | null
                    master_term_id: string | null
                    code: string
                    name: string
                    color: string | null
                    default_credits: number
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    squad_id?: string | null
                    master_term_id?: string | null
                    code: string
                    name: string
                    color?: string | null
                    default_credits?: number
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    squad_id?: string | null
                    master_term_id?: string | null
                    code?: string
                    name?: string
                    color?: string | null
                    default_credits?: number
                    created_by?: string | null
                    created_at?: string
                }
            }
            master_assessments: {
                Row: {
                    id: string
                    master_course_id: string
                    title: string
                    weight: number
                    description: string | null
                    type: string | null
                    total_marks: number | null
                    default_due_offset_days: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    master_course_id: string
                    title: string
                    weight: number
                    description?: string | null
                    type?: string | null
                    total_marks?: number | null
                    default_due_offset_days: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    master_course_id?: string
                    title?: string
                    weight?: number
                    description?: string | null
                    type?: string | null
                    total_marks?: number | null
                    default_due_offset_days?: number
                    created_at?: string
                }
            }
            master_terms: {
                Row: {
                    id: string
                    program_id: string
                    label: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    program_id: string
                    label: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    program_id?: string
                    label?: string
                    created_at?: string
                }
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
            }
            squads: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    program: string | null
                    term: string | null
                    owner_id: string
                    invite_code: string
                    is_official: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    program?: string | null
                    term?: string | null
                    owner_id: string
                    invite_code?: string
                    is_official?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    program?: string | null
                    term?: string | null
                    owner_id?: string
                    invite_code?: string
                    is_official?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            squad_memberships: {
                Row: {
                    id: string
                    squad_id: string
                    user_id: string
                    role: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    squad_id: string
                    user_id: string
                    role: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    squad_id?: string
                    user_id?: string
                    role?: string
                    joined_at?: string
                }
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
            }
            focus_sessions: {
                Row: {
                    id: string
                    user_id: string
                    duration_minutes: number
                    objective_name: string
                    linked_assessment_id: string | null
                    is_completed: boolean
                    started_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    duration_minutes: number
                    objective_name: string
                    linked_assessment_id?: string | null
                    is_completed?: boolean
                    started_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    duration_minutes?: number
                    objective_name?: string
                    linked_assessment_id?: string | null
                    is_completed?: boolean
                    started_at?: string
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
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
            }
            preferences: {
                Row: {
                    id: string
                    user_id: string
                    theme: string | null
                    notifications_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    theme?: string | null
                    notifications_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    theme?: string | null
                    notifications_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            user_task_states: {
                Row: {
                    id: string
                    user_id: string
                    task_id: string
                    state: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    task_id: string
                    state: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    task_id?: string
                    state?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            master_calendar_view: {
                Row: {
                    id: string
                    user_id: string
                    event_date: string
                    event_type: string
                    event_title: string
                    course_code: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    event_date: string
                    event_type: string
                    event_title: string
                    course_code?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    event_date?: string
                    event_type?: string
                    event_title?: string
                    course_code?: string | null
                    created_at?: string
                }
            }
            interviews: {
                Row: {
                    id: string
                    user_id: string
                    role_title: string
                    company_name: string
                    interview_date: string
                    type: string
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    role_title: string
                    company_name: string
                    interview_date: string
                    type: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    role_title?: string
                    company_name?: string
                    interview_date?: string
                    type?: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            universities: {
                Row: {
                    id: string
                    name: string
                    code: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    created_at?: string
                }
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
    }
}
