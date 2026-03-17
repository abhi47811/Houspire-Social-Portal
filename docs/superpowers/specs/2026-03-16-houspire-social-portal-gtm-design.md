# Houspire Social Portal — GTM Design Spec
**Date:** 2026-03-16
**Status:** Approved

---

## Context

The Houspire Social Portal is a Next.js 14 social media management tool for the Houspire team. The codebase is fully built (12 app pages, 6 cron API routes, complete UI). This spec covers connecting it to a live Supabase backend and deploying it to Vercel for production use.

---

## 1. Supabase Project

- **Name:** Houspire Social
- **Region:** ap-south-1
- **Org:** mediashaastra@gmail.com's Org

---

## 2. Database Schema (13 tables)

### sm_users
Staff profiles linked to Supabase auth.
`id, name, email, role (admin|script_writer|reviewer_editor|shooter), avatar_url, auth_user_id, workspace_id, is_active, notification_prefs, created_at`

### sm_tasks
Content tasks with full workflow.
`id, title, script_body, category, platform (instagram|linkedin|both), status (draft→published pipeline), current_owner_id, created_by, rejection_count, caption, hashtags, scheduled_at, published_at, ig_post_id, li_post_id, linkedin_urn, sheets_synced_at, shoot_notes, reference_urls, cover_image_url, final_video_url, drive_link_raw, edit_review_link, created_at, updated_at`

### sm_task_history
Per-task action log.
`id, task_id, action, actor_id, details (jsonb), created_at`

### sm_notifications
In-app notifications.
`id, user_id, task_id, title, body, type, is_read, action_url, actor_id, group_key, is_archived, reference_id, created_at`

### sm_activity
Global activity feed.
`id, actor_id, action, entity_type, entity_id, entity_title, details (jsonb), created_at`

### sm_audit_log
Admin-only change history.
`id, actor_id, action, resource_type, resource_id, resource_title, old_values (jsonb), new_values (jsonb), details (jsonb), created_at`

### sm_media
Media library.
`id, file_name, original_name, file_path, file_url, file_type, file_size, width, height, folder, tags (text[]), alt_text, is_archived, uploaded_by, created_at`

### sm_templates
Reusable content templates.
`id, name, description, platform, category, script_body, caption_template, hashtag_set_id, created_by, is_active, created_at`

### sm_hashtag_sets
Curated hashtag groups.
`id, name, description, hashtags (text[]), platform, is_active, created_by, created_at`

### sm_hashtag_analytics
Hashtag usage tracking.
`id, hashtag, usage_count, updated_at`

### sm_task_metrics
Per-task engagement data.
`id, task_id (unique), platform, impressions, reach, likes, comments, shares, saves, engagement_rate, fetched_at`

### sm_daily_metrics
Aggregated daily stats by platform.
`id, platform, date (unique with platform), impressions, reach, likes, comments, shares, saves, engagement_rate, created_at`

### sm_brand_settings
Brand kit configuration.
`id, workspace_id, primary_color, secondary_color, accent_color, font_heading, font_body, logo_url, brand_voice, tone_of_voice, content_pillars (text[]), updated_at`

---

## 3. Auth & First Admin

- Invite `ak@houspire.ai` via Supabase Auth (magic link / email invite)
- Seed `sm_users` row: `name='AK', role='admin', is_active=true`
- Auth trigger: on `auth.users` insert → auto-create `sm_users` placeholder row

---

## 4. RLS Security Model

| Table | Read | Write |
|---|---|---|
| sm_users | authenticated users | self or admin |
| sm_tasks | authenticated users | owner or admin |
| sm_task_history | authenticated users | authenticated users |
| sm_notifications | own rows only | system/authenticated |
| sm_activity | authenticated users | authenticated users |
| sm_audit_log | admin only | system only |
| sm_media | authenticated users | uploader or admin |
| sm_templates | authenticated users | creator or admin |
| sm_hashtag_sets | authenticated users | creator or admin |
| sm_hashtag_analytics | authenticated users | system only |
| sm_task_metrics | authenticated users | system only |
| sm_daily_metrics | authenticated users | system only |
| sm_brand_settings | authenticated users | admin only |

---

## 5. Vercel Deployment

- Project: `houspire-social-portal`
- Framework: Next.js 14
- Root: `houspire-social-portal/`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No custom domain at this stage — use Vercel-assigned URL

---

## 6. Implementation Order

1. Create Supabase project via MCP
2. Apply all 13 table migrations
3. Set up RLS policies
4. Create auth trigger for auto sm_users creation
5. Invite + seed admin user
6. Write `.env.local` with new credentials
7. Deploy to Vercel via MCP with env vars injected
