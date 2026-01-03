-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('student', 'employee', 'faculty', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meetings table
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('class', 'work', 'project', 'personal', 'general')),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meeting_files table for file organization
CREATE TABLE public.meeting_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create deadlines table
CREATE TABLE public.deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'task' CHECK (category IN ('assignment', 'exam', 'project', 'task', 'meeting')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create submissions table for format validation tracking
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    submission_type TEXT DEFAULT 'assignment' CHECK (submission_type IN ('assignment', 'report', 'project', 'client', 'other')),
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create shared_files table for change tracking
CREATE TABLE public.shared_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    last_modified_by UUID REFERENCES auth.users(id),
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create file_changes table for tracking modifications
CREATE TABLE public.file_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_file_id UUID REFERENCES public.shared_files(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'renamed', 'deleted')),
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for meetings
CREATE POLICY "Users can view their own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_files
CREATE POLICY "Users can view their own meeting files" ON public.meeting_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meeting files" ON public.meeting_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meeting files" ON public.meeting_files FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for deadlines
CREATE POLICY "Users can view their own deadlines" ON public.deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deadlines" ON public.deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deadlines" ON public.deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deadlines" ON public.deadlines FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for submissions
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON public.submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own submissions" ON public.submissions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_files
CREATE POLICY "Users can view their own shared files" ON public.shared_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own shared files" ON public.shared_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shared files" ON public.shared_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shared files" ON public.shared_files FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for file_changes
CREATE POLICY "Users can view changes on their files" ON public.file_changes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shared_files WHERE id = shared_file_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert changes" ON public.file_changes FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
    RETURN new;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-files', 'meeting-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id IN ('meeting-files', 'submissions') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (
    bucket_id IN ('meeting-files', 'submissions') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
    bucket_id IN ('meeting-files', 'submissions') AND auth.uid()::text = (storage.foldername(name))[1]
);