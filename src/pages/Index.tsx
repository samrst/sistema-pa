import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TableProperties, ClipboardCheck, BrainCircuit, ShieldCheck, LogOut } from "lucide-react";
import AcoesTable from "@/components/AcoesTable";
import DashboardView from "@/components/DashboardView";
import ChecklistView from "@/components/ChecklistView";
import AnalistaGemini from "@/components/AnalistaGemini";
import AdminLogin from "@/components/AdminLogin";
import { useAcoes } from "@/hooks/useAcoes";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [tab, setTab] = useState("acoes");
  const { data: acoes } = useAcoes();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">SAEP</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Workshop SAEP 2026</h1>
              <p className="text-xs text-muted-foreground">Plano de Ações — SENAI FEIRA DE SANTANA</p>
            </div>
          </div>
          <div>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-success flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </span>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setIsAdmin(false)}>
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Sair
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setLoginOpen(true)} title="Acesso administrativo">
                <ShieldCheck className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
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
        </Tabs>
      </main>

      <AdminLogin open={loginOpen} onOpenChange={setLoginOpen} onSuccess={() => setIsAdmin(true)} />
    </div>
  );
};

export default Index;
