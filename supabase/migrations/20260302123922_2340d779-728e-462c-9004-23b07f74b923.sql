
-- Create the main actions table
CREATE TABLE public.acoes_saep (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- 1. Identificação
  unidade TEXT NOT NULL DEFAULT 'FSA',
  curso TEXT NOT NULL,
  uc_componente TEXT,
  capacidade_saep TEXT NOT NULL,
  
  -- 2. Diagnóstico
  problema_identificado TEXT NOT NULL,
  evidencias TEXT,
  classificacao_criticidade TEXT DEFAULT 'Adequado',
  
  -- 3. Metas
  meta_objetiva TEXT,
  meta_pratica TEXT,
  meta_prazo DATE,
  
  -- 4. Ação Planejada
  acao TEXT NOT NULL,
  tipo_acao TEXT NOT NULL,
  entregavel TEXT,
  
  -- 5. Responsáveis
  responsavel_principal TEXT NOT NULL,
  funcao_cargo TEXT,
  co_responsaveis TEXT,
  apoios_necessarios TEXT[],
  
  -- 6. Prazos
  data_inicio DATE,
  data_fim DATE,
  
  -- 7. Acompanhamento
  status TEXT NOT NULL DEFAULT 'Não iniciado',
  risco TEXT DEFAULT 'Baixo',
  plano_mitigacao TEXT,
  custo_estimado NUMERIC(12,2),
  prioridade TEXT DEFAULT 'Média',
  impacto_saep TEXT DEFAULT 'Médio',
  
  -- 8. Observações
  observacoes TEXT
);

-- Enable RLS
ALTER TABLE public.acoes_saep ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this internal tool)
CREATE POLICY "Allow all select" ON public.acoes_saep FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.acoes_saep FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.acoes_saep FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.acoes_saep FOR DELETE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_acoes_saep_updated_at
  BEFORE UPDATE ON public.acoes_saep
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
