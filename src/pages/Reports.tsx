import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, FileSpreadsheet, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  id: string;
  municipality: string;
  surveyType: string;
  date: string;
  status: "Pending" | "Reviewed" | "Validated";
  demands: number;
}

const mockReportData: ReportData[] = [
  { id: "1", municipality: "São Paulo", surveyType: "Infraestrutura", date: "2024-01-15", status: "Validated", demands: 5 },
  { id: "2", municipality: "Rio de Janeiro", surveyType: "Saúde", date: "2024-01-20", status: "Reviewed", demands: 3 },
  { id: "3", municipality: "Belo Horizonte", surveyType: "Educação", date: "2024-01-25", status: "Pending", demands: 8 },
  { id: "4", municipality: "Salvador", surveyType: "Transporte", date: "2024-02-01", status: "Validated", demands: 2 },
  { id: "5", municipality: "Brasília", surveyType: "Infraestrutura", date: "2024-02-05", status: "Reviewed", demands: 12 },
];

const chartData = [
  { name: "São Paulo", surveys: 45, demands: 12 },
  { name: "Rio de Janeiro", surveys: 32, demands: 8 },
  { name: "Belo Horizonte", surveys: 28, demands: 15 },
  { name: "Salvador", surveys: 19, demands: 6 },
  { name: "Brasília", surveys: 41, demands: 22 },
];

const statusData = [
  { name: "Validadas", value: 35, color: "#10b981" },
  { name: "Revisadas", value: 28, color: "#f59e0b" },
  { name: "Pendentes", value: 15, color: "#ef4444" },
];

const Reports = () => {
  const [filters, setFilters] = useState({
    municipality: "all",
    dateFrom: "",
    dateTo: "",
    status: "all"
  });
  const [filteredData, setFilteredData] = useState<ReportData[]>(mockReportData);
  const { toast } = useToast();

  const municipalities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Brasília"];
  const statuses = ["Pending", "Reviewed", "Validated"];

  const applyFilters = () => {
    let filtered = mockReportData;

    if (filters.municipality && filters.municipality !== "all") {
      filtered = filtered.filter(item => item.municipality === filters.municipality);
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(filters.dateTo));
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setFilters({
      municipality: "all",
      dateFrom: "",
      dateTo: "",
      status: "all"
    });
    setFilteredData(mockReportData);
  };

  const exportToPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "O relatório está sendo gerado em PDF..."
    });
    // Implementation would go here
  };

  const exportToCSV = () => {
    toast({
      title: "Exportando CSV",
      description: "O relatório está sendo gerado em CSV..."
    });
    // Implementation would go here
  };

  const getStatusBadge = (status: ReportData['status']) => {
    const variants = {
      "Pending": "destructive",
      "Reviewed": "default", 
      "Validated": "secondary"
    } as const;

    const labels = {
      "Pending": "Pendente",
      "Reviewed": "Revisada",
      "Validated": "Validada"
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Gere e exporte relatórios detalhados do sistema</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar seu relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Município</Label>
              <Select value={filters.municipality} onValueChange={(value) => setFilters({...filters, municipality: value})}>
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
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === "Pending" ? "Pendente" : status === "Reviewed" ? "Revisada" : "Validada"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pesquisas por Município</CardTitle>
            <CardDescription>Distribuição de pesquisas e demandas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="surveys" fill="hsl(var(--primary))" name="Pesquisas" />
                <Bar dataKey="demands" fill="hsl(var(--secondary))" name="Demandas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Pesquisas</CardTitle>
            <CardDescription>Distribuição por status de validação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
          <CardDescription>
            Exporte os dados filtrados em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={exportToPDF} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Relatório</CardTitle>
          <CardDescription>
            Visualize os dados que serão incluídos no relatório ({filteredData.length} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Tipo de Pesquisa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Demandas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.municipality}</TableCell>
                      <TableCell>{item.surveyType}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">{item.demands}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;