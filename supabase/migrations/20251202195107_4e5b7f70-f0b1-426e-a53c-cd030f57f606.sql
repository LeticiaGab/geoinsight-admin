-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification when a report is assigned or status changes
CREATE OR REPLACE FUNCTION public.handle_report_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  municipality_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get municipality name
  SELECT name INTO municipality_name 
  FROM public.municipalities 
  WHERE id = NEW.municipality_id;

  -- Handle new report assignment
  IF TG_OP = 'INSERT' AND NEW.author_id IS NOT NULL THEN
    notification_title := 'Nova pesquisa atribuída';
    notification_message := 'Você foi designado para a pesquisa "' || NEW.title || '" no município de ' || COALESCE(municipality_name, 'N/A');
    
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.author_id, notification_title, notification_message, 'assignment', 'report', NEW.id);
  END IF;

  -- Handle status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.author_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'approved' THEN
        notification_title := 'Pesquisa aprovada';
        notification_message := 'Sua pesquisa "' || NEW.title || '" foi aprovada.';
      WHEN 'rejected' THEN
        notification_title := 'Pesquisa rejeitada';
        notification_message := 'Sua pesquisa "' || NEW.title || '" foi rejeitada. Verifique os comentários.';
      WHEN 'pending' THEN
        notification_title := 'Pesquisa em análise';
        notification_message := 'Sua pesquisa "' || NEW.title || '" está em análise.';
      ELSE
        notification_title := 'Status da pesquisa atualizado';
        notification_message := 'O status da pesquisa "' || NEW.title || '" foi atualizado para ' || NEW.status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.author_id, notification_title, notification_message, 'status_change', 'report', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for report notifications
CREATE TRIGGER on_report_change
  AFTER INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_report_notification();