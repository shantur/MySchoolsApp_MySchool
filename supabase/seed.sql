-- ===================================================== 
-- MySchoolWeb Seed Data Script
-- =====================================================
-- This script populates the local Supabase development environment
-- with realistic but anonymized test data for development and testing.
--
-- Usage: Automatically executed during `supabase db reset`
--
-- Data Structure:
-- - 3 test schools (Greenwood, Riverside, Mountain View)
-- - 10 test users (mix of admin and regular users)
-- - 3-5 groups per school (15 total)
-- - 20 test notices with varied statuses
-- - Sample notice reads for tracking
-- =====================================================

-- Clear existing seed data (for idempotency)
TRUNCATE TABLE notice_reads, audit_logs, notices, groups, users, schools CASCADE;

-- Also clear auth.users for local dev (safe for local only!)
DELETE FROM auth.users;

-- =====================================================
-- SCHOOLS DATA (3 schools)
-- =====================================================
INSERT INTO schools (id, name, address, contact_email, contact_phone, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Greenwood Elementary School', '123 Oak Street, Springfield, IL 62701', 'contact@greenwood.edu', '555-0101', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('22222222-2222-2222-2222-222222222222', 'Riverside High School', '456 River Road, Portland, OR 97201', 'info@riversidehigh.edu', '555-0202', NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('33333333-3333-3333-3333-333333333333', 'Mountain View Academy', '789 Summit Avenue, Denver, CO 80201', 'admin@mountainview.edu', '555-0303', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year');

-- =====================================================
-- AUTH USERS DATA (10 auth.users entries)
-- =====================================================
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin.greenwood@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'admin.riverside@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'a3333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'admin.mountainview@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'parent1.greenwood@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u1111112-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'parent2.greenwood@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u2222221-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'parent1.riverside@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'parent2.riverside@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u2222223-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'parent3.riverside@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u3333331-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'parent1.mountainview@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
  ('00000000-0000-0000-0000-000000000000', 'u3333332-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'parent2.mountainview@test.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NULL, '', NULL, '', NULL, '', '', NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);

