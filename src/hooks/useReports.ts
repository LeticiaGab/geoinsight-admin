import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportFilters {
  municipality: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export interface ReportData {
  id: string;
  municipality: string;
  municipalityId: string;
  surveyType: string;
  date: string;
  status: 'pending' | 'approved' | 'review';
  demands: number;
}

export interface MunicipalityChartData {
  name: string;
  surveys: number;
  demands: number;
}

export interface StatusChartData {
  name: string;
  value: number;
  color: string;
}

export interface UseReportsResult {
  reports: ReportData[];
  filteredReports: ReportData[];
  municipalityChartData: MunicipalityChartData[];
  statusChartData: StatusChartData[];
  municipalities: { id: string; name: string }[];
  loading: boolean;
  error: string | null;
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}

const initialFilters: ReportFilters = {
  municipality: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: ''
};

export const useReports = (): UseReportsResult => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ReportFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(initialFilters);
  const { toast } = useToast();

  const fetchMunicipalities = useCallback(async () => {
    const { data, error } = await supabase
      .from('municipalities')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching municipalities:', error);
      return;
    }

    setMunicipalities(data || []);
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch research surveys with municipality info
      const { data: surveys, error: surveysError } = await supabase
        .from('research_surveys')
        .select(`
          id,
          type_of_use,
          created_at,
          status,
          municipality_id,
          municipalities (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (surveysError) {
        throw surveysError;
      }

      // Fetch demands (reports) count per municipality
      const { data: demands, error: demandsError } = await supabase
        .from('reports')
        .select('municipality_id');

      if (demandsError) {
        throw demandsError;
      }

      // Count demands per municipality
      const demandCounts: Record<string, number> = {};
      demands?.forEach(demand => {
        demandCounts[demand.municipality_id] = (demandCounts[demand.municipality_id] || 0) + 1;
      });

      // Map surveys to report data
      const mappedReports: ReportData[] = (surveys || []).map(survey => ({
        id: survey.id,
        municipality: survey.municipalities?.name || 'N/A',
        municipalityId: survey.municipality_id || '',
        surveyType: survey.type_of_use || 'Geral',
        date: survey.created_at,
        status: survey.status as 'pending' | 'approved' | 'review',
        demands: demandCounts[survey.municipality_id || ''] || 0
      }));

      setReports(mappedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Erro ao carregar dados dos relatórios');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter reports based on applied filters
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (appliedFilters.municipality && appliedFilters.municipality !== 'all') {
      filtered = filtered.filter(item => item.municipalityId === appliedFilters.municipality);
    }

    if (appliedFilters.status && appliedFilters.status !== 'all') {
      filtered = filtered.filter(item => item.status === appliedFilters.status);
    }

    if (appliedFilters.dateFrom) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(appliedFilters.dateFrom));
    }

    if (appliedFilters.dateTo) {
      const endDate = new Date(appliedFilters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.date) <= endDate);
    }

    return filtered;
  }, [reports, appliedFilters]);

  // Generate chart data for municipalities
  const municipalityChartData = useMemo(() => {
    const municipalityStats: Record<string, { surveys: number; demands: number; name: string }> = {};

    filteredReports.forEach(report => {
      if (!municipalityStats[report.municipalityId]) {
        municipalityStats[report.municipalityId] = {
          name: report.municipality,
          surveys: 0,
          demands: 0
        };
      }
      municipalityStats[report.municipalityId].surveys += 1;
      municipalityStats[report.municipalityId].demands = report.demands;
    });

    return Object.values(municipalityStats).slice(0, 10); // Limit to 10 municipalities
  }, [filteredReports]);

  // Generate status chart data
  const statusChartData = useMemo(() => {
    const statusCounts = {
      approved: 0,
      review: 0,
      pending: 0
    };

    filteredReports.forEach(report => {
      if (report.status in statusCounts) {
        statusCounts[report.status as keyof typeof statusCounts] += 1;
      }
    });

    return [
      { name: 'Validadas', value: statusCounts.approved, color: 'hsl(var(--primary))' },
      { name: 'Revisadas', value: statusCounts.review, color: 'hsl(142 76% 36%)' },
      { name: 'Pendentes', value: statusCounts.pending, color: 'hsl(0 84% 60%)' }
    ];
  }, [filteredReports]);

  const setFilters = useCallback((newFilters: ReportFilters) => {
    setFiltersState(newFilters);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setAppliedFilters(initialFilters);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMunicipalities();
    fetchReports();
  }, [fetchMunicipalities, fetchReports]);

  // Set up real-time subscriptions
  useEffect(() => {
    const surveysChannel = supabase
      .channel('reports-research-surveys')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'research_surveys' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    const reportsChannel = supabase
      .channel('reports-reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    const municipalitiesChannel = supabase
      .channel('reports-municipalities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'municipalities' },
        () => {
          fetchMunicipalities();
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(surveysChannel);
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(municipalitiesChannel);
    };
  }, [fetchReports, fetchMunicipalities]);

  return {
    reports,
    filteredReports,
    municipalityChartData,
    statusChartData,
    municipalities,
    loading,
    error,
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    refetch: fetchReports
  };
};
