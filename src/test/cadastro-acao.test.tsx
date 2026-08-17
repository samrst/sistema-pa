import "./setup";
import React from "react";
import { describe, it, expect } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AcoesTable from "../components/AcoesTable";
import AcaoFormDialog from "../components/AcaoFormDialog";

const mockAcoes = [
  {
    id: "test-acao-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unidade: "Feira de Santana",
    curso: "Técnico em Desenvolvimento de Sistemas",
    modalidade: "Presencial",
    capacidade_saep: "Geral",
    problema_identificado: "Dificuldade em testes unitários",
    evidencias: "Notas baixas no simulado",
    classificacao_criticidade: "Adequado",
    meta_objetiva: "Aumentar taxa de aprovação",
    meta_pratica: "Aplicar 5 workshops",
    meta_prazo: null,
    acao: "Oficina de Testes Automatizados",
    tipo_acao: "Pedagógica",
    entregavel: "Relatório de presença",
    responsavel_principal: "Prof. Roberto",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: ["Coordenação Pedagógica"],
    data_inicio: null,
    data_fim: "2026-12-31",
    status: "Não iniciado",
    risco: "Baixo",
    plano_mitigacao: null,
    custo_estimado: 500,
    prioridade: "Alta",
    impacto_saep: "Alto",
    observacoes: "Planejado para o 2º semestre",
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("Fluxo de Cadastro e Interface de Ações (AcoesTable + AcaoFormDialog)", () => {
  it("deve renderizar o botão 'Cadastrar ação' corretamente", () => {
    const queryClient = createTestQueryClient();
    const { getByRole } = render(
      <QueryClientProvider client={queryClient}>
        <AcoesTable isAdmin={true} />
      </QueryClientProvider>
    );

    const cadastrarBtn = getByRole("button", { name: /Cadastrar ação/i });
    expect(cadastrarBtn).toBeTruthy();
  });

  it("deve abrir o modal AcaoFormDialog ao clicar no botão 'Cadastrar ação'", async () => {
    const queryClient = createTestQueryClient();
    const { getByRole, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <AcoesTable isAdmin={true} />
      </QueryClientProvider>
    );

    const cadastrarBtn = getByRole("button", { name: /Cadastrar ação/i });
    fireEvent.click(cadastrarBtn);

    // O modal deve exibir o título 'Nova Ação SAEP'
    await waitFor(() => {
      const dialogTitle = getByText("Nova Ação SAEP");
      expect(dialogTitle).toBeTruthy();
    });

    // Campos e seções devem estar presentes
    expect(getByText("1. Identificação")).toBeTruthy();
    expect(getByText("2. Diagnóstico")).toBeTruthy();
    expect(getByText("3. Ação Planejada")).toBeTruthy();
    expect(getByText("4. Responsáveis")).toBeTruthy();
    expect(getByText("5. Prazos")).toBeTruthy();
    expect(getByText("6. Acompanhamento")).toBeTruthy();
    expect(getByText("7. Observações")).toBeTruthy();

    // Botões de ação do formulário
    expect(getByRole("button", { name: /Cancelar/i })).toBeTruthy();
    expect(getByRole("button", { name: /Cadastrar/i })).toBeTruthy();
  });

  it("deve permitir preencher campos e fechar o formulário ao cancelar", async () => {
    let open = true;
    const handleOpenChange = (v: boolean) => {
      open = v;
    };

    const queryClient = createTestQueryClient();
    const { getByRole } = render(
      <QueryClientProvider client={queryClient}>
        <AcaoFormDialog open={open} onOpenChange={handleOpenChange} />
      </QueryClientProvider>
    );

    const cancelButton = getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(open).toBe(false);
  });

  it("deve abrir em modo de edição quando editData é fornecido", () => {
    const queryClient = createTestQueryClient();
    const { getByText, getByRole } = render(
      <QueryClientProvider client={queryClient}>
        <AcaoFormDialog open={true} onOpenChange={() => {}} editData={mockAcoes[0]} />
      </QueryClientProvider>
    );

    expect(getByText("Editar Ação")).toBeTruthy();
    expect(getByRole("button", { name: /Salvar/i })).toBeTruthy();
  });
});
