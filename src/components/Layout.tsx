import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarTrigger,
  useSidebar 
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Users, 
  FileText, 
  MapPin, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Search,
  User,
  Shield,
  FlaskConical,
  LineChart,
  Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";

// Helper function to get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper function to get role display info
const getRoleInfo = (role: string | null) => {
  switch (role) {
    case 'administrator':
      return { label: 'Administrador', icon: Shield, color: 'text-primary' };
    case 'researcher':
      return { label: 'Pesquisador', icon: FlaskConical, color: 'text-blue-500' };
    case 'analyst':
      return { label: 'Analista', icon: LineChart, color: 'text-amber-500' };
    case 'coordinator':
      return { label: 'Coordenador', icon: Briefcase, color: 'text-purple-500' };
    default:
      return { label: 'Usuário', icon: User, color: 'text-muted-foreground' };
  }
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nova pesquisa atribuída a você",
      timestamp: new Date().toLocaleString('pt-BR'),
      read: false,
      link: "/survey-review"
    }
  ]);

  // Auth and user data hooks - synced with database in real-time
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const { role, loading: roleLoading } = useUserRole(user?.id);

  const isUserDataLoading = authLoading || profileLoading || roleLoading;
  const roleInfo = getRoleInfo(role);

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
    { title: "Usuários", url: "/users", icon: Users },
    { title: "Pesquisas", url: "/surveys", icon: FileText },
    { title: "Municípios", url: "/municipalities", icon: MapPin },
    { title: "Relatórios", url: "/reports", icon: BarChart3 },
    { title: "Configurações", url: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erro",
        description: "Falha ao realizar logout.",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <AppSidebar 
          menuItems={menuItems}
          onNavigate={handleNavigation}
          currentPath={location.pathname}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pesquisas, usuários, municípios..."
                  className="pl-9 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold">Notificações</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                            !notification.read ? "bg-muted/30" : ""
                          }`}
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            if (notification.link) {
                              navigate(notification.link);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.timestamp}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-1">
                    <div className="flex items-center gap-2">
                      {isUserDataLoading ? (
                        <>
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="hidden sm:flex flex-col items-start gap-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:flex flex-col items-start">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">
                                {profile?.full_name || 'Usuário'}
                              </span>
                              <roleInfo.icon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {user?.email || 'Sem email'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'Sem email'}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <roleInfo.icon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
                        <span className={`text-xs ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                        {profile?.status && (
                          <Badge 
                            variant={profile.status === 'active' ? 'default' : 'secondary'} 
                            className="text-xs h-5 ml-1"
                          >
                            {profile.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Sidebar Component
interface AppSidebarProps {
  menuItems: Array<{
    title: string;
    url: string;
    icon: React.ComponentType<any>;
  }>;
  onNavigate: (url: string) => void;
  currentPath: string;
}

const AppSidebar = ({ menuItems, onNavigate, currentPath }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="p-2 bg-primary rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary">Geo-Cidades</h1>
              <p className="text-xs text-muted-foreground">Sistema Municipal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = currentPath === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => onNavigate(item.url)}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default Layout;