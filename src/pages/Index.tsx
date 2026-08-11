import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TableProperties, ClipboardCheck, BrainCircuit, ShieldCheck, LogOut, MessageSquare, FileDown } from "lucide-react";
import AcoesTable from "@/components/AcoesTable";
import DashboardView from "@/components/DashboardView";
import ChecklistView from "@/components/ChecklistView";
import AnalistaGemini from "@/components/AnalistaGemini";
import AdminLogin from "@/components/AdminLogin";
import AdminChat from "@/components/AdminChat";
import { useAcoes } from "@/hooks/useAcoes";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";
import "@/styles/header.css";
import "@/styles/footer.css";
import "@/styles/help-button.css";
import { exportAcoesPdf } from "@/lib/exportPdf";
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"></link>

const Index = () => {
  const [tab, setTab] = useState("acoes");
  const { data: acoes } = useAcoes();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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
            {isAdmin ? (
              <Button
                onClick={() => setIsAdmin(false)}
                className="bg-white/15 text-white border border-white/25 px-[18px] py-[10px] rounded-[8px] font-sans text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Button
                onClick={() => setLoginOpen(true)}
                className="bg-white/15 text-white border border-white/25 px-[18px] py-[10px] rounded-[8px] font-sans text-[14px] font-semibold transition-all duration-300 ease-in-out hover:bg-white/25 hover:-translate-y-[2px]"
                title="Área Administrativa"
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
            )}
          </li>
        </ul>

    </nav>

    <section className="saep-hero">

        <p className="saep-eyebrow">
            PLATAFORMA INTERNA
        </p>

        <h1>
            Workshop SAEP 2026
        </h1>

        <p>
            Plataforma para gestão, acompanhamento e análise das ações do SAEP.
        </p>

    </section>

</header>
    <section className="body-section"></section>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="acoes" className="gap-1.5">
              <TableProperties className="h-4 w-4" /> Ações
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ClipboardCheck className="h-4 w-4" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="analise" className="gap-1.5">
              <BrainCircuit className="h-4 w-4" /> Análise IA
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="agente-admin" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Agente Admin
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
          <TabsContent value="analise">
            <AnalistaGemini dadosAcoes={acoes || []} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="agente-admin">
              <AdminChat />
            </TabsContent>
          )}
        </Tabs>

    <a href="https://sistemasaep.netlify.app/contato" className="help-button" aria-label="Central de Ajuda" title="Central de Ajuda">
        <CircleHelp className="h-6 w-6" />
        <span className="help-text">Ajuda</span>
    </a>
    
      </main>

    <div className="container">
    <div className="container"><div className="container">
        <section className ="portal-banner">
            <img src="./IMG/banner-saep.png" alt="Portal de Sistemas SAEP" />
        </section>
    </div></div></div>
    <footer>
        <p>© 2026 SENAI — Uso interno restrito</p>
    </footer>

      <AdminLogin open={loginOpen} onOpenChange={setLoginOpen} onSuccess={() => setIsAdmin(true)} />
    </div>
  );
};

export default Index;
