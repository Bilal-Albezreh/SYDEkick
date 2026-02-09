export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_anonymous: boolean;
  is_participating: boolean;
}

export interface Course {
  id: string;
  user_id: string;
  course_code: string;
  course_name: string;
  color: string;
  assessments: Assessment[];
}

export interface Assessment {
  id: string;
  course_id: string;
  name: string;
  weight: number;
  score: number | null; // Null means "Not graded"
  total_marks: number;
  due_date: string; // ISO String
  is_completed: boolean;
  group_tag: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    is_anonymous: boolean;
    avatar_url: string | null;
  };
}

/** Personal task (dashboard/calendar); may be linked to a course via course_id */
export interface PersonalTask {
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
}