// Types générés à partir du schéma Supabase
// Tu peux générer ces types automatiquement avec: npx supabase gen types typescript --project-id=xxx > types/database.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          role: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          role?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          role?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      game_progress: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          level_id: string;
          completed: boolean;
          score: number | null;
          time_seconds: number | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_type: string;
          level_id: string;
          completed?: boolean;
          score?: number | null;
          time_seconds?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_type?: string;
          level_id?: string;
          completed?: boolean;
          score?: number | null;
          time_seconds?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plays: {
        Row: {
          id: string;
          user_id: string;
          level_id: string;
          started_at: string;
          completed_at: string | null;
          status: string;
          success: boolean | null;
          moves: number | null;
          time_spent_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level_id: string;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          success?: boolean | null;
          moves?: number | null;
          time_spent_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level_id?: string;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          success?: boolean | null;
          moves?: number | null;
          time_spent_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Types utilitaires
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type GameProgress = Database["public"]["Tables"]["game_progress"]["Row"];
export type GameProgressInsert =
  Database["public"]["Tables"]["game_progress"]["Insert"];
export type GameProgressUpdate =
  Database["public"]["Tables"]["game_progress"]["Update"];
