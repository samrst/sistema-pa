export type Perfil = 'ADMIN' | 'MACROPROCESSO_TECNICO' | 'USUARIO';

export interface UnidadeAuth {
  id: string;
  nome: string;
  codigo?: string | null;
  ativo?: boolean;
}

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  unidades: UnidadeAuth[];
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
    unidades: string[];
  };
}

export interface MeResponse {
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
    ativo: boolean;
    unidades: UnidadeAuth[];
  };
}
