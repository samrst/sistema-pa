import "./setup";
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import Index from "../pages/Index";
import UsuariosView from "../components/UsuariosView";
import type { Usuario, Unidade } from "../types/auth";

const mockUnidades: Unidade[] = [
  { id: "u-1", nome: "SENAI Cimatec", codigo: "CIMATEC", ativo: true },
  { id: "u-2", nome: "SENAI Dendezeiros", codigo: "DENDEZEIROS", ativo: true },
  { id: "u-3", nome: "SENAI Feira de Santana", codigo: "FSA", ativo: true },
];

const mockUsuarios: Usuario[] = [
  {
    id: "user-1",
    nome: "Administrador do Sistema",
    email: "admin@fbest.org.br",
    perfil: "ADMIN",
    ativo: true,
    unidades: [],
  },
  {
    id: "user-2",
    nome: "Coordenador Técnico",
    email: "macro@fbest.org.br",
    perfil: "MACROPROCESSO_TECNICO",
    ativo: true,
    unidades: [mockUnidades[0], mockUnidades[1]],
  },
  {
    id: "user-3",
    nome: "Professor Roberto",
    email: "usuario@fbest.org.br",
    perfil: "USUARIO",
    ativo: false,
    unidades: [mockUnidades[2]],
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

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("PHASE 6.6 — Gestão de Usuários, Perfis e Acessos no Frontend", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it("1. Proteção de Acesso: Aba 'Gestão de Acessos' é visível para ADMIN", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            usuario: {
              id: "admin-1",
              nome: "Admin Test",
              email: "admin@fbest.org.br",
              perfil: "ADMIN",
              ativo: true,
              unidades: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (u.includes("/api/acoes") || u.includes("/api/usuarios") || u.includes("/api/unidades")) {
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 404 });
    };

    localStorage.setItem("saep_jwt_token", "fake.admin.jwt");

    const { getByRole } = renderWithProviders(<Index />);

    await waitFor(() => {
      expect(getByRole("tab", { name: /Gestão de Acessos/i })).toBeTruthy();
    });
  });

  it("2. Proteção de Acesso: Aba 'Gestão de Acessos' é oculta para perfil USUARIO", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            usuario: {
              id: "user-1",
              nome: "User Test",
              email: "user@fbest.org.br",
              perfil: "USUARIO",
              ativo: true,
              unidades: [{ id: "u-1", nome: "SENAI Cimatec" }],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (u.includes("/api/acoes") || u.includes("/api/usuarios") || u.includes("/api/unidades")) {
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 404 });
    };

    localStorage.setItem("saep_jwt_token", "fake.user.jwt");

    const { queryByRole, getByRole } = renderWithProviders(<Index />);

    await waitFor(() => {
      expect(getByRole("tab", { name: /Minha Unidade/i })).toBeTruthy();
    });

    expect(queryByRole("tab", { name: /Gestão de Acessos/i })).toBeNull();
  });

  it("3. Renderiza a tabela de usuários com cabeçalho, busca, filtros e dados", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getByText, getByPlaceholderText, getByRole } = renderWithProviders(
      <UsuariosView />
    );

    expect(getByText("Gestão de Usuários e Acessos")).toBeTruthy();
    expect(getByRole("button", { name: /Novo Usuário/i })).toBeTruthy();
    expect(getByPlaceholderText("Buscar por nome ou e-mail...")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("Administrador do Sistema")).toBeTruthy();
      expect(getByText("Coordenador Técnico")).toBeTruthy();
      expect(getByText("Professor Roberto")).toBeTruthy();
    });
  });

  it("4. Exibe e estrutura corretamente a barra de busca e os seletores de filtros", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <UsuariosView />
    );

    await waitFor(() => {
      expect(getByText("Administrador do Sistema")).toBeTruthy();
      expect(getByText("Coordenador Técnico")).toBeTruthy();
      expect(getByText("Professor Roberto")).toBeTruthy();
    });

    // Campo de busca
    const searchInput = getByPlaceholderText("Buscar por nome ou e-mail...");
    expect(searchInput).toBeTruthy();

    // Filtros de Perfil, Unidade e Status
    expect(getByText("Todos os perfis")).toBeTruthy();
    expect(getByText("Todas as unidades")).toBeTruthy();
    expect(getByText("Todos os status")).toBeTruthy();
  });

  it("5. Abre modal de criação ao clicar no botão 'Novo Usuário'", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getByRole, getAllByText } = renderWithProviders(<UsuariosView />);

    await waitFor(() => {
      expect(getByRole("button", { name: /Novo Usuário/i })).toBeTruthy();
    });

    const novoBtn = getByRole("button", { name: /Novo Usuário/i });
    fireEvent.click(novoBtn);

    await waitFor(() => {
      const titles = getAllByText("Novo Usuário");
      expect(titles.length).toBeGreaterThanOrEqual(2); // botão + título do dialog
    });
  });

  it("6. Abre modal de edição ao clicar no botão 'Editar Usuário'", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getAllByTitle, getByText } = renderWithProviders(<UsuariosView />);

    await waitFor(() => {
      expect(getByText("Administrador do Sistema")).toBeTruthy();
    });

    const editBtns = getAllByTitle("Editar Usuário");
    expect(editBtns.length).toBeGreaterThan(0);
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(getByText("Editar Usuário")).toBeTruthy();
    });
  });

  it("7. Abre modal de alteração de senha ao clicar no botão 'Alterar Senha'", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getAllByTitle, getByText } = renderWithProviders(<UsuariosView />);

    await waitFor(() => {
      expect(getByText("Administrador do Sistema")).toBeTruthy();
    });

    const senhaBtns = getAllByTitle("Alterar Senha");
    expect(senhaBtns.length).toBeGreaterThan(0);
    fireEvent.click(senhaBtns[0]);

    await waitFor(() => {
      expect(getByText("Alterar Senha de Acesso")).toBeTruthy();
    });
  });

  it("8. Abre diálogo de confirmação ao clicar no botão de desativação", async () => {
    global.fetch = async (url: any) => {
      const u = url.toString();
      if (u.includes("/api/usuarios")) {
        return new Response(JSON.stringify(mockUsuarios), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/unidades")) {
        return new Response(JSON.stringify(mockUnidades), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getAllByTitle, getByText } = renderWithProviders(<UsuariosView />);

    await waitFor(() => {
      expect(getByText("Administrador do Sistema")).toBeTruthy();
    });

    const desativarBtns = getAllByTitle("Desativar Usuário");
    expect(desativarBtns.length).toBeGreaterThan(0);
    fireEvent.click(desativarBtns[0]);

    await waitFor(() => {
      expect(getByText("Desativar Usuário?")).toBeTruthy();
    });
  });
});
