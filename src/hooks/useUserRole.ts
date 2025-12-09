import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'] | 'superadmin';

interface UserRoleState {
  role: UserRole | null;
  loading: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  isResearcher: boolean;
  isAnalyst: boolean;
  isCoordinator: boolean;
}

export const useUserRole = (userId: string | undefined) => {
  const [state, setState] = useState<UserRoleState>({
    role: null,
    loading: true,
    isSuperadmin: false,
    isAdmin: false,
    isResearcher: false,
    isAnalyst: false,
    isCoordinator: false,
  });

  useEffect(() => {
    if (!userId) {
      setState({
        role: null,
        loading: false,
        isSuperadmin: false,
        isAdmin: false,
        isResearcher: false,
        isAnalyst: false,
        isCoordinator: false,
      });
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        const userRole = data?.role as UserRole | null;
        const isSuperadmin = userRole === 'superadmin';
        const isAdministrator = userRole === 'administrator';

        setState({
          role: userRole,
          loading: false,
          isSuperadmin,
          isAdmin: isAdministrator || isSuperadmin, // Superadmins also have admin privileges
          isResearcher: userRole === 'researcher',
          isAnalyst: userRole === 'analyst',
          isCoordinator: userRole === 'coordinator',
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        setState({
          role: null,
          loading: false,
          isSuperadmin: false,
          isAdmin: false,
          isResearcher: false,
          isAnalyst: false,
          isCoordinator: false,
        });
      }
    };

    fetchRole();

    // Set up real-time subscription for role changes
    const channel = supabase
      .channel(`user-role-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return state;
};
