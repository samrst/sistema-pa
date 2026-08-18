import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  TableProperties,
  ClipboardCheck,
  BrainCircuit,
  LogOut,
  MessageSquare,
  FileDown,
  Loader2,
  CircleHelp,
  Users,
} from "lucide-react";
import AcoesTable from "@/components/AcoesTable";
import DashboardView from "@/components/DashboardView";
import ChecklistView from "@/components/ChecklistView";
import AnalistaGemini from "@/components/AnalistaGemini";
import AdminChat from "@/components/AdminChat";
import LoginView from "@/components/LoginView";
import UsuariosView from "@/components/UsuariosView";
import { useAcoes } from "@/hooks/useAcoes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import "@/styles/header.css";
import "@/styles/footer.css";
import "@/styles/help-button.css";
import { exportAcoesPdf } from "@/lib/exportPdf";

const Index = () => {
  const [tab, setTab] = useState("acoes");
  const { data: acoes } = useAcoes();
  const { user, isAuthenticated, isAdmin, isMacroprocesso, isLoading, logout } = useAuth();

  const canAccessIA = isAdmin || isMacroprocesso;

  useEffect(() => {
    if (!canAccessIA && (tab === "analise" || tab === "agente-admin")) {
      setTab("acoes");
    }
    if (!isAdmin && tab === "usuarios") {
      setTab("acoes");
    }
  }, [canAccessIA, isAdmin, tab]);

  const getPerfilLabel = () => {
    if (isAdmin) return "Admin";
    if (isMacroprocesso) return "Macroprocesso Técnico";
    if (user?.unidades?.[0]?.nome) return user.unidades[0].nome;
    return "Usuário";
  };

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

  // 2. Se não estiver autenticado, exibe a nova tela inicial de Login & Apresentação
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // 3. Usuário autenticado acessa a plataforma completa
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
                onClick={() => exportAcoesPdf(acoes || [])}
                disabled={!acoes || acoes.length === 0}
                className="bg-white/15 text-white border border-white/25 px-[18px] py-[10px] rounded-[8px] font-['Neo_Sans_Pro',sans-serif] italic text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </li>

            <li>
              <Button
                onClick={logout}
                className="bg-white/15 text-white border border-white/25 px-[18px] py-[10px] rounded-[8px] font-sans text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px]"
                title="Encerrar sessão"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
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
          <TabsList className="mb-8 flex-wrap">
            <TabsTrigger value="acoes" className="gap-1.5">
              <TableProperties className="h-4 w-4" /> Ações
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ClipboardCheck className="h-4 w-4" /> Checklist
            </TabsTrigger>
            {canAccessIA && (
              <TabsTrigger value="analise" className="gap-1.5">
                <BrainCircuit className="h-4 w-4" /> Análise IA
              </TabsTrigger>
            )}
            {canAccessIA && (
              <TabsTrigger value="agente-admin" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Agente Admin
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="usuarios" className="gap-1.5">
                <Users className="h-4 w-4" /> Gestão de Acessos
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="acoes">
            <AcoesTable isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardView />
          </TabsContent>
          <TabsContent value="checklist">
            <ChecklistView />
          </TabsContent>
          {canAccessIA && (
            <TabsContent value="analise">
              <AnalistaGemini dadosAcoes={acoes || []} />
            </TabsContent>
          )}
          {canAccessIA && (
            <TabsContent value="agente-admin">
              <AdminChat />
            </TabsContent>
          )}
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

export default Index;
