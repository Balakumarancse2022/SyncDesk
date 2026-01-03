-- Add reminder columns to deadlines table
ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes integer DEFAULT 60;

-- Add reminder columns to meetings table  
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Create user_settings table for preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  meeting_reminders boolean DEFAULT true,
  file_change_alerts boolean DEFAULT true,
  reminder_time integer DEFAULT 60,
  theme text DEFAULT 'system',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();