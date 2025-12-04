import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, CheckCircle, XCircle, Clock, FileText, Download, RefreshCw, Edit, Plus } from "lucide-react";
import { useSurveys, Survey, SurveyStatus } from "@/hooks/useSurveys";
import { useResearchSurveys } from "@/hooks/useResearchSurveys";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateResearchForm } from "@/components/CreateResearchForm";

const Surveys = () => {
  const { user } = useAuth();
  const { 
    filteredSurveys, 
    stats, 
    loading, 
    filters, 
    setFilters, 
    municipalities, 
    types,
    updateSurveyStatus,
    refreshSurveys 
  } = useSurveys(user?.id);

  const { createResearch, refreshSurveys: refreshResearch } = useResearchSurveys(user?.id);

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "review":
        return (
          <Badge variant="outline" className="text-warning border-warning">
            <Eye className="h-3 w-3 mr-1" />
            Em Revisão
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return <Badge variant="outline" className="text-warning border-warning">Média</Badge>;
      case "low":
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleViewSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setReviewNotes(survey.description || "");
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: SurveyStatus) => {
    if (!selectedSurvey || !user?.id) return;
    
    setIsUpdating(true);
    const success = await updateSurveyStatus(selectedSurvey.id, newStatus, user.id, reviewNotes);
    setIsUpdating(false);
    
    if (success) {
      setIsViewModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Pesquisas</h1>
          <p className="text-muted-foreground">
            Revise, valide e gerencie pesquisas de campo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshSurveys} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Pesquisa
          </Button>
        </div>
      </div>

      {/* Status Overview - Real-time stats from database */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            )}
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
            )}
            <div className="text-sm text-muted-foreground">Aprovadas</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
            )}
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-warning">{stats.review}</div>
            )}
            <div className="text-sm text-muted-foreground">Em Revisão</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            {loading ? (
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
            )}
            <div className="text-sm text-muted-foreground">Rejeitadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - directly interact with database queries */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, município ou responsável..."
                className="pl-9"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ searchTerm: e.target.value })}
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Select value={filters.status} onValueChange={(value) => setFilters({ status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.type} onValueChange={(value) => setFilters({ type: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.municipality} onValueChange={(value) => setFilters({ municipality: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Municípios</SelectItem>
                  {municipalities.map((mun) => (
                    <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveys Table - Real-time data from database */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Pesquisas Cadastradas</CardTitle>
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${filteredSurveys.length} pesquisa(s) encontrada(s)`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pesquisa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSurveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma pesquisa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{survey.title}</div>
                        <div className="text-sm text-muted-foreground">{survey.municipality_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{survey.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>{getPriorityBadge(survey.priority)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{survey.author_name || "N/A"}</div>
                        {survey.reviewer_name && (
                          <div className="text-xs text-muted-foreground">
                            Revisor: {survey.reviewer_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Enviado: {formatDate(survey.created_at)}</div>
                        {survey.reviewed_at && (
                          <div className="text-xs text-muted-foreground">
                            Revisado: {formatDate(survey.reviewed_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSurvey(survey)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        {survey.status === "pending" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-success border-success"
                            onClick={() => {
                              setSelectedSurvey(survey);
                              handleUpdateStatus("approved");
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Survey Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Pesquisa</DialogTitle>
            <DialogDescription>
              Revise os detalhes e atualize o status da pesquisa
            </DialogDescription>
          </DialogHeader>
          
          {selectedSurvey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Município</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.municipality_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prioridade</Label>
                  <div className="mt-1">{getPriorityBadge(selectedSurvey.priority)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Responsável</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.author_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Revisor</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.reviewer_name || "Não atribuído"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedSurvey.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Revisão</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedSurvey.reviewed_at)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status Atual</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedSurvey.status)}
                </div>
              </div>
              
              <div>
                <Label htmlFor="review-notes">Descrição / Observações</Label>
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
              disabled={isUpdating}
            >
              Fechar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleUpdateStatus("rejected")}
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleUpdateStatus("review")}
              disabled={isUpdating}
            >
              <Edit className="h-4 w-4 mr-2" />
              Em Revisão
            </Button>
            <Button 
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Research Modal */}
      <CreateResearchForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={async (data, photos) => {
          const success = await createResearch(data, photos);
          if (success) {
            refreshSurveys();
            refreshResearch();
          }
          return success;
        }}
      />
    </div>
  );
};

export default Surveys;
