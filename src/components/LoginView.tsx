import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Target,
  CheckCircle2,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/footer.css";

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim() || !senha) {
      setError("Informe seu e-mail e sua senha para continuar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email.trim(), senha);
      toast.success("Autenticado com sucesso!");
    } catch (err: any) {
      setError(err.message || "E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between">
      {/* Top institutional bar */}
      <header className="saep-nav">
        <div className="flex items-center gap-3">
          <img
            src="/IMG/logo-senai.png"
            alt="Logo SENAI"
            className="saep-logo"
          />
        </div>
        <div className="hidden sm:block text-right text-xs text-white/80 font-sans">
          <span className="font-semibold text-white">SENAI Bahia</span> · Plataforma de Plano de Ação
        </div>
      </header>

      {/* Central Login & Presentation area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl bg-card rounded-[1.25rem] shadow-xl border border-border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column: Form Area (5 cols on lg) */}
          <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-card">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary-light/30 text-primary text-xs font-semibold tracking-wide uppercase mb-6">
                <Lock className="h-3.5 w-3.5" />
                Acesso ao Sistema
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary tracking-tight">
                Bem-vindo(a)!
              </h1>

              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Acesse sua conta na <strong className="text-foreground font-semibold">Plataforma de Plano de Ação</strong> com foco no SAEP.
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-primary uppercase tracking-wider">
                    E-mail Institucional
                  </Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      onInput={(e: any) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="seu.email@fbest.org.br"
                      disabled={loading}
                      autoComplete="email"
                      className="!pl-11 pr-4 h-11 rounded-[0.75rem] border-border bg-background focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Senha
                    </Label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        if (error) setError("");
                      }}
                      onInput={(e: any) => {
                        setSenha(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Sua senha de acesso"
                      disabled={loading}
                      autoComplete="current-password"
                      className="!pl-11 !pr-11 h-11 rounded-[0.75rem] border-border bg-background focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none z-10 p-1"
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[0.75rem] flex items-start gap-2.5 text-xs text-destructive font-medium animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  disabled={loading}
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold text-sm rounded-[0.75rem] transition-all shadow-md active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-border text-center text-xs text-muted-foreground">
              Plataforma institucional do SENAI Bahia.
            </div>
          </div>

          {/* Right Column: Institutional Banner & Features (7 cols on lg) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#164194] via-[#3D67B6] to-[#0F2E69] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-['Neo_Sans_Pro',sans-serif] italic tracking-wide text-[#d9e6f7] mb-6">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                SENAI BAHIA · GESTÃO ESTRATÉGICA
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Neo_Sans_Pro',sans-serif] italic font-bold leading-tight">
                Planeje. Acompanhe. Transforme.
              </h2>

              <p className="mt-3 text-sm md:text-base text-[#d9e6f7] leading-relaxed max-w-xl font-['Neo_Sans_Pro',sans-serif] italic">
                Plataforma de apoio à elaboração, monitoramento e gestão estruturada dos planos de ação com foco no SAEP.
              </p>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[0.875rem] p-4 transition-all hover:bg-white/15">
                  <div className="p-2 w-fit rounded-lg bg-white/15 mb-2.5 text-white">
                    <Target className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Planejamento</h3>
                  <p className="text-xs text-[#d9e6f7]/90 mt-1 leading-snug">
                    Organize objetivos, ações, responsáveis e prazos em um fluxo claro.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[0.875rem] p-4 transition-all hover:bg-white/15">
                  <div className="p-2 w-fit rounded-lg bg-white/15 mb-2.5 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Acompanhamento</h3>
                  <p className="text-xs text-[#d9e6f7]/90 mt-1 leading-snug">
                    Monitore o andamento, status de execução e criticidade em tempo real.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[0.875rem] p-4 transition-all hover:bg-white/15">
                  <div className="p-2 w-fit rounded-lg bg-white/15 mb-2.5 text-white">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Gestão Estruturada</h3>
                  <p className="text-xs text-[#d9e6f7]/90 mt-1 leading-snug">
                    Visão analítica integrada por unidades, cursos e modalidades.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[0.875rem] p-4 transition-all hover:bg-white/15">
                  <div className="p-2 w-fit rounded-lg bg-white/15 mb-2.5 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">Foco no SAEP</h3>
                  <p className="text-xs text-[#d9e6f7]/90 mt-1 leading-snug">
                    Alinhamento estratégico para o avanço dos indicadores e resultados.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Institutional Info */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#d9e6f7]">
              <span>Plataforma de Plano de Ação · SENAI Bahia</span>
              <span className="opacity-80">Versão 2026</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer oficial padronizado com footer.css */}
      <footer>
        <p>© 2026 SENAI Bahia — Plataforma de Plano de Ação com foco no SAEP</p>
      </footer>
    </div>
  );
}
