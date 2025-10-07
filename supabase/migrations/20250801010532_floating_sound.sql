/*
  # Parking Spot Finder Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique identifier for each user
      - `full_name` (text) - Name of the user  
      - `email` (text, unique) - Used for login
      - `phone_number` (text) - Optional contact info
      - `created_at` (timestamp) - When the user registered

    - `parking_spots`
      - `id` (uuid, primary key) - Unique spot identifier
      - `title` (text) - Label or name for the spot
      - `description` (text) - Optional details
      - `latitude` (float) - Location latitude
      - `longitude` (float) - Location longitude
      - `is_available` (boolean) - Current availability status
      - `created_by` (uuid, foreign key) - Who added this spot
      - `created_at` (timestamp) - When the spot was added

    - `bookings`
      - `id` (uuid, primary key) - Unique booking ID
      - `user_id` (uuid, foreign key) - Who booked it
      - `spot_id` (uuid, foreign key) - Which spot is booked
      - `start_time` (timestamp) - Booking start
      - `end_time` (timestamp) - Booking end
      - `status` (enum) - Booking lifecycle status
      - `created_at` (timestamp) - When booking was made

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading public parking spot data

  3. Functions
    - Function to check spot availability
    - Function to update spot availability after booking
*/

-- Create custom types
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled');

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now()
);

-- Parking spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_available boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  spot_id uuid REFERENCES parking_spots(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status booking_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Parking spots policies
CREATE POLICY "Anyone can view parking spots"
  ON parking_spots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create spots"
  ON parking_spots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own spots"
  ON parking_spots
  FOR UPDATE  
  TO authenticated
  USING (auth.uid() = created_by);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if a spot is available for a time period
CREATE OR REPLACE FUNCTION check_spot_availability(
  spot_uuid uuid,
  check_start timestamptz,
  check_end timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if there are any overlapping bookings
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE spot_id = spot_uuid
    AND status IN ('pending', 'confirmed')
    AND (
      (start_time <= check_start AND end_time > check_start) OR
      (start_time < check_end AND end_time >= check_end) OR
      (start_time >= check_start AND end_time <= check_end)
    )
  );
END;
$$;

-- Function to update spot availability
CREATE OR REPLACE FUNCTION update_spot_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update spot availability based on current active bookings
  UPDATE parking_spots
  SET is_available = NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id)
    AND status IN ('pending', 'confirmed')
    AND start_time <= now()
    AND end_time > now()
  )
  WHERE id = COALESCE(NEW.spot_id, OLD.spot_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to automatically update spot availability
CREATE TRIGGER update_spot_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_spot_availability();

-- Insert some sample parking spots
INSERT INTO parking_spots (title, description, latitude, longitude, created_by) VALUES
  ('Downtown Mall - Level 1', 'Covered parking near main entrance', 40.7589, -73.9851, NULL),
  ('City Center - Spot A12', 'Ground level, easy access', 40.7614, -73.9776, NULL),
  ('Metro Station Parking', 'Next to subway entrance', 40.7505, -73.9934, NULL),
  ('Shopping District - B4', 'Underground parking, 24/7 access', 40.7549, -73.9840, NULL),
  ('Business Plaza - Roof', 'Top floor with city view', 40.7580, -73.9855, NULL);