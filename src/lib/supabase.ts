import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'fleet_manager' | 'driver';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'fleet_manager' | 'driver';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'fleet_manager' | 'driver';
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          license_plate: string;
          brand: string;
          model: string;
          year: number | null;
          color: string | null;
          vin: string | null;
          status: 'active' | 'inactive' | 'maintenance';
          last_location_lat: number | null;
          last_location_lng: number | null;
          last_seen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          license_plate: string;
          brand: string;
          model: string;
          year?: number | null;
          color?: string | null;
          vin?: string | null;
          status?: 'active' | 'inactive' | 'maintenance';
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          license_plate?: string;
          brand?: string;
          model?: string;
          year?: number | null;
          color?: string | null;
          vin?: string | null;
          status?: 'active' | 'inactive' | 'maintenance';
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tracking_history: {
        Row: {
          id: string;
          vehicle_id: string;
          latitude: number;
          longitude: number;
          speed: number;
          heading: number | null;
          altitude: number | null;
          accuracy: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          latitude: number;
          longitude: number;
          speed?: number;
          heading?: number | null;
          altitude?: number | null;
          accuracy?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          latitude?: number;
          longitude?: number;
          speed?: number;
          heading?: number | null;
          altitude?: number | null;
          accuracy?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          vehicle_id: string | null;
          user_id: string;
          type: 'geofence' | 'speed' | 'offline' | 'maintenance';
          title: string;
          message: string | null;
          severity: 'info' | 'warning' | 'critical';
          is_read: boolean;
          triggered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id?: string | null;
          user_id: string;
          type: 'geofence' | 'speed' | 'offline' | 'maintenance';
          title: string;
          message?: string | null;
          severity?: 'info' | 'warning' | 'critical';
          is_read?: boolean;
          triggered_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string | null;
          user_id?: string;
          type?: 'geofence' | 'speed' | 'offline' | 'maintenance';
          title?: string;
          message?: string | null;
          severity?: 'info' | 'warning' | 'critical';
          is_read?: boolean;
          triggered_at?: string;
          created_at?: string;
        };
      };
      geofences: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          center_lat: number;
          center_lng: number;
          radius: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          center_lat: number;
          center_lng: number;
          radius: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          center_lat?: number;
          center_lng?: number;
          radius?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
