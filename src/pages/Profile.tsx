import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, MapPin, User, Mail, Shield } from "lucide-react";

const Profile = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock user data
  const user = {
    name: "João Silva",
    email: "joao.silva@geocidades.gov.br",
    role: "Administrador",
    avatar: "/placeholder-avatar.jpg",
    joinDate: "2023-01-15",
    surveysCreated: 45,
    totalMunicipalities: 12
  };

  // Mock surveys data
  const surveys = [
    {
      id: "SRV-001",
      municipality: "São Paulo",
      status: "Validated",
      dateCollected: "2024-01-20",
      demands: 15
    },
    {
      id: "SRV-002", 
      municipality: "Rio de Janeiro",
      status: "Pending",
      dateCollected: "2024-01-18",
      demands: 8
    },
    {
      id: "SRV-003",
      municipality: "Belo Horizonte", 
      status: "Reviewed",
      dateCollected: "2024-01-15",
      demands: 12
    },
    {
      id: "SRV-004",
      municipality: "Salvador",
      status: "Validated",
      dateCollected: "2024-01-10",
      demands: 20
    },
    {
      id: "SRV-005",
      municipality: "Brasília",
      status: "Pending", 
      dateCollected: "2024-01-08",
      demands: 6
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      "Pending": "secondary",
      "Reviewed": "default", 
      "Validated": "default"
    } as const;
    
    const colors = {
      "Pending": "bg-warning text-warning-foreground",
      "Reviewed": "bg-primary text-primary-foreground",
      "Validated": "bg-success text-success-foreground"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  const filteredSurveys = statusFilter === "all" 
    ? surveys 
    : surveys.filter(survey => survey.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil do Usuário</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e visualize suas atividades</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Information Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Membro desde {new Date(user.joinDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.surveysCreated}</div>
                <div className="text-xs text-muted-foreground">Pesquisas Criadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.totalMunicipalities}</div>
                <div className="text-xs text-muted-foreground">Municípios</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Surveys */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Minhas Pesquisas</CardTitle>
                <CardDescription>Pesquisas criadas por você</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="validated">Validado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Pesquisa</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Coletada</TableHead>
                  <TableHead>Demandas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {survey.municipality}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>{new Date(survey.dateCollected).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{survey.demands}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSurveys.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma pesquisa encontrada com o filtro selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Informações Pessoais</CardTitle>
          <CardDescription>Atualize suas informações de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button className="bg-primary hover:bg-primary-hover">
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;