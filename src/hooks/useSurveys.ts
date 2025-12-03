import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SurveyStatus = 'pending' | 'approved' | 'review' | 'rejected';
export type SurveyPriority = 'high' | 'medium' | 'low';

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  type: string;
  priority: SurveyPriority;
  municipality_id: string;
  municipality_name: string;
  author_id: string | null;
  author_name: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

export interface SurveyFilters {
  searchTerm: string;
  status: string;
  type: string;
  municipality: string;
}

export interface SurveyStats {
  total: number;
  approved: number;
  pending: number;
  review: number;
  rejected: number;
}

interface UseSurveysResult {
  surveys: Survey[];
  filteredSurveys: Survey[];
  stats: SurveyStats;
  loading: boolean;
  error: string | null;
  filters: SurveyFilters;
  setFilters: (filters: Partial<SurveyFilters>) => void;
  municipalities: string[];
  types: string[];
  updateSurveyStatus: (id: string, status: SurveyStatus, reviewerId: string, notes?: string) => Promise<boolean>;
  refreshSurveys: () => Promise<void>;
}

export const useSurveys = (userId?: string): UseSurveysResult => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SurveyFilters>({
    searchTerm: '',
    status: 'all',
    type: 'all',
    municipality: 'all',
  });
  const { toast } = useToast();

  // Fetch surveys with related data
  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch reports with municipality names
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          description,
          status,
          type,
          priority,
          municipality_id,
          author_id,
          reviewer_id,
          created_at,
          updated_at,
          reviewed_at,
          municipalities!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch author and reviewer names from profiles
      const authorIds = [...new Set(reportsData?.map(r => r.author_id).filter(Boolean) || [])];
      const reviewerIds = [...new Set(reportsData?.map(r => r.reviewer_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...authorIds, ...reviewerIds])];

      let profilesMap: Record<string, string> = {};
      
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', allUserIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Map to Survey interface
      const mappedSurveys: Survey[] = (reportsData || []).map(report => ({
        id: report.id,
        title: report.title,
        description: report.description,
        status: report.status as SurveyStatus,
        type: report.type || 'Geral',
        priority: (report.priority || 'medium') as SurveyPriority,
        municipality_id: report.municipality_id,
        municipality_name: (report.municipalities as any)?.name || 'N/A',
        author_id: report.author_id,
        author_name: report.author_id ? profilesMap[report.author_id] || 'Desconhecido' : null,
        reviewer_id: report.reviewer_id,
        reviewer_name: report.reviewer_id ? profilesMap[report.reviewer_id] || 'Desconhecido' : null,
        created_at: report.created_at,
        updated_at: report.updated_at,
        reviewed_at: report.reviewed_at,
      }));

      setSurveys(mappedSurveys);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError('Erro ao carregar pesquisas');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as pesquisas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    fetchSurveys();

    // Subscribe to real-time changes on reports table
    const channel = supabase
      .channel('surveys-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        () => {
          // Refetch on any change to keep data fresh
          fetchSurveys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSurveys]);

  // Filter surveys based on current filters
  const filteredSurveys = useMemo(() => {
    return surveys.filter(survey => {
      const matchesSearch = filters.searchTerm === '' || 
        survey.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        survey.municipality_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (survey.author_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = filters.status === 'all' || survey.status === filters.status;
      const matchesType = filters.type === 'all' || survey.type === filters.type;
      const matchesMunicipality = filters.municipality === 'all' || survey.municipality_name === filters.municipality;

      return matchesSearch && matchesStatus && matchesType && matchesMunicipality;
    });
  }, [surveys, filters]);

  // Calculate stats from all surveys (not filtered)
  const stats = useMemo<SurveyStats>(() => ({
    total: surveys.length,
    approved: surveys.filter(s => s.status === 'approved').length,
    pending: surveys.filter(s => s.status === 'pending').length,
    review: surveys.filter(s => s.status === 'review').length,
    rejected: surveys.filter(s => s.status === 'rejected').length,
  }), [surveys]);

  // Get unique municipalities and types for filter dropdowns
  const municipalities = useMemo(() => 
    [...new Set(surveys.map(s => s.municipality_name))].filter(Boolean).sort(),
    [surveys]
  );

  const types = useMemo(() => 
    [...new Set(surveys.map(s => s.type))].filter(Boolean).sort(),
    [surveys]
  );

  // Update filter state
  const setFilters = useCallback((newFilters: Partial<SurveyFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Update survey status
  const updateSurveyStatus = useCallback(async (
    id: string, 
    status: SurveyStatus, 
    reviewerId: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, any> = {
        status,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.description = notes;
      }

      const { error: updateError } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      const statusLabels: Record<SurveyStatus, string> = {
        approved: 'aprovada',
        rejected: 'rejeitada',
        review: 'marcada para revisão',
        pending: 'marcada como pendente',
      };

      toast({
        title: 'Status Atualizado',
        description: `Pesquisa ${statusLabels[status]} com sucesso!`,
      });

      return true;
    } catch (err) {
      console.error('Error updating survey status:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    surveys,
    filteredSurveys,
    stats,
    loading,
    error,
    filters,
    setFilters,
    municipalities,
    types,
    updateSurveyStatus,
    refreshSurveys: fetchSurveys,
  };
};
