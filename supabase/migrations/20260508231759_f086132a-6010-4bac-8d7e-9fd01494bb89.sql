
CREATE TABLE public.vini_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  modality text NOT NULL DEFAULT 'text' CHECK (modality IN ('voice','text','system')),
  intent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vini_conv_user_created ON public.vini_conversations (user_id, created_at DESC);
CREATE INDEX idx_vini_conv_session ON public.vini_conversations (session_id, created_at);

ALTER TABLE public.vini_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vini messages"
  ON public.vini_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own vini messages"
  ON public.vini_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own vini messages"
  ON public.vini_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all vini messages"
  ON public.vini_conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
