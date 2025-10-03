/*
  # Vehicle Tracking System - Database Schema

  ## Overview
  This migration creates the complete database schema for a vehicle tracking system with real-time monitoring, 
  historical tracking data, alerts, and user management capabilities.

  ## 1. New Tables

  ### `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'admin', 'fleet_manager', or 'driver'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ### `vehicles`
  Stores vehicle information and details
  - `id` (uuid, primary key) - Unique vehicle identifier
  - `user_id` (uuid, foreign key) - Owner/manager of the vehicle
  - `license_plate` (text, unique) - Vehicle license plate number
  - `brand` (text) - Vehicle manufacturer
  - `model` (text) - Vehicle model name
  - `year` (integer) - Manufacturing year
  - `color` (text) - Vehicle color
  - `vin` (text) - Vehicle Identification Number
  - `status` (text) - Current status: 'active', 'inactive', 'maintenance'
  - `last_location_lat` (double precision) - Last known latitude
  - `last_location_lng` (double precision) - Last known longitude
  - `last_seen` (timestamptz) - Last tracking update timestamp
  - `created_at` (timestamptz) - Vehicle registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `tracking_history`
  GPS tracking data points for vehicles
  - `id` (uuid, primary key) - Unique tracking record identifier
  - `vehicle_id` (uuid, foreign key) - Reference to vehicles table
  - `latitude` (double precision) - GPS latitude coordinate
  - `longitude` (double precision) - GPS longitude coordinate
  - `speed` (double precision) - Speed in km/h
  - `heading` (double precision) - Direction in degrees (0-360)
  - `altitude` (double precision) - Altitude in meters
  - `accuracy` (double precision) - GPS accuracy in meters
  - `timestamp` (timestamptz) - When the position was recorded
  - `created_at` (timestamptz) - When the record was inserted

  ### `alerts`
  Alert configurations and triggered notifications
  - `id` (uuid, primary key) - Unique alert identifier
  - `vehicle_id` (uuid, foreign key) - Reference to vehicles table
  - `user_id` (uuid, foreign key) - User who owns the alert
  - `type` (text) - Alert type: 'geofence', 'speed', 'offline', 'maintenance'
  - `title` (text) - Alert title
  - `message` (text) - Alert message/description
  - `severity` (text) - Alert severity: 'info', 'warning', 'critical'
  - `is_read` (boolean) - Whether alert has been acknowledged
  - `triggered_at` (timestamptz) - When the alert was triggered
  - `created_at` (timestamptz) - When the alert was created

  ### `geofences`
  Geofence boundaries for location-based alerts
  - `id` (uuid, primary key) - Unique geofence identifier
  - `user_id` (uuid, foreign key) - User who created the geofence
  - `name` (text) - Geofence name
  - `center_lat` (double precision) - Center point latitude
  - `center_lng` (double precision) - Center point longitude
  - `radius` (double precision) - Radius in meters
  - `is_active` (boolean) - Whether geofence is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  All tables have Row Level Security (RLS) enabled with the following policies:

  ### profiles table
  - Users can view their own profile
  - Users can update their own profile
  - Users can insert their own profile on registration

  ### vehicles table
  - Users can view their own vehicles
  - Users can insert new vehicles
  - Users can update their own vehicles
  - Users can delete their own vehicles

  ### tracking_history table
  - Users can view tracking history for their vehicles
  - System can insert tracking data (for GPS device integration)

  ### alerts table
  - Users can view their own alerts
  - System can insert alerts
  - Users can update their own alerts (mark as read)
  - Users can delete their own alerts

  ### geofences table
  - Users can view their own geofences
  - Users can insert new geofences
  - Users can update their own geofences
  - Users can delete their own geofences

  ## 3. Indexes

  Performance indexes are created on:
  - Foreign key columns for faster joins
  - Timestamp columns for date range queries
  - Location columns for geospatial queries
  - Status and type columns for filtering

  ## 4. Important Notes

  - All timestamps use `timestamptz` for proper timezone handling
  - GPS coordinates use `double precision` for accuracy
  - Foreign keys have CASCADE delete to maintain referential integrity
  - Default values are set for boolean and timestamp columns
  - Unique constraints on license_plate to prevent duplicates
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'driver' CHECK (role IN ('admin', 'fleet_manager', 'driver')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  license_plate text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer,
  color text,
  vin text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_location_lat double precision,
  last_location_lng double precision,
  last_seen timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tracking_history table
CREATE TABLE IF NOT EXISTS tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision DEFAULT 0,
  heading double precision,
  altitude double precision,
  accuracy double precision,
  timestamp timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('geofence', 'speed', 'offline', 'maintenance')),
  title text NOT NULL,
  message text,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read boolean DEFAULT false,
  triggered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  radius double precision NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_seen ON vehicles(last_seen);
CREATE INDEX IF NOT EXISTS idx_tracking_history_vehicle_id ON tracking_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON tracking_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tracking history policies
CREATE POLICY "Users can view tracking history for own vehicles"
  ON tracking_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = tracking_history.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert tracking data"
  ON tracking_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = tracking_history.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Alerts policies
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Geofences policies
CREATE POLICY "Users can view own geofences"
  ON geofences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own geofences"
  ON geofences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own geofences"
  ON geofences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own geofences"
  ON geofences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();