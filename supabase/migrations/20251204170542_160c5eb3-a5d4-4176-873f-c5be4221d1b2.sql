-- Create sequence for point_id
CREATE SEQUENCE IF NOT EXISTS public.research_point_seq START 1;

-- Create research_surveys table
CREATE TABLE public.research_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  point_id TEXT NOT NULL DEFAULT 'P' || LPAD(nextval('public.research_point_seq')::TEXT, 6, '0'),
  building_number TEXT,
  street TEXT NOT NULL,
  coordinate_x TEXT NOT NULL,
  coordinate_y TEXT NOT NULL,
  front_setback BOOLEAN DEFAULT false,
  left_side_setback BOOLEAN DEFAULT false,
  number_of_floors INTEGER DEFAULT 1,
  type_of_use TEXT NOT NULL,
  structure_material TEXT NOT NULL,
  occupation_status TEXT NOT NULL,
  building_condition TEXT NOT NULL,
  lot_boundary TEXT NOT NULL,
  sidewalk BOOLEAN DEFAULT false,
  slope_direction TEXT,
  photo_1_url TEXT,
  photo_2_url TEXT,
  photo_3_url TEXT,
  observations TEXT,
  author_id UUID REFERENCES auth.users(id),
  municipality_id UUID REFERENCES public.municipalities(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all research surveys"
ON public.research_surveys
FOR SELECT
USING (true);

CREATE POLICY "Users can create research surveys"
ON public.research_surveys
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own research surveys"
ON public.research_surveys
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all research surveys"
ON public.research_surveys
FOR ALL
USING (has_role(auth.uid(), 'administrator'::app_role));

-- Create indexes
CREATE INDEX idx_research_surveys_author ON public.research_surveys(author_id);
CREATE INDEX idx_research_surveys_municipality ON public.research_surveys(municipality_id);
CREATE INDEX idx_research_surveys_status ON public.research_surveys(status);
CREATE INDEX idx_research_surveys_point_id ON public.research_surveys(point_id);

-- Create trigger for updated_at
CREATE TRIGGER update_research_surveys_updated_at
  BEFORE UPDATE ON public.research_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_surveys;

-- Create storage bucket for research photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-photos', 'research-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for research photos
CREATE POLICY "Research photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'research-photos');

CREATE POLICY "Authenticated users can upload research photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'research-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own research photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'research-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own research photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'research-photos' AND auth.uid()::text = (storage.foldername(name))[1]);