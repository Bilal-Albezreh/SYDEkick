"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { addWeeks } from 'date-fns';

export default function PerformanceChart({ rawData, currentUserId }: { rawData: any[], currentUserId: string }) {
  
  // Logic to process raw data into weekly cumulative averages
  const processTimeline = () => {
    if (!rawData || rawData.length === 0) return [];

    const startDate = new Date(2026, 0, 5); // Jan 5, 2026
    const weeksMap = new Map();

    // 1. Initialize 12 weeks of buckets
    for (let i = 0; i < 12; i++) {
        const weekStart = addWeeks(startDate, i);
        const label = `Week ${i + 1}`;
        weeksMap.set(label, { 
            name: label, 
            classTotalScore: 0, classTotalWeight: 0, 
            userTotalScore: 0, userTotalWeight: 0,
            date: weekStart 
        });
    }

    // 2. Sort assessments into weeks
    rawData.forEach(item => {
        const date = new Date(item.due_date);
        
        // Find which week this assessment belongs to
        // (Difference in milliseconds / milliseconds in a week)
        const diffTime = date.getTime() - startDate.getTime();
        const weekDiff = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
        
        // Ensure we are within the 12-week range
        if (weekDiff >= 0 && weekDiff < 12) {
            const weekLabel = `Week ${weekDiff + 1}`;

            if (weeksMap.has(weekLabel)) {
                const week = weeksMap.get(weekLabel);
                
                // A. Add to Class Totals (Everyone)
                week.classTotalScore += (item.score / 100) * item.weight;
                week.classTotalWeight += item.weight;

                // B. Add to User Totals (Only if it matches current user)
                // FIX: Check item.courses.user_id because of the join
                if (item.courses && item.courses.user_id === currentUserId) {
                    week.userTotalScore += (item.score / 100) * item.weight;
                    week.userTotalWeight += item.weight;
                }
            }
        }
    });

    // 3. Calculate Cumulative Averages (Running Totals)
    let runningClassScore = 0;
    let runningClassWeight = 0;
    let runningUserScore = 0;
    let runningUserWeight = 0;

    return Array.from(weeksMap.values()).map((week: any) => {
        // Accumulate totals week over week
        runningClassScore += week.classTotalScore;
        runningClassWeight += week.classTotalWeight;
        
        runningUserScore += week.userTotalScore;
        runningUserWeight += week.userTotalWeight;

        return {
            name: week.name,
            // Calculate weighted average: (Total Weighted Score / Total Weight) * 100
            classAvg: runningClassWeight > 0 ? Math.round((runningClassScore / runningClassWeight) * 100) : null,
            userAvg: runningUserWeight > 0 ? Math.round((runningUserScore / runningUserWeight) * 100) : null,
        };
    });
  };

  const chartData = processTimeline();

  return (
    <div className="h-[350px] w-full bg-[#191919] p-4 rounded-xl border border-gray-800">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
        Performance Velocity
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke="#666" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          
          <YAxis 
            stroke="#666" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false} 
            domain={[60, 100]} // Y-Axis range from 60% to 100%
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#252525', border: 'none', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ fontSize: '12px' }}
            formatter={(value: any) => [`${value}%`]}
          />
          
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          {/* USER LINE (Green, Thick) */}
          <Line 
            type="monotone" 
            dataKey="userAvg" 
            name="You" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981' }} 
            activeDot={{ r: 6 }} 
            connectNulls
          />
          
          {/* CLASS LINE (Grey, Dashed) */}
          <Line 
            type="monotone" 
            dataKey="classAvg" 
            name="Class Avg" 
            stroke="#4b5563" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}