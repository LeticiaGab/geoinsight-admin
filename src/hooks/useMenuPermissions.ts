import { useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  MapPin, 
  Settings,
  LucideIcon
} from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  allowedRoles: UserRole[] | 'all'; // 'all' means any authenticated user
}

// Menu configuration with role-based permissions
const MENU_CONFIG: MenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: BarChart3,
    allowedRoles: 'all' // All authenticated users can see dashboard
  },
  { 
    title: "Usuários", 
    url: "/users", 
    icon: Users,
    allowedRoles: ['administrator'] // Only admins can manage users
  },
  { 
    title: "Pesquisas", 
    url: "/surveys", 
    icon: FileText,
    allowedRoles: ['administrator', 'researcher', 'coordinator'] // Admins, researchers, and coordinators
  },
  { 
    title: "Municípios", 
    url: "/municipalities", 
    icon: MapPin,
    allowedRoles: ['administrator', 'analyst', 'coordinator'] // Admins, analysts, and coordinators
  },
  { 
    title: "Relatórios", 
    url: "/reports", 
    icon: BarChart3,
    allowedRoles: ['administrator', 'analyst', 'coordinator'] // Admins, analysts, and coordinators
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings,
    allowedRoles: ['administrator'] // Only admins can access settings
  },
];

interface UseMenuPermissionsResult {
  menuItems: MenuItem[];
  hasAccess: (url: string) => boolean;
  loading: boolean;
}

export const useMenuPermissions = (
  userRole: UserRole | null, 
  roleLoading: boolean
): UseMenuPermissionsResult => {
  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    if (!userRole) return [];
    
    return MENU_CONFIG.filter(item => {
      if (item.allowedRoles === 'all') return true;
      return item.allowedRoles.includes(userRole);
    });
  }, [userRole]);

  // Check if user has access to a specific route
  const hasAccess = useMemo(() => {
    return (url: string): boolean => {
      if (!userRole) return false;
      
      const menuItem = MENU_CONFIG.find(item => item.url === url);
      if (!menuItem) return false;
      
      if (menuItem.allowedRoles === 'all') return true;
      return menuItem.allowedRoles.includes(userRole);
    };
  }, [userRole]);

  return {
    menuItems,
    hasAccess,
    loading: roleLoading,
  };
};
