import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MunicipalityWithCounts {
  id: string;
  name: string;
  state: string;
  status: string;
  created_at: string;
  updated_at: string;
  surveysCount: number;
  demandsCount: number;
}

export interface MunicipalityFormData {
  name: string;
  state: string;
  status: string;
}

export const useMunicipalities = () => {
  const [municipalities, setMunicipalities] = useState<MunicipalityWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMunicipalities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch municipalities
      const { data: municipalitiesData, error: municipalitiesError } = await supabase
        .from("municipalities")
        .select("*")
        .order("name", { ascending: true });

      if (municipalitiesError) throw municipalitiesError;

      // Fetch research surveys counts per municipality
      const { data: surveysData, error: surveysError } = await supabase
        .from("research_surveys")
        .select("municipality_id");

      if (surveysError) throw surveysError;

      // Fetch reports (demands) counts per municipality
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("municipality_id");

      if (reportsError) throw reportsError;

      // Count surveys per municipality
      const surveysCounts: Record<string, number> = {};
      surveysData?.forEach((survey) => {
        if (survey.municipality_id) {
          surveysCounts[survey.municipality_id] = (surveysCounts[survey.municipality_id] || 0) + 1;
        }
      });

      // Count demands per municipality
      const demandsCounts: Record<string, number> = {};
      reportsData?.forEach((report) => {
        if (report.municipality_id) {
          demandsCounts[report.municipality_id] = (demandsCounts[report.municipality_id] || 0) + 1;
        }
      });

      // Combine data
      const municipalitiesWithCounts: MunicipalityWithCounts[] = (municipalitiesData || []).map((m) => ({
        id: m.id,
        name: m.name,
        state: m.state,
        status: m.status,
        created_at: m.created_at,
        updated_at: m.updated_at,
        surveysCount: surveysCounts[m.id] || 0,
        demandsCount: demandsCounts[m.id] || 0,
      }));

      setMunicipalities(municipalitiesWithCounts);
    } catch (err) {
      console.error("Error fetching municipalities:", err);
      setError("Erro ao carregar municípios");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os municípios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createMunicipality = async (data: MunicipalityFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("municipalities")
        .insert({
          name: data.name,
          state: data.state,
          status: data.status || "active",
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Município adicionado com sucesso!",
      });

      return true;
    } catch (err) {
      console.error("Error creating municipality:", err);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o município.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMunicipality = async (id: string, data: Partial<MunicipalityFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("municipalities")
        .update({
          name: data.name,
          state: data.state,
          status: data.status,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Município atualizado com sucesso!",
      });

      return true;
    } catch (err) {
      console.error("Error updating municipality:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o município.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMunicipality = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("municipalities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Município removido com sucesso!",
      });

      return true;
    } catch (err) {
      console.error("Error deleting municipality:", err);
      toast({
        title: "Erro",
        description: "Não foi possível remover o município. Verifique se não há pesquisas ou demandas associadas.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMunicipalities();
  }, [fetchMunicipalities]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("municipalities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "municipalities",
        },
        () => {
          fetchMunicipalities();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_surveys",
        },
        () => {
          fetchMunicipalities();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        () => {
          fetchMunicipalities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMunicipalities]);

  // Statistics
  const stats = {
    totalMunicipalities: municipalities.length,
    activeMunicipalities: municipalities.filter((m) => m.status === "active").length,
    totalSurveys: municipalities.reduce((sum, m) => sum + m.surveysCount, 0),
    totalDemands: municipalities.reduce((sum, m) => sum + m.demandsCount, 0),
  };

  return {
    municipalities,
    isLoading,
    error,
    stats,
    fetchMunicipalities,
    createMunicipality,
    updateMunicipality,
    deleteMunicipality,
  };
};
