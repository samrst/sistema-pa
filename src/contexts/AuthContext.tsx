import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type UsuarioAuth,
  type Perfil,
  type LoginResponse,
  type MeResponse,
} from "@/types/auth";
import {
  API_BASE_URL,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  onAuthUnauthorized,
} from "@/services/api";

interface AuthContextType {
  user: UsuarioAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMacroprocesso: boolean;
  isUsuario: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<UsuarioAuth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    removeAuthToken();
    setTokenState(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const loadUserFromMe = useCallback(async (jwtToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.ok) {
        const data: MeResponse = await response.json();
        setUser(data.usuario);
        setTokenState(jwtToken);
      } else if (response.status === 401 || response.status === 403) {
        logout();
      }
    } catch {
      // Falha temporária de conexão de rede não apaga imediatamente a sessão
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = getAuthToken();
    if (storedToken) {
      loadUserFromMe(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [loadUserFromMe]);

  useEffect(() => {
    const unsubscribe = onAuthUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  const login = async (email: string, senha: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Credenciais inválidas.");
    }

    const loginData = data as LoginResponse;
    setAuthToken(loginData.token);
    setTokenState(loginData.token);

    // Imediatamente busca dados detalhados do usuário (incluindo objetos das unidades)
    try {
      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      if (meResponse.ok) {
        const meData: MeResponse = await meResponse.json();
        setUser(meData.usuario);
      } else {
        // Fallback básico caso /api/auth/me falhe
        setUser({
          id: loginData.usuario.id,
          nome: loginData.usuario.nome,
          email: loginData.usuario.email,
          perfil: loginData.usuario.perfil,
          unidades: loginData.usuario.unidades.map((uId) => ({ id: uId, nome: uId })),
        });
      }
    } catch {
      setUser({
        id: loginData.usuario.id,
        nome: loginData.usuario.nome,
        email: loginData.usuario.email,
        perfil: loginData.usuario.perfil,
        unidades: loginData.usuario.unidades.map((uId) => ({ id: uId, nome: uId })),
      });
    }

    // Invalida consultas para recarregar ações com o novo escopo do usuário logado
    queryClient.invalidateQueries();
  };

  const perfil: Perfil | undefined = user?.perfil;
  const isAuthenticated = Boolean(token && user);
  const isAdmin = perfil === "ADMIN";
  const isMacroprocesso = perfil === "MACROPROCESSO_TECNICO";
  const isUsuario = perfil === "USUARIO";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isMacroprocesso,
        isUsuario,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
