import "./setup";
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import LoginView from "../components/LoginView";

function renderLoginView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("PHASE 6.5.1 — Redesign da Tela Inicial e Login (LoginView)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it("1. Renderiza a tela de login com apresentação institucional da Plataforma de Plano de Ação", () => {
    const { getByText, getByLabelText, getByRole } = renderLoginView();

    // Título e posicionamento correto da plataforma
    expect(getByText("Bem-vindo(a)!").textContent).toContain("Bem-vindo(a)!");
    expect(getByText("Plataforma de Plano de Ação")).toBeTruthy();

    // Campos de login
    expect(getByLabelText(/E-mail/i)).toBeTruthy();
    expect(getByLabelText(/Senha/i)).toBeTruthy();

    // Botão de login
    expect(getByRole("button", { name: /Entrar/i })).toBeTruthy();

    // 4 Destaques institucionais
    expect(getByText("Planejamento")).toBeTruthy();
    expect(getByText("Acompanhamento")).toBeTruthy();
    expect(getByText("Gestão Estruturada")).toBeTruthy();
    expect(getByText("Foco no SAEP")).toBeTruthy();
  });

  it("2. Permite alternar visibilidade da senha (mostrar/ocultar senha)", () => {
    const { getByLabelText, getByTitle } = renderLoginView();

    const passwordInput = getByLabelText(/Senha/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleButton = getByTitle("Ver senha");
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe("text");

    const hideButton = getByTitle("Ocultar senha");
    fireEvent.click(hideButton);

    expect(passwordInput.type).toBe("password");
  });

  it("3. Exibe mensagem de erro quando campos estão vazios", async () => {
    const { getByRole, getByText } = renderLoginView();

    const submitBtn = getByRole("button", { name: /Entrar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(getByText("Informe seu e-mail e sua senha para continuar.")).toBeTruthy();
    });
  });

  it("4. Exibe mensagem de erro retornada pelo backend ao falhar autenticação", async () => {
    global.fetch = async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/auth/login")) {
        return new Response(JSON.stringify({ error: "E-mail ou senha incorretos." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    };

    const { getByLabelText, getByRole, getByText } = renderLoginView();

    const emailInput = getByLabelText(/E-mail/i);
    const passwordInput = getByLabelText(/Senha/i);
    const submitBtn = getByRole("button", { name: /Entrar/i });

    fireEvent.input(emailInput, { target: { value: "teste@fbest.org.br" } });
    fireEvent.input(passwordInput, { target: { value: "senhaIncorreta" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(getByText("E-mail ou senha incorretos.")).toBeTruthy();
    });
  });

  it("5. Executa login com sucesso quando credenciais são válidas", async () => {
    global.fetch = async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/auth/login")) {
        return new Response(
          JSON.stringify({
            token: "valid.jwt.token",
            usuario: {
              id: "u-1",
              nome: "Admin Test",
              email: "admin@fbest.org.br",
              perfil: "ADMIN",
              unidades: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            usuario: {
              id: "u-1",
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
      return new Response("{}", { status: 404 });
    };

    const { getByLabelText, getByRole } = renderLoginView();

    const emailInput = getByLabelText(/E-mail/i);
    const passwordInput = getByLabelText(/Senha/i);
    const submitBtn = getByRole("button", { name: /Entrar/i });

    fireEvent.input(emailInput, { target: { value: "admin@fbest.org.br" } });
    fireEvent.input(passwordInput, { target: { value: "SAEP2026" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(localStorage.getItem("saep_jwt_token")).toBe("valid.jwt.token");
    });
  });
});
