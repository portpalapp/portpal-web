export type Database = {
  public: {
    Tables: {
      // =============================================
      // TIER 1: Reference Tables (system-managed)
      // =============================================
      differential_classes: {
        Row: {
          id: string;
          amount: number;
          description: string | null;
        };
        Insert: {
          id: string;
          amount: number;
          description?: string | null;
        };
        Update: {
          amount?: number;
          description?: string | null;
        };
      };
      jobs: {
        Row: {
          id: number;
          name: string;
          differential_class_id: string | null;
          differential_amount: number;
          sort_order: number;
        };
        Insert: {
          name: string;
          differential_class_id?: string | null;
          differential_amount?: number;
          sort_order?: number;
        };
        Update: {
          name?: string;
          differential_class_id?: string | null;
          differential_amount?: number;
          sort_order?: number;
        };
      };
      locations: {
        Row: {
          id: number;
          name: string;
          location_type: string;
          default_day_hours: number;
          default_night_hours: number;
          default_graveyard_hours: number;
          sort_order: number;
        };
        Insert: {
          name: string;
          location_type?: string;
          default_day_hours?: number;
          default_night_hours?: number;
          default_graveyard_hours?: number;
          sort_order?: number;
        };
        Update: {
          name?: string;
          location_type?: string;
          default_day_hours?: number;
          default_night_hours?: number;
          default_graveyard_hours?: number;
          sort_order?: number;
        };
      };
      subjobs: {
        Row: {
          id: number;
          job_name: string;
          name: string;
        };
        Insert: {
          job_name: string;
          name: string;
        };
        Update: {
          job_name?: string;
          name?: string;
        };
      };
      contract_years: {
        Row: {
          id: number;
          year_number: number;
          effective_start: string;
          effective_end: string;
          stbr: number;
          holiday_rate: number;
        };
        Insert: {
          year_number: number;
          effective_start: string;
          effective_end: string;
          stbr: number;
          holiday_rate: number;
        };
        Update: {
          year_number?: number;
          effective_start?: string;
          effective_end?: string;
          stbr?: number;
          holiday_rate?: number;
        };
      };
      base_rates: {
        Row: {
          id: number;
          contract_year_id: number;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          day_type: 'MON-FRI' | 'SAT' | 'SUN-HOL';
          regular_rate: number;
          overtime_rate: number;
          double_time_rate: number;
        };
        Insert: {
          contract_year_id: number;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          day_type: 'MON-FRI' | 'SAT' | 'SUN-HOL';
          regular_rate: number;
          overtime_rate: number;
          double_time_rate: number;
        };
        Update: {
          contract_year_id?: number;
          shift?: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          day_type?: 'MON-FRI' | 'SAT' | 'SUN-HOL';
          regular_rate?: number;
          overtime_rate?: number;
          double_time_rate?: number;
        };
      };
      hour_overrides: {
        Row: {
          id: number;
          job_name: string;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          location_name: string;
          subjob_name: string;
          reg_hours: number;
          ot_hours: number;
        };
        Insert: {
          job_name: string;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          location_name: string;
          subjob_name?: string;
          reg_hours: number;
          ot_hours?: number;
        };
        Update: {
          job_name?: string;
          shift?: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          location_name?: string;
          subjob_name?: string;
          reg_hours?: number;
          ot_hours?: number;
        };
      };
      // =============================================
      // TIER 2: User Tables (RLS-protected)
      // =============================================
      profiles: {
        Row: {
          id: string;
          name: string | null;
          seniority: number | null;
          board: string;
          pension_goal: number;
          union_local: string;
          home_terminal: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          seniority?: number | null;
          board?: string;
          pension_goal?: number;
          union_local?: string;
          home_terminal?: string | null;
        };
        Update: {
          name?: string | null;
          seniority?: number | null;
          board?: string;
          pension_goal?: number;
          union_local?: string;
          home_terminal?: string | null;
        };
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          day_of_week: number;           // Auto-computed from date (0=Sun, 6=Sat)
          job: string;
          location: string;
          subjob: string | null;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          reg_hours: number;
          ot_hours: number;
          dt_hours: number;
          reg_rate: number;
          ot_rate: number;
          dt_rate: number | null;
          total_pay: number;             // User-reported
          expected_pay: number | null;   // System-calculated via trigger
          notes: string | null;
          vessel: string | null;
          foreman: string | null;
          verification_status: 'UNVERIFIED' | 'VERIFIED' | 'DISCREPANCY';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          // day_of_week is GENERATED, do not insert
          job: string;
          location: string;
          subjob?: string | null;
          shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          reg_hours: number;
          ot_hours: number;
          dt_hours?: number;
          reg_rate: number;
          ot_rate: number;
          dt_rate?: number | null;
          total_pay: number;
          // expected_pay is computed by trigger
          notes?: string | null;
          vessel?: string | null;
          foreman?: string | null;
          verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'DISCREPANCY';
        };
        Update: {
          date?: string;
          job?: string;
          location?: string;
          subjob?: string | null;
          shift?: 'DAY' | 'NIGHT' | 'GRAVEYARD';
          reg_hours?: number;
          ot_hours?: number;
          dt_hours?: number;
          reg_rate?: number;
          ot_rate?: number;
          dt_rate?: number | null;
          total_pay?: number;
          notes?: string | null;
          vessel?: string | null;
          foreman?: string | null;
          verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'DISCREPANCY';
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          job: string;
          location: string;
          subjob: string | null;
          shift: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          job: string;
          location: string;
          subjob?: string | null;
          shift: string;
        };
        Update: {
          name?: string;
          job?: string;
          location?: string;
          subjob?: string | null;
          shift?: string;
        };
      };
      custom_locations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
      };
      // =============================================
      // Public Reference: Vessels (read-only via RLS)
      // =============================================
      vessels: {
        Row: {
          imo: number;
          name: string;
          year_built: number | null;
          teu: number | null;
          bays: number | null;
          width: number | null;
          deck_lashing: string[];
          walkways: string[];
          lashing: string[];
          bars: string[];
          turnbuckles: string[];
          stackers: string[];
          notes: string[];
          former_names: string | null;
          raw_html: string | null;
          scraped_at: string;
          updated_at: string;
        };
        Insert: never; // Read-only from app — scraper writes via direct PG
        Update: never;
      };
      // =============================================
      // TIER 3: ML / Analytics Tables
      // =============================================
      pay_verifications: {
        Row: {
          id: string;
          user_id: string;
          shift_id: string;
          stub_image_url: string | null;
          stub_amount: number | null;
          calculated_amount: number | null;
          discrepancy: number | null;    // Auto-computed (stub - calculated)
          status: 'PENDING' | 'MATCH' | 'DISCREPANCY' | 'RESOLVED';
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shift_id: string;
          stub_image_url?: string | null;
          stub_amount?: number | null;
          calculated_amount?: number | null;
          // discrepancy is GENERATED
          status?: 'PENDING' | 'MATCH' | 'DISCREPANCY' | 'RESOLVED';
          resolution_notes?: string | null;
        };
        Update: {
          stub_image_url?: string | null;
          stub_amount?: number | null;
          calculated_amount?: number | null;
          status?: 'PENDING' | 'MATCH' | 'DISCREPANCY' | 'RESOLVED';
          resolution_notes?: string | null;
        };
      };
    };
  };
};
