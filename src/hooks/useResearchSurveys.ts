import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ResearchStatus = "pending" | "approved" | "review" | "rejected";

export interface ResearchSurvey {
  id: string;
  point_id: string;
  building_number: string | null;
  street: string;
  coordinate_x: string;
  coordinate_y: string;
  front_setback: boolean;
  left_side_setback: boolean;
  number_of_floors: number;
  type_of_use: string;
  structure_material: string;
  occupation_status: string;
  building_condition: string;
  lot_boundary: string;
  sidewalk: boolean;
  slope_direction: string | null;
  photo_1_url: string | null;
  photo_2_url: string | null;
  photo_3_url: string | null;
  observations: string | null;
  author_id: string | null;
  municipality_id: string | null;
  status: ResearchStatus;
  created_at: string;
  updated_at: string;
  author_name?: string;
  municipality_name?: string;
}

export interface ResearchFormData {
  building_number: string;
  street: string;
  coordinate_x: string;
  coordinate_y: string;
  front_setback: boolean;
  left_side_setback: boolean;
  number_of_floors: number;
  type_of_use: string;
  structure_material: string;
  occupation_status: string;
  building_condition: string;
  lot_boundary: string;
  sidewalk: boolean;
  slope_direction: string;
  observations: string;
  municipality_id: string;
}

export interface ResearchStats {
  total: number;
  approved: number;
  pending: number;
  review: number;
  rejected: number;
}

export interface ResearchFilters {
  searchTerm: string;
  status: string;
  municipality: string;
}

export function useResearchSurveys(userId?: string) {
  const [surveys, setSurveys] = useState<ResearchSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ResearchFilters>({
    searchTerm: "",
    status: "all",
    municipality: "all",
  });

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("research_surveys")
        .select(`
          *,
          municipalities (name),
          profiles:author_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const mappedData: ResearchSurvey[] = (data || []).map((item: any) => ({
        id: item.id,
        point_id: item.point_id,
        building_number: item.building_number,
        street: item.street,
        coordinate_x: item.coordinate_x,
        coordinate_y: item.coordinate_y,
        front_setback: item.front_setback,
        left_side_setback: item.left_side_setback,
        number_of_floors: item.number_of_floors,
        type_of_use: item.type_of_use,
        structure_material: item.structure_material,
        occupation_status: item.occupation_status,
        building_condition: item.building_condition,
        lot_boundary: item.lot_boundary,
        sidewalk: item.sidewalk,
        slope_direction: item.slope_direction,
        photo_1_url: item.photo_1_url,
        photo_2_url: item.photo_2_url,
        photo_3_url: item.photo_3_url,
        observations: item.observations,
        author_id: item.author_id,
        municipality_id: item.municipality_id,
        status: item.status as ResearchStatus,
        created_at: item.created_at,
        updated_at: item.updated_at,
        author_name: item.profiles?.full_name || null,
        municipality_name: item.municipalities?.name || null,
      }));

      setSurveys(mappedData);
    } catch (err: any) {
      console.error("Error fetching research surveys:", err);
      setError(err.message);
      toast({
        title: "Erro ao carregar pesquisas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();

    const channel = supabase
      .channel("research-surveys-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_surveys",
        },
        () => {
          fetchSurveys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSurveys]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      const matchesSearch =
        filters.searchTerm === "" ||
        survey.point_id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        survey.street.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (survey.municipality_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ?? false);

      const matchesStatus =
        filters.status === "all" || survey.status === filters.status;

      const matchesMunicipality =
        filters.municipality === "all" ||
        survey.municipality_name === filters.municipality;

      return matchesSearch && matchesStatus && matchesMunicipality;
    });
  }, [surveys, filters]);

  const stats: ResearchStats = useMemo(() => {
    return {
      total: surveys.length,
      approved: surveys.filter((s) => s.status === "approved").length,
      pending: surveys.filter((s) => s.status === "pending").length,
      review: surveys.filter((s) => s.status === "review").length,
      rejected: surveys.filter((s) => s.status === "rejected").length,
    };
  }, [surveys]);

  const municipalities = useMemo(() => {
    const names = surveys
      .map((s) => s.municipality_name)
      .filter((name): name is string => !!name);
    return [...new Set(names)];
  }, [surveys]);

  const setFilters = useCallback((newFilters: Partial<ResearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const createResearch = useCallback(
    async (formData: ResearchFormData, photos: { file: File; slot: number }[]) => {
      if (!userId) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar uma pesquisa",
          variant: "destructive",
        });
        return false;
      }

      try {
        // Upload photos first
        const photoUrls: { [key: string]: string } = {};

        for (const photo of photos) {
          const fileExt = photo.file.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${photo.slot}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("research-photos")
            .upload(fileName, photo.file);

          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
            throw new Error(`Erro ao fazer upload da foto ${photo.slot}`);
          }

          const { data: urlData } = supabase.storage
            .from("research-photos")
            .getPublicUrl(fileName);

          photoUrls[`photo_${photo.slot}_url`] = urlData.publicUrl;
        }

        // Insert research survey
        const { error: insertError } = await supabase
          .from("research_surveys")
          .insert({
            building_number: formData.building_number || null,
            street: formData.street,
            coordinate_x: formData.coordinate_x,
            coordinate_y: formData.coordinate_y,
            front_setback: formData.front_setback,
            left_side_setback: formData.left_side_setback,
            number_of_floors: formData.number_of_floors,
            type_of_use: formData.type_of_use,
            structure_material: formData.structure_material,
            occupation_status: formData.occupation_status,
            building_condition: formData.building_condition,
            lot_boundary: formData.lot_boundary,
            sidewalk: formData.sidewalk,
            slope_direction: formData.slope_direction || null,
            observations: formData.observations || null,
            municipality_id: formData.municipality_id || null,
            author_id: userId,
            photo_1_url: photoUrls.photo_1_url || null,
            photo_2_url: photoUrls.photo_2_url || null,
            photo_3_url: photoUrls.photo_3_url || null,
          });

        if (insertError) throw insertError;

        toast({
          title: "Pesquisa criada com sucesso",
          description: "A pesquisa foi salva no sistema",
        });

        return true;
      } catch (err: any) {
        console.error("Error creating research:", err);
        toast({
          title: "Erro ao criar pesquisa",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [userId]
  );

  const updateStatus = useCallback(
    async (surveyId: string, newStatus: ResearchStatus) => {
      try {
        const { error } = await supabase
          .from("research_surveys")
          .update({ status: newStatus })
          .eq("id", surveyId);

        if (error) throw error;

        toast({
          title: "Status atualizado",
          description: `Status alterado para ${newStatus}`,
        });

        return true;
      } catch (err: any) {
        console.error("Error updating status:", err);
        toast({
          title: "Erro ao atualizar status",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    []
  );

  return {
    surveys,
    filteredSurveys,
    stats,
    loading,
    error,
    filters,
    setFilters,
    municipalities,
    createResearch,
    updateStatus,
    refreshSurveys: fetchSurveys,
  };
}
