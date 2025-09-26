import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SurveyDetailModal from "@/components/SurveyDetailModal";
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
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (survey: any) => {
    setSelectedSurvey(survey);
    setIsModalOpen(true);
  };
  // Mock data for the dashboard
  const stats = [
    {
      title: "Total de Pesquisas",
      value: "1,247",
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      description: "Pesquisas coletadas este mês"
    },
    {
      title: "Municípios Ativos",
      value: "85",
      change: "+3",
      changeType: "positive" as const,
      icon: MapPin,
      description: "Municípios com coletas ativas"
    },
    {
      title: "Usuários Registrados",
      value: "342",
      change: "+18%",
      changeType: "positive" as const,
      icon: Users,
      description: "Usuários ativos no sistema"
    },
    {
      title: "Taxa de Sincronização",
      value: "94.2%",
      change: "-2.1%",
      changeType: "negative" as const,
      icon: RefreshCw,
      description: "Dados sincronizados com sucesso"
    }
  ];

  const recentSurveys = [
    { id: 1, municipality: "São Paulo", status: "Aprovado", reviewer: "Maria Silva", date: "2024-01-15", type: "Infraestrutura" },
    { id: 2, municipality: "Rio de Janeiro", status: "Pendente", reviewer: "João Santos", date: "2024-01-14", type: "Transporte" },
    { id: 3, municipality: "Belo Horizonte", status: "Revisão", reviewer: "Ana Costa", date: "2024-01-14", type: "Habitação" },
    { id: 4, municipality: "Brasília", status: "Aprovado", reviewer: "Carlos Lima", date: "2024-01-13", type: "Educação" },
    { id: 5, municipality: "Salvador", status: "Pendente", reviewer: "Lucia Ferreira", date: "2024-01-13", type: "Saúde" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprovado":
        return <Badge variant="default" className="bg-success text-success-foreground">Aprovado</Badge>;
      case "Pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "Revisão":
        return <Badge variant="outline" className="text-warning border-warning">Revisão</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
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
            <div className="space-y-4">
              {recentSurveys.map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{survey.municipality}</h4>
                      {getStatusBadge(survey.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Tipo: {survey.type}</span>
                      <span>Revisor: {survey.reviewer}</span>
                      <span>{survey.date}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(survey)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Aprovadas</span>
                </div>
                <span className="font-medium">847</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <span className="font-medium">156</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Rejeitadas</span>
                </div>
                <span className="font-medium">23</span>
              </div>
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