/**
 * Academic Terms Constants
 * Single source of truth for term labels across the application
 */

export const ACADEMIC_TERMS = [
    '1A', '1B', 
    '2A', '2B', 
    '3A', '3B', 
    '4A', '4B', 
    '5A', '5B', 
    'WT1', 'WT2', 'WT3', 'WT4', 'WT5', 'WT6'
] as const;

export type AcademicTerm = typeof ACADEMIC_TERMS[number];
