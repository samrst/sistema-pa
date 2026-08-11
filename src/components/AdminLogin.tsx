import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AdminLogin({ open, onOpenChange, onSuccess }: AdminLoginProps) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (user === "admin" && pass === "SAEP2026") {
      setError("");
      setUser("");
      setPass("");
      onSuccess();
      onOpenChange(false);
    } else {
      setError("Usuário ou senha incorretos.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2 text-base text-primary font-heading">
            <Lock className="h-4 w-4" /> Acesso Administrativo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="admin-user" className="text-primary font-semibold">Usuário</Label>
            <Input id="admin-user" value={user} onChange={e => setUser(e.target.value)} placeholder="Usuário" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-pass" className="text-primary font-semibold">Senha</Label>
            <Input id="admin-pass" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha"
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button className="w-full" onClick={handleLogin}>Entrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
