-- F002 Test Data Seed Script
-- Purpose: Populate local database with realistic test data for F002 feature testing
-- Run: docker exec -i supabase_db_Adaptive_Outbound psql -U postgres -d postgres < supabase/seed_test_data.sql

-- Clear existing test data (preserve auth.users)
DELETE FROM activities;
DELETE FROM tasks;
DELETE FROM entity_tags;
DELETE FROM tags;
DELETE FROM contacts;
DELETE FROM accounts;
DELETE FROM teams;
DELETE FROM workspace_members WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'test@example.com');
DELETE FROM workspaces WHERE id NOT IN (SELECT workspace_id FROM workspace_members);

\echo 'Creating test user and workspace...'

-- Create test user (if doesn't exist)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change_token_current,
  email_change_token_new
) VALUES (
  'b3d1c3b0-1234-5678-90ab-cdef12345678',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz',  -- dummy password hash
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  false,
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create test workspace
INSERT INTO workspaces (id, name, slug, owner_id, plan, seats_limit, created_at)
VALUES (
  'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  'Test Workspace',
  'test-workspace',
  'b3d1c3b0-1234-5678-90ab-cdef12345678',
  'professional',
  10,
  NOW()
) ON CONFLICT DO NOTHING;

-- Add user as admin to workspace
INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
VALUES (
  'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  'b3d1c3b0-1234-5678-90ab-cdef12345678',
  'admin',
  'active',
  NOW()
) ON CONFLICT DO NOTHING;

-- Create profile for test user
INSERT INTO profiles (id, email, full_name, workspace_id, created_at)
VALUES (
  'b3d1c3b0-1234-5678-90ab-cdef12345678',
  'test@example.com',
  'Test User',
  'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  workspace_id = 'a1b2c3d4-5678-90ab-cdef-1234567890ab';

\echo 'Creating teams...'

-- Create test teams
INSERT INTO teams (id, workspace_id, name, description, created_by, created_at) VALUES
('t1000000-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Sales Team Alpha', 'Primary sales team', 'b3d1c3b0-1234-5678-90ab-cdef12345678', NOW()),
('t2000000-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Sales Team Beta', 'Secondary sales team', 'b3d1c3b0-1234-5678-90ab-cdef12345678', NOW());

\echo 'Creating accounts...'

-- Create 10 test accounts with realistic data
INSERT INTO accounts (id, workspace_id, name, website, industry, employee_count, annual_revenue, country, city, status, lifecycle_stage, created_by) VALUES
('acc00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Acme Corporation', 'https://acme.com', 'Technology', 500, 50000000, 'United States', 'San Francisco', 'active', 'customer', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'TechVision Inc', 'https://techvision.io', 'Software', 150, 15000000, 'United States', 'Austin', 'active', 'qualified_lead', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Global Solutions Ltd', 'https://globalsolutions.com', 'Consulting', 1200, 120000000, 'United Kingdom', 'London', 'active', 'opportunity', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Innovation Labs', NULL, 'Research', 75, 8000000, 'Germany', 'Berlin', 'active', 'marketing_qualified_lead', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00005-0000-0000-0000-000000000005', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'DataCore Systems', 'https://datacore.ai', 'Data Analytics', 300, 35000000, 'Canada', 'Toronto', 'active', 'sales_qualified_lead', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00006-0000-0000-0000-000000000006', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'CloudFirst Technologies', 'https://cloudfirst.tech', 'Cloud Services', 450, 60000000, 'United States', 'Seattle', 'active', 'customer', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00007-0000-0000-0000-000000000007', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Enterprise Dynamics', 'https://entdynamics.com', 'Manufacturing', 2500, 250000000, 'United States', 'Chicago', 'active', 'opportunity', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00008-0000-0000-0000-000000000008', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'StartupHub', 'https://startuphub.io', 'Venture Capital', 25, 3000000, 'United States', 'New York', 'active', 'prospect', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00009-0000-0000-0000-000000000009', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'FinanceGroup International', 'https://financegroup.com', 'Financial Services', 5000, 500000000, 'Singapore', 'Singapore', 'active', 'customer', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('acc00010-0000-0000-0000-000000000010', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'HealthTech Innovations', 'https://healthtech.io', 'Healthcare', 180, 22000000, 'United States', 'Boston', 'active', 'qualified_lead', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

\echo 'Creating contacts...'

-- Create 30 test contacts linked to accounts
INSERT INTO contacts (id, workspace_id, account_id, first_name, last_name, email, phone, job_title, department, seniority_level, is_decision_maker, is_champion, status, created_by) VALUES
-- Acme Corporation (5 contacts)
('con00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'John', 'Smith', 'john.smith@acme.com', '+1-415-555-0001', 'CEO', 'Executive', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'Sarah', 'Johnson', 'sarah.johnson@acme.com', '+1-415-555-0002', 'VP Engineering', 'Engineering', 'vp', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'Michael', 'Chen', 'michael.chen@acme.com', '+1-415-555-0003', 'Senior Developer', 'Engineering', 'senior', false, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'Emily', 'Davis', 'emily.davis@acme.com', NULL, 'Product Manager', 'Product', 'manager', false, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00005-0000-0000-0000-000000000005', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'David', 'Wilson', 'david.wilson@acme.com', '+1-415-555-0005', 'CFO', 'Finance', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- TechVision Inc (3 contacts)
('con00006-0000-0000-0000-000000000006', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00002-0000-0000-0000-000000000002', 'Lisa', 'Anderson', 'lisa.anderson@techvision.io', '+1-512-555-0001', 'Founder & CEO', 'Executive', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00007-0000-0000-0000-000000000007', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00002-0000-0000-0000-000000000002', 'Robert', 'Martinez', 'robert.martinez@techvision.io', '+1-512-555-0002', 'CTO', 'Engineering', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00008-0000-0000-0000-000000000008', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00002-0000-0000-0000-000000000002', 'Jennifer', 'Taylor', 'jennifer.taylor@techvision.io', NULL, 'Head of Sales', 'Sales', 'director', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Global Solutions Ltd (4 contacts)
('con00009-0000-0000-0000-000000000009', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'James', 'Brown', 'james.brown@globalsolutions.com', '+44-20-5555-0001', 'Managing Director', 'Executive', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00010-0000-0000-0000-000000000010', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'Emma', 'Williams', 'emma.williams@globalsolutions.com', '+44-20-5555-0002', 'Head of Operations', 'Operations', 'director', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00011-0000-0000-0000-000000000011', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'Oliver', 'Jones', 'oliver.jones@globalsolutions.com', NULL, 'Senior Consultant', 'Consulting', 'senior', false, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00012-0000-0000-0000-000000000012', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'Sophie', 'Garcia', 'sophie.garcia@globalsolutions.com', '+44-20-5555-0004', 'VP Finance', 'Finance', 'vp', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Innovation Labs (2 contacts)
('con00013-0000-0000-0000-000000000013', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00004-0000-0000-0000-000000000004', 'Thomas', 'Mueller', 'thomas.mueller@innovationlabs.de', '+49-30-5555-0001', 'Research Director', 'Research', 'director', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00014-0000-0000-0000-000000000014', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00004-0000-0000-0000-000000000004', 'Anna', 'Schmidt', 'anna.schmidt@innovationlabs.de', NULL, 'Lead Scientist', 'Research', 'senior', false, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- DataCore Systems (3 contacts)
('con00015-0000-0000-0000-000000000015', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00005-0000-0000-0000-000000000005', 'Daniel', 'Lee', 'daniel.lee@datacore.ai', '+1-416-555-0001', 'CEO', 'Executive', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00016-0000-0000-0000-000000000016', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00005-0000-0000-0000-000000000005', 'Maria', 'Rodriguez', 'maria.rodriguez@datacore.ai', '+1-416-555-0002', 'VP Analytics', 'Analytics', 'vp', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00017-0000-0000-0000-000000000017', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00005-0000-0000-0000-000000000005', 'Kevin', 'Wang', 'kevin.wang@datacore.ai', NULL, 'Data Scientist', 'Analytics', 'senior', false, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- CloudFirst Technologies (3 contacts)
('con00018-0000-0000-0000-000000000018', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00006-0000-0000-0000-000000000006', 'Rachel', 'Thompson', 'rachel.thompson@cloudfirst.tech', '+1-206-555-0001', 'VP Product', 'Product', 'vp', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00019-0000-0000-0000-000000000019', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00006-0000-0000-0000-000000000006', 'Christopher', 'White', 'christopher.white@cloudfirst.tech', '+1-206-555-0002', 'Director of Engineering', 'Engineering', 'director', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00020-0000-0000-0000-000000000020', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00006-0000-0000-0000-000000000006', 'Amanda', 'Harris', 'amanda.harris@cloudfirst.tech', NULL, 'Customer Success Manager', 'Customer Success', 'manager', false, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Enterprise Dynamics (4 contacts)
('con00021-0000-0000-0000-000000000021', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'William', 'Clark', 'william.clark@entdynamics.com', '+1-312-555-0001', 'CEO', 'Executive', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00022-0000-0000-0000-000000000022', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'Patricia', 'Lewis', 'patricia.lewis@entdynamics.com', '+1-312-555-0002', 'COO', 'Operations', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00023-0000-0000-0000-000000000023', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'Richard', 'Walker', 'richard.walker@entdynamics.com', NULL, 'VP Manufacturing', 'Manufacturing', 'vp', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00024-0000-0000-0000-000000000024', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'Barbara', 'Hall', 'barbara.hall@entdynamics.com', '+1-312-555-0004', 'Head of Procurement', 'Procurement', 'director', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- StartupHub (2 contacts)
('con00025-0000-0000-0000-000000000025', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00008-0000-0000-0000-000000000008', 'Charles', 'Young', 'charles.young@startuphub.io', '+1-212-555-0001', 'Managing Partner', 'Investment', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00026-0000-0000-0000-000000000026', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00008-0000-0000-0000-000000000008', 'Nancy', 'King', 'nancy.king@startuphub.io', NULL, 'Investment Analyst', 'Investment', 'junior', false, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- FinanceGroup International (2 contacts)
('con00027-0000-0000-0000-000000000027', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00009-0000-0000-0000-000000000009', 'Steven', 'Wright', 'steven.wright@financegroup.com', '+65-6555-0001', 'Regional Director', 'Executive', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00028-0000-0000-0000-000000000028', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00009-0000-0000-0000-000000000009', 'Michelle', 'Lopez', 'michelle.lopez@financegroup.com', '+65-6555-0002', 'VP Operations', 'Operations', 'vp', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- HealthTech Innovations (2 contacts)
('con00029-0000-0000-0000-000000000029', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00010-0000-0000-0000-000000000010', 'Paul', 'Hill', 'paul.hill@healthtech.io', '+1-617-555-0001', 'Founder & CEO', 'Executive', 'c_level', true, true, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('con00030-0000-0000-0000-000000000030', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00010-0000-0000-0000-000000000010', 'Laura', 'Green', 'laura.green@healthtech.io', NULL, 'Chief Medical Officer', 'Medical', 'c_level', true, false, 'active', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

\echo 'Creating tags...'

-- Create 5 test tags
INSERT INTO tags (id, workspace_id, name, color, created_by) VALUES
('tag00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'High Priority', 'red', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('tag00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Enterprise', 'blue', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('tag00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Tech Stack: Cloud', 'cyan', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('tag00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Hot Lead', 'orange', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('tag00005-0000-0000-0000-000000000005', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Partner', 'purple', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

-- Tag accounts and contacts
INSERT INTO entity_tags (entity_type, entity_id, tag_id, workspace_id, created_by) VALUES
-- Tag high-value accounts as Enterprise
('account', 'acc00001-0000-0000-0000-000000000001', 'tag00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('account', 'acc00003-0000-0000-0000-000000000003', 'tag00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('account', 'acc00007-0000-0000-0000-000000000007', 'tag00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('account', 'acc00009-0000-0000-0000-000000000009', 'tag00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Tag cloud accounts
('account', 'acc00006-0000-0000-0000-000000000006', 'tag00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('account', 'acc00005-0000-0000-0000-000000000005', 'tag00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Tag hot leads
('account', 'acc00002-0000-0000-0000-000000000002', 'tag00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('account', 'acc00004-0000-0000-0000-000000000004', 'tag00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Tag some champions
('contact', 'con00001-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef12345678', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('contact', 'con00006-0000-0000-0000-000000000006', 'tag00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

\echo 'Creating activities...'

-- Create 20 test activities
INSERT INTO activities (id, workspace_id, account_id, contact_id, activity_type, outcome, direction, notes, occurred_at, created_by) VALUES
-- Recent activities for Acme
('act00001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'con00001-0000-0000-0000-000000000001', 'meeting', 'completed', 'outbound', 'Q1 strategy meeting - discussed expansion plans', NOW() - INTERVAL '2 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'con00002-0000-0000-0000-000000000002', 'email', 'completed', 'outbound', 'Sent technical proposal for integration', NOW() - INTERVAL '5 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', 'con00003-0000-0000-0000-000000000003', 'call', 'completed', 'inbound', 'Developer asked about API documentation', NOW() - INTERVAL '7 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- TechVision activities
('act00004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00002-0000-0000-0000-000000000002', 'con00006-0000-0000-0000-000000000006', 'meeting', 'completed', 'outbound', 'Initial discovery call - very interested', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00005-0000-0000-0000-000000000005', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00002-0000-0000-0000-000000000002', 'con00007-0000-0000-0000-000000000007', 'email', 'completed', 'outbound', 'Follow-up with pricing information', NOW() - INTERVAL '3 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Global Solutions activities
('act00006-0000-0000-0000-000000000006', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'con00009-0000-0000-0000-000000000009', 'call', 'no_answer', 'outbound', 'Attempted to reach MD - left voicemail', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00007-0000-0000-0000-000000000007', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00003-0000-0000-0000-000000000003', 'con00010-0000-0000-0000-000000000010', 'meeting', 'completed', 'outbound', 'Contract negotiation - moving forward', NOW() - INTERVAL '4 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Innovation Labs activities
('act00008-0000-0000-0000-000000000008', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00004-0000-0000-0000-000000000004', 'con00013-0000-0000-0000-000000000013', 'email', 'completed', 'inbound', 'Research director inquired about partnership', NOW() - INTERVAL '2 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- DataCore Systems activities
('act00009-0000-0000-0000-000000000009', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00005-0000-0000-0000-000000000005', 'con00015-0000-0000-0000-000000000015', 'meeting', 'completed', 'outbound', 'Product demo - CEO impressed with features', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00010-0000-0000-0000-000000000010', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00005-0000-0000-0000-000000000005', 'con00016-0000-0000-0000-000000000016', 'call', 'completed', 'outbound', 'Discussed implementation timeline', NOW() - INTERVAL '5 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- CloudFirst activities
('act00011-0000-0000-0000-000000000011', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00006-0000-0000-0000-000000000006', 'con00018-0000-0000-0000-000000000018', 'email', 'completed', 'outbound', 'Sent case studies and ROI analysis', NOW() - INTERVAL '3 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00012-0000-0000-0000-000000000012', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00006-0000-0000-0000-000000000006', 'con00019-0000-0000-0000-000000000019', 'meeting', 'completed', 'outbound', 'Technical deep-dive session', NOW() - INTERVAL '6 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- Enterprise Dynamics activities
('act00013-0000-0000-0000-000000000013', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'con00021-0000-0000-0000-000000000021', 'meeting', 'completed', 'outbound', 'Quarterly business review - all systems running well', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00014-0000-0000-0000-000000000014', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00007-0000-0000-0000-000000000007', 'con00022-0000-0000-0000-000000000022', 'call', 'completed', 'inbound', 'COO requested expansion to 3 more facilities', NOW() - INTERVAL '4 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- StartupHub activities
('act00015-0000-0000-0000-000000000015', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00008-0000-0000-0000-000000000008', 'con00025-0000-0000-0000-000000000025', 'social', 'completed', 'outbound', 'Connected on LinkedIn - sent intro message', NOW() - INTERVAL '2 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- FinanceGroup activities
('act00016-0000-0000-0000-000000000016', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00009-0000-0000-0000-000000000009', 'con00027-0000-0000-0000-000000000027', 'meeting', 'completed', 'outbound', 'Regional expansion discussion - exploring APAC rollout', NOW() - INTERVAL '3 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00017-0000-0000-0000-000000000017', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00009-0000-0000-0000-000000000009', 'con00028-0000-0000-0000-000000000028', 'email', 'completed', 'inbound', 'Operations VP requested security compliance docs', NOW() - INTERVAL '5 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- HealthTech activities
('act00018-0000-0000-0000-000000000018', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00010-0000-0000-0000-000000000010', 'con00029-0000-0000-0000-000000000029', 'call', 'completed', 'outbound', 'CEO very interested - scheduling demo for next week', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('act00019-0000-0000-0000-000000000019', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00010-0000-0000-0000-000000000010', 'con00030-0000-0000-0000-000000000030', 'email', 'completed', 'outbound', 'Sent HIPAA compliance information', NOW() - INTERVAL '4 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),

-- General account activity (no specific contact)
('act00020-0000-0000-0000-000000000020', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'acc00001-0000-0000-0000-000000000001', NULL, 'other', 'completed', 'outbound', 'Company wide announcement shared via newsletter', NOW() - INTERVAL '7 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

\echo 'Creating tasks...'

-- Create 10 test tasks
INSERT INTO tasks (id, workspace_id, title, description, task_type, priority, status, due_date, assigned_to, account_id, contact_id, created_by) VALUES
('task0001-0000-0000-0000-000000000001', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Send proposal to Acme Corp', 'Prepare and send Q2 expansion proposal to John Smith', 'follow_up', 'high', 'pending', NOW() + INTERVAL '2 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00001-0000-0000-0000-000000000001', 'con00001-0000-0000-0000-000000000001', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0002-0000-0000-0000-000000000002', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Schedule demo with TechVision', 'Book product demo with Lisa Anderson next week', 'meeting', 'high', 'pending', NOW() + INTERVAL '5 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00002-0000-0000-0000-000000000002', 'con00006-0000-0000-0000-000000000006', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0003-0000-0000-0000-000000000003', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Follow up with Global Solutions', 'Call Emma Williams about contract status', 'call', 'medium', 'pending', NOW() + INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00003-0000-0000-0000-000000000003', 'con00010-0000-0000-0000-000000000010', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0004-0000-0000-0000-000000000004', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Research Innovation Labs requirements', 'Deep dive into their research needs before partnership discussion', 'research', 'medium', 'pending', NOW() + INTERVAL '7 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00004-0000-0000-0000-000000000004', NULL, 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0005-0000-0000-0000-000000000005', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Prepare DataCore implementation plan', 'Create detailed implementation timeline and resource allocation', 'other', 'high', 'in_progress', NOW() + INTERVAL '3 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00005-0000-0000-0000-000000000005', 'con00015-0000-0000-0000-000000000015', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0006-0000-0000-0000-000000000006', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Send case studies to CloudFirst', 'Compile 3 relevant case studies for VP Product review', 'email', 'medium', 'completed', NOW() - INTERVAL '1 day', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00006-0000-0000-0000-000000000006', 'con00018-0000-0000-0000-000000000018', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0007-0000-0000-0000-000000000007', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Quarterly review with Enterprise Dynamics', 'Prepare Q1 metrics and roadmap presentation', 'meeting', 'high', 'completed', NOW() - INTERVAL '2 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00007-0000-0000-0000-000000000007', 'con00021-0000-0000-0000-000000000021', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0008-0000-0000-0000-000000000008', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Research StartupHub portfolio', 'Review their portfolio companies for potential leads', 'research', 'low', 'pending', NOW() + INTERVAL '14 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00008-0000-0000-0000-000000000008', NULL, 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0009-0000-0000-0000-000000000009', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'APAC expansion planning with FinanceGroup', 'Schedule strategy session for regional rollout', 'meeting', 'high', 'pending', NOW() + INTERVAL '4 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00009-0000-0000-0000-000000000009', 'con00027-0000-0000-0000-000000000027', 'b3d1c3b0-1234-5678-90ab-cdef12345678'),
('task0010-0000-0000-0000-000000000010', 'a1b2c3d4-5678-90ab-cdef-1234567890ab', 'Schedule demo for HealthTech Innovations', 'Book product demo including HIPAA compliance review', 'meeting', 'high', 'pending', NOW() + INTERVAL '6 days', 'b3d1c3b0-1234-5678-90ab-cdef12345678', 'acc00010-0000-0000-0000-000000000010', 'con00029-0000-0000-0000-000000000029', 'b3d1c3b0-1234-5678-90ab-cdef12345678');

\echo 'Test data seeding complete!'
\echo ''
\echo 'Summary:'
\echo '- 1 test user (test@example.com)'
\echo '- 1 test workspace (Test Workspace)'
\echo '- 2 teams'
\echo '- 10 accounts'
\echo '- 30 contacts'
\echo '- 5 tags'
\echo '- 20 activities'
\echo '- 10 tasks (2 completed, 1 in-progress, 7 pending)'
\echo ''
\echo 'Login credentials:'
\echo '  Email: test@example.com'
\echo '  Password: (set via Supabase Studio or create new user)'
\echo ''
\echo 'Next steps:'
\echo '1. Open Supabase Studio: http://127.0.0.1:54333'
\echo '2. Go to Authentication > Users'
\echo '3. Create user with email: test@example.com'
\echo '4. Start web app: cd web-app && npm run dev'
\echo '5. Login and test F002 features!'
