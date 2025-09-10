import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app this would authenticate with backend
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-8 hidden lg:block">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold">Geo-Cidades</h1>
            </div>
            <p className="text-xl text-white/90">
              Sistema de Administração Municipal
            </p>
            <p className="text-white/80 text-lg">
              Gerencie pesquisas, usuários e dados municipais com eficiência e segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Seguro</h3>
              <p className="text-sm text-white/80">Autenticação JWT e criptografia</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Colaborativo</h3>
              <p className="text-sm text-white/80">Gestão de usuários e permissões</p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <MapPin className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Eficiente</h3>
              <p className="text-sm text-white/80">Relatórios e análises em tempo real</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-strong border-0">
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center lg:hidden">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-primary">Geo-Cidades</h1>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
              <CardDescription>
                Faça login em sua conta para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@geocidades.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-border"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-muted-foreground">Lembrar-me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <Button type="submit" className="w-full">
                  Entrar no Sistema
                </Button>
              </form>
              
              <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
                <p>Acesso restrito a usuários autorizados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;