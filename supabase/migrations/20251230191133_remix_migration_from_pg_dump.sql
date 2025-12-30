CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: user_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_level AS ENUM (
    'admin',
    'manager',
    'user'
);


--
-- Name: get_user_client_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_client_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT client_id
  FROM public.users
  WHERE id = _user_id
$$;


--
-- Name: get_user_level(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_level(_user_id uuid) RETURNS public.user_level
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT user_level
  FROM public.users
  WHERE id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  target_client_id UUID;
  target_user_level public.user_level;
BEGIN
  -- Se vier um client_id no metadata, é um usuário de equipe de uma empresa já existente
  IF new.raw_user_meta_data ? 'client_id' THEN
    target_client_id := (new.raw_user_meta_data->>'client_id')::uuid;
    target_user_level := COALESCE((new.raw_user_meta_data->>'user_level')::public.user_level, 'user');

    INSERT INTO public.users (id, email, nome, client_id, user_level)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'nome', new.email),
      target_client_id,
      target_user_level
    );
  ELSE
    -- Primeiro usuário: cria a empresa em clients usando o próprio id do auth como id do client
    INSERT INTO public.clients (id, email, nome, nome_empresa, telefone)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'nome', new.email),
      COALESCE(new.raw_user_meta_data->>'nome_empresa', 'Minha Empresa'),
      new.raw_user_meta_data->>'telefone'
    );

    INSERT INTO public.users (id, email, nome, client_id, user_level)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'nome', new.email),
      new.id,
      'admin'
    );
  END IF;

  RETURN new;
END;
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id
      AND user_level = 'admin'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid NOT NULL,
    email text NOT NULL,
    shopify_store_name text,
    shopify_access_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nome text,
    nome_empresa text,
    telefone text,
    language text DEFAULT 'en'::text NOT NULL,
    settings_updated_at timestamp with time zone,
    shopify_connected_at timestamp with time zone,
    woocommerce_store_url text,
    woocommerce_api_key text,
    woocommerce_connected_at timestamp with time zone,
    stripe_api_key text,
    stripe_connected_at timestamp with time zone,
    paypal_client_id text,
    paypal_secret text,
    paypal_connected_at timestamp with time zone,
    klarna_api_key text,
    klarna_connected_at timestamp with time zone,
    airwallex_api_key text,
    airwallex_connected_at timestamp with time zone,
    woopayments_api_key text,
    woopayments_connected_at timestamp with time zone,
    braintree_merchant_id text,
    braintree_api_key text,
    braintree_connected_at timestamp with time zone,
    adyen_api_key text,
    adyen_merchant_account text,
    adyen_connected_at timestamp with time zone,
    wix_api_key text,
    wix_site_id text,
    wix_connected_at timestamp with time zone,
    magento_store_url text,
    magento_api_key text,
    magento_connected_at timestamp with time zone,
    two_factor_secret text,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_enabled_at timestamp with time zone,
    brand_color text DEFAULT '#10B981'::text,
    brand_text_color text DEFAULT '#FFFFFF'::text,
    support_url text,
    refund_policy_url text,
    logo_url text
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    disputa_ganha boolean DEFAULT true NOT NULL,
    provas_apresentadas boolean DEFAULT true NOT NULL,
    resumo_semanal boolean DEFAULT true NOT NULL,
    novo_alerta_impedido boolean DEFAULT true NOT NULL,
    relatorio_semanal_alertas boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications_menu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    disputes integer DEFAULT 0 NOT NULL,
    prevent integer DEFAULT 0 NOT NULL,
    alerts integer DEFAULT 0 NOT NULL,
    last_login timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    client_id uuid,
    nome text NOT NULL,
    email text NOT NULL,
    user_level public.user_level DEFAULT 'user'::public.user_level NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_client_id_key UNIQUE (client_id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notifications_menu notifications_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_menu
    ADD CONSTRAINT notifications_menu_pkey PRIMARY KEY (id);


--
-- Name: notifications_menu notifications_menu_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_menu
    ADD CONSTRAINT notifications_menu_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_settings update_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications_menu update_notifications_menu_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notifications_menu_updated_at BEFORE UPDATE ON public.notifications_menu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients clients_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: notifications_menu notifications_menu_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications_menu
    ADD CONSTRAINT notifications_menu_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users Admins can delete users in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete users in their company" ON public.users FOR DELETE USING ((public.is_admin(auth.uid()) AND (client_id = public.get_user_client_id(auth.uid()))));


--
-- Name: users Admins can insert users in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert users in their company" ON public.users FOR INSERT WITH CHECK ((public.is_admin(auth.uid()) AND (client_id = public.get_user_client_id(auth.uid()))));


--
-- Name: clients Admins can update their company data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their company data" ON public.clients FOR UPDATE USING ((public.is_admin(auth.uid()) AND (id = public.get_user_client_id(auth.uid())))) WITH CHECK ((id = public.get_user_client_id(auth.uid())));


--
-- Name: users Admins can update users in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update users in their company" ON public.users FOR UPDATE USING ((public.is_admin(auth.uid()) AND (client_id = public.get_user_client_id(auth.uid())))) WITH CHECK ((client_id = public.get_user_client_id(auth.uid())));


--
-- Name: notifications_menu Users can insert their own notifications_menu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own notifications_menu" ON public.notifications_menu FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications_menu Users can update their own notifications_menu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications_menu" ON public.notifications_menu FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: clients Users can view their company data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their company data" ON public.clients FOR SELECT USING ((id = public.get_user_client_id(auth.uid())));


--
-- Name: notifications_menu Users can view their own notifications_menu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications_menu" ON public.notifications_menu FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: users Users can view users from their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view users from their company" ON public.users FOR SELECT USING ((client_id = public.get_user_client_id(auth.uid())));


--
-- Name: notification_settings Usuários podem atualizar configurações da sua empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar configurações da sua empresa" ON public.notification_settings FOR UPDATE USING ((client_id = public.get_user_client_id(auth.uid()))) WITH CHECK ((client_id = public.get_user_client_id(auth.uid())));


--
-- Name: notification_settings Usuários podem inserir configurações da sua empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem inserir configurações da sua empresa" ON public.notification_settings FOR INSERT WITH CHECK ((client_id = public.get_user_client_id(auth.uid())));


--
-- Name: notification_settings Usuários podem ver configurações da sua empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver configurações da sua empresa" ON public.notification_settings FOR SELECT USING ((client_id = public.get_user_client_id(auth.uid())));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications_menu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications_menu ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;