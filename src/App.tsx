import AnalistaGemini from "@/components/AnalistaGemini";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const [actions, setActions] = useState([]); // O nome pode ser 'acoes', 'items', etc.
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


import { useState } from "react";
import AnalistaGemini from "@/components/AnalistaGemini"; // 1. Importou

const Index = () => {
  // 2. Seus dados (exemplo de como o Lovable estruturaria)
  const [minhasAcoes, setMinhasAcoes] = useState([
    { id: 1, titulo: "Ação de Cobrança", status: "Pendente", valor: 500 },
    { id: 2, titulo: "Ação de Danos Morais", status: "Concluída", valor: 1200 },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Meu Gerenciador de Ações</h1>
      
      {/* Lista ou Tabela que você já tem no projeto... */}

      <hr className="my-10" />

      {/* 3. O Agente de IA aparece aqui embaixo */}
      <AnalistaGemini dadosAcoes={minhasAcoes} />
    </div>
  );
};

export default Index;


export default App;
