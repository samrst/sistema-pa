-- DDL for MariaDB equivalent of public.acoes_saep (do NOT execute yet)
CREATE TABLE `acoes_saep` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

  `unidade` TEXT NOT NULL,
  `curso` TEXT NOT NULL,
  `modalidade` TEXT NOT NULL,
  `capacidade_saep` TEXT NOT NULL,

  `problema_identificado` TEXT NOT NULL,
  `evidencias` TEXT DEFAULT NULL,
  `classificacao_criticidade` TEXT DEFAULT 'Adequado',

  `meta_objetiva` TEXT DEFAULT NULL,
  `meta_pratica` TEXT DEFAULT NULL,
  `meta_prazo` DATE DEFAULT NULL,

  `acao` TEXT NOT NULL,
  `tipo_acao` TEXT NOT NULL,
  `entregavel` TEXT DEFAULT NULL,

  `responsavel_principal` TEXT NOT NULL,
  `funcao_cargo` TEXT DEFAULT NULL,
  `co_responsaveis` TEXT DEFAULT NULL,
  `apoios_necessarios` JSON DEFAULT NULL,

  `data_inicio` DATE DEFAULT NULL,
  `data_fim` DATE DEFAULT NULL,

  `status` TEXT DEFAULT 'Não iniciado',
  `risco` TEXT DEFAULT 'Baixo',
  `plano_mitigacao` TEXT DEFAULT NULL,
  `custo_estimado` DECIMAL(12,2) DEFAULT NULL,
  `prioridade` TEXT DEFAULT 'Média',
  `impacto_saep` TEXT DEFAULT 'Médio',
  `observacoes` TEXT DEFAULT NULL
)
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- Notes:
-- * `id` stored as CHAR(36) to preserve existing UUID strings (e.g. 'xxxxxxxx-xxxx-...').
-- * `apoios_necessarios` stored as JSON. If later queries require relational searches by element, consider a separate linking table.
-- * Timezone: MariaDB DATETIME does not store timezone; store UTC values from the application layer.

-- Notes:
-- * `id` stored as CHAR(36)` to preserve existing UUID strings (e.g. 'xxxxxxxx-xxxx-...').
-- * `apoios_necessarios` stored as JSON. If later queries require relational searches by element, consider a separate linking table.
-- * Timezone: MariaDB DATETIME does not store timezone; store UTC values from the application layer.
