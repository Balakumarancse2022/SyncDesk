-- Add mode and meeting_link columns to meetings table
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS mode text DEFAULT 'offline';
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_link text;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger to notify on shared file changes
CREATE OR REPLACE FUNCTION public.notify_file_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, description, type, related_id, related_type)
    VALUES (
        NEW.user_id,
        'File Modified',
        NEW.file_name || ' was ' || NEW.change_type,
        'file',
        NEW.shared_file_id,
        'shared_file'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_file_change
AFTER INSERT ON public.file_changes
FOR EACH ROW
EXECUTE FUNCTION public.notify_file_change();

-- Create trigger to notify on approaching deadlines (within 24 hours)
CREATE OR REPLACE FUNCTION public.check_deadline_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification if deadline is within 24 hours
    IF NEW.due_date <= (NOW() + INTERVAL '24 hours') AND NEW.status != 'completed' THEN
        INSERT INTO public.notifications (user_id, title, description, type, related_id, related_type)
        VALUES (
            NEW.user_id,
            'Deadline Approaching',
            NEW.title || ' is due soon',
            'warning',
            NEW.id,
            'deadline'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;