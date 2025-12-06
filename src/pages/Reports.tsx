import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, FileText, FileSpreadsheet, Filter, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

const Reports = () => {
  const {
    filteredReports,
    municipalityChartData,
    statusChartData,
    municipalities,
    loading,
    filters,
    setFilters,
    applyFilters,
    clearFilters
  } = useReports();
  const { toast } = useToast();

  const statuses = [
    { value: 'pending', label: 'Pendente' },
    { value: 'review', label: 'Em Revisão' },
    { value: 'approved', label: 'Validada' }
  ];

  const exportToPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "O relatório está sendo gerado em PDF..."
    });
  };

  const exportToCSV = () => {
    if (filteredReports.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Município', 'Tipo de Pesquisa', 'Data', 'Status', 'Demandas'];
    const rows = filteredReports.map(item => [
      item.municipality,
      item.surveyType,
      new Date(item.date).toLocaleDateString('pt-BR'),
      item.status === 'approved' ? 'Validada' : item.status === 'review' ? 'Revisada' : 'Pendente',
      item.demands.toString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Exportado",
      description: "O relatório foi exportado com sucesso"
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      pending: 'destructive',
      review: 'default',
      approved: 'secondary'
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      review: 'Revisada',
      approved: 'Validada'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const totalStatus = statusChartData.reduce((sum, item) => sum + item.value, 0);

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
              <Select 
                value={filters.municipality} 
                onValueChange={(value) => setFilters({...filters, municipality: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os municípios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  {municipalities.map(municipality => (
                    <SelectItem key={municipality.id} value={municipality.id}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
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
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : municipalityChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={municipalityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="fill-muted-foreground"
                  />
                  <YAxis className="fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="surveys" fill="hsl(var(--primary))" name="Pesquisas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demands" fill="hsl(142 76% 36%)" name="Demandas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Pesquisas</CardTitle>
            <CardDescription>
              Distribuição por status de validação ({totalStatus} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : totalStatus === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="space-y-4">
                {statusChartData.map((item, index) => {
                  const percentage = totalStatus > 0 ? ((item.value / totalStatus) * 100).toFixed(0) : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        >
                          {Number(percentage) > 15 && (
                            <span className="text-xs font-medium text-primary-foreground">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            Visualize os dados que serão incluídos no relatório ({filteredReports.length} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Tipo de Uso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Demandas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((item) => (
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
