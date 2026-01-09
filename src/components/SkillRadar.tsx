"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function SkillRadar({ data }: { data: any[] }) {
  if (!data || data.length < 3) {
      return (
          <div className="h-[300px] flex items-center justify-center text-gray-600 text-xs text-center p-8 border border-dashed border-gray-800 rounded-xl">
             Not enough course data for Radar Analysis. <br/> Need at least 3 subjects.
          </div>
      );
  }

  return (
    <div className="h-[320px] w-full bg-[#191919] p-2 rounded-xl border border-gray-800 relative">
      <h3 className="absolute top-4 left-4 text-gray-400 text-xs font-bold uppercase tracking-widest z-10">
        Skill Analysis
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="You"
            dataKey="userAvg"
            stroke="#10b981"
            strokeWidth={2}
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Radar
            name="Class Avg"
            dataKey="classAvg"
            stroke="#6b7280"
            strokeWidth={1}
            fill="#6b7280"
            fillOpacity={0.1}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}