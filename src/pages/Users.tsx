import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Pencil, Trash2, UserPlus, Filter, Users as UsersIcon, Loader2, ShieldAlert, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'] | 'superadmin';
type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserWithRole extends Profile {
  role: UserRole;
  email: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [currentUserIsSuperadmin, setCurrentUserIsSuperadmin] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "researcher" as UserRole,
    status: "active"
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isAdmin, isSuperadmin, loading: roleLoading } = useUserRole(currentUser?.id);

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Try to get emails via edge function (admin only)
      let emailMap: Record<string, string> = {};
      let isSuperadminFromServer = false;
      try {
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: { action: 'list' }
        });
        
        if (!error && data?.emails) {
          emailMap = data.emails;
          isSuperadminFromServer = data.isSuperadmin || false;
          setCurrentUserIsSuperadmin(isSuperadminFromServer);
        }
      } catch (e) {
        // Not admin or error - emails won't be available
        console.log('Could not fetch emails - user may not be admin');
      }

      // Combine the data
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          ...profile,
          role: (userRole?.role || 'researcher') as UserRole,
          email: emailMap[profile.id] || 'N/A'
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return <Badge className="bg-amber-500 text-white"><Crown className="h-3 w-3 mr-1" />Superadmin</Badge>;
      case "administrator":
        return <Badge className="bg-primary text-primary-foreground">Administrador</Badge>;
      case "researcher":
        return <Badge variant="secondary">Pesquisador</Badge>;
      case "analyst":
        return <Badge className="bg-accent text-accent-foreground">Analista</Badge>;
      case "coordinator":
        return <Badge variant="outline">Coordenador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-success text-success-foreground">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Check if current user can modify target user
  const canModifyUser = (targetUser: UserWithRole): boolean => {
    // Superadmins can modify anyone
    if (isSuperadmin || currentUserIsSuperadmin) {
      return true;
    }
    
    // Admins cannot modify superadmins or other admins
    if (targetUser.role === 'superadmin' || targetUser.role === 'administrator') {
      return false;
    }
    
    // Admins can modify other users
    return isAdmin;
  };

  // Check if current user can delete target user
  const canDeleteUser = (targetUser: UserWithRole): boolean => {
    // Cannot delete yourself
    if (targetUser.id === currentUser?.id) {
      return false;
    }
    
    return canModifyUser(targetUser);
  };

  // Check if current user can assign a specific role
  const canAssignRole = (role: UserRole): boolean => {
    // Only superadmins can assign admin or superadmin roles
    if (role === 'administrator' || role === 'superadmin') {
      return isSuperadmin || currentUserIsSuperadmin;
    }
    return isAdmin;
  };

  const sendNotificationEmail = async (
    type: 'created' | 'updated' | 'deleted',
    user: { name: string; email: string; role?: UserRole }
  ) => {
    try {
      if (!currentUser?.email) {
        console.log('No admin email found, skipping notification');
        return;
      }

      await supabase.functions.invoke('send-user-notification', {
        body: {
          type,
          user,
          adminEmail: currentUser.email
        }
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  };

  const handleAddUser = async () => {
    // Validate inputs
    if (!newUser.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!newUser.email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Erro",
        description: "Formato de email inválido.",
        variant: "destructive"
      });
      return;
    }

    if (!newUser.password || newUser.password.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter no mínimo 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    // Check if user can assign the selected role
    if (!canAssignRole(newUser.role)) {
      toast({
        title: "Erro",
        description: "Ação bloqueada: apenas superadmins podem criar administradores.",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(true);

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create',
          email: newUser.email.trim(),
          password: newUser.password,
          full_name: newUser.name.trim(),
          role: newUser.role,
          status: newUser.status
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send notification email
      await sendNotificationEmail('created', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });

      setNewUser({ name: "", email: "", password: "", role: "researcher", status: "active" });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar usuário.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = (user: UserWithRole) => {
    if (!canModifyUser(user)) {
      toast({
        title: "Ação bloqueada",
        description: "Apenas superadmins podem modificar administradores.",
        variant: "destructive"
      });
      return;
    }

    setSelectedUser(user);
    setNewUser({
      name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !newUser.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Check if role change is allowed
    if (newUser.role !== selectedUser.role && !canAssignRole(newUser.role)) {
      toast({
        title: "Erro",
        description: "Ação bloqueada: apenas superadmins podem promover usuários a administrador.",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(true);

      // Call edge function to update user with role change validation
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update',
          user_id: selectedUser.id,
          full_name: newUser.name.trim(),
          status: newUser.status,
          new_role: newUser.role !== selectedUser.role ? newUser.role : undefined
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send notification email
      await sendNotificationEmail('updated', {
        name: newUser.name,
        email: selectedUser.email,
        role: newUser.role
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setNewUser({ name: "", email: "", password: "", role: "researcher", status: "active" });
      
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar usuário.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) return;

    // Check if user can delete target
    if (!canDeleteUser(userToDelete)) {
      toast({
        title: "Ação bloqueada",
        description: userToDelete.id === currentUser?.id 
          ? "Você não pode excluir sua própria conta."
          : "Apenas superadmins podem modificar administradores.",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(true);

      // Call edge function to delete user
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete',
          user_id: userId
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send notification email
      await sendNotificationEmail('deleted', {
        name: userToDelete.full_name,
        email: userToDelete.email
      });

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso!"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover usuário.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>
        
        {/* Admin-only Add User Button */}
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Cadastre um novo usuário no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input 
                    id="name" 
                    placeholder="Digite o nome completo" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@exemplo.com" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil de Acesso</Label>
                  <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="researcher">Pesquisador</SelectItem>
                      <SelectItem value="analyst">Analista</SelectItem>
                      <SelectItem value="coordinator">Coordenador</SelectItem>
                      {(isSuperadmin || currentUserIsSuperadmin) && (
                        <>
                          <SelectItem value="administrator">Administrador</SelectItem>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newUser.status} onValueChange={(value) => setNewUser({...newUser, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Cadastrar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Show message for non-admins */}
        {!roleLoading && !isAdmin && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm">Somente visualização</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.status === "active").length} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "superadmin").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "administrator").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesquisadores</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "researcher").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Perfis</SelectItem>
                  <SelectItem value="superadmin">Superadmins</SelectItem>
                  <SelectItem value="administrator">Administradores</SelectItem>
                  <SelectItem value="researcher">Pesquisadores</SelectItem>
                  <SelectItem value="analyst">Analistas</SelectItem>
                  <SelectItem value="coordinator">Coordenadores</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Registro</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{new Date(user.registration_date).toLocaleDateString('pt-BR')}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditUser(user)} 
                          disabled={actionLoading || !canModifyUser(user)}
                          title={!canModifyUser(user) ? "Apenas superadmins podem modificar administradores" : "Editar usuário"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!canDeleteUser(user) || actionLoading}
                          title={
                            user.id === currentUser?.id 
                              ? "Você não pode excluir sua própria conta" 
                              : !canModifyUser(user)
                                ? "Apenas superadmins podem modificar administradores"
                                : "Excluir usuário"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal - Admin only */}
      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input 
                  id="edit-name" 
                  placeholder="Digite o nome completo" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (somente leitura)</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={newUser.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Perfil de Acesso</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}
                  disabled={selectedUser && (selectedUser.role === 'administrator' || selectedUser.role === 'superadmin') && !(isSuperadmin || currentUserIsSuperadmin)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="researcher">Pesquisador</SelectItem>
                    <SelectItem value="analyst">Analista</SelectItem>
                    <SelectItem value="coordinator">Coordenador</SelectItem>
                    {(isSuperadmin || currentUserIsSuperadmin) && (
                      <>
                        <SelectItem value="administrator">Administrador</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {selectedUser && (selectedUser.role === 'administrator' || selectedUser.role === 'superadmin') && !(isSuperadmin || currentUserIsSuperadmin) && (
                  <p className="text-sm text-muted-foreground">
                    Apenas superadmins podem alterar o perfil de administradores.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={newUser.status} onValueChange={(value) => setNewUser({...newUser, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Atualizar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Users;
