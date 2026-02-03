// Database type definitions for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          username: string | null
          avatar_url: string | null
          cover_url: string | null
          bio: string | null
          role: string | null
          current_focus: string | null
          followers_count: number
          following_count: number
          posts_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          username?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          role?: string | null
          current_focus?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          username?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          role?: string | null
          current_focus?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          group_id: string | null
          likes_count: number
          comments_count: number
          shares_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          group_id?: string | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          group_id?: string | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string | null
          members_count: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          image_url?: string | null
          members_count?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string | null
          members_count?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      focus_groups: {
        Row: {
          id: string
          title: string
          description: string
          mentor_id: string | null
          mentor_name: string
          mentor_role: string
          mentor_image_url: string | null
          group_id: string | null
          total_spots: number
          available_spots: number
          is_full: boolean
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          mentor_id?: string | null
          mentor_name: string
          mentor_role: string
          mentor_image_url?: string | null
          group_id?: string | null
          total_spots: number
          available_spots: number
          is_full?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          mentor_id?: string | null
          mentor_name?: string
          mentor_role?: string
          mentor_image_url?: string | null
          group_id?: string | null
          total_spots?: number
          available_spots?: number
          is_full?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string | null
          is_read: boolean
          created_at: string
          file_url: string | null
          file_type: string | null
          file_name: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          is_read?: boolean
          created_at?: string
          file_url?: string | null
          file_type?: string | null
          file_name?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          is_read?: boolean
          created_at?: string
          file_url?: string | null
          file_type?: string | null
          file_name?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          related_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      followers: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          category?: string
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
