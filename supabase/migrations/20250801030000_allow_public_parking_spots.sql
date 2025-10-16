/*
  # Allow Public Access to Parking Spots
  
  This migration updates the RLS policy to allow anonymous users to view parking spots.
  Parking spots are generally public information that should be viewable without authentication.
  
  Changes:
  1. Update parking spots policy to allow anonymous viewing
  2. Keep write operations restricted to authenticated users
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view parking spots" ON parking_spots;

-- Create new policy that allows public reading
CREATE POLICY "Public can view parking spots"
  ON parking_spots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure authenticated users can still create spots  
-- (existing policies for INSERT, UPDATE, DELETE remain unchanged)