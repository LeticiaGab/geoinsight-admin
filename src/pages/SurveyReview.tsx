import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Edit, CheckCircle, XCircle, Clock, Filter, RefreshCw } from "lucide-react";
import { useSurveys, Survey, SurveyStatus } from "@/hooks/useSurveys";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SurveyReview = () => {
  const { user } = useAuth();
  const { 
    filteredSurveys, 
    stats, 
    loading, 
    filters, 
    setFilters, 
    municipalities,
    updateSurveyStatus,
    refreshSurveys 
  } = useSurveys(user?.id);

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; Icon: typeof Clock }> = {
      pending: { variant: "default", label: "Pendente", Icon: Clock },
      review: { variant: "secondary", label: "Revisada", Icon: Edit },
      approved: { variant: "default", label: "Validada", Icon: CheckCircle },
      rejected: { variant: "destructive", label: "Rejeitada", Icon: XCircle },
    };

    const { variant, label, Icon } = config[status] || { variant: "outline", label: status, Icon: Clock };

    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
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
          <h1 className="text-2xl font-bold text-foreground">Revisão de Pesquisas</h1>
          <p className="text-muted-foreground">Revise, valide e gerencie as pesquisas coletadas em campo</p>
        </div>
        <Button variant="outline" onClick={refreshSurveys} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards - Real-time from database */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.pending}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.review}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.approved}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.rejected}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters - Database-driven */}
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
                  placeholder="ID, título, município ou coletor..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Município</Label>
              <Select value={filters.municipality} onValueChange={(value) => setFilters({ municipality: value })}>
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
              <Select value={filters.status} onValueChange={(value) => setFilters({ status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="approved">Validada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveys Table - Real-time data */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisas para Revisão</CardTitle>
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              `${filteredSurveys.length} pesquisa(s) encontrada(s)`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSurveys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma pesquisa encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">{survey.title}</TableCell>
                      <TableCell>{survey.municipality_name}</TableCell>
                      <TableCell>{survey.author_name || "N/A"}</TableCell>
                      <TableCell>{survey.type}</TableCell>
                      <TableCell>{formatDate(survey.created_at)}</TableCell>
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
                  <Label className="text-sm font-medium">Responsável</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.author_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">{selectedSurvey.type}</p>
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
                <Label className="text-sm font-medium">Revisor</Label>
                <p className="text-sm text-muted-foreground">{selectedSurvey.reviewer_name || "Não atribuído"}</p>
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
              Marcar como Revisada
            </Button>
            <Button 
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdating}
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
