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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnidades } from "@/hooks/useUnidades";
import { useCreateUsuario, useUpdateUsuario } from "@/hooks/useUsuarios";
import type { Usuario, Perfil } from "@/types/auth";
import { Lock, Mail, User, Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Usuario | null;
}

export default function UsuarioFormDialog({
  open,
  onOpenChange,
  editData,
}: UsuarioFormDialogProps) {
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>("USUARIO");
  const [ativo, setAtivo] = useState(true);
  const [selectedUnidadesIds, setSelectedUnidadesIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const isEditing = Boolean(editData);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (editData) {
        setNome(editData.nome);
        setEmail(editData.email);
        setSenha("");
        setPerfil(editData.perfil);
        setAtivo(editData.ativo);
        setSelectedUnidadesIds(editData.unidades.map((u) => u.id));
      } else {
        setNome("");
        setEmail("");
        setSenha("");
        setPerfil("USUARIO");
        setAtivo(true);
        setSelectedUnidadesIds(unidades.length > 0 ? [unidades[0].id] : []);
      }
      setError("");
      setShowSenha(false);
    }
  }, [open, editData]);

  useEffect(() => {
    if (open && !editData && selectedUnidadesIds.length === 0 && unidades.length > 0) {
      setSelectedUnidadesIds([unidades[0].id]);
    }
  }, [open, editData, unidades, selectedUnidadesIds.length]);

  // Ao mudar perfil, ajusta a quantidade de unidades para respeitar as regras
  const handlePerfilChange = (newPerfil: Perfil) => {
    setPerfil(newPerfil);
    setError("");

    if (newPerfil === "USUARIO") {
      // Deve ter exatamente 1 unidade
      if (selectedUnidadesIds.length > 1) {
        setSelectedUnidadesIds([selectedUnidadesIds[0]]);
      } else if (selectedUnidadesIds.length === 0 && unidades.length > 0) {
        setSelectedUnidadesIds([unidades[0].id]);
      }
    } else if (newPerfil === "MACROPROCESSO_TECNICO") {
      // Deve ter pelo menos 1 unidade
      if (selectedUnidadesIds.length === 0 && unidades.length > 0) {
        setSelectedUnidadesIds([unidades[0].id]);
      }
    }
  };

  const handleToggleUnidadeCheckbox = (unidadeId: string) => {
    setSelectedUnidadesIds((prev) => {
      if (prev.includes(unidadeId)) {
        return prev.filter((id) => id !== unidadeId);
      } else {
        return [...prev, unidadeId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nome.trim()) {
      setError("Informe o nome completo do colaborador.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Informe um endereço de e-mail válido.");
      return;
    }

    if (!isEditing) {
      if (!senha || senha.length < 6) {
        setError("A senha inicial deve conter no mínimo 6 caracteres.");
        return;
      }
    }

    // Validação de unidades conforme o perfil
    if (perfil === "USUARIO") {
      if (selectedUnidadesIds.length !== 1) {
        setError("O perfil Usuário deve possuir exatamente 1 unidade vinculada.");
        return;
      }
    } else if (perfil === "MACROPROCESSO_TECNICO") {
      if (selectedUnidadesIds.length < 1) {
        setError("O perfil Macroprocesso Técnico deve possuir pelo menos 1 unidade vinculada.");
        return;
      }
    }

    try {
      if (isEditing && editData) {
        await updateMutation.mutateAsync({
          id: editData.id,
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          perfil,
          ativo,
          unidades_ids: selectedUnidadesIds,
        });
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          perfil,
          unidades_ids: selectedUnidadesIds,
        });
        toast.success("Usuário cadastrado com sucesso!");
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[1.25rem]">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border bg-card">
          <DialogTitle className="text-lg sm:text-xl font-heading font-bold text-primary flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isEditing
              ? "Atualize os dados cadastrais, perfil de acesso e vínculos institucionais."
              : "Preencha as credenciais e defina as permissões de acesso do novo colaborador."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="user-nome" className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Nome Completo *
                </Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="user-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    disabled={isPending}
                    className="!pl-11 h-10 rounded-[0.75rem] border-border bg-background"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-xs font-semibold text-primary uppercase tracking-wider">
                  E-mail Institucional *
                </Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colaborador@fbest.org.br"
                    disabled={isPending}
                    className="!pl-11 h-10 rounded-[0.75rem] border-border bg-background"
                  />
                </div>
              </div>

              {/* Senha Inicial (Apenas no Cadastro) */}
              {!isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="user-senha" className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Senha Inicial (mínimo 6 caracteres) *
                  </Label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="user-senha"
                      type={showSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Defina uma senha segura"
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
              )}

              {/* Perfil e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="user-perfil" className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Perfil de Acesso *
                  </Label>
                  <Select
                    value={perfil}
                    onValueChange={(val) => handlePerfilChange(val as Perfil)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="user-perfil" className="h-10 rounded-[0.75rem] border-border bg-background">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador (Global)</SelectItem>
                      <SelectItem value="MACROPROCESSO_TECNICO">Macroprocesso Técnico</SelectItem>
                      <SelectItem value="USUARIO">Usuário Comum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEditing && (
                  <div className="space-y-1.5">
                    <Label htmlFor="user-status" className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Status da Conta
                    </Label>
                    <div className="flex items-center justify-between h-10 px-3 border border-border rounded-[0.75rem] bg-background">
                      <span className="text-xs font-medium text-foreground">
                        {ativo ? "Usuário Ativo" : "Usuário Inativo"}
                      </span>
                      <Switch
                        id="user-status"
                        checked={ativo}
                        onCheckedChange={setAtivo}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vínculo de Unidades */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Vínculo de Unidades
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {perfil === "ADMIN" && "Opcional (Acesso global a todas)"}
                    {perfil === "MACROPROCESSO_TECNICO" && "Mínimo 1 unidade (múltipla seleção)"}
                    {perfil === "USUARIO" && "Exatamente 1 unidade obrigatória"}
                  </span>
                </div>

                {loadingUnidades ? (
                  <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Carregando unidades...
                  </div>
                ) : perfil === "USUARIO" ? (
                  /* Modo USUARIO: Select de 1 unidade */
                  <Select
                    value={selectedUnidadesIds[0] || ""}
                    onValueChange={(val) => setSelectedUnidadesIds([val])}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-10 rounded-[0.75rem] border-border bg-background">
                      <SelectValue placeholder="Selecione a unidade do colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  /* Modo MACROPROCESSO_TECNICO / ADMIN: Lista com Checkboxes */
                  <div className="border border-border rounded-[0.75rem] p-3 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-2">
                      {unidades.map((u) => {
                        const isChecked = selectedUnidadesIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-primary-soft/60 border-primary-light text-primary font-medium"
                                : "bg-card border-border/80 hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleUnidadeCheckbox(u.id)}
                              disabled={isPending}
                            />
                            <span className="truncate">{u.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Erro integrado */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[0.75rem] text-xs text-destructive font-medium animate-in fade-in">
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 sm:p-6 border-t border-border bg-muted/20 flex flex-row items-center justify-end gap-2">
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
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
