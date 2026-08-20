import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  UserPlus,
  Pencil,
  KeyRound,
  Power,
  Loader2,
  AlertCircle,
  Users,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useUsuarios, useUpdateUsuario } from "@/hooks/useUsuarios";
import { useUnidades } from "@/hooks/useUnidades";
import UsuarioFormDialog from "./UsuarioFormDialog";
import UsuarioSenhaDialog from "./UsuarioSenhaDialog";
import type { Usuario, Perfil } from "@/types/auth";
import { toast } from "sonner";

export default function UsuariosView() {
  const { data: usuarios = [], isLoading, isError } = useUsuarios();
  const { data: unidades = [] } = useUnidades();
  const updateMutation = useUpdateUsuario();

  // Estados de modais
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [senhaUser, setSenhaUser] = useState<Usuario | null>(null);
  const [senhaOpen, setSenhaOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<Usuario | null>(null);
  const [statusAlertOpen, setStatusAlertOpen] = useState(false);

  // Estados de busca e filtros
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((user) => {
      // 1. Busca por nome ou e-mail
      const matchSearch =
        !search.trim() ||
        user.nome.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      // 2. Filtro de Perfil
      const matchPerfil =
        filterPerfil === "all" || user.perfil === filterPerfil;

      // 3. Filtro de Unidade
      const matchUnidade =
        filterUnidade === "all" ||
        user.unidades.some((u) => u.id === filterUnidade || u.nome === filterUnidade);

      // 4. Filtro de Status
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "ativo" && user.ativo) ||
        (filterStatus === "inativo" && !user.ativo);

      return matchSearch && matchPerfil && matchUnidade && matchStatus;
    });
  }, [usuarios, search, filterPerfil, filterUnidade, filterStatus]);

  const handleCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: Usuario) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleOpenSenha = (user: Usuario) => {
    setSenhaUser(user);
    setSenhaOpen(true);
  };

  const handleOpenStatusAlert = (user: Usuario) => {
    setStatusUser(user);
    setStatusAlertOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusUser) return;
    try {
      await updateMutation.mutateAsync({
        id: statusUser.id,
        ativo: !statusUser.ativo,
      });
      toast.success(
        `Usuário ${statusUser.nome} ${statusUser.ativo ? "desativado" : "ativado"} com sucesso!`
      );
      setStatusAlertOpen(false);
      setStatusUser(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar o status do usuário.");
    }
  };

  const getPerfilBadge = (perfil: Perfil) => {
    switch (perfil) {
      case "ADMIN":
        return (
          <Badge
            variant="outline"
            className="bg-primary-soft text-primary border-primary/30 font-semibold text-xs px-2.5 py-0.5"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        );
      case "MACROPROCESSO_TECNICO":
        return (
          <Badge
            variant="outline"
            className="bg-info/15 text-info border-info/30 font-semibold text-xs px-2.5 py-0.5"
          >
            <Building2 className="h-3 w-3 mr-1" />
            Macroprocesso Técnico
          </Badge>
        );
      case "USUARIO":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border font-medium text-xs px-2.5 py-0.5"
          >
            Usuário
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-[1.25rem] border border-border shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft border border-primary-light/30 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="h-3.5 w-3.5" />
            Controle de Acessos
          </div>
          <h1 className="text-2xl font-heading font-bold text-primary tracking-tight">
            Gestão de Usuários e Acessos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administre colaboradores, perfis de acesso e vínculos institucionais por unidade.
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="h-11 px-5 rounded-[0.75rem] bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-md transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-card p-4 rounded-[1.25rem] border border-border shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="!pl-11 h-10 rounded-[0.75rem] border-border bg-background"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center w-full lg:w-auto">
          {/* Filtro Perfil */}
          <Select value={filterPerfil} onValueChange={setFilterPerfil}>
            <SelectTrigger className="w-full sm:w-[170px] h-10 rounded-[0.75rem] border-border bg-background text-xs">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="MACROPROCESSO_TECNICO">Macroprocesso Técnico</SelectItem>
              <SelectItem value="USUARIO">Usuário</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Unidade */}
          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-[0.75rem] border-border bg-background text-xs">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {unidades.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-[0.75rem] border-border bg-background text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-card rounded-[1.25rem] border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span className="text-sm font-medium">Carregando lista de usuários...</span>
          </div>
        ) : isError ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-semibold">Erro ao carregar os dados dos usuários.</p>
            <span className="text-xs text-muted-foreground">
              Verifique sua conexão ou tente recarregar a página.
            </span>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Nenhum usuário encontrado</h3>
            <p className="text-xs mt-1">
              Tente alterar os filtros ou realizar uma nova busca por nome ou e-mail.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-primary">
                    Colaborador / E-mail
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-primary text-center">
                    Perfil de Acesso
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-primary">
                    Unidade(s) Autorizada(s)
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-primary text-center">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-primary text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors border-b border-border/60"
                  >
                    {/* Coluna Nome e E-mail */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">
                          {user.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>

                    {/* Coluna Perfil */}
                    <TableCell className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getPerfilBadge(user.perfil)}
                    </TableCell>

                    {/* Coluna Unidades */}
                    <TableCell className="py-3.5 px-4">
                      {user.perfil === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground font-medium italic">
                          Acesso Global (Todas as unidades)
                        </span>
                      ) : user.unidades.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {user.unidades.map((u) => (
                            <Badge
                              key={u.id}
                              variant="secondary"
                              className="bg-muted text-foreground border-border text-[11px] font-normal px-2 py-0.5"
                            >
                              {u.nome}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Nenhuma unidade
                        </span>
                      )}
                    </TableCell>

                    {/* Coluna Status */}
                    <TableCell className="py-3.5 px-4 text-center whitespace-nowrap">
                      {user.ativo ? (
                        <Badge
                          variant="outline"
                          className="bg-success/15 text-success border-success/30 font-medium text-xs px-2.5 py-0.5"
                        >
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-destructive/15 text-destructive border-destructive/30 font-medium text-xs px-2.5 py-0.5"
                        >
                          Inativo
                        </Badge>
                      )}
                    </TableCell>

                    {/* Coluna Ações */}
                    <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary-soft hover:text-primary"
                          title="Editar Usuário"
                          aria-label={`Editar usuário ${user.nome}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Alterar Senha */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSenha(user)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
                          title="Alterar Senha"
                          aria-label={`Alterar senha do usuário ${user.nome}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>

                        {/* Ativar/Desativar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenStatusAlert(user)}
                          className={`h-8 w-8 p-0 rounded-lg ${
                            user.ativo
                              ? "hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                              : "hover:bg-success/10 hover:text-success text-muted-foreground"
                          }`}
                          title={user.ativo ? "Desativar Usuário" : "Ativar Usuário"}
                          aria-label={`${user.ativo ? "Desativar" : "Ativar"} usuário ${user.nome}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal de Formulário (Criação / Edição) */}
      <UsuarioFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editUser}
      />

      {/* Modal de Alteração de Senha */}
      <UsuarioSenhaDialog
        open={senhaOpen}
        onOpenChange={setSenhaOpen}
        usuario={senhaUser}
      />

      {/* Alerta de Confirmação para Ativação / Desativação */}
      <AlertDialog open={statusAlertOpen} onOpenChange={setStatusAlertOpen}>
        <AlertDialogContent className="rounded-[1.25rem] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-heading font-bold text-primary flex items-center gap-2">
              <Power className="h-5 w-5 text-primary" />
              {statusUser?.ativo ? "Desativar Usuário?" : "Ativar Usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
              {statusUser?.ativo ? (
                <>
                  O colaborador <strong className="text-foreground font-semibold">{statusUser?.nome}</strong> não poderá mais acessar a plataforma enquanto estiver inativo.
                </>
              ) : (
                <>
                  O colaborador <strong className="text-foreground font-semibold">{statusUser?.nome}</strong> terá seu acesso reestabelecido e poderá acessar a plataforma normalmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <AlertDialogCancel className="h-10 px-5 rounded-[0.75rem] text-xs font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={`h-10 px-5 rounded-[0.75rem] text-xs font-semibold text-white ${
                statusUser?.ativo
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-success hover:bg-success/90"
              }`}
            >
              {statusUser?.ativo ? "Sim, Desativar" : "Sim, Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
