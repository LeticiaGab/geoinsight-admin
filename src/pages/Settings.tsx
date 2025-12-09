import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Database, 
  Save,
  Clock,
  Shield,
  Moon,
  Sun,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const { toast } = useToast();
  const { isLight, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { settings, loading, saving, saveSettings, updateLastBackup } = useSystemSettings(user?.id);
  
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupInterval, setBackupInterval] = useState(12);
  const [runningBackup, setRunningBackup] = useState(false);

  // Sync local state with database settings
  useEffect(() => {
    if (settings) {
      setThemeMode(settings.theme_mode);
      setAutoBackupEnabled(settings.automatic_backup_enabled);
      setBackupInterval(settings.automatic_backup_interval_hours);
      
      // Sync theme with settings from database
      const shouldBeLight = settings.theme_mode === 'light';
      if (shouldBeLight !== isLight) {
        toggleTheme();
      }
    }
  }, [settings]);

  const handleThemeToggle = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    toggleTheme();
  };

  const handleManualBackup = async () => {
    setRunningBackup(true);
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last backup time in database
      const success = await updateLastBackup();
      
      if (success) {
        toast({
          title: "Backup Concluído",
          description: "O backup manual foi executado com sucesso!",
        });
      } else {
        throw new Error("Failed to update backup time");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar o backup.",
        variant: "destructive",
      });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings({
      theme_mode: themeMode,
      automatic_backup_enabled: autoBackupEnabled,
      automatic_backup_interval_hours: backupInterval,
    });

    if (!success) {
      // Revert local state if save failed
      if (settings) {
        setThemeMode(settings.theme_mode);
        setAutoBackupEnabled(settings.automatic_backup_enabled);
        setBackupInterval(settings.automatic_backup_interval_hours);
      }
    }
  };

  const formatBackupDateTime = (datetime: string | null) => {
    if (!datetime) return "Nenhum backup realizado";
    return new Date(datetime).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {themeMode === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Configurações de Tema
          </CardTitle>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="light-mode">Modo Claro</Label>
              <div className="text-sm text-muted-foreground">
                {themeMode === 'light' ? "Desativar para voltar ao tema escuro padrão" : "Ativar tema claro com fundo branco"}
              </div>
            </div>
            <Switch
              id="light-mode"
              checked={themeMode === 'light'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Controle de Backup
          </CardTitle>
          <CardDescription>
            Gerencie os backups automáticos e manuais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Último Backup</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatBackupDateTime(settings?.last_backup_datetime || null)}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Backup Automático</span>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  id="auto-backup"
                  checked={autoBackupEnabled}
                  onCheckedChange={setAutoBackupEnabled}
                />
                <Label htmlFor="auto-backup" className="text-sm text-muted-foreground">
                  {autoBackupEnabled ? "Ativado" : "Desativado"}
                </Label>
              </div>
            </div>
          </div>

          {autoBackupEnabled && (
            <div className="space-y-2">
              <Label htmlFor="backup-interval">Intervalo de Backup (horas)</Label>
              <Input
                id="backup-interval"
                type="number"
                min={1}
                max={168}
                value={backupInterval}
                onChange={(e) => setBackupInterval(parseInt(e.target.value) || 12)}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                O backup automático será executado a cada {backupInterval} hora{backupInterval > 1 ? 's' : ''}
              </p>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Backup Manual</div>
              <div className="text-sm text-muted-foreground">
                Execute um backup imediato do sistema
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleManualBackup}
              disabled={runningBackup}
            >
              {runningBackup ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Executar Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          className="flex items-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
