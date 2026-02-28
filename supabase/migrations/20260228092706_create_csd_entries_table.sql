/*
  # CSD Management System Database Schema

  1. New Tables
    - `csd_entries`
      - `id` (uuid, primary key) - Unique identifier for each entry
      - `user_id` (uuid, foreign key) - Links to auth.users, ensures entries belong to specific user
      - `company_name` (text, required) - Name of the company
      - `contact_name` (text, required) - Contact person's name
      - `ntn` (text, optional) - National Tax Number
      - `contact_number` (text, optional) - Phone number for WhatsApp
      - `email` (text, optional) - Email address for communication
      - `business` (text, required) - Business description/type
      - `added_by` (text, required) - Name of person who added the entry
      - `created_at` (timestamptz) - Timestamp when entry was created
      - `updated_at` (timestamptz) - Timestamp when entry was last updated

  2. Security
    - Enable RLS on `csd_entries` table
    - Add policy for users to view only their own entries
    - Add policy for users to create entries (automatically linked to their user_id)
    - Add policy for users to update only their own entries
    - Add policy for users to delete only their own entries

  3. Important Notes
    - Each entry is securely linked to the authenticated user
    - Email validation is handled at application level for optional field
    - NTN is optional and stored as text
    - Contact number stored as text to preserve formatting
*/

CREATE TABLE IF NOT EXISTS csd_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  ntn text,
  contact_number text,
  email text,
  business text NOT NULL,
  added_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE csd_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON csd_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries"
  ON csd_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON csd_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON csd_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_csd_entries_user_id ON csd_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_csd_entries_created_at ON csd_entries(created_at DESC);