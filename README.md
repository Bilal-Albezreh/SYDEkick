# Engineering Academic Performance Portal

A high-performance academic management dashboard designed for engineering students to track, simulate, and optimize their term results. This portal focuses on data accuracy, mathematical forecasting, and responsive UI/UX.

## 🚀 Key Engineering Features

### 1. Intelligent Grade Calculator & "What-If" Simulator
* **Weighted Math Engine:** Implements a precise calculation engine that tracks `Earned`, `Attempted`, and `Potential` weights across diverse assessment types.
* **Predictive Simulation:** Features a "What-If" mode using local state management to allow users to forecast final grades without affecting the underlying database.
* **Non-Volatile Sorting:** Utilizes a strict chronological sorting algorithm based on assessment due dates with a name-based tie-breaker to ensure UI stability during data entry.

### 2. "Potential" Grade Visualization
* **Stacked Bar Analytics:** Built with Recharts to visualize the "Hard Ceiling" of a course.
* **Visual Logic:** * 🟩 **Secured:** Verified marks already earned.
    * 🟪 **Projected:** Hypothetical marks from the simulator.
    * ⬜ **Remaining:** Future weight available to be earned.
    * 🟥 **Lost:** Irrecoverable weight from past assessments.

### 3. Automated Performance Safeguards
* **Danger Logic:** Built-in alerts that trigger visual warnings (Red state) when a student's progress exceeds 40% of the course weight while maintaining a sub-50% average.

## 🛠 Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript (Strict Mode)
* **Styling:** Tailwind CSS + Shadcn/UI
* **Database/Backend:** Server Actions for atomic grade updates
* **Charts:** Recharts (SVG-based responsive visualizations)
* **Icons:** Lucide React
