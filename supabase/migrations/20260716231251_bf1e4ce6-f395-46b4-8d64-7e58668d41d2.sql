
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fb_user_id text,
  fb_user_token text,
  fb_page_id text,
  fb_page_name text,
  fb_page_token text,
  ig_user_id text,
  ig_username text,
  token_expires_at timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_social_accounts" ON public.social_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER touch_social_accounts BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.social_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  post_time_utc text NOT NULL DEFAULT '13:00',
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_topic_index integer NOT NULL DEFAULT 0,
  tone text NOT NULL DEFAULT 'engaging',
  audience text NOT NULL DEFAULT 'general audience',
  cta text NOT NULL DEFAULT '',
  platforms jsonb NOT NULL DEFAULT '["instagram","facebook"]'::jsonb,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_schedules TO authenticated;
GRANT ALL ON public.social_schedules TO service_role;
ALTER TABLE public.social_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_social_schedules" ON public.social_schedules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER touch_social_schedules BEFORE UPDATE ON public.social_schedules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.social_post_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  topic text,
  caption text,
  image_url text,
  external_id text,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_post_log TO authenticated;
GRANT ALL ON public.social_post_log TO service_role;
ALTER TABLE public.social_post_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_read_log" ON public.social_post_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX social_post_log_user_created ON public.social_post_log (user_id, created_at DESC);
