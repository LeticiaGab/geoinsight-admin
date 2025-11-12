import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const useDataRefresh = (refreshCallback: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      await refreshCallback();
      
      toast({
        title: "Dados atualizados",
        description: "Todos os dados foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshData, isRefreshing };
};
