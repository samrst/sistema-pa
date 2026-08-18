import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateSenhaUsuario } from "@/hooks/useUsuarios";
import type { Usuario } from "@/types/auth";
import { KeyRound, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UsuarioSenhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
}

export default function UsuarioSenhaDialog({
  open,
  onOpenChange,
  usuario,
}: UsuarioSenhaDialogProps) {
  const updateSenhaMutation = useUpdateSenhaUsuario();

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState("");

  const isPending = updateSenhaMutation.isPending;

  useEffect(() => {
    if (open) {
      setSenha("");
      setConfirmacao("");
      setShowSenha(false);
      setError("");
    }
  }, [open, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usuario) return;

    if (!senha || senha.length < 6) {
      setError("A nova senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setError("A confirmação de senha não confere com a nova senha.");
      return;
    }

    try {
      await updateSenhaMutation.mutateAsync({
        id: usuario.id,
        senha,
      });
      toast.success(`Senha de ${usuario.nome} atualizada com sucesso!`);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao alterar a senha do usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[1.25rem]">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Alterar Senha de Acesso
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Defina uma nova senha para o colaborador{" "}
            <strong className="text-foreground font-semibold">
              {usuario?.nome || "selecionado"}
            </strong>
            .
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha" className="text-xs font-semibold text-primary uppercase tracking-wider">
              Nova Senha (mínimo 6 caracteres) *
            </Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="nova-senha"
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Informe a nova senha"
                disabled={isPending}
                className="!pl-11 !pr-11 h-10 rounded-[0.75rem] border-border bg-background"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
                title={showSenha ? "Ocultar senha" : "Ver senha"}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar-senha" className="text-xs font-semibold text-primary uppercase tracking-wider">
              Confirmar Nova Senha *
            </Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmar-senha"
                type={showSenha ? "text" : "password"}
                value={confirmacao}
                onChange={(e) => {
                  setConfirmacao(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Repita a nova senha"
                disabled={isPending}
                className="!pl-11 !pr-11 h-10 rounded-[0.75rem] border-border bg-background"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[0.75rem] text-xs text-destructive font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-10 px-5 rounded-[0.75rem] text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 px-6 rounded-[0.75rem] bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Senha"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
