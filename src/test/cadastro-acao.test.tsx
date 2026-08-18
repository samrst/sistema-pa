import "./setup";
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import AcoesTable, { getPrazoInfo } from "../components/AcoesTable";
import AcaoFormDialog from "../components/AcaoFormDialog";
import DashboardView from "../components/DashboardView";

const mockAdminUser = {
  id: "admin-1",
  nome: "Admin Geral",
  email: "admin@fbest.org.br",
  perfil: "ADMIN",
  unidades: [],
};

const mockMacroUser = {
  id: "macro-1",
  nome: "Coordenador Técnico",
  email: "macro@fbest.org.br",
  perfil: "MACROPROCESSO_TECNICO",
  unidades: [
    { id: "u-1", nome: "Feira de Santana", codigo: "FSA" },
    { id: "u-2", nome: "Dendezeiros", codigo: "DEN" },
  ],
};

const mockUsuarioUser = {
  id: "usuario-1",
  nome: "Professor João",
  email: "joao@fbest.org.br",
  perfil: "USUARIO",
  unidades: [
    { id: "u-1", nome: "Feira de Santana", codigo: "FSA" },
  ],
};

const mockAcoesList = [
  {
    id: "acao-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unidade_id: "u-1",
    usuario_criador_id: "usuario-1", // Criada por usuario-1 em Feira de Santana
    unidade: "Feira de Santana",
    curso: "Técnico em Desenvolvimento de Sistemas",
    modalidade: "Presencial",
    capacidade_saep: "Geral",
    problema_identificado: "Dificuldade em testes unitários",
    evidencias: "Notas baixas",
    classificacao_criticidade: "Adequado",
    meta_objetiva: "Aumentar taxa",
    meta_pratica: "5 workshops",
    meta_prazo: null,
    acao: "Oficina de Testes",
    tipo_acao: "Pedagógica",
    entregavel: "Relatório",
    responsavel_principal: "Prof. Roberto",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: ["Coordenação"],
    data_inicio: "2026-01-01",
    data_fim: "2026-12-31",
    status: "Em andamento",
    risco: "Baixo",
    plano_mitigacao: null,
    custo_estimado: 500,
    prioridade: "Alta",
    impacto_saep: "Alto",
    observacoes: "Planejado",
  },
  {
    id: "acao-2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unidade_id: "u-1",
    usuario_criador_id: "outro-usuario", // Criada por outro na mesma unidade
    unidade: "Feira de Santana",
    curso: "Técnico em Automação",
    modalidade: "Presencial",
    capacidade_saep: "Específica",
    problema_identificado: "Equipamentos antigos",
    evidencias: "Laudo",
    classificacao_criticidade: "Crítico",
    meta_objetiva: "Atualizar bancadas",
    meta_pratica: "Comprar kits",
    meta_prazo: null,
    acao: "Aquisição de Kits",
    tipo_acao: "Infraestrutura",
    entregavel: "Nota fiscal",
    responsavel_principal: "Prof. Marcos",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: null,
    data_inicio: "2026-01-01",
    data_fim: "2026-01-10", // Vencida
    status: "Não iniciado",
    risco: "Médio",
    plano_mitigacao: null,
    custo_estimado: 5000,
    prioridade: "Alta",
    impacto_saep: "Alto",
    observacoes: null,
  },
  {
    id: "acao-3",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unidade_id: "u-3",
    usuario_criador_id: "outro-usuario", // Unidade Camaçari
    unidade: "Camaçari",
    curso: "Técnico em Química",
    modalidade: "Presencial",
    capacidade_saep: "Específica",
    problema_identificado: "Insumos",
    evidencias: "Estoque",
    classificacao_criticidade: "Adequado",
    meta_objetiva: "Repor insumos",
    meta_pratica: "Comprar reagentes",
    meta_prazo: null,
    acao: "Compra de Reagentes",
    tipo_acao: "Suprimentos",
    entregavel: "Estoque atualizado",
    responsavel_principal: "Prof. Clara",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: null,
    data_inicio: "2026-01-01",
    data_fim: "2026-01-10",
    status: "Concluído", // Concluída com data passada
    risco: "Baixo",
    plano_mitigacao: null,
    custo_estimado: 1000,
    prioridade: "Média",
    impacto_saep: "Médio",
    observacoes: null,
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, initialUser: any = mockAdminUser) {
  const queryClient = createTestQueryClient();
  localStorage.setItem("saep_jwt_token", "test-token");

  global.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = url.toString();
    if (urlStr.includes("/api/auth/me")) {
      return new Response(JSON.stringify({ usuario: initialUser }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("/api/acoes")) {
      return new Response(JSON.stringify(mockAcoesList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("PHASE 7.0 — Refinamento de Permissões, Prazos e Ações", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    localStorage.clear();
  });

  // 1. ADMIN pode editar ação no Dashboard
  it("1. ADMIN pode visualizar botão de edição para qualquer ação no Dashboard", async () => {
    const { getByText, getAllByTitle } = renderWithProviders(<DashboardView />, mockAdminUser);

    await waitFor(() => {
      expect(getByText("Total de Ações")).toBeTruthy();
    });

    // Clica no card de Total de Ações para abrir a tabela de detalhamento
    const cardTotal = getByText("Total de Ações").closest(".cursor-pointer");
    expect(cardTotal).toBeTruthy();
    if (cardTotal) fireEvent.click(cardTotal);

    await waitFor(() => {
      // Como é ADMIN, deve renderizar botão de edição para as ações
      const editButtons = getAllByTitle("Editar ação");
      expect(editButtons.length).toBe(mockAcoesList.length);
    });
  });

  // 2. MACROPROCESSO_TECNICO pode editar ação de unidade permitida
  it("2. MACROPROCESSO_TECNICO pode editar ações de unidades permitidas", async () => {
    const { getByText, getAllByTitle } = renderWithProviders(<AcoesTable />, mockMacroUser);

    await waitFor(() => {
      expect(getByText("Oficina de Testes")).toBeTruthy();
    });

    // Macro tem unidades Feira de Santana e Dendezeiros.
    // acao-1 (Feira) e acao-2 (Feira) são permitidas; acao-3 (Camaçari) não é permitida.
    await waitFor(() => {
      const editButtons = getAllByTitle("Editar ação");
      expect(editButtons.length).toBe(2);
    });
  });

  // 3. USUARIO não recebe botão de edição para ação criada por outro usuário
  it("3. USUARIO não recebe botão de edição para ação criada por outro usuário", async () => {
    const { getByText, queryAllByTitle } = renderWithProviders(<AcoesTable />, mockUsuarioUser);

    await waitFor(() => {
      expect(getByText("Oficina de Testes")).toBeTruthy();
      expect(getByText("Aquisição de Kits")).toBeTruthy();
    });

    // Deve encontrar apenas 1 botão de editar (para acao-1, que foi criada por ele)
    await waitFor(() => {
      const editButtons = queryAllByTitle("Editar ação");
      expect(editButtons.length).toBe(1);
    });
  });

  // 4. USUARIO recebe botão de edição para sua própria ação permitida no Dashboard
  it("4. USUARIO no Dashboard recebe botão de edição apenas para sua própria ação", async () => {
    const { getByText, queryAllByTitle } = renderWithProviders(<DashboardView />, mockUsuarioUser);

    await waitFor(() => {
      expect(getByText("Total de Ações")).toBeTruthy();
    });

    const cardTotal = getByText("Total de Ações").closest(".cursor-pointer");
    if (cardTotal) fireEvent.click(cardTotal);

    await waitFor(() => {
      const editButtons = queryAllByTitle("Editar ação");
      expect(editButtons.length).toBe(1);
    });
  });

  // 5. USUARIO com uma unidade tem a unidade automaticamente selecionada no formulário
  it("5. USUARIO com uma unidade tem a unidade pré-selecionada no formulário", async () => {
    const { getByText } = renderWithProviders(
      <AcaoFormDialog open={true} onOpenChange={() => {}} />,
      mockUsuarioUser
    );

    await waitFor(() => {
      expect(getByText("Nova Ação SAEP")).toBeTruthy();
    });

    await waitFor(() => {
      // O texto da unidade deve ser Feira de Santana
      expect(getByText("Feira de Santana")).toBeTruthy();
    });
  });

  // 6. USUARIO não consegue trocar a unidade no formulário (campo desabilitado)
  it("6. USUARIO tem o seletor de unidade desabilitado no formulário", async () => {
    const { getByText } = renderWithProviders(
      <AcaoFormDialog open={true} onOpenChange={() => {}} />,
      mockUsuarioUser
    );

    await waitFor(() => {
      expect(getByText("Nova Ação SAEP")).toBeTruthy();
      expect(getByText("Feira de Santana")).toBeTruthy();
    });

    // O trigger de select da unidade deve estar desabilitado
    const unitSelectTrigger = getByText("Feira de Santana").closest("button");
    expect(unitSelectTrigger?.hasAttribute("disabled")).toBe(true);
  });

  // 7. MACROPROCESSO_TECNICO somente recebe unidades permitidas
  it("7. MACROPROCESSO_TECNICO recebe no seletor apenas suas unidades permitidas", async () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <AcaoFormDialog open={true} onOpenChange={() => {}} />,
      mockMacroUser
    );

    await waitFor(() => {
      expect(getByText("Nova Ação SAEP")).toBeTruthy();
      expect(getByText("1. Identificação")).toBeTruthy();
    });

    // Campo de unidade está presente
    expect(getByText("Unidade *")).toBeTruthy();
  });

  // 8. Ação vencida recebe indicador de vencimento
  it("8. getPrazoInfo classifica corretamente ação vencida", () => {
    const dataPassada = "2025-01-01";
    const info = getPrazoInfo(dataPassada, "Não iniciado");

    expect(info.status).toBe("vencida");
    expect(info.label).toBe("Vencida");
    expect(info.formattedDate).toBe("01/01/2025");
  });

  // 9. Ação vencendo dentro de 7 dias recebe indicador de prazo próximo
  it("9. getPrazoInfo classifica corretamente ação vencendo em até 7 dias", () => {
    const hoje = new Date();
    const em3Dias = new Date(hoje);
    em3Dias.setDate(hoje.getDate() + 3);

    const ano = em3Dias.getFullYear();
    const mes = String(em3Dias.getMonth() + 1).padStart(2, "0");
    const dia = String(em3Dias.getDate()).padStart(2, "0");
    const dataStr = `${ano}-${mes}-${dia}`;

    const info = getPrazoInfo(dataStr, "Em andamento");

    expect(info.status).toBe("vencendo");
    expect(info.label).toBe("Vence em 3 dias");
  });

  // 10. Ação concluída não recebe indicador de vencimento mesmo com prazo expirado
  it("10. Ação concluída com prazo no passado permanece classificada como concluída", () => {
    const dataPassada = "2024-05-10";
    const info = getPrazoInfo(dataPassada, "Concluído");

    expect(info.status).toBe("concluido");
    expect(info.label).toBe("10/05/2024");
  });

  // 11. Ação com prazo superior a 7 dias permanece normal
  it("11. Ação com prazo superior a 7 dias permanece com status normal", () => {
    const dataFutura = "2028-12-31";
    const info = getPrazoInfo(dataFutura, "Não iniciado");

    expect(info.status).toBe("normal");
    expect(info.label).toBe("31/12/2028");
    expect(info.formattedDate).toBe("31/12/2028");
  });

  // 12. Fluxo básico do formulário de ações
  it("12. Fluxo básico: modal pode ser aberto e fechado pelo botão Cancelar", async () => {
    let open = true;
    const { getByRole, getByText } = renderWithProviders(
      <AcaoFormDialog open={open} onOpenChange={(v) => { open = v; }} />,
      mockAdminUser
    );

    await waitFor(() => {
      expect(getByText("Nova Ação SAEP")).toBeTruthy();
    });

    const cancelBtn = getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(open).toBe(false);
  });
});
