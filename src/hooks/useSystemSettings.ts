import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  id?: string;
  user_id: string;
  theme_mode: 'light' | 'dark';
  automatic_backup_enabled: boolean;
  automatic_backup_interval_hours: number;
  last_backup_datetime: string | null;
}

export const useSystemSettings = (userId: string | undefined) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          theme_mode: data.theme_mode as 'light' | 'dark',
          automatic_backup_enabled: data.automatic_backup_enabled,
          automatic_backup_interval_hours: data.automatic_backup_interval_hours,
          last_backup_datetime: data.last_backup_datetime,
        });
      } else {
        // Create default settings if none exist
        const defaultSettings: SystemSettings = {
          user_id: userId,
          theme_mode: 'dark',
          automatic_backup_enabled: true,
          automatic_backup_interval_hours: 12,
          last_backup_datetime: null,
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('system_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        
        setSettings({
          ...defaultSettings,
          id: newData.id,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!userId || !settings?.id) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          theme_mode: newSettings.theme_mode ?? settings.theme_mode,
          automatic_backup_enabled: newSettings.automatic_backup_enabled ?? settings.automatic_backup_enabled,
          automatic_backup_interval_hours: newSettings.automatic_backup_interval_hours ?? settings.automatic_backup_interval_hours,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateLastBackup = async () => {
    if (!userId || !settings?.id) return false;

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('system_settings')
        .update({ last_backup_datetime: now })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, last_backup_datetime: now } : null);
      return true;
    } catch (error: any) {
      console.error('Error updating backup time:', error);
      return false;
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateLastBackup,
    refetch: fetchSettings,
  };
};
