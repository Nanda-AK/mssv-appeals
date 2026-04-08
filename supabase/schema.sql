-- ============================================================
-- MSSV & Co — Appeal Management System
-- Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('service_provider', 'client')),
  pan TEXT,
  tan TEXT,
  gst TEXT,
  contact_person TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (public profile linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
  designation TEXT,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appeals
CREATE TABLE IF NOT EXISTS appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appeal_number TEXT NOT NULL,
  client_org_id UUID REFERENCES organizations(id),
  assigned_to UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  case_type TEXT,
  type_of_proceedings TEXT,
  assessment_year TEXT,
  section TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  outcome TEXT,
  filing_date DATE,
  next_hearing_date DATE,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: Organizations
-- ============================================================
CREATE POLICY "Authenticated users can read organizations"
  ON organizations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert organizations"
  ON organizations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update organizations"
  ON organizations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS Policies: Users
-- ============================================================
CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS Policies: Appeals
-- ============================================================

-- Admin and Staff see all appeals
CREATE POLICY "Admin and staff can read all appeals"
  ON appeals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Client users see only their org's appeals
CREATE POLICY "Client users see own org appeals"
  ON appeals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'client'
        AND org_id = appeals.client_org_id
    )
  );

-- Admin and staff can insert appeals
CREATE POLICY "Admin and staff can insert appeals"
  ON appeals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin and staff can update appeals
CREATE POLICY "Admin and staff can update appeals"
  ON appeals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Only admin can delete appeals
CREATE POLICY "Admin can delete appeals"
  ON appeals FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Supabase Storage: appeal-documents bucket
-- Create this bucket manually in Supabase Dashboard > Storage
-- Set to PUBLIC so file_url links work directly
-- ============================================================

-- ============================================================
-- Seed: MSSV & Co (Service Provider)
-- ============================================================
INSERT INTO organizations (name, type) VALUES ('MSSV & Co', 'service_provider')
ON CONFLICT DO NOTHING;
