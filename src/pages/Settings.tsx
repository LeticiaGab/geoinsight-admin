import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Users, 
  Palette, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Clock,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Reviewer" | "User";
  status: "Active" | "Inactive";
  lastLogin: string;
}

const mockUsers: User[] = [
  { 
    id: "1", 
    name: "Administrador", 
    email: "admin@geocidades.gov.br", 
    role: "Administrator", 
    status: "Active",
    lastLogin: "2024-01-15 14:30"
  },
  { 
    id: "2", 
    name: "João Silva", 
    email: "joao.silva@geocidades.gov.br", 
    role: "Reviewer", 
    status: "Active",
    lastLogin: "2024-01-15 10:15"
  },
  { 
    id: "3", 
    name: "Maria Santos", 
    email: "maria.santos@geocidades.gov.br", 
    role: "User", 
    status: "Active",
    lastLogin: "2024-01-14 16:45"
  },
];

const Settings = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [darkMode, setDarkMode] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "User" as User['role']
  });
  const [lastBackup, setLastBackup] = useState("2024-01-15 02:00:00");
  const { toast } = useToast();

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "Active",
      lastLogin: "Nunca"
    };

    setUsers([...users, user]);
    setNewUser({ name: "", email: "", role: "User" });
    setIsAddUserModalOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Usuário adicionado com sucesso!"
    });
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast({
      title: "Sucesso",
      description: "Usuário removido com sucesso!"
    });
  };

  const handleManualBackup = () => {
    const now = new Date().toLocaleString('pt-BR');
    setLastBackup(now);
    toast({
      title: "Backup Iniciado",
      description: "O backup manual foi iniciado com sucesso!"
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Configurações Salvas",
      description: "Todas as configurações foram salvas com sucesso!"
    });
  };

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      "Administrator": "default",
      "Reviewer": "secondary",
      "User": "outline"
    } as const;

    const labels = {
      "Administrator": "Administrador",
      "Reviewer": "Revisor",
      "User": "Usuário"
    };

    return (
      <Badge variant={variants[role]}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (status: User['status']) => {
    return (
      <Badge variant={status === "Active" ? "default" : "destructive"}>
        {status === "Active" ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema e usuários</p>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie usuários do sistema e suas permissões (apenas administradores)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total de usuários: {users.length}
            </div>
            
            <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do usuário que deseja adicionar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nome Completo</Label>
                    <Input
                      id="user-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="Digite o email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Perfil de Acesso</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({...newUser, role: value as User['role']})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="User">Usuário</SelectItem>
                        <SelectItem value="Reviewer">Revisor</SelectItem>
                        <SelectItem value="Administrator">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddUser}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={user.role === "Administrator"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configurações de Tema
          </CardTitle>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <div className="text-sm text-muted-foreground">
                Ativar o tema escuro para toda a interface
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Controle de Backup
          </CardTitle>
          <CardDescription>
            Gerencie os backups automáticos e manuais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Último Backup</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {lastBackup}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Backup Automático</span>
              </div>
              <div className="text-sm text-muted-foreground">
                A cada 12 horas (configurado)
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Backup Manual</div>
              <div className="text-sm text-muted-foreground">
                Execute um backup imediato do sistema
              </div>
            </div>
            <Button variant="outline" onClick={handleManualBackup}>
              <Database className="h-4 w-4 mr-2" />
              Executar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default Settings;