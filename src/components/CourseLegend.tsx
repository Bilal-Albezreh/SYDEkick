"use client";

interface Course {
  code: string;
  name: string;
  color: string;
}

export default function CourseLegend({ courses }: { courses: Course[] }) {
  return (
    <div className="h-full p-4 border-l border-gray-800 animate-in fade-in slide-in-from-right-4 duration-700">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">
        Course Legend
      </h3>
      
      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.code} className="group flex items-start gap-3 transition-opacity hover:opacity-80">
            {/* Color Dot */}
            <div 
              className="w-3 h-3 rounded-full mt-1.5 shadow-sm shrink-0" 
              style={{ backgroundColor: course.color, boxShadow: `0 0 8px ${course.color}40` }}
            />
            
            {/* Text Info */}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                {course.code}
              </span>
              <span className="text-xs text-gray-500 font-medium leading-tight">
                {course.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Optional Decoration */}
      <div className="mt-8 pt-8 border-t border-gray-800/50">
        <p className="text-[10px] text-gray-600 italic">
          Winter 2026 Term <br/>
          Systems Design Engineering
        </p>
      </div>
    </div>
  );
}