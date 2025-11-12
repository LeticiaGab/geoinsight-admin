import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ExportOptions {
  format: "csv" | "pdf";
  data: any[];
  filename: string;
  columns: string[];
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async ({ format, data, filename, columns }: ExportOptions) => {
    setIsExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para exportar dados.",
          variant: "destructive",
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.email || "Sistema";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            format,
            data,
            filename,
            columns,
            userName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao exportar dados");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${format === "pdf" ? "html" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Sucesso",
        description: `Arquivo ${format.toUpperCase()} gerado com sucesso!`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erro",
        description: "Falha ao exportar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
};