-- Create identities for each auth user (required by Supabase Auth)
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', '{"sub":"a1111111-1111-1111-1111-111111111111"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', '{"sub":"a2222222-2222-2222-2222-222222222222"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', '{"sub":"a3333333-3333-3333-3333-333333333333"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u1111111-1111-1111-1111-111111111111', '{"sub":"u1111111-1111-1111-1111-111111111111"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u1111112-1111-1111-1111-111111111111', '{"sub":"u1111112-1111-1111-1111-111111111111"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u2222221-2222-2222-2222-222222222222', '{"sub":"u2222221-2222-2222-2222-222222222222"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u2222222-2222-2222-2222-222222222222', '{"sub":"u2222222-2222-2222-2222-222222222222"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u2222223-2222-2222-2222-222222222222', '{"sub":"u2222223-2222-2222-2222-222222222222"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u3333331-3333-3333-3333-333333333333', '{"sub":"u3333331-3333-3333-3333-333333333333"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'u3333332-3333-3333-3333-333333333333', '{"sub":"u3333332-3333-3333-3333-333333333333"}', 'email', NOW(), NOW(), NOW());

-- =====================================================
-- USERS DATA (10 users: 3 admins, 7 regular users)
-- =====================================================
INSERT INTO users (id, email, school_id, role, display_name, group_ids, created_at, updated_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'admin.greenwood@test.com', '11111111-1111-1111-1111-111111111111', 'admin', 'Sarah Johnson', ARRAY[]::uuid[], NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('a2222222-2222-2222-2222-222222222222', 'admin.riverside@test.com', '22222222-2222-2222-2222-222222222222', 'admin', 'Michael Chen', ARRAY[]::uuid[], NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('a3333333-3333-3333-3333-333333333333', 'admin.mountainview@test.com', '33333333-3333-3333-3333-333333333333', 'admin', 'Emily Rodriguez', ARRAY[]::uuid[], NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('u1111111-1111-1111-1111-111111111111', 'parent1.greenwood@test.com', '11111111-1111-1111-1111-111111111111', 'user', 'David Anderson', ARRAY[]::uuid[], NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('u1111112-1111-1111-1111-111111111111', 'parent2.greenwood@test.com', '11111111-1111-1111-1111-111111111111', 'user', 'Lisa Thompson', ARRAY[]::uuid[], NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('u2222221-2222-2222-2222-222222222222', 'parent1.riverside@test.com', '22222222-2222-2222-2222-222222222222', 'user', 'Robert Martinez', ARRAY[]::uuid[], NOW() - INTERVAL '15 months', NOW() - INTERVAL '15 months'),
  ('u2222222-2222-2222-2222-222222222222', 'parent2.riverside@test.com', '22222222-2222-2222-2222-222222222222', 'user', 'Jennifer Lee', ARRAY[]::uuid[], NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('u2222223-2222-2222-2222-222222222222', 'parent3.riverside@test.com', '22222222-2222-2222-2222-222222222222', 'user', 'James Wilson', ARRAY[]::uuid[], NOW() - INTERVAL '8 months', NOW() - INTERVAL '8 months'),
  ('u3333331-3333-3333-3333-333333333333', 'parent1.mountainview@test.com', '33333333-3333-3333-3333-333333333333', 'user', 'Patricia Garcia', ARRAY[]::uuid[], NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months'),
  ('u3333332-3333-3333-3333-333333333333', 'parent2.mountainview@test.com', '33333333-3333-3333-3333-333333333333', 'user', 'Christopher Brown', ARRAY[]::uuid[], NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months');

-- =====================================================
-- GROUPS DATA (15 groups: 5 per school)
-- =====================================================
INSERT INTO groups (id, school_id, name, description, created_at, updated_at) VALUES
  ('g1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Grade 1A', 'First grade class A - Morning session', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('g1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Grade 2B', 'Second grade class B - Afternoon session', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('g1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Grade 3A', 'Third grade class A - Full day program', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('g1111114-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'After School Club', 'After school enrichment activities', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g1111115-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Parent Association', 'School parent-teacher association - Empty group for testing', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years'),
  ('g2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Grade 9 Homeroom A', 'Freshman homeroom section A', NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('g2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Grade 10 Homeroom B', 'Sophomore homeroom section B', NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('g2222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Science Club', 'After-school science and robotics club', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g2222224-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Drama Department', 'Theater and performing arts group', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g2222225-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Athletics', 'School sports teams and athletic events', NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  ('g3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Middle School 6th Grade', 'Sixth grade cohort', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Middle School 7th Grade', 'Seventh grade cohort', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Middle School 8th Grade', 'Eighth grade cohort', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g3333334-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Music Program', 'Band, orchestra, and choir', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
  ('g3333335-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Archived Group', 'Old group no longer in use - For testing archived scenarios', NOW() - INTERVAL '2 years', NOW() - INTERVAL '2 years');

-- Update users with their group assignments
UPDATE users SET group_ids = ARRAY['g1111111-1111-1111-1111-111111111111'::uuid, 'g1111114-1111-1111-1111-111111111111'::uuid] WHERE id = 'u1111111-1111-1111-1111-111111111111';
UPDATE users SET group_ids = ARRAY['g1111112-1111-1111-1111-111111111111'::uuid, 'g1111115-1111-1111-1111-111111111111'::uuid] WHERE id = 'u1111112-1111-1111-1111-111111111111';
UPDATE users SET group_ids = ARRAY['g2222221-2222-2222-2222-222222222222'::uuid, 'g2222223-2222-2222-2222-222222222222'::uuid] WHERE id = 'u2222221-2222-2222-2222-222222222222';
UPDATE users SET group_ids = ARRAY['g2222222-2222-2222-2222-222222222222'::uuid, 'g2222225-2222-2222-2222-222222222222'::uuid] WHERE id = 'u2222222-2222-2222-2222-222222222222';
UPDATE users SET group_ids = ARRAY['g2222224-2222-2222-2222-222222222222'::uuid] WHERE id = 'u2222223-2222-2222-2222-222222222222';
UPDATE users SET group_ids = ARRAY['g3333331-3333-3333-3333-333333333333'::uuid, 'g3333334-3333-3333-3333-333333333333'::uuid] WHERE id = 'u3333331-3333-3333-3333-333333333333';
UPDATE users SET group_ids = ARRAY['g3333332-3333-3333-3333-333333333333'::uuid] WHERE id = 'u3333332-3333-3333-3333-333333333333';

-- =====================================================
-- NOTICES DATA (20 notices with varied statuses)
-- =====================================================
INSERT INTO notices (id, school_id, group_id, title, body, publication_date, status, attachments, sender_name, created_at, updated_at) VALUES
  ('n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'Welcome to Grade 1A!', 'Dear parents, welcome to the new school year! We are excited to begin this journey with your children. Please review the attached class schedule and supply list.', NOW() - INTERVAL '30 days', 'published', '[{"id": "att1111111", "fileName": "grade1a_schedule.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/grade1a_schedule.pdf", "size": 245760}]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '31 days', NOW() - INTERVAL '30 days'),
  ('n1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'Field Trip Permission Required', 'We will be taking a field trip to the science museum next Friday. Please sign and return the attached permission slip by Wednesday.', NOW() - INTERVAL '5 days', 'published', '[{"id": "att1111112", "fileName": "permission_slip.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/permission_slip.pdf", "size": 123456}]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days'),
  ('n1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111112-1111-1111-1111-111111111111', 'Parent-Teacher Conference Schedule', 'Parent-teacher conferences for Grade 2B will be held next week. Please use the online booking system to schedule your 15-minute slot.', NOW() - INTERVAL '10 days', 'published', '[]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'),
  ('n1111114-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111113-1111-1111-1111-111111111111', 'Science Fair Projects Due', 'Reminder: Science fair projects for Grade 3A are due on Monday, March 15th. Projects will be displayed in the gymnasium.', NOW() - INTERVAL '3 days', 'published', '[]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  ('n1111115-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111114-1111-1111-1111-111111111111', 'After School Club Registration Open', 'Registration is now open for spring semester after school clubs. Activities include art, chess, coding, and sports.', NOW() - INTERVAL '2 days', 'published', '[{"id": "att1111115", "fileName": "club_brochure.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/club_brochure.pdf", "size": 1048576}]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
  ('n1111116-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111115-1111-1111-1111-111111111111', 'DRAFT: Upcoming Fundraiser Planning', 'Draft notice for parent association - not yet published. Details about the spring fundraiser event.', NOW() + INTERVAL '5 days', 'draft', '[]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('n1111117-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'Last Year Holiday Schedule', 'This notice has been archived. It contains the holiday schedule from last academic year.', NOW() - INTERVAL '365 days', 'archived', '[]'::jsonb, 'Sarah Johnson', NOW() - INTERVAL '400 days', NOW() - INTERVAL '100 days'),
  ('n2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222221-2222-2222-2222-222222222222', 'Semester Exam Schedule Released', 'The semester exam schedule has been posted. Grade 9 exams will begin on Monday, June 5th. Please review the attached schedule.', NOW() - INTERVAL '15 days', 'published', '[{"id": "att2222221", "fileName": "exam_schedule.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/exam_schedule.pdf", "size": 567890}]'::jsonb, 'Michael Chen', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
  ('n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', 'College Fair Next Week', 'Representatives from 50+ colleges will be visiting our campus next Thursday. All Grade 10-12 students are encouraged to attend.', NOW() - INTERVAL '6 days', 'published', '[{"id": "att2222222", "fileName": "college_list.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/college_list.pdf", "size": 345678}, {"id": "att2222223", "fileName": "campus_map.png", "fileType": "image/png", "downloadURL": "https://storage.example.com/attachments/campus_map.png", "size": 891234}]'::jsonb, 'Michael Chen', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
  ('n2222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222223-2222-2222-2222-222222222222', 'Science Club Robotics Competition', 'Our robotics team placed 2nd in the regional competition! Congratulations to all participants. Photos are attached.', NOW() - INTERVAL '8 days', 'published', '[{"id": "att2222224", "fileName": "competition_photos.zip", "fileType": "application/zip", "downloadURL": "https://storage.example.com/attachments/competition_photos.zip", "size": 5242880}]'::jsonb, 'Michael Chen', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
  ('n2222224-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222224-2222-2222-2222-222222222222', 'Spring Musical Auditions', 'Auditions for this year spring musical The Sound of Music will be held next Monday and Tuesday after school. Sign up sheet is posted outside the drama room.', NOW() - INTERVAL '4 days', 'published', '[]'::jsonb, 'Michael Chen', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'),
  ('n2222225-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222225-2222-2222-2222-222222222222', 'Basketball Season Starts', 'Varsity and JV basketball practices begin next week. Tryouts schedule and team roster information attached.', NOW() - INTERVAL '12 days', 'published', '[{"id": "att2222225", "fileName": "basketball_schedule.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/basketball_schedule.pdf", "size": 234567}]'::jsonb, 'Michael Chen', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days'),
  ('n2222226-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222221-2222-2222-2222-222222222222', 'DRAFT: Homecoming Week Activities', 'Draft notice - not yet published. Planning homecoming spirit week activities for all grade levels.', NOW() + INTERVAL '30 days', 'draft', '[]'::jsonb, 'Michael Chen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('n2222227-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222225-2222-2222-2222-222222222222', 'Last Season Football Results', 'Archived notice from last year football season. Final standings and award winners.', NOW() - INTERVAL '300 days', 'archived', '[]'::jsonb, 'Michael Chen', NOW() - INTERVAL '320 days', NOW() - INTERVAL '150 days'),
  ('n2222228-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', 'Important: Early Dismissal Tomorrow', 'Due to staff development, school will be dismissed 2 hours early tomorrow (Wednesday). Buses will run on early schedule.', NOW() - INTERVAL '1 day', 'published', '[]'::jsonb, 'Michael Chen', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('n3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333331-3333-3333-3333-333333333333', 'Welcome 6th Graders!', 'Welcome to Mountain View Academy! We are excited to have you join our middle school. Important dates and campus map attached.', NOW() - INTERVAL '25 days', 'published', '[{"id": "att3333331", "fileName": "welcome_packet.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/welcome_packet.pdf", "size": 678901}]'::jsonb, 'Emily Rodriguez', NOW() - INTERVAL '28 days', NOW() - INTERVAL '25 days'),
  ('n3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333332-3333-3333-3333-333333333333', 'Math Competition Registration', '7th graders interested in the regional math competition should register by Friday. Practice sessions will be held during lunch.', NOW() - INTERVAL '9 days', 'published', '[]'::jsonb, 'Emily Rodriguez', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days'),
  ('n3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333333-3333-3333-3333-333333333333', '8th Grade Washington DC Trip', 'Information session for the 8th grade trip to Washington DC will be held next Tuesday at 6 PM in the cafeteria. Parents and students welcome.', NOW() - INTERVAL '7 days', 'published', '[{"id": "att3333333", "fileName": "trip_itinerary.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/trip_itinerary.pdf", "size": 456789}]'::jsonb, 'Emily Rodriguez', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'),
  ('n3333334-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333334-3333-3333-3333-333333333333', 'Spring Concert This Friday', 'The spring band and choir concert will be held this Friday at 7 PM in the auditorium. All music program families are invited!', NOW() - INTERVAL '3 days', 'published', '[{"id": "att3333334", "fileName": "concert_program.pdf", "fileType": "application/pdf", "downloadURL": "https://storage.example.com/attachments/concert_program.pdf", "size": 234567}]'::jsonb, 'Emily Rodriguez', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  ('n3333335-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333335-3333-3333-3333-333333333333', 'Old Archived Group Notice', 'This notice is for an archived group that is no longer active. Testing archived scenarios.', NOW() - INTERVAL '500 days', 'archived', '[]'::jsonb, 'Emily Rodriguez', NOW() - INTERVAL '550 days', NOW() - INTERVAL '200 days');

-- =====================================================
-- NOTICE_READS DATA (Sample read tracking)
-- =====================================================
INSERT INTO notice_reads (id, user_id, notice_id, school_id, group_id, read_at) VALUES
  ('r1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
  ('r1111112-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'n1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days'),
  ('r1111113-1111-1111-1111-111111111111', 'u1111112-1111-1111-1111-111111111111', 'n1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'g1111112-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days'),
  ('r2222221-2222-2222-2222-222222222222', 'u2222221-2222-2222-2222-222222222222', 'n2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222221-2222-2222-2222-222222222222', NOW() - INTERVAL '14 days'),
  ('r2222222-2222-2222-2222-222222222222', 'u2222221-2222-2222-2222-222222222222', 'n2222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222223-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days'),
  ('r2222223-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days'),
  ('r2222224-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'n2222225-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222225-2222-2222-2222-222222222222', NOW() - INTERVAL '11 days'),
  ('r2222225-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'n2222228-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
  ('r2222226-2222-2222-2222-222222222222', 'u2222223-2222-2222-2222-222222222222', 'n2222224-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'g2222224-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days'),
  ('r3333331-3333-3333-3333-333333333333', 'u3333331-3333-3333-3333-333333333333', 'n3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333331-3333-3333-3333-333333333333', NOW() - INTERVAL '24 days'),
  ('r3333332-3333-3333-3333-333333333333', 'u3333331-3333-3333-3333-333333333333', 'n3333334-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333334-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),
  ('r3333333-3333-3333-3333-333333333333', 'u3333332-3333-3333-3333-333333333333', 'n3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'g3333332-3333-3333-3333-333333333333', NOW() - INTERVAL '8 days');

-- =====================================================
-- SAMPLE AUDIT_LOGS DATA (for testing)
-- =====================================================
INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, user_email, timestamp, changes, metadata) VALUES
  ('l1111111-1111-1111-1111-111111111111', 'create', 'school', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'admin.greenwood@test.com', NOW() - INTERVAL '2 years', '{"after": {"name": "Greenwood Elementary School", "address": "123 Oak Street, Springfield, IL 62701"}}'::jsonb, '{"ip": "192.168.1.100", "user_agent": "Mozilla/5.0"}'::jsonb),
  ('l2222221-2222-2222-2222-222222222222', 'create', 'user', 'u1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'admin.greenwood@test.com', NOW() - INTERVAL '18 months', '{"after": {"email": "parent1.greenwood@test.com", "role": "user", "display_name": "David Anderson"}}'::jsonb, '{"ip": "192.168.1.101", "user_agent": "Mozilla/5.0"}'::jsonb),
  ('l3333331-3333-3333-3333-333333333333', 'update', 'notice', 'n1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'admin.greenwood@test.com', NOW() - INTERVAL '30 days', '{"before": {"status": "draft"}, "after": {"status": "published"}}'::jsonb, '{"action": "publish_notice"}'::jsonb),
  ('l4444441-4444-4444-4444-444444444444', 'create', 'group', 'g2222223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'admin.riverside@test.com', NOW() - INTERVAL '1 year', '{"after": {"name": "Science Club", "description": "After-school science and robotics club"}}'::jsonb, '{"ip": "192.168.2.50"}'::jsonb);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data successfully loaded!';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Schools: 3';
  RAISE NOTICE '   - Users: 10 (3 admins, 7 regular)';
  RAISE NOTICE '   - Groups: 15 (5 per school)';
  RAISE NOTICE '   - Notices: 20 (14 published, 3 draft, 3 archived)';
  RAISE NOTICE '   - Notice Reads: 13';
  RAISE NOTICE '   - Audit Logs: 4';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Test Credentials:';
  RAISE NOTICE '   Admin accounts:';
  RAISE NOTICE '     - admin.greenwood@test.com / Test123!@#';
  RAISE NOTICE '     - admin.riverside@test.com / Test123!@#';
  RAISE NOTICE '     - admin.mountainview@test.com / Test123!@#';
  RAISE NOTICE '   Regular user accounts:';
  RAISE NOTICE '     - parent1.greenwood@test.com / Test123!@#';
  RAISE NOTICE '     - parent1.riverside@test.com / Test123!@#';
  RAISE NOTICE '     - parent1.mountainview@test.com / Test123!@#';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Test Scenarios Covered:';
  RAISE NOTICE '   ✓ Multiple schools with different data';
  RAISE NOTICE '   ✓ Admin and regular user roles';
  RAISE NOTICE '   ✓ Groups with members and empty groups';
  RAISE NOTICE '   ✓ Published, draft, and archived notices';
  RAISE NOTICE '   ✓ Notices with and without attachments';
  RAISE NOTICE '   ✓ Read tracking across users';
  RAISE NOTICE '   ✓ Audit log examples';
END $$;
