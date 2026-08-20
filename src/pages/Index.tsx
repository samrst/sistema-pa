import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  TableProperties,
  BrainCircuit,
  LogOut,
  MessageSquare,
  FileDown,
  Loader2,
  CircleHelp,
  Users,
  UserCheck,
  Layers,
} from "lucide-react";
import AcoesTable from "@/components/AcoesTable";
import DashboardView from "@/components/DashboardView";
import AnalistaGemini from "@/components/AnalistaGemini";
import AdminChat from "@/components/AdminChat";
import LoginView from "@/components/LoginView";
import UsuariosView from "@/components/UsuariosView";
import FilterBar from "@/components/FilterBar";
import { FilterProvider, useAcoesFilter, getFiltersSummary } from "@/contexts/FilterContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/styles/header.css";
import "@/styles/footer.css";
import "@/styles/help-button.css";
import { exportAcoesPdf } from "@/lib/exportPdf";

const ScopeSelector = () => {
  const { scope, setScope, totalAcoes, totalScopedAcoes } = useAcoesFilter();

  return (
    <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg border border-border shadow-inner">
      <button
        type="button"
        onClick={() => setScope("todas")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
          scope === "todas"
            ? "bg-background text-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Todas as ações</span>
      </button>
      <button
        type="button"
        onClick={() => setScope("minhas")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
          scope === "minhas"
            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <UserCheck className="h-3.5 w-3.5" />
        <span>Minhas ações</span>
        {scope === "minhas" && (
          <span className="ml-1 text-[11px] bg-primary-foreground/20 px-1.5 py-0.2 rounded-full">
            {totalScopedAcoes}
          </span>
        )}
      </button>
    </div>
  );
};

const MainWorkspace = () => {
  const { user, isAdmin, isMacroprocesso, isUsuario, logout } = useAuth();
  const defaultTab = isAdmin ? "visao-geral" : "minha-unidade";
  const [tab, setTab] = useState(defaultTab);
  const { filteredAcoes, filters, scope } = useAcoesFilter();

  const canAccessChatIA = isAdmin || isMacroprocesso;

  useEffect(() => {
    if (isAdmin) {
      if (tab === "minha-unidade" || tab === "checklist" || tab === "dashboard") {
        setTab("visao-geral");
      }
    } else {
      if (tab === "acoes" || tab === "usuarios" || tab === "checklist" || tab === "dashboard") {
        setTab("minha-unidade");
      } else if (isUsuario && tab === "agente-admin") {
        setTab("minha-unidade");
      }
    }
  }, [isAdmin, isUsuario, isMacroprocesso, tab]);

  const getPerfilLabel = () => {
    if (isAdmin) return "Admin";
    if (isMacroprocesso) return "Macroprocesso Técnico";
    if (user?.unidades?.[0]?.nome) return user.unidades[0].nome;
    return "Usuário";
  };

  const handleExportPdf = () => {
    const summary = getFiltersSummary(filters, scope);
    exportAcoesPdf(filteredAcoes, summary);
  };

  return (
    <div className="min-h-screen bg-background">
      <header>
        <nav className="saep-nav">
          <a href="/">
            <img
              src="/IMG/logo-senai.png"
              alt="Logo SENAI"
              className="saep-logo"
            />
          </a>

          <h2 className="saep-title">
            SENAI | SAEP
          </h2>

          <ul className="flex items-center gap-2 ml-auto">
            {user && (
              <li className="hidden md:flex items-center bg-white/15 text-white border border-white/25 px-[14px] py-[8px] rounded-[8px] font-sans text-[13px] font-semibold">
                <span className="truncate max-w-[160px]">{user.nome}</span>
                <span className="mx-2 opacity-60">|</span>
                <span className="opacity-90">{getPerfilLabel()}</span>
              </li>
            )}

            <li>
              <Button
                onClick={handleExportPdf}
                disabled={!filteredAcoes || filteredAcoes.length === 0}
                className="bg-white/15 text-white border border-white/25 px-2.5 sm:px-[18px] py-1.5 sm:py-[10px] rounded-[8px] font-['Neo_Sans_Pro',sans-serif] italic text-xs sm:text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0"
                title="Exportar ações filtradas em PDF"
                aria-label={`Exportar ${filteredAcoes.length} ações filtradas em PDF`}
              >
                <FileDown className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline">Exportar PDF </span>
                {filteredAcoes.length > 0 && `(${filteredAcoes.length})`}
              </Button>
            </li>

            <li>
              <Button
                onClick={logout}
                className="bg-white/15 text-white border border-white/25 px-2.5 sm:px-[18px] py-1.5 sm:py-[10px] rounded-[8px] font-sans text-xs sm:text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px] shrink-0"
                title="Encerrar sessão"
                aria-label="Encerrar sessão"
              >
                <LogOut className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                <span>Sair</span>
              </Button>
            </li>
          </ul>
        </nav>

        <section className="saep-hero">
          <p className="saep-eyebrow">
            PLATAFORMA DE PLANO DE AÇÃO
          </p>

          <h1>
            Workshop SAEP 2026
          </h1>

          <p>
            Plataforma para gestão, acompanhamento e análise das ações com foco no SAEP.
          </p>
        </section>
      </header>

      <section className="body-section"></section>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="w-full overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            <TabsList className="w-max min-w-full justify-start sm:justify-start gap-1">
              {/* ADMIN Tabs */}
              {isAdmin && (
                <>
                  <TabsTrigger value="visao-geral" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <LayoutDashboard className="h-4 w-4" /> Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="acoes" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <TableProperties className="h-4 w-4" /> Ações
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <BrainCircuit className="h-4 w-4" /> Análise IA
                  </TabsTrigger>
                  <TabsTrigger value="agente-admin" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" /> Chat IA
                  </TabsTrigger>
                  <TabsTrigger value="usuarios" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <Users className="h-4 w-4" /> Gestão de Acessos
                  </TabsTrigger>
                </>
              )}

              {/* MACROPROCESSO_TECNICO Tabs */}
              {isMacroprocesso && (
                <>
                  <TabsTrigger value="minha-unidade" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <TableProperties className="h-4 w-4" /> Minha Unidade
                  </TabsTrigger>
                  <TabsTrigger value="visao-geral" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <LayoutDashboard className="h-4 w-4" /> Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <BrainCircuit className="h-4 w-4" /> Análise IA
                  </TabsTrigger>
                  <TabsTrigger value="agente-admin" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" /> Chat IA
                  </TabsTrigger>
                </>
              )}

              {/* USUARIO Tabs */}
              {isUsuario && (
                <>
                  <TabsTrigger value="minha-unidade" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <TableProperties className="h-4 w-4" /> Minha Unidade
                  </TabsTrigger>
                  <TabsTrigger value="visao-geral" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <LayoutDashboard className="h-4 w-4" /> Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <BrainCircuit className="h-4 w-4" /> Análise IA
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* ABA VISÃO GERAL */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-foreground font-heading">Visão Geral</h3>
                <p className="text-xs text-muted-foreground">Indicadores e análise consolidada das ações do Workshop SAEP.</p>
              </div>
              <ScopeSelector />
            </div>
            <FilterBar />
            <DashboardView />
            {!isAdmin && (
              <div className="pt-4 border-t border-border space-y-3">
                <AcoesTable isAdmin={false} isReadOnly={true} title="Ações Consolidadas (Visão Geral)" />
              </div>
            )}
          </TabsContent>

          {/* ABA AÇÕES (ADMIN Exclusivo) */}
          {isAdmin && (
            <TabsContent value="acoes" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-base font-bold text-foreground font-heading">Ações</h3>
                  <p className="text-xs text-muted-foreground">Gerencie e acompanhe as ações cadastradas no plano.</p>
                </div>
                <ScopeSelector />
              </div>
              <FilterBar />
              <AcoesTable isAdmin={true} isReadOnly={false} title="Ações" />
            </TabsContent>
          )}

          {/* ABA MINHA UNIDADE (Macroprocesso e Usuário) */}
          {(isMacroprocesso || isUsuario) && (
            <TabsContent value="minha-unidade" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-base font-bold text-foreground font-heading">Minha Unidade</h3>
                  <p className="text-xs text-muted-foreground">Acompanhe e gerencie as ações das unidades autorizadas.</p>
                </div>
                <ScopeSelector />
              </div>
              <FilterBar />
              <AcoesTable isAdmin={false} isReadOnly={false} title="Minha Unidade" />
            </TabsContent>
          )}

          {/* ABA ANÁLISE IA (Disponível para todos os perfis) */}
          <TabsContent value="analise">
            <AnalistaGemini />
          </TabsContent>

          {/* ABA CHAT IA (ADMIN e MACROPROCESSO_TECNICO) */}
          {canAccessChatIA && (
            <TabsContent value="agente-admin">
              <AdminChat />
            </TabsContent>
          )}

          {/* ABA GESTÃO DE ACESSOS (ADMIN Exclusivo) */}
          {isAdmin && (
            <TabsContent value="usuarios">
              <UsuariosView />
            </TabsContent>
          )}
        </Tabs>

        <a href="https://sistemasaep.netlify.app/contato" className="help-button" aria-label="Central de Ajuda" title="Central de Ajuda">
          <CircleHelp className="h-6 w-6" />
          <span className="help-text">Ajuda</span>
        </a>
      </main>

      <div className="container mx-auto px-4">
        <section className="portal-banner my-6">
          <img src="/IMG/banner-saep.png" alt="Portal de Sistemas SAEP" />
        </section>
      </div>
      <footer>
        <p>© 2026 SENAI Bahia — Plataforma de Plano de Ação com foco no SAEP</p>
      </footer>
    </div>
  );
};

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Tela de carregamento enquanto valida token / sessão
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <img src="/IMG/logo-senai.png" alt="SENAI" className="h-10 w-auto" />
          <div className="flex items-center gap-2.5 text-primary font-semibold text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Carregando plataforma...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Se não estiver autenticado, exibe a tela inicial de Login & Apresentação
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // 3. Usuário autenticado acessa o workspace encapsulado no FilterProvider
  return (
    <FilterProvider>
      <MainWorkspace />
    </FilterProvider>
  );
};

export { MainWorkspace };
export default Index;
