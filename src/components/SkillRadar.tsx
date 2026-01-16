"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export default function SkillRadar({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-[300px] flex flex-col">
      <div className="mb-2">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Skill Velocity</h3>
        <div className="flex gap-4 mt-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /> You
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" /> Cohort Avg
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="You"
              dataKey="A"
              stroke="#22c55e"
              strokeWidth={2}
              fill="#22c55e"
              fillOpacity={0.3}
            />
            <Radar
              name="Cohort"
              dataKey="B"
              stroke="#6b7280"
              strokeWidth={2}
              fill="#6b7280"
              fillOpacity={0.1}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
              itemStyle={{ fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}