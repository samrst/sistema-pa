import "./setup";
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AUTH_TOKEN_KEY, getAuthToken, setAuthToken, removeAuthToken } from "../services/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("PHASE 6.5 — AuthContext e Autenticação JWT no Frontend", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it("1. Inicializa sem autenticação quando não há token no localStorage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMacroprocesso).toBe(false);
    expect(result.current.isUsuario).toBe(false);
  });

  it("2. Realiza login com sucesso, armazena token e atualiza usuário ADMIN", async () => {
    const mockToken = "mock.jwt.token.admin";
    const mockLoginResponse = {
      token: mockToken,
      usuario: {
        id: "admin-uuid-1",
        nome: "Administrador Geral",
        email: "admin@fbest.org.br",
        perfil: "ADMIN",
        unidades: [],
      },
    };
    const mockMeResponse = {
      usuario: {
        id: "admin-uuid-1",
        nome: "Administrador Geral",
        email: "admin@fbest.org.br",
        perfil: "ADMIN",
        ativo: true,
        unidades: [],
      },
    };

    global.fetch = async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/auth/login")) {
        return new Response(JSON.stringify(mockLoginResponse), { status: 200 });
      }
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify(mockMeResponse), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("admin@fbest.org.br", "SAEP2026");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isMacroprocesso).toBe(false);
    expect(result.current.isUsuario).toBe(false);
    expect(result.current.user?.email).toBe("admin@fbest.org.br");
    expect(result.current.token).toBe(mockToken);
    expect(getAuthToken()).toBe(mockToken);
  });

  it("3. Rejeita login com credenciais inválidas e propaga erro do backend", async () => {
    global.fetch = async (url: any) => {
      if (url.toString().includes("/api/auth/login")) {
        return new Response(JSON.stringify({ error: "Credenciais inválidas." }), { status: 401 });
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    let errorThrown: any = null;
    await act(async () => {
      try {
        await result.current.login("errado@fbest.org.br", "senhaErrada");
      } catch (err: any) {
        errorThrown = err;
      }
    });

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toBe("Credenciais inválidas.");
    expect(result.current.isAuthenticated).toBe(false);
    expect(getAuthToken()).toBeNull();
  });

  it("4. Logout limpa o token e reseta o estado do usuário", async () => {
    setAuthToken("existing.mock.token");

    global.fetch = async (url: any) => {
      if (url.toString().includes("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            usuario: {
              id: "user-1",
              nome: "Test User",
              email: "test@fbest.org.br",
              perfil: "ADMIN",
              ativo: true,
              unidades: [],
            },
          }),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    // Aguarda carregar sessão inicial
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it("5. Recupera sessão existente via /api/auth/me na montagem", async () => {
    const existingToken = "existing.valid.token";
    setAuthToken(existingToken);

    global.fetch = async (url: any) => {
      if (url.toString().includes("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            usuario: {
              id: "macro-uuid-1",
              nome: "Técnico Regional",
              email: "macro@fbest.org.br",
              perfil: "MACROPROCESSO_TECNICO",
              ativo: true,
              unidades: [
                { id: "u-1", nome: "Dendezeiros", codigo: "DEN", ativo: true },
                { id: "u-2", nome: "CIMATEC", codigo: "CIM", ativo: true },
              ],
            },
          }),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMacroprocesso).toBe(true);
    expect(result.current.isUsuario).toBe(false);
    expect(result.current.user?.unidades.length).toBe(2);
  });

  it("6. Token inválido (401) em /api/auth/me limpa automaticamente a sessão", async () => {
    setAuthToken("expired.token");

    global.fetch = async (url: any) => {
      if (url.toString().includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Token expirado ou inválido." }), { status: 401 });
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it("7. Reconhece corretamente o perfil USUARIO e suas unidades vinculadas", async () => {
    const mockToken = "token.usuario";
    const mockLoginResponse = {
      token: mockToken,
      usuario: {
        id: "usuario-uuid-1",
        nome: "Docente Cimatec",
        email: "docente@fbest.org.br",
        perfil: "USUARIO",
        unidades: ["cimatec-id"],
      },
    };
    const mockMeResponse = {
      usuario: {
        id: "usuario-uuid-1",
        nome: "Docente Cimatec",
        email: "docente@fbest.org.br",
        perfil: "USUARIO",
        ativo: true,
        unidades: [{ id: "cimatec-id", nome: "CIMATEC", codigo: "CIM", ativo: true }],
      },
    };

    global.fetch = async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/auth/login")) {
        return new Response(JSON.stringify(mockLoginResponse), { status: 200 });
      }
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify(mockMeResponse), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    };

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login("docente@fbest.org.br", "SAEP2026");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMacroprocesso).toBe(false);
    expect(result.current.isUsuario).toBe(true);
    expect(result.current.user?.unidades[0]?.nome).toBe("CIMATEC");
  });
});
