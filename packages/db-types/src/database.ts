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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      document_parsing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          document_id: number | null
          error: string | null
          id: number
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_id?: number | null
          error?: string | null
          id?: number
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_id?: number | null
          error?: string | null
          id?: number
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_parsing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          doc_id: string | null
          file_name: string
          file_size: number | null
          id: number
          md_storage_path: string | null
          mime_type: string | null
          org_id: string | null
          page_count: number | null
          project_id: string | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_id?: string | null
          file_name: string
          file_size?: number | null
          id?: number
          md_storage_path?: string | null
          mime_type?: string | null
          org_id?: string | null
          page_count?: number | null
          project_id?: string | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_id?: string | null
          file_name?: string
          file_size?: number | null
          id?: number
          md_storage_path?: string | null
          mime_type?: string | null
          org_id?: string | null
          page_count?: number | null
          project_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          added_by: string | null
          created_at: string
          document_id: number | null
          id: number
          observation_id: number | null
          page: number | null
          property_key: string | null
          quote: string | null
          reference: string | null
          schema_field_id: number
          screening_id: number
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          document_id?: number | null
          id?: never
          observation_id?: number | null
          page?: number | null
          property_key?: string | null
          quote?: string | null
          reference?: string | null
          schema_field_id: number
          screening_id: number
        }
        Update: {
          added_by?: string | null
          created_at?: string
          document_id?: number | null
          id?: never
          observation_id?: number | null
          page?: number | null
          property_key?: string | null
          quote?: string | null
          reference?: string | null
          schema_field_id?: number
          screening_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_values: {
        Row: {
          property_key: string
          schema_field_id: number
          screening_id: number
          set_by: string | null
          source: Database["public"]["Enums"]["fact_source"]
          updated_at: string
          value: Json
        }
        Insert: {
          property_key: string
          schema_field_id: number
          screening_id: number
          set_by?: string | null
          source: Database["public"]["Enums"]["fact_source"]
          updated_at?: string
          value: Json
        }
        Update: {
          property_key?: string
          schema_field_id?: number
          screening_id?: number
          set_by?: string | null
          source?: Database["public"]["Enums"]["fact_source"]
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fact_values_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_values_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      field_review_events: {
        Row: {
          actor: string | null
          created_at: string
          from_score: number | null
          id: number
          schema_field_id: number
          screening_id: number
          text: string | null
          to_score: number | null
          type: Database["public"]["Enums"]["review_event_type"]
        }
        Insert: {
          actor?: string | null
          created_at?: string
          from_score?: number | null
          id?: never
          schema_field_id: number
          screening_id: number
          text?: string | null
          to_score?: number | null
          type: Database["public"]["Enums"]["review_event_type"]
        }
        Update: {
          actor?: string | null
          created_at?: string
          from_score?: number | null
          id?: never
          schema_field_id?: number
          screening_id?: number
          text?: string | null
          to_score?: number | null
          type?: Database["public"]["Enums"]["review_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "field_review_events_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_review_events_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      field_reviews: {
        Row: {
          ai_score: number | null
          rationale: string
          reviewed_at: string
          reviewed_by: string | null
          schema_field_id: number
          score: number
          screening_id: number
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          ai_score?: number | null
          rationale?: string
          reviewed_at?: string
          reviewed_by?: string | null
          schema_field_id: number
          score: number
          screening_id: number
          status: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          ai_score?: number | null
          rationale?: string
          reviewed_at?: string
          reviewed_by?: string | null
          schema_field_id?: number
          score?: number
          screening_id?: number
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "field_reviews_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_reviews_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: number | null
          gap_description: string | null
          id: number
          is_gap: boolean | null
          name: string | null
          observation_description: string | null
          observation_type: string | null
          schema_field_id: number | null
          score_impact: number | null
          screening_id: number | null
          source_reference: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id?: number | null
          gap_description?: string | null
          id?: number
          is_gap?: boolean | null
          name?: string | null
          observation_description?: string | null
          observation_type?: string | null
          schema_field_id?: number | null
          score_impact?: number | null
          screening_id?: number | null
          source_reference?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: number | null
          gap_description?: string | null
          id?: number
          is_gap?: boolean | null
          name?: string | null
          observation_description?: string | null
          observation_type?: string | null
          schema_field_id?: number | null
          score_impact?: number | null
          screening_id?: number | null
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      org_user: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_user_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          last_org_id: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_org_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_org_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_org_id_fkey"
            columns: ["last_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          author: string | null
          body: string
          created_at: string
          id: number
          project_id: string
        }
        Insert: {
          author?: string | null
          body: string
          created_at?: string
          id?: never
          project_id: string
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string
          id?: never
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          org_id: string
          screening_score: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          org_id: string
          screening_score?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          org_id?: string
          screening_score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organisation_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: number
          name: string
          template_id: number | null
          weight: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: number
          name: string
          template_id?: number | null
          weight?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: number
          name?: string
          template_id?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_categories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schema_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schema_categories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_field: {
        Row: {
          category_id: number | null
          created_at: string
          created_by: string | null
          display_order: number | null
          extraction_description: string | null
          gap_description: string | null
          id: number
          is_dealbreaker: boolean | null
          is_required: boolean | null
          name: string
          output_schema: Json | null
          semantic_id: string | null
          weight: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          extraction_description?: string | null
          gap_description?: string | null
          id?: number
          is_dealbreaker?: boolean | null
          is_required?: boolean | null
          name: string
          output_schema?: Json | null
          semantic_id?: string | null
          weight?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          extraction_description?: string | null
          gap_description?: string | null
          id?: number
          is_dealbreaker?: boolean | null
          is_required?: boolean | null
          name?: string
          output_schema?: Json | null
          semantic_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_field_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "schema_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          name: string | null
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          name?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          name?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_assessments: {
        Row: {
          author: string | null
          conclusion: string
          recommendation: Database["public"]["Enums"]["recommendation"] | null
          screening_id: number
          status: Database["public"]["Enums"]["assessment_status"]
          updated_at: string
        }
        Insert: {
          author?: string | null
          conclusion?: string
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          screening_id: number
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
        }
        Update: {
          author?: string | null
          conclusion?: string
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          screening_id?: number
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_assessments_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: true
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_documents: {
        Row: {
          created_at: string
          document_id: number
          screening_id: number
        }
        Insert: {
          created_at?: string
          document_id: number
          screening_id: number
        }
        Update: {
          created_at?: string
          document_id?: number
          screening_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "screening_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_documents_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      screenings: {
        Row: {
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: number
          name: string | null
          project_id: string | null
          schema_template_id: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["screening_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: number
          name?: string | null
          project_id?: string | null
          schema_template_id?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["screening_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: number
          name?: string | null
          project_id?: string | null
          schema_template_id?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["screening_status"]
        }
        Relationships: [
          {
            foreignKeyName: "screenings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_schema_template_id_fkey"
            columns: ["schema_template_id"]
            isOneToOne: false
            referencedRelation: "schema_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_schema_template_id_fkey"
            columns: ["schema_template_id"]
            isOneToOne: false
            referencedRelation: "template_overview"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_activity: {
        Row: {
          actor: string | null
          body: string | null
          created_at: string | null
          id: string | null
          project_id: string | null
          subject: string | null
          type: string | null
        }
        Relationships: []
      }
      project_overview: {
        Row: {
          created_at: string | null
          document_count: number | null
          id: string | null
          last_screened_at: string | null
          name: string | null
          org_id: string | null
          screening_count: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_count?: never
          id?: string | null
          last_screened_at?: never
          name?: string | null
          org_id?: string | null
          screening_count?: never
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_count?: never
          id?: string | null
          last_screened_at?: never
          name?: string | null
          org_id?: string | null
          screening_count?: never
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organisation_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_field_results: {
        Row: {
          ai_score: number | null
          confidence: number | null
          finding: string | null
          gap_note: string | null
          is_gap: boolean | null
          observation_count: number | null
          schema_field_id: number | null
          screening_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "schema_field"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      template_overview: {
        Row: {
          category_count: number | null
          created_at: string | null
          dealbreaker_count: number | null
          description: string | null
          field_count: number | null
          gap_field_count: number | null
          id: number | null
          name: string | null
          org_id: string | null
          required_count: number | null
          screening_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      duplicate_template: {
        Args: { p_name?: string; p_template_id: number }
        Returns: number
      }
    }
    Enums: {
      assessment_status: "draft" | "final"
      fact_source: "ai" | "reviewer"
      org_member_role: "owner" | "admin" | "member"
      recommendation: "go" | "hold" | "no_go"
      review_event_type:
        | "accepted"
        | "overridden"
        | "follow_up"
        | "reopened"
        | "evidence_added"
        | "fact_updated"
        | "manual"
      review_status: "accepted" | "overridden" | "follow_up" | "manual"
      screening_status: "draft" | "in_progress" | "review" | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      assessment_status: ["draft", "final"],
      fact_source: ["ai", "reviewer"],
      org_member_role: ["owner", "admin", "member"],
      recommendation: ["go", "hold", "no_go"],
      review_event_type: [
        "accepted",
        "overridden",
        "follow_up",
        "reopened",
        "evidence_added",
        "fact_updated",
        "manual",
      ],
      review_status: ["accepted", "overridden", "follow_up", "manual"],
      screening_status: ["draft", "in_progress", "review", "completed"],
    },
  },
} as const
