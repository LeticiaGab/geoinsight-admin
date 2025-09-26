import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Edit3, X } from "lucide-react";

interface Survey {
  id: number;
  municipality: string;
  status: string;
  reviewer: string;
  date: string;
  type: string;
}

interface SurveyDetailModalProps {
  survey: Survey | null;
  isOpen: boolean;
  onClose: () => void;
}

const SurveyDetailModal = ({ survey, isOpen, onClose }: SurveyDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    period: "morning",
    responsibleNames: "",
    blockNumber: "",
    unitId: "",
    coordinateX: "",
    coordinateY: "",
    landUseType: "residential",
    landUseOther: "",
    occupied: "yes",
    cornerHouse: "no",
    frontSetback: "no",
    rightSetback: "no",
    leftSetback: "no",
    numberOfFloors: "ground",
    floorNotes: "",
    structureMaterial: "masonry",
    observations: ""
  });

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

  if (!survey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              FORMULÁRIO DE PESQUISA DE MORFOLOGIA URBANA
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Município:</label>
              <p className="text-base font-medium">{survey.municipality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data:</label>
              <p className="text-base font-medium">{survey.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status:</label>
              <div className="mt-1">{getStatusBadge(survey.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Revisor:</label>
              <p className="text-base font-medium">{survey.reviewer}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Period */}
            <div>
              <Label className="text-base font-medium mb-3 block">Período:</Label>
              <RadioGroup
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
                className="flex gap-6"
                disabled={!isEditing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning" />
                  <Label htmlFor="morning">Manhã</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <Label htmlFor="afternoon">Tarde</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsibleNames" className="text-base font-medium">Nome(s) do(s) Responsável(is):</Label>
                <Input
                  id="responsibleNames"
                  value={formData.responsibleNames}
                  onChange={(e) => setFormData({ ...formData, responsibleNames: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="blockNumber" className="text-base font-medium">Número da Quadra:</Label>
                <Input
                  id="blockNumber"
                  value={formData.blockNumber}
                  onChange={(e) => setFormData({ ...formData, blockNumber: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="unitId" className="text-base font-medium">Número de Identificação da Unidade:</Label>
                <Input
                  id="unitId"
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coordinateX" className="text-base font-medium">1. Coordenada X:</Label>
                <Input
                  id="coordinateX"
                  value={formData.coordinateX}
                  onChange={(e) => setFormData({ ...formData, coordinateX: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coordinateY" className="text-base font-medium">2. Coordenada Y:</Label>
                <Input
                  id="coordinateY"
                  value={formData.coordinateY}
                  onChange={(e) => setFormData({ ...formData, coordinateY: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Land Use Type */}
            <div>
              <Label className="text-base font-medium mb-3 block">3. Tipo de Uso do Solo:</Label>
              <RadioGroup
                value={formData.landUseType}
                onValueChange={(value) => setFormData({ ...formData, landUseType: value })}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                disabled={!isEditing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="residential" id="residential" />
                  <Label htmlFor="residential">Residencial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="commercial" id="commercial" />
                  <Label htmlFor="commercial">Comercial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Misto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="institutional" id="institutional" />
                  <Label htmlFor="institutional">Institucional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="religious" id="religious" />
                  <Label htmlFor="religious">Religioso</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="services" id="services" />
                  <Label htmlFor="services">Serviços</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="empty" id="empty" />
                  <Label htmlFor="empty">Lote Vazio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Outro</Label>
                </div>
              </RadioGroup>
              {formData.landUseType === "other" && (
                <Input
                  placeholder="Especificar outro tipo"
                  value={formData.landUseOther}
                  onChange={(e) => setFormData({ ...formData, landUseOther: e.target.value })}
                  disabled={!isEditing}
                  className="mt-2"
                />
              )}
            </div>

            {/* Yes/No Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: "occupied", label: "4. Ocupado:" },
                { key: "cornerHouse", label: "5. Casa de Esquina:" },
                { key: "frontSetback", label: "6. Recuo Frontal:" },
                { key: "rightSetback", label: "7. Recuo Lateral Direito:" },
                { key: "leftSetback", label: "8. Recuo Lateral Esquerdo:" }
              ].map((item) => (
                <div key={item.key}>
                  <Label className="text-base font-medium mb-3 block">{item.label}</Label>
                  <RadioGroup
                    value={formData[item.key as keyof typeof formData]}
                    onValueChange={(value) => setFormData({ ...formData, [item.key]: value })}
                    className="flex gap-6"
                    disabled={!isEditing}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                      <Label htmlFor={`${item.key}-yes`}>Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${item.key}-no`} />
                      <Label htmlFor={`${item.key}-no`}>Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* Number of Floors */}
            <div>
              <Label className="text-base font-medium mb-3 block">9. Número de Pavimentos:</Label>
              <RadioGroup
                value={formData.numberOfFloors}
                onValueChange={(value) => setFormData({ ...formData, numberOfFloors: value })}
                className="flex flex-wrap gap-4 mb-3"
                disabled={!isEditing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ground" id="ground" />
                  <Label htmlFor="ground">Térreo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="floor-2" />
                  <Label htmlFor="floor-2">2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="floor-3" />
                  <Label htmlFor="floor-3">3</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="floor-4" />
                  <Label htmlFor="floor-4">4</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="floor-5" />
                  <Label htmlFor="floor-5">5</Label>
                </div>
              </RadioGroup>
              <div>
                <Label htmlFor="floorNotes" className="text-sm font-medium">Observações:</Label>
                <Input
                  id="floorNotes"
                  value={formData.floorNotes}
                  onChange={(e) => setFormData({ ...formData, floorNotes: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Structure and Material */}
            <div>
              <Label className="text-base font-medium mb-3 block">10. Estrutura e Material:</Label>
              <RadioGroup
                value={formData.structureMaterial}
                onValueChange={(value) => setFormData({ ...formData, structureMaterial: value })}
                className="flex gap-6"
                disabled={!isEditing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="masonry" id="masonry" />
                  <Label htmlFor="masonry">Alvenaria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wood" id="wood" />
                  <Label htmlFor="wood">Madeira</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="material-mixed" />
                  <Label htmlFor="material-mixed">Misto</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Observations */}
            <div>
              <Label htmlFor="observations" className="text-base font-medium">11. Observações:</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Pesquisa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsEditing(false)}>
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyDetailModal;