import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Mail, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Report {
  id: string;
  title: string;
  status: string;
  created_at: string;
  municipality: {
    name: string;
  } | null;
}

const Profile = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [municipalityCount, setMunicipalityCount] = useState(0);
  
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile(user?.id);
  const { toast } = useToast();

  // Fetch user's reports
  useEffect(() => {
    if (!user?.id) return;

    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            status,
            created_at,
            municipality:municipalities(name)
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to handle the municipality relationship
        const transformedData = (data || []).map(report => ({
          ...report,
          municipality: Array.isArray(report.municipality) 
            ? report.municipality[0] || null 
            : report.municipality
        }));

        setReports(transformedData);

        // Get unique municipalities count
        const uniqueMunicipalities = new Set(
          transformedData
            .filter(r => r.municipality?.name)
            .map(r => r.municipality?.name)
        );
        setMunicipalityCount(uniqueMunicipalities.size);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar relatórios.',
          variant: 'destructive',
        });
      } finally {
        setReportsLoading(false);
      }
    };

    fetchReports();

    // Set up real-time subscription for reports
    const channel = supabase
      .channel(`user-reports-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `author_id=eq.${user.id}`,
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  // Update edit name when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setEditName(profile.full_name);
    }
  }, [profile?.full_name]);

  const getRoleName = (role: string | null) => {
    const roleNames: Record<string, string> = {
      administrator: "Administrador",
      researcher: "Pesquisador",
      analyst: "Analista",
      coordinator: "Coordenador",
    };
    return role ? roleNames[role] || role : "Usuário";
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-card text-card-foreground border border-border",
      approved: "bg-success text-success-foreground",
      rejected: "bg-destructive text-destructive-foreground",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };

    return (
      <Badge className={colors[status] || colors.pending}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredReports = statusFilter === "all" 
    ? reports 
    : reports.filter(report => report.status.toLowerCase() === statusFilter.toLowerCase());

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    await updateProfile({ full_name: editName.trim() });
    setIsSaving(false);
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{profile?.full_name || 'Usuário'}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {getRoleName(profile?.role || null)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{profile?.email || user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Membro desde {profile?.registration_date 
                  ? new Date(profile.registration_date).toLocaleDateString('pt-BR') 
                  : 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{reports.length}</div>
                <div className="text-xs text-muted-foreground">Relatórios Criados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{municipalityCount}</div>
                <div className="text-xs text-muted-foreground">Municípios</div>
              </div>
            </div>
            <div className="pt-2">
              <Badge className={profile?.status === 'active' 
                ? 'bg-success text-success-foreground' 
                : 'bg-muted text-muted-foreground'}>
                {profile?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Reports */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Meus Relatórios</CardTitle>
                <CardDescription>Relatórios criados por você</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Município</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {report.municipality?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {reports.length === 0 
                      ? "Você ainda não criou nenhum relatório."
                      : "Nenhum relatório encontrado com o filtro selecionado."}
                  </div>
                )}
              </>
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
              <Input 
                id="name" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (somente leitura)</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile?.email || user?.email || ''} 
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button 
              className="bg-primary hover:bg-primary-hover"
              onClick={handleSaveProfile}
              disabled={isSaving || editName === profile?.full_name}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
