type Assessment = {
  id: string;
  name: string;
  weight: number;
  score: number | null;
  total_marks: number;
  group_tag?: string | null;
};

type GradingRules = Record<string, { drop_lowest?: number; best_of?: number }>;

export function calculateCourseGrade(
  assessments: Assessment[], 
  rules: GradingRules = {}
): { currentGrade: number; totalWeightCompleted: number; droppedIds: string[] } {
  
  let totalWeight = 0;
  let earnedWeight = 0;
  let droppedIds: string[] = [];

  // 1. Group assessments by their tag (e.g. "quiz" -> [Quiz 1, Quiz 2...])
  const groups: Record<string, Assessment[]> = {};
  const ungrouped: Assessment[] = [];

  assessments.forEach(a => {
    if (a.group_tag) {
      if (!groups[a.group_tag]) groups[a.group_tag] = [];
      groups[a.group_tag].push(a);
    } else {
      ungrouped.push(a);
    }
  });

  // 2. Process Groups with Rules
  Object.keys(groups).forEach(tag => {
    let groupItems = groups[tag];
    const rule = rules[tag];

    if (rule && groupItems.length > 0) {
      // Sort by performance (Score % - not raw score)
      // We treat null scores as 0 for sorting purposes if we are strictly calculating drop rules
      groupItems.sort((a, b) => {
        const scoreA = a.score !== null ? (a.score / a.total_marks) : -1;
        const scoreB = b.score !== null ? (b.score / b.total_marks) : -1;
        return scoreA - scoreB; // Ascending order (lowest first)
      });

      // Determine how many to drop
      let dropCount = 0;
      if (rule.drop_lowest) dropCount = rule.drop_lowest;
      if (rule.best_of) dropCount = Math.max(0, groupItems.length - rule.best_of);

      // Mark the lowest ones as "dropped"
      for (let i = 0; i < dropCount; i++) {
        if (i < groupItems.length) {
            droppedIds.push(groupItems[i].id);
        }
      }

      // Keep the rest
      const keptItems = groupItems.slice(dropCount);
      
      // Add to totals
      keptItems.forEach(a => {
        if (a.score !== null) {
          totalWeight += a.weight;
          earnedWeight += (a.score / a.total_marks) * a.weight;
        }
      });
    } else {
      // No rule? Just add them all.
      groupItems.forEach(a => {
        if (a.score !== null) {
          totalWeight += a.weight;
          earnedWeight += (a.score / a.total_marks) * a.weight;
        }
      });
    }
  });

  // 3. Process Ungrouped Items (Midterms, Finals)
  ungrouped.forEach(a => {
    if (a.score !== null) {
      totalWeight += a.weight;
      earnedWeight += (a.score / a.total_marks) * a.weight;
    }
  });

  if (totalWeight === 0) return { currentGrade: 0, totalWeightCompleted: 0, droppedIds };

  // Return formatted data
  return {
    currentGrade: (earnedWeight / totalWeight) * 100,
    totalWeightCompleted: totalWeight,
    droppedIds
  };
}