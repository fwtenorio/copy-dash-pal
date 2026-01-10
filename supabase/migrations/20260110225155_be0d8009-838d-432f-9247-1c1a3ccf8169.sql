-- Corrigir as políticas RLS de evidence_field_configs
-- O problema é que as políticas estão RESTRICTIVE e não PERMISSIVE

-- Primeiro, dropar as políticas existentes
DROP POLICY IF EXISTS "Public can read evidence configs by client_id" ON public.evidence_field_configs;
DROP POLICY IF EXISTS "Users can view their company evidence configs" ON public.evidence_field_configs;
DROP POLICY IF EXISTS "Admins can insert their company evidence configs" ON public.evidence_field_configs;
DROP POLICY IF EXISTS "Admins can update their company evidence configs" ON public.evidence_field_configs;
DROP POLICY IF EXISTS "Admins can delete their company evidence configs" ON public.evidence_field_configs;

-- Recriar como PERMISSIVE (padrão)
-- Política para usuários autenticados verem configs da sua empresa
CREATE POLICY "Users can view their company evidence configs" 
ON public.evidence_field_configs 
FOR SELECT 
USING (client_id = get_user_client_id(auth.uid()));

-- Política para acesso público (proxy sem autenticação) - apenas leitura
CREATE POLICY "Public can read evidence configs by client_id" 
ON public.evidence_field_configs 
FOR SELECT 
USING (true);

-- Admins podem inserir configs da sua empresa
CREATE POLICY "Admins can insert their company evidence configs" 
ON public.evidence_field_configs 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()));

-- Admins podem atualizar configs da sua empresa
CREATE POLICY "Admins can update their company evidence configs" 
ON public.evidence_field_configs 
FOR UPDATE 
USING (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Admins podem deletar configs da sua empresa
CREATE POLICY "Admins can delete their company evidence configs" 
ON public.evidence_field_configs 
FOR DELETE 
USING (is_admin(auth.uid()) AND client_id = get_user_client_id(auth.uid()));