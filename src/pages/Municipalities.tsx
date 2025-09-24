import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Edit, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Municipality {
  id: string;
  name: string;
  state: string;
  surveysCount: number;
  demandsCount: number;
  status: "Active" | "Inactive";
}

const mockMunicipalities: Municipality[] = [
  { id: "1", name: "São Paulo", state: "SP", surveysCount: 45, demandsCount: 12, status: "Active" },
  { id: "2", name: "Rio de Janeiro", state: "RJ", surveysCount: 32, demandsCount: 8, status: "Active" },
  { id: "3", name: "Belo Horizonte", state: "MG", surveysCount: 28, demandsCount: 15, status: "Active" },
  { id: "4", name: "Salvador", state: "BA", surveysCount: 19, demandsCount: 6, status: "Inactive" },
  { id: "5", name: "Brasília", state: "DF", surveysCount: 41, demandsCount: 22, status: "Active" },
];

const Municipalities = () => {
  const [municipalities, setMunicipalities] = useState<Municipality[]>(mockMunicipalities);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Municipality>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMunicipality, setNewMunicipality] = useState({
    name: "",
    state: "",
    notes: ""
  });
  const { toast } = useToast();

  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const filteredMunicipalities = municipalities
    .filter(municipality =>
      municipality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipality.state.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: keyof Municipality) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddMunicipality = () => {
    if (!newMunicipality.name || !newMunicipality.state) {
      toast({
        title: "Erro",
        description: "Nome e estado são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const municipality: Municipality = {
      id: Date.now().toString(),
      name: newMunicipality.name,
      state: newMunicipality.state,
      surveysCount: 0,
      demandsCount: 0,
      status: "Active"
    };

    setMunicipalities([...municipalities, municipality]);
    setNewMunicipality({ name: "", state: "", notes: "" });
    setIsAddModalOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Município adicionado com sucesso!"
    });
  };

  const handleDelete = (id: string) => {
    setMunicipalities(municipalities.filter(m => m.id !== id));
    toast({
      title: "Sucesso",
      description: "Município removido com sucesso!"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Municípios</h1>
          <p className="text-muted-foreground">Gerencie os municípios cadastrados no sistema</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Município
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Município</DialogTitle>
              <DialogDescription>
                Preencha as informações do município que deseja adicionar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Município</Label>
                <Input
                  id="name"
                  value={newMunicipality.name}
                  onChange={(e) => setNewMunicipality({...newMunicipality, name: e.target.value})}
                  placeholder="Digite o nome do município"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={newMunicipality.state}
                  onValueChange={(value) => setNewMunicipality({...newMunicipality, state: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newMunicipality.notes}
                  onChange={(e) => setNewMunicipality({...newMunicipality, notes: e.target.value})}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMunicipality}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Municípios</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{municipalities.length}</div>
            <p className="text-xs text-muted-foreground">
              {municipalities.filter(m => m.status === "Active").length} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pesquisas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {municipalities.reduce((sum, m) => sum + m.surveysCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribuídas entre municípios
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Demandas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {municipalities.reduce((sum, m) => sum + m.demandsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Nome do Município
                    {sortField === "name" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("state")}
                  >
                    Estado
                    {sortField === "state" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("surveysCount")}
                  >
                    Pesquisas
                    {sortField === "surveysCount" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("demandsCount")}
                  >
                    Demandas
                    {sortField === "demandsCount" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMunicipalities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum município encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMunicipalities.map((municipality) => (
                    <TableRow key={municipality.id}>
                      <TableCell className="font-medium">{municipality.name}</TableCell>
                      <TableCell>{municipality.state}</TableCell>
                      <TableCell>{municipality.surveysCount}</TableCell>
                      <TableCell>{municipality.demandsCount}</TableCell>
                      <TableCell>
                        <Badge variant={municipality.status === "Active" ? "default" : "secondary"}>
                          {municipality.status === "Active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(municipality.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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

export default Municipalities;