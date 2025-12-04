import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, X, Loader2, AlertCircle } from "lucide-react";
import { ResearchFormData } from "@/hooks/useResearchSurveys";
import { supabase } from "@/integrations/supabase/client";

interface Municipality {
  id: string;
  name: string;
}

interface CreateResearchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ResearchFormData, photos: { file: File; slot: number }[]) => Promise<boolean>;
}

const TYPE_OF_USE_OPTIONS = [
  { value: "residential", label: "Residencial" },
  { value: "commercial", label: "Comercial" },
  { value: "services", label: "Serviços" },
  { value: "commercial_services", label: "Comercial/Serviços" },
  { value: "mixed", label: "Misto" },
  { value: "religious", label: "Religioso" },
  { value: "institutional", label: "Institucional" },
  { value: "empty_lot", label: "Terreno Vazio" },
];

const STRUCTURE_MATERIAL_OPTIONS = [
  { value: "masonry", label: "Alvenaria" },
  { value: "wood", label: "Madeira" },
  { value: "mixed", label: "Misto" },
];

const OCCUPATION_STATUS_OPTIONS = [
  { value: "occupied", label: "Ocupado" },
  { value: "unoccupied", label: "Não Ocupado" },
];

const BUILDING_CONDITION_OPTIONS = [
  { value: "very_poor", label: "Péssimo" },
  { value: "regular", label: "Regular" },
  { value: "good", label: "Bom" },
  { value: "excellent", label: "Ótimo" },
];

const LOT_BOUNDARY_OPTIONS = [
  { value: "wall", label: "Muro" },
  { value: "fence", label: "Gradil" },
  { value: "wooden_fence", label: "Cerca de madeira" },
  { value: "hedge", label: "Cerca-viva" },
  { value: "open", label: "Aberto" },
  { value: "partially_limited", label: "Parcialmente Limitado" },
];

const SLOPE_DIRECTION_OPTIONS = [
  { value: "uphill", label: "Aclive" },
  { value: "downhill", label: "Declive" },
  { value: "left", label: "Esquerda" },
  { value: "right", label: "Direita" },
];

interface PhotoPreview {
  file: File;
  preview: string;
}

export function CreateResearchForm({ open, onOpenChange, onSubmit }: CreateResearchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [photos, setPhotos] = useState<(PhotoPreview | null)[]>([null, null, null]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [formData, setFormData] = useState<ResearchFormData>({
    building_number: "",
    street: "",
    coordinate_x: "",
    coordinate_y: "",
    front_setback: false,
    left_side_setback: false,
    number_of_floors: 1,
    type_of_use: "",
    structure_material: "",
    occupation_status: "",
    building_condition: "",
    lot_boundary: "",
    sidewalk: false,
    slope_direction: "",
    observations: "",
    municipality_id: "",
  });

  useEffect(() => {
    const fetchMunicipalities = async () => {
      const { data } = await supabase
        .from("municipalities")
        .select("id, name")
        .order("name");
      if (data) setMunicipalities(data);
    };
    fetchMunicipalities();
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset form when closing
      setFormData({
        building_number: "",
        street: "",
        coordinate_x: "",
        coordinate_y: "",
        front_setback: false,
        left_side_setback: false,
        number_of_floors: 1,
        type_of_use: "",
        structure_material: "",
        occupation_status: "",
        building_condition: "",
        lot_boundary: "",
        sidewalk: false,
        slope_direction: "",
        observations: "",
        municipality_id: "",
      });
      setPhotos([null, null, null]);
      setErrors({});
    }
  }, [open]);

  const validateCoordinateX = (value: string): boolean => {
    // UTM X format: 6 digits + dot + 3 decimals (e.g., 660404.333)
    const pattern = /^\d{6}\.\d{3}$/;
    return pattern.test(value);
  };

  const validateCoordinateY = (value: string): boolean => {
    // UTM Y format: 7 digits + dot + 3 decimals (e.g., 7822852.777)
    const pattern = /^\d{7}\.\d{3}$/;
    return pattern.test(value);
  };

  const handleInputChange = (field: keyof ResearchFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhotoSelect = (index: number) => {
    fileInputRefs[index].current?.click();
  };

  const handlePhotoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, [`photo_${index + 1}`]: "Por favor, selecione uma imagem válida" }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [`photo_${index + 1}`]: "A imagem deve ter no máximo 5MB" }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = { file, preview: reader.result as string };
        setPhotos(newPhotos);
        // Clear photo error
        if (errors[`photo_${index + 1}`]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`photo_${index + 1}`];
            return newErrors;
          });
        }
        if (errors.photos) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.photos;
            return newErrors;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.street.trim()) {
      newErrors.street = "Logradouro é obrigatório";
    }

    if (!formData.coordinate_x.trim()) {
      newErrors.coordinate_x = "Coordenada X é obrigatória";
    } else if (!validateCoordinateX(formData.coordinate_x)) {
      newErrors.coordinate_x = "Formato inválido. Ex: 660404.333";
    }

    if (!formData.coordinate_y.trim()) {
      newErrors.coordinate_y = "Coordenada Y é obrigatória";
    } else if (!validateCoordinateY(formData.coordinate_y)) {
      newErrors.coordinate_y = "Formato inválido. Ex: 7822852.777";
    }

    if (!formData.type_of_use) {
      newErrors.type_of_use = "Tipo de uso é obrigatório";
    }

    if (!formData.structure_material) {
      newErrors.structure_material = "Estrutura e material é obrigatório";
    }

    if (!formData.occupation_status) {
      newErrors.occupation_status = "Status de ocupação é obrigatório";
    }

    if (!formData.building_condition) {
      newErrors.building_condition = "Estado de conservação é obrigatório";
    }

    if (!formData.lot_boundary) {
      newErrors.lot_boundary = "Limite do lote é obrigatório";
    }

    // At least 1 photo required
    const hasPhoto = photos.some((p) => p !== null);
    if (!hasPhoto) {
      newErrors.photos = "É necessário adicionar pelo menos 1 foto";
    }

    if (formData.observations && formData.observations.length > 1000) {
      newErrors.observations = "Observações devem ter no máximo 1000 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const photoData = photos
      .map((p, index) => (p ? { file: p.file, slot: index + 1 } : null))
      .filter((p): p is { file: File; slot: number } => p !== null);

    const success = await onSubmit(formData, photoData);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Criar Nova Pesquisa</DialogTitle>
          <DialogDescription>
            Preencha os dados da pesquisa de campo. O Point ID será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Municipality */}
            <div className="space-y-2">
              <Label htmlFor="municipality">Município</Label>
              <Select
                value={formData.municipality_id}
                onValueChange={(value) => handleInputChange("municipality_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o município" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((mun) => (
                    <SelectItem key={mun.id} value={mun.id}>
                      {mun.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Building Number and Street */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_number">Número Predial</Label>
                <Input
                  id="building_number"
                  value={formData.building_number}
                  onChange={(e) => handleInputChange("building_number", e.target.value)}
                  placeholder="Ex: 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Logradouro *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  placeholder="Ex: Rua das Flores"
                  className={errors.street ? "border-destructive" : ""}
                />
                {errors.street && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.street}
                  </p>
                )}
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinate_x">Coordenada X (UTM) *</Label>
                <Input
                  id="coordinate_x"
                  value={formData.coordinate_x}
                  onChange={(e) => handleInputChange("coordinate_x", e.target.value)}
                  placeholder="Ex: 660404.333"
                  className={errors.coordinate_x ? "border-destructive" : ""}
                />
                {errors.coordinate_x && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.coordinate_x}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinate_y">Coordenada Y (UTM) *</Label>
                <Input
                  id="coordinate_y"
                  value={formData.coordinate_y}
                  onChange={(e) => handleInputChange("coordinate_y", e.target.value)}
                  placeholder="Ex: 7822852.777"
                  className={errors.coordinate_y ? "border-destructive" : ""}
                />
                {errors.coordinate_y && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.coordinate_y}
                  </p>
                )}
              </div>
            </div>

            {/* Setbacks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="front_setback" className="cursor-pointer">
                  Recuo Frontal
                </Label>
                <Switch
                  id="front_setback"
                  checked={formData.front_setback}
                  onCheckedChange={(checked) => handleInputChange("front_setback", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="left_side_setback" className="cursor-pointer">
                  Recuo Lateral Esquerdo
                </Label>
                <Switch
                  id="left_side_setback"
                  checked={formData.left_side_setback}
                  onCheckedChange={(checked) => handleInputChange("left_side_setback", checked)}
                />
              </div>
            </div>

            {/* Number of Floors */}
            <div className="space-y-2">
              <Label htmlFor="number_of_floors">N° de Pavimentos</Label>
              <Input
                id="number_of_floors"
                type="number"
                min={1}
                value={formData.number_of_floors}
                onChange={(e) => handleInputChange("number_of_floors", parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Dropdowns Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Uso *</Label>
                <Select
                  value={formData.type_of_use}
                  onValueChange={(value) => handleInputChange("type_of_use", value)}
                >
                  <SelectTrigger className={errors.type_of_use ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OF_USE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type_of_use && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.type_of_use}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Estrutura e Material *</Label>
                <Select
                  value={formData.structure_material}
                  onValueChange={(value) => handleInputChange("structure_material", value)}
                >
                  <SelectTrigger className={errors.structure_material ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRUCTURE_MATERIAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.structure_material && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.structure_material}
                  </p>
                )}
              </div>
            </div>

            {/* Dropdowns Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ocupação *</Label>
                <Select
                  value={formData.occupation_status}
                  onValueChange={(value) => handleInputChange("occupation_status", value)}
                >
                  <SelectTrigger className={errors.occupation_status ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.occupation_status && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.occupation_status}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Estado de Conservação *</Label>
                <Select
                  value={formData.building_condition}
                  onValueChange={(value) => handleInputChange("building_condition", value)}
                >
                  <SelectTrigger className={errors.building_condition ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.building_condition && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.building_condition}
                  </p>
                )}
              </div>
            </div>

            {/* Dropdowns Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite do Lote *</Label>
                <Select
                  value={formData.lot_boundary}
                  onValueChange={(value) => handleInputChange("lot_boundary", value)}
                >
                  <SelectTrigger className={errors.lot_boundary ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOT_BOUNDARY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lot_boundary && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lot_boundary}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Direção da Declividade</Label>
                <Select
                  value={formData.slope_direction}
                  onValueChange={(value) => handleInputChange("slope_direction", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOPE_DIRECTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sidewalk */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="sidewalk" className="cursor-pointer">
                Calçada na Frente
              </Label>
              <Switch
                id="sidewalk"
                checked={formData.sidewalk}
                onCheckedChange={(checked) => handleInputChange("sidewalk", checked)}
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Fotos * (mínimo 1, máximo 3)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    <input
                      ref={fileInputRefs[index]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(index, e)}
                    />
                    {photos[index] ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={photos[index]!.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePhotoSelect(index)}
                        className="aspect-square w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors"
                      >
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Foto {index + 1}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.photos && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.photos}
                </p>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">
                Observações ({formData.observations.length}/1000)
              </Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange("observations", e.target.value)}
                placeholder="Digite observações adicionais..."
                maxLength={1000}
                rows={4}
                className={errors.observations ? "border-destructive" : ""}
              />
              {errors.observations && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.observations}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Criar Pesquisa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
