import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Edit, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  municipality: string;
  collector: string;
  status: "Pending" | "Reviewed" | "Validated" | "Rejected";
  type: string;
  date: string;
  location: string;
  description: string;
  notes?: string;
}

const mockSurveys: Survey[] = [
  {
    id: "SRV-001",
    municipality: "São Paulo",
    collector: "João Silva",
    status: "Pending",
    type: "Infraestrutura",
    date: "2024-01-15",
    location: "Centro - Rua XV de Novembro",
    description: "Avaliação de calçadas e acessibilidade no centro da cidade",
  },
  {
    id: "SRV-002", 
    municipality: "Rio de Janeiro",
    collector: "Maria Santos",
    status: "Reviewed",
    type: "Transporte",
    date: "2024-01-14",
    location: "Copacabana - Av. Atlântica",
    description: "Análise do sistema de transporte público na orla",
  },
  {
    id: "SRV-003",
    municipality: "Belo Horizonte",
    collector: "Ana Costa",
    status: "Validated",
    type: "Habitação",
    date: "2024-01-13",
    location: "Savassi - Rua Pernambuco",
    description: "Levantamento habitacional na região central",
  },
  {
    id: "SRV-004",
    municipality: "Brasília",
    collector: "Carlos Lima",
    status: "Pending",
    type: "Educação",
    date: "2024-01-12",
    location: "Asa Norte - Quadra 402",
    description: "Avaliação de equipamentos educacionais",
  },
  {
    id: "SRV-005",
    municipality: "Salvador",
    collector: "Lucia Ferreira",
    status: "Rejected",
    type: "Saúde",
    date: "2024-01-11",
    location: "Pelourinho - Largo do Pelourinho",
    description: "Pesquisa sobre unidades de saúde no centro histórico",
    notes: "Dados incompletos, necessária nova coleta"
  },
];

const SurveyReview = () => {
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  const municipalities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Salvador"];
  const statuses = ["Pending", "Reviewed", "Validated", "Rejected"];

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.collector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMunicipality = municipalityFilter === "all" || survey.municipality === municipalityFilter;
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter;
    
    return matchesSearch && matchesMunicipality && matchesStatus;
  });

  const getStatusBadge = (status: Survey['status']) => {
    const variants = {
      "Pending": "default",
      "Reviewed": "secondary", 
      "Validated": "default",
      "Rejected": "destructive"
    } as const;

    const labels = {
      "Pending": "Pendente",
      "Reviewed": "Revisada",
      "Validated": "Validada",
      "Rejected": "Rejeitada"
    };

    const icons = {
      "Pending": Clock,
      "Reviewed": Edit,
      "Validated": CheckCircle,
      "Rejected": XCircle
    };

    const Icon = icons[status];

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {labels[status]}
      </Badge>
    );
  };

  const handleViewSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setReviewNotes(survey.notes || "");
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = (newStatus: Survey['status']) => {
    if (!selectedSurvey) return;

    const updatedSurveys = surveys.map(survey =>
      survey.id === selectedSurvey.id 
        ? { ...survey, status: newStatus, notes: reviewNotes }
        : survey
    );

    setSurveys(updatedSurveys);
    setIsViewModalOpen(false);
    
    const statusLabels = {
      "Validated": "validada",
      "Rejected": "rejeitada",
      "Reviewed": "marcada como revisada",
      "Pending": "marcada como pendente"
    };

    toast({
      title: "Status Atualizado",
      description: `Pesquisa ${selectedSurvey.id} foi ${statusLabels[newStatus]} com sucesso!`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revisão de Pesquisas</h1>
        <p className="text-muted-foreground">Revise, valide e gerencie as pesquisas coletadas em campo</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.filter(s => s.status === "Pending").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisadas</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.filter(s => s.status === "Reviewed").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.filter(s => s.status === "Validated").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.filter(s => s.status === "Rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ID, município ou coletor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Município</Label>
              <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os municípios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  {municipalities.map(municipality => (
                    <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === "Pending" ? "Pendente" : 
                       status === "Reviewed" ? "Revisada" : 
                       status === "Validated" ? "Validada" : "Rejeitada"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisas para Revisão</CardTitle>
          <CardDescription>
            {filteredSurveys.length} pesquisa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Pesquisa</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Coletor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma pesquisa encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">{survey.id}</TableCell>
                      <TableCell>{survey.municipality}</TableCell>
                      <TableCell>{survey.collector}</TableCell>
                      <TableCell>{survey.type}</TableCell>
                      <TableCell>{new Date(survey.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{getStatusBadge(survey.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewSurvey(survey)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Survey Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Pesquisa - {selectedSurvey?.id}</DialogTitle>
            <DialogDescription>
              Revise os detalhes e atualize o status da pesquisa
            </DialogDescription>
          </DialogHeader>
          
          {selectedSurvey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Município</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.municipality}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Coletor</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.collector}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSurvey.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Localização</Label>
                <p className="text-sm text-muted-foreground">{selectedSurvey.location}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground">{selectedSurvey.description}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status Atual</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedSurvey.status)}
                </div>
              </div>
              
              <div>
                <Label htmlFor="review-notes">Observações da Revisão</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Adicione observações sobre a revisão..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsViewModalOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleUpdateStatus("Rejected")}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleUpdateStatus("Reviewed")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Marcar como Revisada
            </Button>
            <Button 
              onClick={() => handleUpdateStatus("Validated")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurveyReview;