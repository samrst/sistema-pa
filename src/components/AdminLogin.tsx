import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AdminLogin({ open, onOpenChange, onSuccess }: AdminLoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha) {
      setError("Informe o e-mail e a senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email.trim(), senha);
      setEmail("");
      setSenha("");
      toast.success("Autenticado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2 text-base text-primary font-heading">
            <Lock className="h-4 w-4" /> Acesso ao Sistema SAEP
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-primary font-semibold">
              E-mail
            </Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="seu.email@fbest.org.br"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-pass" className="text-primary font-semibold">
              Senha
            </Label>
            <Input
              id="login-pass"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                if (error) setError("");
              }}
              placeholder="Sua senha"
              disabled={loading}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
            />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
