-- Add additional columns to reports table for survey management
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Geral',
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON public.reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_municipality ON public.reports(municipality_id);

-- Enable realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;