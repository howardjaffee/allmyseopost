GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_plan_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publish_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;

GRANT ALL ON public.articles TO service_role;
GRANT ALL ON public.content_plan_items TO service_role;
GRANT ALL ON public.content_plans TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.publish_settings TO service_role;
GRANT ALL ON public.quality_scores TO service_role;
GRANT ALL ON public.sites TO service_role;