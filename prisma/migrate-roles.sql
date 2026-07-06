-- ============================================================
-- Role simplification migration
-- Run this in Supabase SQL Editor BEFORE deploying the code.
-- Execute each block separately (copy-paste one at a time).
-- ============================================================

-- Block 1: Add isProgramChair column + mark existing chairs
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isProgramChair" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET "isProgramChair" = TRUE
WHERE roles::text LIKE '%PROGRAM_CHAIR%';

-- Block 2: Change workflow_steps.role from enum to text
ALTER TABLE workflow_steps
ALTER COLUMN role TYPE TEXT USING role::text;

-- Block 3: Add PROFESSOR to the Role enum
--   (commit Block 1+2 first, then run this)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROFESSOR';

-- Block 4: Migrate faculty users → PROFESSOR
--   (commit Block 3 first, then run this)
UPDATE users
SET roles = ARRAY(
  SELECT DISTINCT
    CASE WHEN r::text IN (
      'ADVISOR', 'CO_ADVISOR', 'PROGRAM_CHAIR',
      'HEAD_EXAM_COMMITTEE', 'EXAM_COMMITTEE', 'INVITED_EXAM_COMMITTEE',
      'DEPT_STAFF', 'FACULTY_DEAN', 'GRADUATE_SCHOOL'
    )
    THEN 'PROFESSOR'::text
    ELSE r::text
    END
  FROM unnest(roles) r
)::"Role"[]
WHERE EXISTS (
  SELECT 1 FROM unnest(roles) r
  WHERE r::text IN (
    'ADVISOR', 'CO_ADVISOR', 'PROGRAM_CHAIR',
    'HEAD_EXAM_COMMITTEE', 'EXAM_COMMITTEE', 'INVITED_EXAM_COMMITTEE',
    'DEPT_STAFF', 'FACULTY_DEAN', 'GRADUATE_SCHOOL'
  )
);

-- Block 5: Replace Role enum with 4-value version
--   (commit Block 4 first, then run this entire block at once)
CREATE TYPE "Role_v2" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PROFESSOR');

ALTER TABLE users
ALTER COLUMN roles TYPE "Role_v2"[]
USING roles::text[]::"Role_v2"[];

DROP TYPE "Role";
ALTER TYPE "Role_v2" RENAME TO "Role";
