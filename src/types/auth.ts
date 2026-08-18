export type Perfil = 'ADMIN' | 'MACROPROCESSO_TECNICO' | 'USUARIO';

export interface Unidade {
  id: string;
  nome: string;
  codigo?: string | null;
  ativo: boolean;
}

export interface UnidadeAuth {
  id: string;
  nome: string;
  codigo?: string | null;
  ativo?: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  unidades: Unidade[];
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  unidades: UnidadeAuth[];
}

export interface CreateUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  unidades_ids: string[];
}

export interface UpdateUsuarioInput {
  nome?: string;
  email?: string;
  perfil?: Perfil;
  ativo?: boolean;
  unidades_ids?: string[];
}

export interface UpdateSenhaUsuarioInput {
  senha: string;
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
