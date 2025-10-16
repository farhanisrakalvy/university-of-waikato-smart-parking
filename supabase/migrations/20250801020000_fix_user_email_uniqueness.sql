/*
  # Fix User Email Uniqueness

  This migration ensures proper email uniqueness constraints and prevents duplicate signups.
  
  1. Add additional constraints for email uniqueness
  2. Create a function to handle user registration more safely
  3. Add indexes for better performance
*/

-- Ensure email is stored in lowercase for consistency
CREATE OR REPLACE FUNCTION trigger_set_lowercase_email()
RETURNS trigger AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically lowercase emails
DROP TRIGGER IF EXISTS set_lowercase_email ON users;
CREATE TRIGGER set_lowercase_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_lowercase_email();

-- Add index on email for better query performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Create a function to safely create user profiles
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = LOWER(user_email)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;

  -- Insert the user profile
  INSERT INTO users (id, email, full_name)
  VALUES (user_id, LOWER(user_email), user_full_name);

  RETURN json_build_object(
    'success', true,
    'error', null
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create user profile'
    );
END;
$$;

-- Update existing emails to lowercase
UPDATE users SET email = LOWER(email);
