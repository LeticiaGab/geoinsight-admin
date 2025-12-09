-- Create system_settings table for storing global settings
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme_mode text NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('light', 'dark')),
  automatic_backup_enabled boolean NOT NULL DEFAULT true,
  automatic_backup_interval_hours integer NOT NULL DEFAULT 12,
  last_backup_datetime timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.system_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.system_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Create function to check if a user can modify another user's role
CREATE OR REPLACE FUNCTION public.can_modify_user(_actor_id uuid, _target_user_id uuid, _action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role app_role;
  target_role app_role;
BEGIN
  -- Get actor's role
  SELECT role INTO actor_role FROM public.user_roles WHERE user_id = _actor_id LIMIT 1;
  
  -- Get target's role
  SELECT role INTO target_role FROM public.user_roles WHERE user_id = _target_user_id LIMIT 1;
  
  -- Superadmins can do anything
  IF actor_role = 'superadmin' THEN
    RETURN true;
  END IF;
  
  -- Admins cannot modify superadmins or other admins
  IF actor_role = 'administrator' THEN
    IF target_role IN ('superadmin', 'administrator') THEN
      RETURN false;
    END IF;
    -- Admins can modify researchers, analysts, coordinators
    RETURN true;
  END IF;
  
  -- Non-admins cannot modify anyone
  RETURN false;
END;
$$;