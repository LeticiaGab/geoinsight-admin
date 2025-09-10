import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";

const Surveys = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Mock survey data
  const surveys = [
    {
      id: 1,
      title: "Pesquisa de Infraestrutura Urbana",
      municipality: "São Paulo",
      type: "Infraestrutura",
      status: "approved",
      submittedBy: "João Silva",
      reviewer: "Maria Santos",
      submittedAt: "2024-01-15",
      reviewedAt: "2024-01-16",
      priority: "high"
    },
    {
      id: 2,
      title: "Avaliação do Transporte Público",
      municipality: "Rio de Janeiro",
      type: "Transporte",
      status: "pending",
      submittedBy: "Ana Costa",
      reviewer: "Carlos Lima",
      submittedAt: "2024-01-14",
      reviewedAt: null,
      priority: "medium"
    },
    {
      id: 3,
      title: "Pesquisa Habitacional",
      municipality: "Belo Horizonte",
      type: "Habitação",
      status: "review",
      submittedBy: "Pedro Oliveira",
      reviewer: "Lucia Ferreira",
      submittedAt: "2024-01-13",
      reviewedAt: null,
      priority: "low"
    },
    {
      id: 4,
      title: "Avaliação Educacional",
      municipality: "Brasília",
      type: "Educação",
      status: "approved",
      submittedBy: "Marina Souza",
      reviewer: "Roberto Silva",
      submittedAt: "2024-01-12",
      reviewedAt: "2024-01-14",
      priority: "high"
    },
    {
      id: 5,
      title: "Pesquisa de Saúde Pública",
      municipality: "Salvador",
      type: "Saúde",
      status: "rejected",
      submittedBy: "Carlos Mendes",
      reviewer: "Ana Santos",
      submittedAt: "2024-01-11",
      reviewedAt: "2024-01-13",
      priority: "medium"
    }
  ];

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

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter;
    const matchesType = typeFilter === "all" || survey.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusCounts = {
    total: surveys.length,
    approved: surveys.filter(s => s.status === "approved").length,
    pending: surveys.filter(s => s.status === "pending").length,
    review: surveys.filter(s => s.status === "review").length,
    rejected: surveys.filter(s => s.status === "rejected").length,
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
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar Dados
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{statusCounts.approved}</div>
            <div className="text-sm text-muted-foreground">Aprovadas</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{statusCounts.pending}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{statusCounts.review}</div>
            <div className="text-sm text-muted-foreground">Em Revisão</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{statusCounts.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejeitadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, município ou responsável..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Habitação">Habitação</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveys Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Pesquisas Cadastradas</CardTitle>
          <CardDescription>
            {filteredSurveys.length} pesquisa(s) encontrada(s)
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
              {filteredSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{survey.title}</div>
                      <div className="text-sm text-muted-foreground">{survey.municipality}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{survey.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(survey.status)}</TableCell>
                  <TableCell>{getPriorityBadge(survey.priority)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{survey.submittedBy}</div>
                      {survey.reviewer && (
                        <div className="text-xs text-muted-foreground">
                          Revisor: {survey.reviewer}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Enviado: {survey.submittedAt}</div>
                      {survey.reviewedAt && (
                        <div className="text-xs text-muted-foreground">
                          Revisado: {survey.reviewedAt}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {survey.status === "pending" && (
                        <Button variant="outline" size="sm" className="text-success border-success">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Surveys;