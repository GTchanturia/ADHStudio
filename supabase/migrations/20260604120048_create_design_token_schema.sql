/*
  # Design Token Management Platform - Initial Schema

  ## Overview
  Creates the full database schema for the Design Token Management Platform.

  ## New Tables

  ### organizations
  - `id` (uuid, PK) - Unique organization identifier
  - `name` (text) - Organization display name
  - `slug` (text, unique) - URL-friendly identifier
  - `created_at` (timestamptz)

  ### projects
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK → organizations)
  - `name` (text)
  - `description` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### token_sets
  - `id` (uuid, PK)
  - `project_id` (uuid, FK → projects)
  - `name` (text) - supports slash-notation for folder hierarchy (e.g., "Brand/Light")
  - `description` (text)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### tokens
  - `id` (uuid, PK)
  - `token_set_id` (uuid, FK → token_sets)
  - `name` (text) - dash-notation (e.g., "color-primary-500")
  - `type` (text) - color, typography, spacing, border, shadow, etc.
  - `layer` (text) - core, semantic, component
  - `value` (jsonb) - raw value or alias reference
  - `description` (text)
  - `metadata` (jsonb) - extra data like LCH modifiers, tags
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### themes
  - `id` (uuid, PK)
  - `project_id` (uuid, FK → projects)
  - `name` (text)
  - `token_set_ids` (uuid[]) - ordered list of active token sets for this theme
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read/write policies for demo purposes (no auth required for MVP)
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are publicly readable"
  ON organizations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Organizations are publicly insertable"
  ON organizations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Organizations are publicly updatable"
  ON organizations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are publicly readable"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Projects are publicly insertable"
  ON projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Projects are publicly updatable"
  ON projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Token sets table
CREATE TABLE IF NOT EXISTS token_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE token_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Token sets are publicly readable"
  ON token_sets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Token sets are publicly insertable"
  ON token_sets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Token sets are publicly updatable"
  ON token_sets FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Token sets are publicly deletable"
  ON token_sets FOR DELETE
  TO anon, authenticated
  USING (true);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_set_id uuid REFERENCES token_sets(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'color',
  layer text NOT NULL DEFAULT 'core',
  value jsonb NOT NULL DEFAULT '{}',
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tokens are publicly readable"
  ON tokens FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Tokens are publicly insertable"
  ON tokens FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Tokens are publicly updatable"
  ON tokens FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tokens are publicly deletable"
  ON tokens FOR DELETE
  TO anon, authenticated
  USING (true);

-- Themes table
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_set_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Themes are publicly readable"
  ON themes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Themes are publicly insertable"
  ON themes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Themes are publicly updatable"
  ON themes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Themes are publicly deletable"
  ON themes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_token_sets_project ON token_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_tokens_set ON tokens(token_set_id);
CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens(type);
CREATE INDEX IF NOT EXISTS idx_tokens_layer ON tokens(layer);
CREATE INDEX IF NOT EXISTS idx_themes_project ON themes(project_id);
