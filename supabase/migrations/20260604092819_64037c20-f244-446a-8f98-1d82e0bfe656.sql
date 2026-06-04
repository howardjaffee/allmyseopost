
-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- sites
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  niche TEXT,
  target_country TEXT,
  target_audience TEXT,
  business_type TEXT,
  default_tone TEXT DEFAULT 'professional',
  default_word_count INT DEFAULT 1500,
  primary_keywords TEXT[],
  secondary_keywords TEXT[],
  wp_username TEXT,
  wp_app_password TEXT,
  wp_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sites" ON public.sites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- content_plans
CREATE TABLE public.content_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  niche TEXT,
  target_country TEXT,
  target_audience TEXT,
  primary_keywords TEXT[],
  secondary_keywords TEXT[],
  strategy JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_plans TO authenticated;
GRANT ALL ON public.content_plans TO service_role;
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.content_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.content_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- content_plan_items
CREATE TABLE public.content_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.content_plans ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_number INT NOT NULL,
  scheduled_date DATE,
  topic TEXT NOT NULL,
  primary_keyword TEXT,
  search_intent TEXT,
  cluster TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  article_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_plan_items TO authenticated;
GRANT ALL ON public.content_plan_items TO service_role;
ALTER TABLE public.content_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan items" ON public.content_plan_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- articles
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites ON DELETE SET NULL,
  plan_item_id UUID REFERENCES public.content_plan_items ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT,
  primary_keyword TEXT,
  secondary_keywords TEXT[],
  tone TEXT,
  word_count INT,
  target_country TEXT,
  search_intent TEXT,
  content_html TEXT,
  content_markdown TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  featured_image_url TEXT,
  faq JSONB,
  outline JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  wp_post_id INT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own articles" ON public.articles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_articles_updated BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- quality_scores
CREATE TABLE public.quality_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  overall INT NOT NULL,
  seo INT NOT NULL,
  readability INT NOT NULL,
  eeat INT NOT NULL,
  originality INT NOT NULL,
  keyword_coverage INT NOT NULL,
  structure INT NOT NULL,
  grammar INT NOT NULL,
  tier TEXT NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_scores TO authenticated;
GRANT ALL ON public.quality_scores TO service_role;
ALTER TABLE public.quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores" ON public.quality_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- publish_settings
CREATE TABLE public.publish_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily',
  time_slots TEXT[] DEFAULT ARRAY['09:00'],
  timezone TEXT NOT NULL DEFAULT 'UTC',
  start_date DATE,
  end_date DATE,
  approval_mode TEXT NOT NULL DEFAULT 'manual',
  min_quality_score INT NOT NULL DEFAULT 80,
  auto_images BOOLEAN NOT NULL DEFAULT true,
  auto_internal_links BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publish_settings TO authenticated;
GRANT ALL ON public.publish_settings TO service_role;
ALTER TABLE public.publish_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own publish settings" ON public.publish_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_psettings_updated BEFORE UPDATE ON public.publish_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
