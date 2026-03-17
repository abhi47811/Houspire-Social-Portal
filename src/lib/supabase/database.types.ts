export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      sm_activity: {
        Row: { action: string; actor_id: string | null; created_at: string | null; details: Json | null; entity_id: string | null; entity_title: string | null; entity_type: string; id: string }
        Insert: { action: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; entity_id?: string | null; entity_title?: string | null; entity_type: string; id?: string }
        Update: { action?: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; entity_id?: string | null; entity_title?: string | null; entity_type?: string; id?: string }
        Relationships: []
      }
      sm_api_rate_limits: {
        Row: { endpoint: string; id: string; request_count: number; user_id: string; window_start: string }
        Insert: { endpoint: string; id?: string; request_count?: number; user_id: string; window_start?: string }
        Update: { endpoint?: string; id?: string; request_count?: number; user_id?: string; window_start?: string }
        Relationships: []
      }
      sm_audit_log: {
        Row: { action: string; actor_id: string | null; created_at: string | null; details: Json | null; id: string; new_values: Json | null; old_values: Json | null; resource_id: string | null; resource_title: string | null; resource_type: string }
        Insert: { action: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; id?: string; new_values?: Json | null; old_values?: Json | null; resource_id?: string | null; resource_title?: string | null; resource_type: string }
        Update: { action?: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; id?: string; new_values?: Json | null; old_values?: Json | null; resource_id?: string | null; resource_title?: string | null; resource_type?: string }
        Relationships: []
      }
      sm_automation_runs: {
        Row: { actions_executed: Json | null; automation_id: string | null; created_at: string | null; duration_ms: number | null; error_message: string | null; id: string; success: boolean | null; trigger_data: Json | null; trigger_event: string | null }
        Insert: { actions_executed?: Json | null; automation_id?: string | null; created_at?: string | null; duration_ms?: number | null; error_message?: string | null; id?: string; success?: boolean | null; trigger_data?: Json | null; trigger_event?: string | null }
        Update: { actions_executed?: Json | null; automation_id?: string | null; created_at?: string | null; duration_ms?: number | null; error_message?: string | null; id?: string; success?: boolean | null; trigger_data?: Json | null; trigger_event?: string | null }
        Relationships: []
      }
      sm_automations: {
        Row: { actions: Json | null; created_at: string | null; created_by: string | null; description: string | null; id: string; is_active: boolean | null; last_run_at: string | null; name: string; run_count: number | null; trigger_conditions: Json | null; trigger_event: string; updated_at: string | null; workspace_id: string | null }
        Insert: { actions?: Json | null; created_at?: string | null; created_by?: string | null; description?: string | null; id?: string; is_active?: boolean | null; last_run_at?: string | null; name: string; run_count?: number | null; trigger_conditions?: Json | null; trigger_event: string; updated_at?: string | null; workspace_id?: string | null }
        Update: { actions?: Json | null; created_at?: string | null; created_by?: string | null; description?: string | null; id?: string; is_active?: boolean | null; last_run_at?: string | null; name?: string; run_count?: number | null; trigger_conditions?: Json | null; trigger_event?: string; updated_at?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_brand_kit: {
        Row: { accent_color: string | null; background_color: string | null; created_at: string | null; cta_phrases: Json | null; donts: Json | null; dos: Json | null; emoji_style: string | null; hashtag_bank: Json | null; id: string; logo_dark_id: string | null; logo_icon_id: string | null; logo_light_id: string | null; primary_color: string | null; primary_font: string | null; sample_captions: Json | null; secondary_color: string | null; secondary_font: string | null; target_audience: string | null; text_color: string | null; updated_at: string | null; voice_description: string | null; voice_style: string | null; watermark_id: string | null; workspace_id: string | null }
        Insert: { accent_color?: string | null; background_color?: string | null; created_at?: string | null; cta_phrases?: Json | null; donts?: Json | null; dos?: Json | null; emoji_style?: string | null; hashtag_bank?: Json | null; id?: string; logo_dark_id?: string | null; logo_icon_id?: string | null; logo_light_id?: string | null; primary_color?: string | null; primary_font?: string | null; sample_captions?: Json | null; secondary_color?: string | null; secondary_font?: string | null; target_audience?: string | null; text_color?: string | null; updated_at?: string | null; voice_description?: string | null; voice_style?: string | null; watermark_id?: string | null; workspace_id?: string | null }
        Update: { accent_color?: string | null; background_color?: string | null; created_at?: string | null; cta_phrases?: Json | null; donts?: Json | null; dos?: Json | null; emoji_style?: string | null; hashtag_bank?: Json | null; id?: string; logo_dark_id?: string | null; logo_icon_id?: string | null; logo_light_id?: string | null; primary_color?: string | null; primary_font?: string | null; sample_captions?: Json | null; secondary_color?: string | null; secondary_font?: string | null; target_audience?: string | null; text_color?: string | null; updated_at?: string | null; voice_description?: string | null; voice_style?: string | null; watermark_id?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_brand_settings: {
        Row: { accent_color: string | null; brand_voice: string | null; content_pillars: string[] | null; font_body: string | null; font_heading: string | null; id: string; logo_url: string | null; primary_color: string | null; secondary_color: string | null; tone_of_voice: string | null; updated_at: string | null; workspace_id: string | null }
        Insert: { accent_color?: string | null; brand_voice?: string | null; content_pillars?: string[] | null; font_body?: string | null; font_heading?: string | null; id?: string; logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null; tone_of_voice?: string | null; updated_at?: string | null; workspace_id?: string | null }
        Update: { accent_color?: string | null; brand_voice?: string | null; content_pillars?: string[] | null; font_body?: string | null; font_heading?: string | null; id?: string; logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null; tone_of_voice?: string | null; updated_at?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_competitor_metrics: {
        Row: { avg_comments: number | null; avg_engagement_rate: number | null; avg_likes: number | null; competitor_id: string | null; created_at: string | null; follower_change: number | null; follower_count: number | null; id: string; metadata: Json | null; platform: string | null; posts_count: number | null; snapshot_date: string; top_post_likes: number | null; top_post_url: string | null }
        Insert: { avg_comments?: number | null; avg_engagement_rate?: number | null; avg_likes?: number | null; competitor_id?: string | null; created_at?: string | null; follower_change?: number | null; follower_count?: number | null; id?: string; metadata?: Json | null; platform?: string | null; posts_count?: number | null; snapshot_date: string; top_post_likes?: number | null; top_post_url?: string | null }
        Update: { avg_comments?: number | null; avg_engagement_rate?: number | null; avg_likes?: number | null; competitor_id?: string | null; created_at?: string | null; follower_change?: number | null; follower_count?: number | null; id?: string; metadata?: Json | null; platform?: string | null; posts_count?: number | null; snapshot_date?: string; top_post_likes?: number | null; top_post_url?: string | null }
        Relationships: []
      }
      sm_competitors: {
        Row: { created_at: string | null; id: string; instagram_handle: string | null; is_active: boolean | null; linkedin_page_url: string | null; name: string; notes: string | null; updated_at: string | null; website_url: string | null; workspace_id: string | null }
        Insert: { created_at?: string | null; id?: string; instagram_handle?: string | null; is_active?: boolean | null; linkedin_page_url?: string | null; name: string; notes?: string | null; updated_at?: string | null; website_url?: string | null; workspace_id?: string | null }
        Update: { created_at?: string | null; id?: string; instagram_handle?: string | null; is_active?: boolean | null; linkedin_page_url?: string | null; name?: string; notes?: string | null; updated_at?: string | null; website_url?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_daily_metrics: {
        Row: { avg_engagement_rate: number | null; comments: number | null; created_at: string | null; date: string; engagement_rate: number | null; follower_change: number | null; follower_count: number | null; id: string; impressions: number | null; likes: number | null; metadata: Json | null; platform: string; posts_published: number | null; reach: number | null; saves: number | null; shares: number | null; top_post_id: string | null; total_comments: number | null; total_impressions: number | null; total_likes: number | null; total_reach: number | null; total_saves: number | null; total_shares: number | null; workspace_id: string | null }
        Insert: { avg_engagement_rate?: number | null; comments?: number | null; created_at?: string | null; date: string; engagement_rate?: number | null; follower_change?: number | null; follower_count?: number | null; id?: string; impressions?: number | null; likes?: number | null; metadata?: Json | null; platform: string; posts_published?: number | null; reach?: number | null; saves?: number | null; shares?: number | null; top_post_id?: string | null; total_comments?: number | null; total_impressions?: number | null; total_likes?: number | null; total_reach?: number | null; total_saves?: number | null; total_shares?: number | null; workspace_id?: string | null }
        Update: { avg_engagement_rate?: number | null; comments?: number | null; created_at?: string | null; date?: string; engagement_rate?: number | null; follower_change?: number | null; follower_count?: number | null; id?: string; impressions?: number | null; likes?: number | null; metadata?: Json | null; platform?: string; posts_published?: number | null; reach?: number | null; saves?: number | null; shares?: number | null; top_post_id?: string | null; total_comments?: number | null; total_impressions?: number | null; total_likes?: number | null; total_reach?: number | null; total_saves?: number | null; total_shares?: number | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_integrations: {
        Row: { id: string; platform: string; access_token: string | null; account_id: string | null; token_issued_at: string | null; is_connected: boolean | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; platform: string; access_token?: string | null; account_id?: string | null; token_issued_at?: string | null; is_connected?: boolean | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; platform?: string; access_token?: string | null; account_id?: string | null; token_issued_at?: string | null; is_connected?: boolean | null; created_at?: string | null; updated_at?: string | null }
        Relationships: []
      }
      sm_hashtag_analytics: {
        Row: { avg_engagement_rate: number | null; created_at: string | null; hashtag: string; id: string; last_used_at: string | null; platform: string | null; times_used: number | null; total_engagement: number | null; total_impressions: number | null; total_reach: number | null; updated_at: string | null; usage_count: number; workspace_id: string | null }
        Insert: { avg_engagement_rate?: number | null; created_at?: string | null; hashtag: string; id?: string; last_used_at?: string | null; platform?: string | null; times_used?: number | null; total_engagement?: number | null; total_impressions?: number | null; total_reach?: number | null; updated_at?: string | null; usage_count?: number; workspace_id?: string | null }
        Update: { avg_engagement_rate?: number | null; created_at?: string | null; hashtag?: string; id?: string; last_used_at?: string | null; platform?: string | null; times_used?: number | null; total_engagement?: number | null; total_impressions?: number | null; total_reach?: number | null; updated_at?: string | null; usage_count?: number; workspace_id?: string | null }
        Relationships: []
      }
      sm_hashtag_sets: {
        Row: { avg_engagement_rate: number | null; avg_reach: number | null; best_performing_tag: string | null; category: string | null; created_at: string | null; created_by: string | null; description: string | null; hashtags: string[]; id: string; is_active: boolean; is_pinned: boolean | null; name: string; platform: string; times_used: number | null; updated_at: string | null; workspace_id: string | null }
        Insert: { avg_engagement_rate?: number | null; avg_reach?: number | null; best_performing_tag?: string | null; category?: string | null; created_at?: string | null; created_by?: string | null; description?: string | null; hashtags?: string[]; id?: string; is_active?: boolean; is_pinned?: boolean | null; name: string; platform?: string; times_used?: number | null; updated_at?: string | null; workspace_id?: string | null }
        Update: { avg_engagement_rate?: number | null; avg_reach?: number | null; best_performing_tag?: string | null; category?: string | null; created_at?: string | null; created_by?: string | null; description?: string | null; hashtags?: string[]; id?: string; is_active?: boolean; is_pinned?: boolean | null; name?: string; platform?: string; times_used?: number | null; updated_at?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_media: {
        Row: { alt_text: string | null; created_at: string | null; file_name: string; file_path: string; file_size: number; file_type: string; file_url: string; folder: string; height: number | null; id: string; is_archived: boolean; original_name: string; tags: string[] | null; uploaded_by: string | null; width: number | null }
        Insert: { alt_text?: string | null; created_at?: string | null; file_name: string; file_path: string; file_size?: number; file_type: string; file_url: string; folder?: string; height?: number | null; id?: string; is_archived?: boolean; original_name: string; tags?: string[] | null; uploaded_by?: string | null; width?: number | null }
        Update: { alt_text?: string | null; created_at?: string | null; file_name?: string; file_path?: string; file_size?: number; file_type?: string; file_url?: string; folder?: string; height?: number | null; id?: string; is_archived?: boolean; original_name?: string; tags?: string[] | null; uploaded_by?: string | null; width?: number | null }
        Relationships: []
      }
      sm_notifications: {
        Row: { action_url: string | null; actor_id: string | null; body: string | null; created_at: string | null; group_key: string | null; id: string; is_archived: boolean; is_read: boolean; reference_id: string | null; task_id: string | null; title: string; type: string; user_id: string }
        Insert: { action_url?: string | null; actor_id?: string | null; body?: string | null; created_at?: string | null; group_key?: string | null; id?: string; is_archived?: boolean; is_read?: boolean; reference_id?: string | null; task_id?: string | null; title: string; type?: string; user_id: string }
        Update: { action_url?: string | null; actor_id?: string | null; body?: string | null; created_at?: string | null; group_key?: string | null; id?: string; is_archived?: boolean; is_read?: boolean; reference_id?: string | null; task_id?: string | null; title?: string; type?: string; user_id?: string }
        Relationships: []
      }
      sm_queue_slots: {
        Row: { avg_engagement_rate: number | null; created_at: string | null; day_of_week: number; id: string; is_active: boolean | null; label: string | null; platform: string; recommended: boolean | null; time_slot: string; workspace_id: string | null }
        Insert: { avg_engagement_rate?: number | null; created_at?: string | null; day_of_week: number; id?: string; is_active?: boolean | null; label?: string | null; platform: string; recommended?: boolean | null; time_slot: string; workspace_id?: string | null }
        Update: { avg_engagement_rate?: number | null; created_at?: string | null; day_of_week?: number; id?: string; is_active?: boolean | null; label?: string | null; platform?: string; recommended?: boolean | null; time_slot?: string; workspace_id?: string | null }
        Relationships: []
      }
      sm_schedule_rules: {
        Row: { created_at: string | null; id: string; is_active: boolean | null; platform: string | null; rule_type: string; updated_at: string | null; value: Json | null; workspace_id: string | null }
        Insert: { created_at?: string | null; id?: string; is_active?: boolean | null; platform?: string | null; rule_type: string; updated_at?: string | null; value?: Json | null; workspace_id?: string | null }
        Update: { created_at?: string | null; id?: string; is_active?: boolean | null; platform?: string | null; rule_type?: string; updated_at?: string | null; value?: Json | null; workspace_id?: string | null }
        Relationships: []
      }
      sm_task_comments: {
        Row: { comment_body: string; created_at: string | null; id: string; task_id: string | null; user_id: string | null }
        Insert: { comment_body: string; created_at?: string | null; id?: string; task_id?: string | null; user_id?: string | null }
        Update: { comment_body?: string; created_at?: string | null; id?: string; task_id?: string | null; user_id?: string | null }
        Relationships: []
      }
      sm_task_history: {
        Row: { action: string; actor_id: string | null; created_at: string | null; details: Json | null; id: string; task_id: string }
        Insert: { action: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; id?: string; task_id: string }
        Update: { action?: string; actor_id?: string | null; created_at?: string | null; details?: Json | null; id?: string; task_id?: string }
        Relationships: []
      }
      sm_task_metrics: {
        Row: { comments: number | null; engagement_rate: number | null; fetched_at: string | null; id: string; impressions: number | null; likes: number | null; platform: string | null; reach: number | null; recorded_at: string | null; saves: number | null; shares: number | null; task_id: string }
        Insert: { comments?: number | null; engagement_rate?: number | null; fetched_at?: string | null; id?: string; impressions?: number | null; likes?: number | null; platform?: string | null; reach?: number | null; recorded_at?: string | null; saves?: number | null; shares?: number | null; task_id: string }
        Update: { comments?: number | null; engagement_rate?: number | null; fetched_at?: string | null; id?: string; impressions?: number | null; likes?: number | null; platform?: string | null; reach?: number | null; recorded_at?: string | null; saves?: number | null; shares?: number | null; task_id?: string }
        Relationships: []
      }
      sm_tasks: {
        Row: { caption: string | null; category: string | null; cover_image_url: string | null; created_at: string | null; created_by: string | null; current_owner_id: string | null; drive_link_raw: string | null; edit_review_link: string | null; final_video_url: string | null; hashtags: string | null; id: string; ig_post_id: string | null; li_post_id: string | null; linkedin_urn: string | null; platform: string; published_at: string | null; reference_urls: string | null; rejection_count: number; scheduled_at: string | null; script_body: string | null; sheets_synced_at: string | null; shoot_notes: string | null; status: string; title: string; updated_at: string | null }
        Insert: { caption?: string | null; category?: string | null; cover_image_url?: string | null; created_at?: string | null; created_by?: string | null; current_owner_id?: string | null; drive_link_raw?: string | null; edit_review_link?: string | null; final_video_url?: string | null; hashtags?: string | null; id?: string; ig_post_id?: string | null; li_post_id?: string | null; linkedin_urn?: string | null; platform?: string; published_at?: string | null; reference_urls?: string | null; rejection_count?: number; scheduled_at?: string | null; script_body?: string | null; sheets_synced_at?: string | null; shoot_notes?: string | null; status?: string; title: string; updated_at?: string | null }
        Update: { caption?: string | null; category?: string | null; cover_image_url?: string | null; created_at?: string | null; created_by?: string | null; current_owner_id?: string | null; drive_link_raw?: string | null; edit_review_link?: string | null; final_video_url?: string | null; hashtags?: string | null; id?: string; ig_post_id?: string | null; li_post_id?: string | null; linkedin_urn?: string | null; platform?: string; published_at?: string | null; reference_urls?: string | null; rejection_count?: number; scheduled_at?: string | null; script_body?: string | null; sheets_synced_at?: string | null; shoot_notes?: string | null; status?: string; title?: string; updated_at?: string | null }
        Relationships: []
      }
      sm_templates: {
        Row: { caption_template: string | null; category: string | null; created_at: string | null; created_by: string | null; description: string | null; hashtag_set_id: string | null; id: string; is_active: boolean; name: string; platform: string; script_body: string | null }
        Insert: { caption_template?: string | null; category?: string | null; created_at?: string | null; created_by?: string | null; description?: string | null; hashtag_set_id?: string | null; id?: string; is_active?: boolean; name: string; platform?: string; script_body?: string | null }
        Update: { caption_template?: string | null; category?: string | null; created_at?: string | null; created_by?: string | null; description?: string | null; hashtag_set_id?: string | null; id?: string; is_active?: boolean; name?: string; platform?: string; script_body?: string | null }
        Relationships: []
      }
      sm_users: {
        Row: { auth_user_id: string | null; avatar_url: string | null; created_at: string | null; email: string; id: string; is_active: boolean; name: string; notification_prefs: Json | null; role: string; workspace_id: string | null }
        Insert: { auth_user_id?: string | null; avatar_url?: string | null; created_at?: string | null; email: string; id?: string; is_active?: boolean; name: string; notification_prefs?: Json | null; role?: string; workspace_id?: string | null }
        Update: { auth_user_id?: string | null; avatar_url?: string | null; created_at?: string | null; email?: string; id?: string; is_active?: boolean; name?: string; notification_prefs?: Json | null; role?: string; workspace_id?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_sm_user_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]
