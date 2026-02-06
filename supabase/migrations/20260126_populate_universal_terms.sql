-- =============================================
-- Universal Terms Population
-- Migration: 20260126_populate_universal_terms
-- =============================================
-- Populates master_terms with standard engineering terms (1A-4B)
-- for ALL programs in the system

DO $$
DECLARE
    term_labels TEXT[] := ARRAY['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
BEGIN
    -- Use CROSS JOIN to generate all combinations of programs × term labels
    -- ON CONFLICT DO NOTHING ensures we don't duplicate existing SYDE terms
    INSERT INTO "public"."master_terms" ("program_id", "label")
    SELECT 
        p.id AS program_id,
        t.label
    FROM 
        "public"."programs" p
    CROSS JOIN 
        unnest(term_labels) AS t(label)
    ON CONFLICT ("program_id", "label") DO NOTHING;
    
    RAISE NOTICE 'Universal terms populated for all programs';
END $$;

-- Verify the population
DO $$
DECLARE
    program_count INT;
    term_count INT;
BEGIN
    SELECT COUNT(*) INTO program_count FROM "public"."programs";
    SELECT COUNT(*) INTO term_count FROM "public"."master_terms";
    
    RAISE NOTICE 'Programs: %, Master Terms: %', program_count, term_count;
END $$;

COMMENT ON SCHEMA public IS 'Phase 2: Universal terms populated for all programs (1A-4B).';
