export type Assessment = {
  title: string;
  date: string; // ISO string "YYYY-MM-DD"
  weight: number;
  type: string;
  notes?: string;
};

export type Course = {
  course_code: string;
  course_name: string;
  color: string;
  grading_type: "Percentage" | "Pass/Fail";
  assessments: Assessment[];
};