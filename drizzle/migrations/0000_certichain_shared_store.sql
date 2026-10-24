CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.student_accounts (
  user_id uuid PRIMARY KEY,
  nim text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_accounts TO authenticated;
GRANT ALL ON public.student_accounts TO service_role;
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own link" ON public.student_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage student links" ON public.student_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.current_student_nim()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT nim FROM public.student_accounts WHERE user_id = auth.uid()
$$;

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  student_name text NOT NULL,
  nim text NOT NULL,
  activity text NOT NULL,
  organizer text NOT NULL,
  activity_date date NOT NULL,
  issue_date date NOT NULL,
  notes text,
  issuer_id text NOT NULL DEFAULT 'ISSUER-UNF-001',
  issuer_name text NOT NULL DEFAULT 'Universitas Nusantara Fiktif (Prototype)',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  revoked_at timestamptz,
  revoke_reason text,
  data_hash text NOT NULL,
  document_hash text,
  chain_status text NOT NULL DEFAULT 'PENDING' CHECK (chain_status IN ('NOT_REGISTERED','PENDING','SIMULATED','CONFIRMED','FAILED')),
  chain_mode text NOT NULL DEFAULT 'demo' CHECK (chain_mode IN ('demo','evm')),
  chain_reference text,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  events jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX certificates_nim_idx ON public.certificates (nim);
CREATE INDEX certificates_document_hash_idx ON public.certificates (document_hash);
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read certificates" ON public.certificates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students read own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (nim = public.current_student_nim());
CREATE POLICY "Admins create certificates" ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update certificates" ON public.certificates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.chain_registry (
  certificate_code text PRIMARY KEY,
  hash text NOT NULL,
  issuer_id text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  reference text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'demo'
);
GRANT SELECT ON public.chain_registry TO anon;
GRANT SELECT, INSERT, UPDATE ON public.chain_registry TO authenticated;
GRANT ALL ON public.chain_registry TO service_role;
ALTER TABLE public.chain_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads registry" ON public.chain_registry FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins register" ON public.chain_registry FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update registry" ON public.chain_registry FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));