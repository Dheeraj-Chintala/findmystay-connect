export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          hostel_id: string
          id: string
          message: string | null
          move_in_date: string | null
          phone: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hostel_id: string
          id?: string
          message?: string | null
          move_in_date?: string | null
          phone?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hostel_id?: string
          id?: string
          message?: string | null
          move_in_date?: string | null
          phone?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          ac: boolean | null
          cctv: boolean | null
          common_kitchen: boolean | null
          food: boolean | null
          geyser: boolean | null
          gym: boolean | null
          hostel_id: string
          housekeeping: boolean | null
          id: string
          laundry: boolean | null
          parking: boolean | null
          pool: boolean | null
          power_backup: boolean | null
          study_room: boolean | null
          washing_machine: boolean | null
          wifi: boolean | null
        }
        Insert: {
          ac?: boolean | null
          cctv?: boolean | null
          common_kitchen?: boolean | null
          food?: boolean | null
          geyser?: boolean | null
          gym?: boolean | null
          hostel_id: string
          housekeeping?: boolean | null
          id?: string
          laundry?: boolean | null
          parking?: boolean | null
          pool?: boolean | null
          power_backup?: boolean | null
          study_room?: boolean | null
          washing_machine?: boolean | null
          wifi?: boolean | null
        }
        Update: {
          ac?: boolean | null
          cctv?: boolean | null
          common_kitchen?: boolean | null
          food?: boolean | null
          geyser?: boolean | null
          gym?: boolean | null
          hostel_id?: string
          housekeeping?: boolean | null
          id?: string
          laundry?: boolean | null
          parking?: boolean | null
          pool?: boolean | null
          power_backup?: boolean | null
          study_room?: boolean | null
          washing_machine?: boolean | null
          wifi?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: true
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          admin_notes: string | null
          created_at: string
          flags: Json
          hostel_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          flags?: Json
          hostel_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          flags?: Json
          hostel_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_images: {
        Row: {
          display_order: number | null
          hostel_id: string
          id: string
          image_url: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          display_order?: number | null
          hostel_id: string
          id?: string
          image_url: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          display_order?: number | null
          hostel_id?: string
          id?: string
          image_url?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_images_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_videos: {
        Row: {
          created_at: string
          display_order: number | null
          hostel_id: string
          id: string
          uploaded_by: string
          video_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          hostel_id: string
          id?: string
          uploaded_by?: string
          video_url: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          hostel_id?: string
          id?: string
          uploaded_by?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_videos_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          city: string
          created_at: string
          description: string | null
          gender: string
          hostel_name: string
          id: string
          is_active: boolean
          latitude: number | null
          location: string
          longitude: number | null
          media_verification_badge: string | null
          owner_id: string
          price_max: number
          price_min: number
          property_type: string
          rating: number | null
          review_count: number | null
          updated_at: string
          verified_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          gender?: string
          hostel_name: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          media_verification_badge?: string | null
          owner_id: string
          price_max?: number
          price_min?: number
          property_type?: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          verified_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          gender?: string
          hostel_name?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          media_verification_badge?: string | null
          owner_id?: string
          price_max?: number
          price_min?: number
          property_type?: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          verified_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      laundry_order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          price: number
          quantity: number
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          price?: number
          quantity?: number
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          price?: number
          quantity?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laundry_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "laundry_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laundry_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "laundry_services"
            referencedColumns: ["id"]
          },
        ]
      }
      laundry_orders: {
        Row: {
          created_at: string
          delivery_time: string | null
          hostel_id: string | null
          id: string
          notes: string | null
          pickup_time: string | null
          status: Database["public"]["Enums"]["laundry_order_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_time?: string | null
          hostel_id?: string | null
          id?: string
          notes?: string | null
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["laundry_order_status"]
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_time?: string | null
          hostel_id?: string | null
          id?: string
          notes?: string | null
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["laundry_order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laundry_orders_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      laundry_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laundry_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "laundry_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      laundry_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      lifestyle_clicks: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          redirect_url: string
          service_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          redirect_url: string
          service_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          redirect_url?: string
          service_name?: string
          user_id?: string
        }
        Relationships: []
      }
      media_verification_requests: {
        Row: {
          admin_notes: string | null
          areas_to_capture: string[] | null
          assigned_pr_member: string | null
          created_at: string
          hostel_id: string
          id: string
          owner_id: string
          requested_date: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["media_verification_status"]
          updated_at: string
          verification_type: Database["public"]["Enums"]["media_verification_type"]
        }
        Insert: {
          admin_notes?: string | null
          areas_to_capture?: string[] | null
          assigned_pr_member?: string | null
          created_at?: string
          hostel_id: string
          id?: string
          owner_id: string
          requested_date?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["media_verification_status"]
          updated_at?: string
          verification_type: Database["public"]["Enums"]["media_verification_type"]
        }
        Update: {
          admin_notes?: string | null
          areas_to_capture?: string[] | null
          assigned_pr_member?: string | null
          created_at?: string
          hostel_id?: string
          id?: string
          owner_id?: string
          requested_date?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["media_verification_status"]
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["media_verification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "media_verification_requests_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number
          contact: string
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          contact: string
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          contact?: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          full_name: string
          hostel_name: string | null
          id: string
          occupation: string | null
          onboarding_complete: boolean | null
          phone: string | null
          preferred_location: string | null
          property_location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          hostel_name?: string | null
          id?: string
          occupation?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          preferred_location?: string | null
          property_location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          hostel_name?: string | null
          id?: string
          occupation?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          preferred_location?: string | null
          property_location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_points: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_points?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_points?: number
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number | null
          hostel_id: string
          id: string
          is_verified: boolean | null
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          hostel_id: string
          id?: string
          is_verified?: boolean | null
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          hostel_id?: string
          id?: string
          is_verified?: boolean | null
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          available_beds: number
          created_at: string
          hostel_id: string
          id: string
          price_per_month: number
          sharing_type: string
          total_beds: number
        }
        Insert: {
          available_beds?: number
          created_at?: string
          hostel_id: string
          id?: string
          price_per_month: number
          sharing_type: string
          total_beds?: number
        }
        Update: {
          available_beds?: number
          created_at?: string
          hostel_id?: string
          id?: string
          price_per_month?: number
          sharing_type?: string
          total_beds?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_hostels: {
        Row: {
          created_at: string
          hostel_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hostel_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hostel_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_hostels_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          city: string | null
          created_at: string
          filters: Json | null
          id: string
          search_query: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          search_query?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          filters?: Json | null
          id?: string
          search_query?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          id: string
          preferred_city: string | null
          preferred_facilities: string[] | null
          preferred_gender: string | null
          preferred_location: string | null
          preferred_sharing: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          id?: string
          preferred_city?: string | null
          preferred_facilities?: string[] | null
          preferred_gender?: string | null
          preferred_location?: string | null
          preferred_sharing?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          id?: string
          preferred_city?: string | null
          preferred_facilities?: string[] | null
          preferred_gender?: string | null
          preferred_location?: string | null
          preferred_sharing?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallet: {
        Row: {
          cash_value: number
          id: string
          reward_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_value?: number
          id?: string
          reward_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_value?: number
          id?: string
          reward_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          government_id_url: string | null
          hostel_id: string
          id: string
          owner_id: string
          ownership_proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          government_id_url?: string | null
          hostel_id: string
          id?: string
          owner_id: string
          ownership_proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          government_id_url?: string | null
          hostel_id?: string
          id?: string
          owner_id?: string
          ownership_proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_media: {
        Row: {
          capture_step: string | null
          capture_timestamp: string | null
          created_at: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          media_type: string
          media_url: string
          metadata: Json | null
          request_id: string
          uploader_id: string
        }
        Insert: {
          capture_step?: string | null
          capture_timestamp?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          media_type?: string
          media_url: string
          metadata?: Json | null
          request_id: string
          uploader_id: string
        }
        Update: {
          capture_step?: string | null
          capture_timestamp?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          media_type?: string
          media_url?: string
          metadata?: Json | null
          request_id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_media_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "media_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user" | "owner_pending"
      booking_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "completed"
      laundry_order_status:
        | "order_placed"
        | "pickup_scheduled"
        | "in_progress"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      media_verification_status:
        | "pending"
        | "scheduled"
        | "under_review"
        | "platform_verified"
        | "owner_verified"
        | "ai_check"
        | "admin_review"
        | "rejected"
      media_verification_type: "pr_team" | "self_capture"
      verification_status: "pending" | "under_review" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "user", "owner_pending"],
      booking_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ],
      laundry_order_status: [
        "order_placed",
        "pickup_scheduled",
        "in_progress",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      media_verification_status: [
        "pending",
        "scheduled",
        "under_review",
        "platform_verified",
        "owner_verified",
        "ai_check",
        "admin_review",
        "rejected",
      ],
      media_verification_type: ["pr_team", "self_capture"],
      verification_status: ["pending", "under_review", "verified", "rejected"],
    },
  },
} as const
