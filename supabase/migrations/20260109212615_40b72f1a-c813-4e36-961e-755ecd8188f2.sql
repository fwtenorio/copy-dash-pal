-- Função para listar sessões ativas do usuário
CREATE OR REPLACE FUNCTION public.list_user_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_agent TEXT,
  ip TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_agent::TEXT,
    s.ip::TEXT
  FROM auth.sessions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$;

-- Função para revogar uma sessão específica do usuário
CREATE OR REPLACE FUNCTION public.revoke_user_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE id = p_session_id AND user_id = p_user_id;
END;
$$;