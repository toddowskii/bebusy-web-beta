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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          group_id: string | null
          parent_message_id: string | null
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
          conversation_id?: string | null
          group_id?: string | null
          parent_message_id?: string | null
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
          conversation_id?: string | null
          group_id?: string | null
          parent_message_id?: string | null
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
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          like_notifications: boolean
          comment_notifications: boolean
          follow_notifications: boolean
          message_notifications: boolean
          group_notifications: boolean
          mention_notifications: boolean
          profile_visibility: 'public' | 'private' | 'friends'
          show_online_status: boolean
          allow_messages_from: 'everyone' | 'followers' | 'none'
          allow_tags: boolean
          show_activity: boolean
          language: string
          theme: 'dark' | 'light' | 'auto'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          like_notifications?: boolean
          comment_notifications?: boolean
          follow_notifications?: boolean
          message_notifications?: boolean
          group_notifications?: boolean
          mention_notifications?: boolean
          profile_visibility?: 'public' | 'private' | 'friends'
          show_online_status?: boolean
          allow_messages_from?: 'everyone' | 'followers' | 'none'
          allow_tags?: boolean
          show_activity?: boolean
          language?: string
          theme?: 'dark' | 'light' | 'auto'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          like_notifications?: boolean
          comment_notifications?: boolean
          follow_notifications?: boolean
          message_notifications?: boolean
          group_notifications?: boolean
          mention_notifications?: boolean
          profile_visibility?: 'public' | 'private' | 'friends'
          show_online_status?: boolean
          allow_messages_from?: 'everyone' | 'followers' | 'none'
          allow_tags?: boolean
          show_activity?: boolean
          language?: string
          theme?: 'dark' | 'light' | 'auto'
          created_at?: string
          updated_at?: string
        }
      }
      blocked_users: {
        Row: {
          id: string
          user_id: string
          blocked_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blocked_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          blocked_user_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_post_id: string | null
          reported_comment_id: string | null
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_post_id?: string | null
          reported_comment_id?: string | null
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_post_id?: string | null
          reported_comment_id?: string | null
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
      daily_check_ins: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          today_goal: string
          yesterday_completed: string | null
          is_completed: boolean
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          today_goal: string
          yesterday_completed?: string | null
          is_completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string | null
          today_goal?: string
          yesterday_completed?: string | null
          is_completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_check_in_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_check_in_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_check_in_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          image_url: string | null
          project_url: string | null
          technologies: string[] | null
          completed_at: string
          is_featured: boolean
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          technologies?: string[] | null
          completed_at?: string
          is_featured?: boolean
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          technologies?: string[] | null
          completed_at?: string
          is_featured?: boolean
          likes_count?: number
          created_at?: string
          updated_at?: string
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
