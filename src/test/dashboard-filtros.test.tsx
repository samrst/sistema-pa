import "./setup";
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { FilterProvider, useAcoesFilter, matchPersonName, isMinhaAcao, getFiltersSummary } from "../contexts/FilterContext";
import DashboardView from "../components/DashboardView";
import AcoesTable from "../components/AcoesTable";
import FilterBar from "../components/FilterBar";
import AnalistaGemini from "../components/AnalistaGemini";
import { MainWorkspace } from "../pages/Index";
import { exportAcoesPdf } from "../lib/exportPdf";
import { exportRelatorioPdf } from "../lib/exportRelatorioPdf";
import { parseReportHtml, buildColumnStyles } from "../lib/reportPdfHtml";
import type { Acao } from "../hooks/useAcoes";

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

const mockAcoesList: Acao[] = [
  {
    id: "acao-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unidade_id: "u-1",
    usuario_criador_id: "usuario-1",
    unidade: "Feira de Santana",
    curso: "Técnico em Desenvolvimento de Sistemas",
    modalidade: "Presencial",
    capacidade_saep: "Geral",
    problema_identificado: "Dificuldade em testes",
    evidencias: "Notas baixas",
    classificacao_criticidade: "Adequado",
    meta_objetiva: "Aumentar taxa",
    meta_pratica: "5 workshops",
    meta_prazo: null,
    acao: "Oficina de Testes Unitários",
    tipo_acao: "Metodologia/Didática",
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
    usuario_criador_id: "outro-usuario",
    unidade: "Feira de Santana",
    curso: "Técnico em Automação",
    modalidade: "Presencial",
    capacidade_saep: "Específica",
    problema_identificado: "Bancadas desatualizadas",
    evidencias: "Laudo técnico",
    classificacao_criticidade: "Crítico",
    meta_objetiva: "Comprar kits",
    meta_pratica: "Instalar kits",
    meta_prazo: null,
    acao: "Aquisição de Bancadas",
    tipo_acao: "Infraestrutura/Suprimentos",
    entregavel: "Nota fiscal",
    responsavel_principal: "Prof. Marcos",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: null,
    data_inicio: "2026-01-01",
    data_fim: "2025-01-10", // Vencida
    status: "Não iniciado",
    risco: "Alto",
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
    unidade_id: "u-2",
    usuario_criador_id: "outro-usuario",
    unidade: "Dendezeiros",
    curso: "Técnico em Química",
    modalidade: "Semipresencial",
    capacidade_saep: "Específica",
    problema_identificado: "Falta de reagentes",
    evidencias: "Estoque",
    classificacao_criticidade: "Atenção",
    meta_objetiva: "Repor insumos",
    meta_pratica: "Comprar reagentes",
    meta_prazo: null,
    acao: "Compra de Reagentes",
    tipo_acao: "Infraestrutura/Suprimentos",
    entregavel: "Estoque atualizado",
    responsavel_principal: "Prof. Clara",
    funcao_cargo: "Docente",
    co_responsaveis: null,
    apoios_necessarios: null,
    data_inicio: "2026-01-01",
    data_fim: "2024-05-10",
    status: "Concluído",
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

function renderWithFilterContext(ui: React.ReactElement, initialUser: any = mockAdminUser, acoes: Acao[] = mockAcoesList) {
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
      return new Response(JSON.stringify(acoes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("/api/usuarios")) {
      return new Response(JSON.stringify([initialUser]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("/api/unidades")) {
      return new Response(JSON.stringify([
        { id: "u-1", nome: "Feira de Santana", codigo: "FSA" },
        { id: "u-2", nome: "Dendezeiros", codigo: "DEN" },
      ]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("/api/ia/analyze")) {
      return new Response(JSON.stringify({ analise: "<h2>Relatório IA Gerado</h2><p>Conteúdo analisado com sucesso.</p>" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>{ui}</FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("PHASE 7.1 — Dashboards Reativos, Visão Geral, Filtros Globais e Relatórios", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    localStorage.clear();
  });

  // 1. Filtro de Unidade altera KPIs
  it("1. Filtro de Unidade altera os KPIs no Dashboard", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("unidade", "Dendezeiros")}>Filtrar Dendezeiros</button>
          <div data-testid="kpi-total">{filteredAcoes.length}</div>
          <DashboardView />
        </div>
      );
    };

    const { getByText, getAllByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Total de Ações");
    await waitFor(() => {
      expect(getByTestId("kpi-total").textContent).toBe("3");
    });

    fireEvent.click(getByText("Filtrar Dendezeiros"));

    await waitFor(() => {
      expect(getByTestId("kpi-total").textContent).toBe("1");
      expect(getAllByText("100%").length).toBeGreaterThanOrEqual(1);
    });
  });


  // 2. Filtro de Unidade altera gráficos
  it("2. Filtro de Unidade altera os dados consolidados para os gráficos", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("unidade", "Feira de Santana")}>Filtrar Feira</button>
          <div data-testid="count">{filteredAcoes.length}</div>
          <DashboardView />
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Ações por Unidade");
    await waitFor(() => {
      expect(getByTestId("count").textContent).toBe("3");
    });

    fireEvent.click(getByText("Filtrar Feira"));

    await waitFor(() => {
      expect(getByTestId("count").textContent).toBe("2");
    });
  });

  // 3. Filtro de Unidade altera tabela
  it("3. Filtro de Unidade atualiza as linhas exibidas na AcoesTable", async () => {
    const TestComponent = () => {
      const { setFilter } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("unidade", "Dendezeiros")}>Filtrar Dendezeiros</button>
          <AcoesTable />
        </div>
      );
    };

    const { getByText, queryByText, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Oficina de Testes Unitários");
    expect(getByText("Compra de Reagentes")).toBeTruthy();

    fireEvent.click(getByText("Filtrar Dendezeiros"));

    await waitFor(() => {
      expect(getByText("Compra de Reagentes")).toBeTruthy();
      expect(queryByText("Oficina de Testes Unitários")).toBeNull();
    });
  });

  // 4. Filtro de Curso altera indicadores
  it("4. Filtro de Curso altera os KPIs e contagens de ações", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("curso", "Técnico em Desenvolvimento de Sistemas")}>Filtrar DS</button>
          <div data-testid="filtered-count">{filteredAcoes.length}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Filtrar DS");
    await waitFor(() => {
      expect(getByTestId("filtered-count").textContent).toBe("3");
    });

    fireEvent.click(getByText("Filtrar DS"));

    await waitFor(() => {
      expect(getByTestId("filtered-count").textContent).toBe("1");
    });
  });

  // 5. Filtro de Status altera distribuição
  it("5. Filtro de Status reflete no conjunto derivado de ações", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("status", "Concluído")}>Filtrar Concluído</button>
          <div data-testid="status-count">{filteredAcoes.length}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Filtrar Concluído");
    await waitFor(() => {
      expect(getByTestId("status-count").textContent).toBe("3");
    });

    fireEvent.click(getByText("Filtrar Concluído"));

    await waitFor(() => {
      expect(getByTestId("status-count").textContent).toBe("1");
    });
  });

  // 6. Combinação Unidade + Curso + Status usa interseção correta
  it("6. Combinação de múltiplos filtros aplica interseção estrita (AND)", async () => {
    const TestComponent = () => {
      const { setFilters, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button
            onClick={() =>
              setFilters({
                unidade: "Feira de Santana",
                curso: "Técnico em Desenvolvimento de Sistemas",
                status: "Em andamento",
              })
            }
          >
            Aplicar Interseção
          </button>
          <div data-testid="intersection-count">{filteredAcoes.length}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Aplicar Interseção");
    await waitFor(() => {
      expect(getByTestId("intersection-count").textContent).toBe("3");
    });

    fireEvent.click(getByText("Aplicar Interseção"));

    await waitFor(() => {
      expect(getByTestId("intersection-count").textContent).toBe("1");
    });
  });

  // 7. Limpar filtros restaura o conjunto completo autorizado
  it("7. Limpar filtros restaura o total inicial de ações autorizadas", async () => {
    const TestComponent = () => {
      const { setFilter, clearFilters, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("status", "Não iniciado")}>Filtrar</button>
          <button onClick={clearFilters}>Limpar</button>
          <div data-testid="total">{filteredAcoes.length}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Filtrar");
    await waitFor(() => {
      expect(getByTestId("total").textContent).toBe("3");
    });

    fireEvent.click(getByText("Filtrar"));

    await waitFor(() => {
      expect(getByTestId("total").textContent).toBe("1");
    });

    fireEvent.click(getByText("Limpar"));

    await waitFor(() => {
      expect(getByTestId("total").textContent).toBe("3");
    });
  });

  // 8. ADMIN pode visualizar todas as unidades
  it("8. ADMIN tem acesso a todas as opções de unidades no FilterContext", async () => {
    const TestComponent = () => {
      const { availableUnidades } = useAcoesFilter();
      return (
        <div>
          <div data-testid="units-count">{availableUnidades.length}</div>
        </div>
      );
    };

    const { getByTestId } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await waitFor(() => {
      expect(parseInt(getByTestId("units-count").textContent || "0", 10)).toBeGreaterThanOrEqual(2);
    });
  });

  // 9. MACROPROCESSO_TECNICO somente visualiza suas unidades
  it("9. MACROPROCESSO_TECNICO recebe apenas suas unidades vinculadas", async () => {
    const TestComponent = () => {
      const { availableUnidades } = useAcoesFilter();
      return (
        <div>
          <div data-testid="macro-units">{availableUnidades.join(",")}</div>
        </div>
      );
    };

    const { getByTestId } = renderWithFilterContext(<TestComponent />, mockMacroUser);

    await waitFor(() => {
      expect(getByTestId("macro-units").textContent).toBe("Feira de Santana,Dendezeiros");
    });
  });

  // 10. USUARIO somente visualiza sua unidade
  it("10. USUARIO recebe apenas sua unidade autorizada", async () => {
    const TestComponent = () => {
      const { availableUnidades } = useAcoesFilter();
      return (
        <div>
          <div data-testid="user-units">{availableUnidades.join(",")}</div>
        </div>
      );
    };

    const { getByTestId } = renderWithFilterContext(<TestComponent />, mockUsuarioUser);

    await waitFor(() => {
      expect(getByTestId("user-units").textContent).toBe("Feira de Santana");
    });
  });

  // 11. Filtro de prazo classifica corretamente ações vencidas
  it("11. Filtro de prazo 'vencida' seleciona apenas ações atrasadas e não concluídas", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("situacaoPrazo", "vencida")}>Filtrar Vencidas</button>
          <div data-testid="vencidas">{filteredAcoes.map((a) => a.acao).join(";")}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Filtrar Vencidas");
    fireEvent.click(getByText("Filtrar Vencidas"));

    await waitFor(() => {
      // Somente acao-2 (Aquisição de Bancadas com data_fim em 2025 e status Não iniciado)
      expect(getByTestId("vencidas").textContent).toBe("Aquisição de Bancadas");
    });
  });

  // 12. Filtro de prazo respeita ações concluídas
  it("12. Ação com prazo expirado mas status Concluído não entra no filtro de vencidas", async () => {
    const TestComponent = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("situacaoPrazo", "concluida")}>Filtrar Concluídas</button>
          <div data-testid="concluidas">{filteredAcoes.map((a) => a.acao).join(";")}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Filtrar Concluídas");
    fireEvent.click(getByText("Filtrar Concluídas"));

    await waitFor(() => {
      expect(getByTestId("concluidas").textContent).toBe("Compra de Reagentes");
    });
  });

  // 13. PDF recebe filteredAcoes
  it("13. exportAcoesPdf executa com sucesso recebendo array filtrado e sumário", () => {
    const acoesFiltradas = [mockAcoesList[0]];
    const summary = "Unidade: Feira de Santana | Status: Em andamento";

    // Não deve lançar exceção
    expect(() => {
      exportAcoesPdf(acoesFiltradas, summary);
    }).not.toThrow();
  });

  // 14. IA recebe filteredAcoes e renderiza relatório
  it("14. AnalistaGemini executa análise sobre o conjunto filtrado", async () => {
    const { getByText, findByText } = renderWithFilterContext(
      <AnalistaGemini dadosAcoes={[mockAcoesList[0]]} />,
      mockAdminUser
    );

    await findByText("Agente Analista IA");
    expect(getByText("1 ação pronta para análise")).toBeTruthy();

    const generateBtn = getByText("Gerar Relatório Executivo");
    fireEvent.click(generateBtn);

    await findByText("Relatório Executivo — Plano de Ações SAEP");
    expect(getByText("Relatório IA Gerado")).toBeTruthy();
  });

  // 15. Quando não existem ações filtradas, a análise não é disparada
  it("15. AnalistaGemini não dispara API quando o array filtrado está vazio", async () => {
    const { getByText, findByText } = renderWithFilterContext(
      <AnalistaGemini dadosAcoes={[]} />,
      mockAdminUser
    );

    await findByText("Agente Analista IA");
    expect(getByText("0 ações prontas para análise")).toBeTruthy();

    const btn = getByText("Gerar Relatório Executivo");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  // 16. Filtros ativos são exibidos corretamente na FilterBar
  it("16. FilterBar exibe contadores e badges de filtros ativos", async () => {
    const TestComponent = () => {
      const { setFilter, activeFilterCount } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("status", "Em andamento")}>Ativar Filtro Status</button>
          <div data-testid="active-count">{activeFilterCount}</div>
          <FilterBar />
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestComponent />, mockAdminUser);

    await findByText("Todas as unidades");
    await waitFor(() => {
      expect(getByTestId("active-count").textContent).toBe("0");
    });

    const activateBtn = getByText("Ativar Filtro Status");
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(getByTestId("active-count").textContent).toBe("1");
      expect(getByText("Status: Em andamento")).toBeTruthy();
    });
  });

  // 17. Sincronismo total: Dashboard e Tabela compartilham o mesmo estado filtrado
  it("17. Sincronismo total: Dashboard e Tabela compartilham o mesmo estado filtrado", async () => {
    const TestWorkspace = () => {
      const { setFilter, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("unidade", "Feira de Santana")}>Filtrar Feira</button>
          <div data-testid="total-filtrado">{filteredAcoes.length}</div>
          <AcoesTable />
        </div>
      );
    };

    const { getByText, queryByText, getByTestId, findByText } = renderWithFilterContext(<TestWorkspace />, mockAdminUser);

    await findByText("Oficina de Testes Unitários");
    await waitFor(() => {
      expect(getByTestId("total-filtrado").textContent).toBe("3");
      expect(getByText("Compra de Reagentes")).toBeTruthy();
    });

    fireEvent.click(getByText("Filtrar Feira"));

    await waitFor(() => {
      expect(getByTestId("total-filtrado").textContent).toBe("2");
      expect(queryByText("Compra de Reagentes")).toBeNull();
      expect(getByText("Oficina de Testes Unitários")).toBeTruthy();
    });
  });

  // 18. FilterBar contextual: aparece em Visão Geral, Ações e Minha Unidade, e NÃO em Gestão de Acessos ou Chat IA
  it("18. FilterBar aparece nas abas analíticas (Visão Geral, Ações) e não em Gestão de Acessos ou Chat IA", async () => {
    const { getByRole, queryByText, findByText, queryByPlaceholderText } = renderWithFilterContext(
      <MainWorkspace />,
      mockAdminUser
    );

    const clickTab = (trigger: HTMLElement) => {
      fireEvent.focus(trigger);
      fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
      fireEvent.click(trigger);
    };

    // 1. Aba Visão Geral (inicial do Admin): FilterBar presente
    await findByText("Indicadores e análise consolidada das ações do Workshop SAEP.");
    expect(queryByText("Todas as unidades")).toBeTruthy();
    expect(queryByText("Mais Filtros")).toBeTruthy();

    // 2. Troca para Ações: FilterBar presente
    const acoesTab = await waitFor(() => getByRole("tab", { name: /Ações/i }));
    clickTab(acoesTab);
    await findByText("Oficina de Testes Unitários");
    expect(queryByText("Todas as unidades")).toBeTruthy();

    // 3. Troca para Gestão de Acessos: FilterBar NÃO deve existir
    const usuariosTab = await waitFor(() => getByRole("tab", { name: /Gestão de Acessos/i }));
    clickTab(usuariosTab);
    await findByText("Gestão de Usuários e Acessos");
    expect(queryByPlaceholderText("Buscar ações por título, responsável, problema, curso...")).toBeNull();
    expect(queryByText("Mais Filtros")).toBeNull();

    // 4. Troca para Chat IA: FilterBar NÃO deve existir
    const adminChatTab = await waitFor(() => getByRole("tab", { name: /Chat IA/i }));
    clickTab(adminChatTab);
    await findByText("Agente IA — Assessoria Estratégica");
    expect(queryByPlaceholderText("Buscar ações por título, responsável, problema, curso...")).toBeNull();
    expect(queryByText("Todas as unidades")).toBeNull();
    expect(queryByText("Mais Filtros")).toBeNull();
  });

  // 19. Trocar de aba preserva o estado dos filtros ativos
  it("19. Trocar de aba não destrói o estado dos filtros ativos", async () => {
    const TestPreserveTabs = () => {
      const { setFilter } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setFilter("search", "Oficina")}>Aplicar Busca Oficina</button>
          <MainWorkspace />
        </div>
      );
    };

    const { getAllByRole, queryByText, findByText, getByText } = renderWithFilterContext(
      <TestPreserveTabs />,
      mockAdminUser
    );

    const clickTab = (trigger: HTMLElement) => {
      fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
      fireEvent.mouseDown(trigger, { button: 0, ctrlKey: false });
      fireEvent.focus(trigger);
      fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
      fireEvent.click(trigger);
    };

    await findByText("Indicadores e análise consolidada das ações do Workshop SAEP.");

    // Aplica busca por 'Oficina'
    fireEvent.click(getByText("Aplicar Busca Oficina"));

    const tabs = getAllByRole("tab");
    const visaoGeralTab = tabs[0];
    const acoesTab = tabs[1];

    // Troca para Ações: o filtro ainda está ativo!
    clickTab(acoesTab);
    await waitFor(() => {
      expect(acoesTab.getAttribute("data-state")).toBe("active");
      expect(queryByText("Aquisição de Bancadas")).toBeNull();
      expect(queryByText("Oficina de Testes Unitários")).toBeTruthy();
    });

    // Troca de volta para Visão Geral
    clickTab(visaoGeralTab);
    await waitFor(() => {
      expect(visaoGeralTab.getAttribute("data-state")).toBe("active");
    });
  });

  // 20. Indicador de ações filtradas com alta legibilidade
  it("20. Indicador 'Exibindo X ações' exibe contagem exata e destaque visual", async () => {
    const { getByText, findByText } = renderWithFilterContext(
      <FilterBar />,
      mockAdminUser
    );

    await findByText("Todas as unidades");
    await findByText("Exibindo");
    expect(await findByText(/3 ações/i)).toBeTruthy();
  });

  // 21. exportRelatorioPdf executa com conteúdo extenso e metadados de filtros
  it("21. exportRelatorioPdf gera relatório sem erros para textos longos, tabelas e filtros", () => {
    const markdownContent = `
      <h1>Diagnóstico Estratégico SAEP 2026</h1>
      <h2>1. Visão Geral das Ações</h2>
      <p>Parágrafo extenso com detalhamento metodológico para verificar quebra de linha em margens estritas com palavras longas como CAPACIDADE_TECNICA_ORGANIZACIONAL_2026.</p>
      <div class="alert-critical">Atenção: Ação com impeditivo operacional identificado no laboratório de automação.</div>
      <div class="alert-success">Conquista: Metas de capacitação atingidas com sucesso em todos os cursos.</div>
      <ul>
        <li>Primeiro ponto de análise com texto explicativo longo para teste de wrapping e quebra de página.</li>
        <li>Segundo ponto de melhoria contínua dos cursos técnicos de formação profissional.</li>
      </ul>
      <table>
        <thead>
          <tr><th>Unidade</th><th>Curso</th><th>Status</th><th>Prioridade</th></tr>
        </thead>
        <tbody>
          <tr><td>Feira de Santana</td><td>Desenvolvimento</td><td>Em andamento</td><td>Alta</td></tr>
          <tr><td>CIMATEC</td><td>Mecatrônica</td><td>Concluído</td><td>Média</td></tr>
        </tbody>
      </table>
    `;

    expect(() => {
      exportRelatorioPdf(markdownContent, 12, "Unidade: Feira de Santana | Status: Em andamento");
    }).not.toThrow();
  });

  // 22. parseReportHtml interpreta tags HTML corretamente
  it("22. parseReportHtml processa h1, h2, h3, h4, tabelas, alertas e listas", () => {
    const html = `
      <h1>Título 1</h1>
      <h2>Título 2</h2>
      <h3>Título 3</h3>
      <h4>Título 4</h4>
      <p>Parágrafo padrão</p>
      <ul><li>Item bullet</li></ul>
      <ol><li>Item num</li></ol>
      <div class="alert-info">Alerta informativo</div>
      <table><thead><tr><th>Col1</th><th>Col2</th></tr></thead><tbody><tr><td>Val1</td><td>Val2</td></tr></tbody></table>
    `;
    const { blocks, tables } = parseReportHtml(html);
    expect(blocks.some((b) => b.type === "heading" && b.level === 1)).toBe(true);
    expect(blocks.some((b) => b.type === "heading" && b.level === 2)).toBe(true);
    expect(blocks.some((b) => b.type === "heading" && b.level === 3)).toBe(true);
    expect(blocks.some((b) => b.type === "heading" && b.level === 4)).toBe(true);
    expect(blocks.some((b) => b.type === "paragraph")).toBe(true);
    expect(blocks.some((b) => b.type === "bullet")).toBe(true);
    expect(blocks.some((b) => b.type === "numbered")).toBe(true);
    expect(blocks.some((b) => b.type === "alert")).toBe(true);
    expect(tables.length).toBe(1);
    expect(tables[0].headers).toEqual(["Col1", "Col2"]);
  });

  // 23. buildColumnStyles garante que a soma das colunas seja exatamente igual à largura disponível
  it("23. buildColumnStyles distribui larguras somando exatamente a largura total disponível", () => {
    const headers4 = ["Unidade", "Curso", "Status", "Prioridade"];
    const width = 182; // contentWidth portrait
    const styles4 = buildColumnStyles(headers4, width);
    const sum4 = Object.values(styles4).reduce((acc, col) => acc + col.cellWidth, 0);
    expect(Math.abs(sum4 - width)).toBeLessThan(0.5);

    const headers7 = ["A", "B", "C", "D", "E", "F", "G"];
    const styles7 = buildColumnStyles(headers7, width);
    const sum7 = Object.values(styles7).reduce((acc, col) => acc + col.cellWidth, 0);
    expect(Math.abs(sum7 - width)).toBeLessThan(0.5);
  });

  // 24. Comparação de nomes segura (matchPersonName)
  it("24. matchPersonName lida corretamente com prefixos, acentos, separadores e evita falsos positivos", () => {
    expect(matchPersonName("Prof. Roberto Silva", "Roberto Silva")).toBe(true);
    expect(matchPersonName("Coord. João Paulo", "João Paulo")).toBe(true);
    expect(matchPersonName("Professora Maria Santos", "Maria Santos")).toBe(true);
    expect(matchPersonName("Maria Santos, João Paulo, Roberto Silva", "João Paulo")).toBe(true);
    expect(matchPersonName("Maria / Roberto", "Roberto")).toBe(true);

    // Evita falsos positivos de substring ingênua
    expect(matchPersonName("Mariana Santos", "Ana")).toBe(false);
    expect(matchPersonName("Luciana Ribeiro", "Ana")).toBe(false);
    expect(matchPersonName("Paulo Roberto", "Beto")).toBe(false);
  });

  // 25. isMinhaAcao identifica criador, responsável e co-responsável
  it("25. isMinhaAcao identifica união OR de criador, responsável principal e co-responsável", () => {
    const userA = { id: "user-1", nome: "João Silva", email: "joao@senai.br", perfil: "USUARIO" as const, unidades: [] };

    // 1. Criador
    const acaoCriador: Acao = { ...mockAcoesList[0], usuario_criador_id: "user-1", responsavel_principal: "Outro", co_responsaveis: null };
    expect(isMinhaAcao(acaoCriador, userA)).toBe(true);

    // 2. Responsável Principal
    const acaoResp: Acao = { ...mockAcoesList[0], usuario_criador_id: "outro", responsavel_principal: "Prof. João Silva", co_responsaveis: null };
    expect(isMinhaAcao(acaoResp, userA)).toBe(true);

    // 3. Co-responsável
    const acaoCoResp: Acao = { ...mockAcoesList[0], usuario_criador_id: "outro", responsavel_principal: "Outro", co_responsaveis: "Maria Santos, João Silva" };
    expect(isMinhaAcao(acaoCoResp, userA)).toBe(true);

    // 4. Não relacionado
    const acaoNaoRel: Acao = { ...mockAcoesList[0], usuario_criador_id: "outro", responsavel_principal: "Maria Santos", co_responsaveis: null };
    expect(isMinhaAcao(acaoNaoRel, userA)).toBe(false);
  });

  // 26. Scope Filter: "Todas as ações" vs "Minhas ações"
  it("26. Scope Filter alterna baseAcoes entre todas e minhas ações", async () => {
    const customUser = { id: "usuario-1", nome: "Prof. Roberto", email: "roberto@fbest.org.br", perfil: "USUARIO" as const, unidades: [] };

    const TestScopeComponent = () => {
      const { scope, setScope, baseAcoes, filteredAcoes } = useAcoesFilter();
      return (
        <div>
          <button onClick={() => setScope("minhas")}>Selecionar Minhas</button>
          <button onClick={() => setScope("todas")}>Selecionar Todas</button>
          <div data-testid="scope-val">{scope}</div>
          <div data-testid="base-count">{baseAcoes.length}</div>
          <div data-testid="filtered-count">{filteredAcoes.length}</div>
        </div>
      );
    };

    const { getByText, getByTestId, findByText } = renderWithFilterContext(<TestScopeComponent />, customUser);

    await findByText("Selecionar Minhas");
    expect(getByTestId("scope-val").textContent).toBe("todas");
    expect(getByTestId("base-count").textContent).toBe("3");

    fireEvent.click(getByText("Selecionar Minhas"));

    await waitFor(() => {
      expect(getByTestId("scope-val").textContent).toBe("minhas");
      // mockAcoesList[0] has usuario_criador_id="usuario-1" and responsavel_principal="Prof. Roberto"
      expect(getByTestId("base-count").textContent).toBe("1");
      expect(getByTestId("filtered-count").textContent).toBe("1");
    });
  });

  // 27. getFiltersSummary inclui 'Escopo: Minhas ações' quando ativo
  it("27. getFiltersSummary inclui escopo Minhas ações", () => {
    const summaryTodas = getFiltersSummary({ ...useAcoesFilter.prototype?.filters, unidade: "all", curso: "all", modalidade: "all", status: "all", criticidade: "all", prioridade: "all", risco: "all", capacidade_saep: "all", tipo_acao: "all", situacaoPrazo: "all", search: "" }, "todas");
    expect(summaryTodas).toBe("Todos");

    const summaryMinhas = getFiltersSummary({ ...useAcoesFilter.prototype?.filters, unidade: "all", curso: "all", modalidade: "all", status: "all", criticidade: "all", prioridade: "all", risco: "all", capacidade_saep: "all", tipo_acao: "all", situacaoPrazo: "all", search: "" }, "minhas");
    expect(summaryMinhas).toContain("Escopo: Minhas ações");
  });

  // 28. Navegação e abas do ADMIN: inicial Visão Geral, sem Minha Unidade, sem Checklist
  it("28. ADMIN inicia em Visão Geral e não possui aba Minha Unidade nem Checklist", async () => {
    const { getAllByRole, queryByRole, findByText } = renderWithFilterContext(
      <MainWorkspace />,
      mockAdminUser
    );

    await findByText("Indicadores e análise consolidada das ações do Workshop SAEP.");
    const tabs = getAllByRole("tab");
    const tabNames = tabs.map((t) => t.textContent?.trim());

    expect(tabNames).toContain("Visão Geral");
    expect(tabNames).toContain("Ações");
    expect(tabNames).toContain("Análise IA");
    expect(tabNames).toContain("Chat IA");
    expect(tabNames).toContain("Gestão de Acessos");

    expect(tabNames.some((t) => t?.includes("Minha Unidade"))).toBe(false);
    expect(tabNames.some((t) => t?.includes("Checklist"))).toBe(false);
  });

  // 29. Navegação e abas do MACROPROCESSO_TECNICO: inicial Minha Unidade, com Chat IA, sem Gestão de Acessos, sem Checklist
  it("29. MACROPROCESSO_TECNICO inicia em Minha Unidade e possui Chat IA sem Gestão de Acessos", async () => {
    const { getAllByRole, queryByRole, findByText } = renderWithFilterContext(
      <MainWorkspace />,
      mockMacroUser
    );

    await findByText("Acompanhe e gerencie as ações das unidades autorizadas.");
    const tabs = getAllByRole("tab");
    const tabNames = tabs.map((t) => t.textContent?.trim());

    expect(tabNames[0]).toContain("Minha Unidade");
    expect(tabNames).toContain("Visão Geral");
    expect(tabNames).toContain("Análise IA");
    expect(tabNames).toContain("Chat IA");

    expect(tabNames.some((t) => t?.includes("Gestão de Acessos"))).toBe(false);
    expect(tabNames.some((t) => t?.includes("Checklist"))).toBe(false);
  });

  // 30. Navegação e abas do USUARIO: inicial Minha Unidade, sem Chat IA, sem Gestão de Acessos, sem Checklist
  it("30. USUARIO inicia em Minha Unidade e tem acesso à Análise IA sem Chat IA nem Gestão de Acessos", async () => {
    const { getAllByRole, queryByRole, findByText } = renderWithFilterContext(
      <MainWorkspace />,
      mockUsuarioUser
    );

    await findByText("Acompanhe e gerencie as ações das unidades autorizadas.");
    const tabs = getAllByRole("tab");
    const tabNames = tabs.map((t) => t.textContent?.trim());

    expect(tabNames[0]).toContain("Minha Unidade");
    expect(tabNames).toContain("Visão Geral");
    expect(tabNames).toContain("Análise IA");

    expect(tabNames.some((t) => t?.includes("Chat IA"))).toBe(false);
    expect(tabNames.some((t) => t?.includes("Gestão de Acessos"))).toBe(false);
    expect(tabNames.some((t) => t?.includes("Checklist"))).toBe(false);
  });

  // 31. Panorama das Unidades visível para ADMIN no Dashboard
  it("31. Panorama das Unidades é renderizado exclusivamente para ADMIN no Dashboard", async () => {
    const { getByText, findByText } = renderWithFilterContext(
      <DashboardView />,
      mockAdminUser
    );

    await findByText("Panorama das Unidades");
    expect(getByText("Visão Consolidada (2 unidades)")).toBeTruthy();
    expect(getByText("Feira de Santana")).toBeTruthy();
    expect(getByText("Dendezeiros")).toBeTruthy();
  });

  // 32. Panorama das Unidades NÃO é renderizado para MACRO e USUARIO
  it("32. Panorama das Unidades não é exibido para MACRO e USUARIO", async () => {
    const { queryByText, findByText } = renderWithFilterContext(
      <DashboardView />,
      mockUsuarioUser
    );

    await findByText("Total de Ações");
    expect(queryByText("Panorama das Unidades")).toBeNull();
    expect(queryByText("Visualização do Dashboard:")).toBeTruthy();
  });

  // 33. AcoesTable suporta modo isReadOnly
  it("33. AcoesTable no modo isReadOnly não exibe botão de cadastrar nem ações de edição/exclusão", async () => {
    const { queryByText, queryByTitle, findByText } = renderWithFilterContext(
      <AcoesTable isAdmin={false} isReadOnly={true} title="Tabela Somente Leitura" />,
      mockUsuarioUser
    );

    await findByText("Tabela Somente Leitura (3)");
    expect(queryByText("Cadastrar ação")).toBeNull();
    expect(queryByTitle("Editar ação")).toBeNull();
    expect(queryByTitle("Excluir ação")).toBeNull();
  });
});
