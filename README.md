# Sistema SAEP — Plataforma de Gestão de Planos de Ação (SENAI Bahia)

Plataforma integrada para planejamento, acompanhamento, checklist, geração de relatórios e assessoria estratégica com Inteligência Artificial para planos de ação do **SAEP (Sistema de Avaliação da Educação Profissional)** do **SENAI Bahia**.

---

## 1. Arquitetura do Sistema

O sistema possui uma arquitetura 100% própria e desacoplada de serviços externos legados:

```
Frontend (React + Vite + TypeScript)
        ↓ (HTTP / REST + SSE)
Backend (Fastify + TypeScript)
        ↓
  ┌─────┴─────────────────────────┐
  ↓                               ↓
Prisma ORM               Google Gemini API
  ↓                     (gemini-2.5-flash)
MariaDB Local/Portátil
```

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui e TanStack Query.
* **Backend**: Node.js, Fastify 4, TypeScript e Prisma ORM.
* **Banco de Dados**: MariaDB (local ou portátil) na porta `3306`.
* **Inteligência Artificial**: Google Gemini (`gemini-2.5-flash`) consumido exclusivamente pelo backend através da SDK oficial `@google/generative-ai`.

> [!NOTE]
> O sistema não depende mais do Supabase para banco de dados, autenticação ou execução das rotas de inteligência artificial.

---

## 2. Pré-requisitos

* **Bun** (v1.1+ recomendado) ou **Node.js** (v18+).
* **MariaDB** (instalado localmente ou executável portátil no Windows).
* **Chave de API do Google Gemini** (`GEMINI_API_KEY`).
* **Git**.

---

## 3. Banco de Dados MariaDB

O projeto utiliza MariaDB na porta padrão `3306`.

### Inicialização do MariaDB Portátil (Windows):
1. Inicie o executável do MariaDB (ex: `mariadbd.exe` ou `mysqld.exe`).
2. Confirme que a porta `3306` está respondendo. No PowerShell:
   ```powershell
   Test-NetConnection 127.0.0.1 -Port 3306
   ```
   *(O resultado `TcpTestSucceeded: True` indica que o banco está pronto).*

---

## 4. Configuração de Variáveis de Ambiente

### 4.1 Backend (`backend/.env`)
Crie o arquivo `backend/.env` baseado em `backend/.env.example`:
```env
DATABASE_URL="mysql://sistema_pa:SUA_SENHA@localhost:3306/sistema_pa"
CORS_ORIGIN=http://localhost:5173
PORT=3000
GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
```
> [!IMPORTANT]
> A chave `GEMINI_API_KEY` deve existir **exclusivamente** no `backend/.env` e nunca ser compartilhada com o frontend.

### 4.2 Frontend (`.env`)
Crie o arquivo `.env` na raiz do projeto baseado em `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 5. Instalação e Preparação do Banco

1. Instale as dependências da raiz (frontend):
   ```sh
   bun install
   ```

2. Instale as dependências do backend e configure a tabela `acoes_saep`:
   ```sh
   cd backend
   bun install
   bun run prisma:validate
   bun run prisma:db-setup
   ```

---

## 6. Execução da Aplicação

### 6.1 Iniciar o Backend:
```sh
cd backend
bun run dev
```
* O servidor Fastify iniciará em `http://localhost:3000`.

### 6.2 Iniciar o Frontend:
Em outro terminal, na raiz do projeto:
```sh
bun run dev
```
* A aplicação web estará acessível em `http://localhost:5173`.

---

## 7. Health Check da API

Para verificar o status do servidor e a conectividade com o MariaDB:
```sh
GET http://localhost:3000/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "db": true
}
```

---

## 8. Estrutura de Diretórios

```
sistema-pa/
├── src/                    # Código-fonte do Frontend (React + Vite + TS)
│   ├── components/         # Componentes UI, Tabelas, Dialogs e Agentes IA
│   ├── hooks/              # Hooks React e integração React Query (useAcoes)
│   ├── pages/              # Páginas da aplicação (Index, NotFound)
│   ├── styles/             # Folhas de estilo customizadas
│   └── lib/                # Utilitários e exportadores (PDF, CSV, Excel)
├── backend/                # Código-fonte do Backend (Fastify + Prisma)
│   ├── prisma/             # Schema Prisma e DDL MariaDB
│   ├── scripts/            # Scripts operacionais (db-setup)
│   └── src/
│       ├── controllers/    # Controladores de Ações, IA Analista e Chat
│       ├── routes/         # Rotas REST e SSE (/api/acoes, /api/ia, /api/chat)
│       ├── services/       # Serviços e prompts do Gemini (ia.ts, chat.ts)
│       └── server.ts       # Servidor Fastify principal
├── supabase/               # Legado preservado (histórico / rollback)
├── package.json            # Configuração e dependências do Frontend
├── docker-compose.yml      # Configuração opcional para containers MariaDB
└── README.md               # Documentação oficial do projeto
```

---

## 9. Segurança e Boas Práticas

* Os arquivos `.env` e `backend/.env` estão listados no `.gitignore` e **nunca** devem ser incluídos em commits.
* O frontend comunica-se exclusivamente com o backend Fastify através da URL base `VITE_API_BASE_URL`.
* O acesso às funções administrativas (Agente Admin e edição de ações) conta com persistência de sessão em `sessionStorage` sem armazenar credenciais ou tokens sensíveis.
