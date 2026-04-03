-- Migration 000027: Ensure jobs.benefits is TEXT[] (idempotent)
-- Migration 000012 already converts JSONB -> TEXT[] for fresh databases.
-- This migration is a safety net for existing databases where 000012 was
-- baselined (recorded but not executed), leaving benefits as JSONB.
--
-- The DO block makes it safe to run even when benefits is already TEXT[].
--
-- Edge cases handled:
--   NULL       -> '{}'  (null DB value)
--   'null'     -> '{}'  (JSON null literal)
--   '[]'       -> '{}'  (empty JSON array — the correct empty state)
--   '{}'       -> '{}'  (empty JSON object — written when pq.StringArray(nil)
--                        was inserted; {} is not valid for jsonb_array_elements_text)
--   '[...]'    -> TEXT[] (normal non-empty array, converted element by element)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs'
          AND column_name = 'benefits'
          AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE jobs
            ALTER COLUMN benefits TYPE TEXT[]
            USING CASE
                WHEN benefits IS NULL
                  OR benefits = 'null'::jsonb
                  OR benefits = '[]'::jsonb
                  OR jsonb_typeof(benefits) <> 'array'
                THEN '{}'::text[]
                ELSE ARRAY(SELECT jsonb_array_elements_text(benefits))
            END;

        ALTER TABLE jobs ALTER COLUMN benefits SET DEFAULT '{}';

        RAISE NOTICE 'Migration 000027: jobs.benefits converted from JSONB to TEXT[]';
    ELSE
        RAISE NOTICE 'Migration 000027: jobs.benefits is already TEXT[], no conversion needed';
    END IF;
END;
$$;
