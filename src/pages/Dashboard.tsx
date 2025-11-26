import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SurveyDetailModal from "@/components/SurveyDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Users, 
  FileText, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  RefreshCw
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for real data
  const [totalReports, setTotalReports] = useState(0);
  const [activeMunicipalities, setActiveMunicipalities] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const handleViewDetails = (report: any) => {
    setSelectedSurvey(report);
    setIsModalOpen(true);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch total reports
      const { count: reportsCount, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });
      
      if (reportsError) throw reportsError;
      setTotalReports(reportsCount || 0);

      // Fetch active municipalities
      const { count: municipalitiesCount, error: municipalitiesError } = await supabase
        .from('municipalities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (municipalitiesError) throw municipalitiesError;
      setActiveMunicipalities(municipalitiesCount || 0);

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (usersError) throw usersError;
      setTotalUsers(usersCount || 0);

      // Fetch recent reports with municipality and author info
      const { data: reportsData, error: recentReportsError } = await supabase
        .from('reports')
        .select(`
          *,
          municipalities (name),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentReportsError) throw recentReportsError;
      setRecentReports(reportsData || []);

      // Fetch status counts
      const { data: statusData, error: statusError } = await supabase
        .from('reports')
        .select('status');
      
      if (statusError) throw statusError;
      
      const approved = statusData?.filter(r => r.status === 'approved').length || 0;
      const pending = statusData?.filter(r => r.status === 'pending').length || 0;
      const rejected = statusData?.filter(r => r.status === 'rejected').length || 0;
      
      setApprovedCount(approved);
      setPendingCount(pending);
      setRejectedCount(rejected);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    toast({
      title: "Dados atualizados",
      description: "Dashboard atualizado com sucesso",
    });
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const reportsChannel = supabase
      .channel('dashboard-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const municipalitiesChannel = supabase
      .channel('dashboard-municipalities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'municipalities'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('dashboard-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(municipalitiesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const stats = [
    {
      title: "Total de Pesquisas",
      value: isLoading ? "..." : totalReports.toString(),
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      description: "Pesquisas coletadas este mês"
    },
    {
      title: "Municípios Ativos",
      value: isLoading ? "..." : activeMunicipalities.toString(),
      change: "+3",
      changeType: "positive" as const,
      icon: MapPin,
      description: "Municípios com coletas ativas"
    },
    {
      title: "Usuários Registrados",
      value: isLoading ? "..." : totalUsers.toString(),
      change: "+18%",
      changeType: "positive" as const,
      icon: Users,
      description: "Usuários ativos no sistema"
    },
    {
      title: "Taxa de Sincronização",
      value: "100%",
      change: "Real-time",
      changeType: "positive" as const,
      icon: RefreshCw,
      description: "Dados sincronizados em tempo real"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground border-success">Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground border-warning">Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-destructive text-destructive-foreground border-destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema Geo-Cidades
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs">
                  <span className={stat.changeType === 'positive' ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Surveys */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pesquisas Recentes
            </CardTitle>
            <CardDescription>
              Últimas pesquisas submetidas para revisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-foreground">
                        {report.municipalities?.name || 'Município não informado'}
                      </h4>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="space-y-1 mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span>Título: {report.title}</span>
                      </div>
                      {report.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          <span>Descrição: {report.description}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        <span>Autor: {report.profiles?.full_name || 'Não informado'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>Data: {formatDate(report.created_at)}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleViewDetails(report)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Status Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Aprovadas</span>
                    </div>
                    <span className="font-medium">{approvedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm">Pendentes</span>
                    </div>
                    <span className="font-medium">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Rejeitadas</span>
                    </div>
                    <span className="font-medium">{rejectedCount}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/users")}
              >
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Usuários
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/survey-review")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Revisar Pesquisas
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/reports")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Gerar Relatórios
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/municipalities")}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Dados Municipais
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <SurveyDetailModal
        survey={selectedSurvey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;