BEGIN;

CREATE OR REPLACE FUNCTION _jsonb_arr_to_text_arr(val JSONB)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE AS $$
BEGIN
    IF val IS NULL OR jsonb_typeof(val) != 'array' THEN
        RETURN '{}'::TEXT[];
    END IF;
    RETURN ARRAY(SELECT jsonb_array_elements_text(val));
END;
$$;

DROP INDEX IF EXISTS idx_workers_availability;

-- Remove old JSONB defaults before type conversion
ALTER TABLE workers ALTER COLUMN selected_roles DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN venue_preferences DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN work_types DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN availability DROP DEFAULT;

ALTER TABLE workers
    ALTER COLUMN selected_roles TYPE TEXT[] USING _jsonb_arr_to_text_arr(selected_roles);

ALTER TABLE workers
    ALTER COLUMN venue_preferences TYPE TEXT[] USING _jsonb_arr_to_text_arr(venue_preferences);

ALTER TABLE workers
    ALTER COLUMN work_types TYPE TEXT[] USING _jsonb_arr_to_text_arr(work_types);

ALTER TABLE workers
    ALTER COLUMN availability TYPE TEXT[] USING _jsonb_arr_to_text_arr(availability);

-- Set new TEXT[] defaults after type conversion
ALTER TABLE workers ALTER COLUMN selected_roles SET DEFAULT '{}'::TEXT[];
ALTER TABLE workers ALTER COLUMN venue_preferences SET DEFAULT '{}'::TEXT[];
ALTER TABLE workers ALTER COLUMN work_types SET DEFAULT '{}'::TEXT[];
ALTER TABLE workers ALTER COLUMN availability SET DEFAULT '{}'::TEXT[];

DROP FUNCTION _jsonb_arr_to_text_arr(JSONB);

CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers USING GIN(availability);

COMMIT;