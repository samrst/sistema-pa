-- ==============================================================================
-- DDL MariaDB — Sistema PA: Modelos de Usuários, Unidades, Permissões e Ações SAEP
-- Compatível com MariaDB 10.x+ / utf8mb4
-- ==============================================================================

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `perfil` ENUM('ADMIN', 'MACROPROCESSO_TECNICO', 'USUARIO') NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
)
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- 2. Tabela de Unidades Oficiais
CREATE TABLE IF NOT EXISTS `unidades` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `nome` VARCHAR(150) NOT NULL UNIQUE,
  `codigo` VARCHAR(50) DEFAULT NULL UNIQUE,
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
)
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- 3. Tabela Pivot N:N entre Usuários e Unidades
CREATE TABLE IF NOT EXISTS `usuario_unidades` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `usuario_id` CHAR(36) NOT NULL,
  `unidade_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY `uk_usuario_unidade` (`usuario_id`, `unidade_id`),
  INDEX `idx_usuario_unidades_usuario` (`usuario_id`),
  INDEX `idx_usuario_unidades_unidade` (`unidade_id`),
  CONSTRAINT `fk_usuario_unidades_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_unidades_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE
)
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- 4. Tabela de Ações SAEP (com relacionamentos opcionais preservando histórico)
CREATE TABLE IF NOT EXISTS `acoes_saep` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

  -- Chaves estrangeiras opcionais
  `unidade_id` CHAR(36) DEFAULT NULL,
  `usuario_criador_id` CHAR(36) DEFAULT NULL,

  -- Campo textual mantido para compatibilidade retroativa
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
  `observacoes` TEXT DEFAULT NULL,

  INDEX `idx_acoes_saep_unidade_id` (`unidade_id`),
  INDEX `idx_acoes_saep_usuario_criador_id` (`usuario_criador_id`),
  CONSTRAINT `fk_acoes_saep_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_acoes_saep_usuario_criador` FOREIGN KEY (`usuario_criador_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
)
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;
