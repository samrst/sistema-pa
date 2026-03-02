import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TableProperties, ClipboardCheck } from "lucide-react";
import AcoesTable from "@/components/AcoesTable";
import DashboardView from "@/components/DashboardView";
import ChecklistView from "@/components/ChecklistView";

const Index = () => {
  const [tab, setTab] = useState("acoes");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Workshop SAEP 2026 </h1>
              <p className="text-xs text-muted-foreground">Plano de Ações — SENAI FEIRA DE SANTANA </p>
            </div>
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
          </TabsList>

          <TabsContent value="acoes">
            <AcoesTable />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardView />
          </TabsContent>
          <TabsContent value="checklist">
            <ChecklistView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
