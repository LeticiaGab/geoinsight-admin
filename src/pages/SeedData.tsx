import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Users, Building2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedUsers = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-users');
      
      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message + " (Default password: Test@123456)",
      });
    } catch (error) {
      console.error('Error seeding users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed users",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedReports = async () => {
    setIsSeeding(true);
    try {
      // Get municipalities and users to create reports
      const { data: municipalities } = await supabase
        .from('municipalities')
        .select('id, name')
        .limit(10);

      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .limit(10);

      if (!municipalities || !users || municipalities.length === 0 || users.length === 0) {
        throw new Error("Please seed users and ensure municipalities exist first");
      }

      const reportsData = [
        {
          title: "Análise de Mobilidade Urbana",
          municipality_id: municipalities[0].id,
          author_id: users[0].id,
          status: "completed",
          description: "Estudo completo sobre o sistema de transporte público e alternativas de mobilidade sustentável.",
          created_at: "2023-11-15T10:00:00Z"
        },
        {
          title: "Pesquisa de Saneamento Básico",
          municipality_id: municipalities[1].id,
          author_id: users[1].id,
          status: "under_review",
          description: "Levantamento da infraestrutura de água e esgoto nas áreas urbanas e rurais.",
          created_at: "2023-11-20T14:30:00Z"
        },
        {
          title: "Relatório de Educação Municipal",
          municipality_id: municipalities[2].id,
          author_id: users[2].id,
          status: "completed",
          description: "Avaliação da qualidade do ensino e infraestrutura das escolas municipais.",
          created_at: "2023-12-01T09:15:00Z"
        },
        {
          title: "Estudo de Habitação Popular",
          municipality_id: municipalities[3].id,
          author_id: users[3].id,
          status: "pending",
          description: "Análise das necessidades habitacionais e programas de moradia social.",
          created_at: "2023-12-10T11:45:00Z"
        },
        {
          title: "Pesquisa de Saúde Pública",
          municipality_id: municipalities[4].id,
          author_id: users[4].id,
          status: "completed",
          description: "Mapeamento dos serviços de saúde e indicadores de atendimento à população.",
          created_at: "2024-01-05T16:20:00Z"
        },
        {
          title: "Análise de Segurança Pública",
          municipality_id: municipalities[5].id,
          author_id: users[5].id,
          status: "under_review",
          description: "Estudo sobre índices de criminalidade e efetividade do policiamento comunitário.",
          created_at: "2024-01-15T08:30:00Z"
        },
        {
          title: "Relatório de Meio Ambiente",
          municipality_id: municipalities[6].id,
          author_id: users[6].id,
          status: "completed",
          description: "Avaliação das áreas verdes, qualidade do ar e gestão de resíduos sólidos.",
          created_at: "2024-02-01T13:10:00Z"
        },
        {
          title: "Pesquisa de Desenvolvimento Econômico",
          municipality_id: municipalities[7].id,
          author_id: users[7].id,
          status: "pending",
          description: "Análise do perfil econômico local e oportunidades de investimento.",
          created_at: "2024-02-10T15:45:00Z"
        },
        {
          title: "Estudo de Cultura e Turismo",
          municipality_id: municipalities[8].id,
          author_id: users[8].id,
          status: "completed",
          description: "Levantamento do patrimônio cultural e potencial turístico do município.",
          created_at: "2024-02-20T10:25:00Z"
        },
        {
          title: "Relatório de Infraestrutura Digital",
          municipality_id: municipalities[9].id,
          author_id: users[9].id,
          status: "under_review",
          description: "Avaliação da conectividade de internet e inclusão digital na população.",
          created_at: "2024-03-01T12:00:00Z"
        }
      ];

      const { error } = await supabase
        .from('reports')
        .insert(reportsData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Successfully created 10 sample reports",
      });
    } catch (error) {
      console.error('Error seeding reports:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed reports",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Database Seeding</h1>
          <p className="text-muted-foreground">
            Generate sample data for testing the system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seed Users
              </CardTitle>
              <CardDescription>
                Create 10 test users with different roles (Administrator, Researcher, Analyst, Coordinator)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSeedUsers} 
                disabled={isSeeding}
                className="w-full"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Users
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Default password: <code className="bg-muted px-1 py-0.5 rounded">Test@123456</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Municipalities
              </CardTitle>
              <CardDescription>
                10 Brazilian municipalities have been pre-populated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Municipalities from SP, RJ, MG, BA, PR, CE, AM, PE, RS, and DF are already in the database.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Seed Reports
              </CardTitle>
              <CardDescription>
                Create 10 sample reports linked to municipalities and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSeedReports} 
                disabled={isSeeding}
                className="w-full"
                variant="secondary"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Reports
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Run this after seeding users
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seeding Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click "Seed Users" to create 10 test users with profiles and roles</li>
              <li>Municipalities are already populated in the database</li>
              <li>Click "Seed Reports" to create sample reports (requires users to be seeded first)</li>
              <li>All test users have the password: <code className="bg-muted px-1 py-0.5 rounded">Test@123456</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeedData;