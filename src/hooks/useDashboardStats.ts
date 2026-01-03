import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  meetings: number;
  deadlines: number;
  submissions: number;
  conflicts: number;
}

export const useDashboardStats = () => {
  const { user } = useAuth();
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) return { meetings: 0, deadlines: 0, submissions: 0, conflicts: 0 };

      // Fetch meetings this week
      const { count: meetingsCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('meeting_date', now.toISOString())
        .lte('meeting_date', weekFromNow.toISOString());

      // Fetch pending deadlines in next 7 days
      const { data: deadlinesData } = await supabase
        .from('deadlines')
        .select('due_date')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .gte('due_date', now.toISOString())
        .lte('due_date', weekFromNow.toISOString());

      // Fetch validated submissions
      const { count: submissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('validation_status', 'valid');

      // Calculate conflicts (same day deadlines)
      const deadlinesByDate = new Map<string, number>();
      deadlinesData?.forEach(d => {
        const dateKey = new Date(d.due_date).toDateString();
        deadlinesByDate.set(dateKey, (deadlinesByDate.get(dateKey) || 0) + 1);
      });
      
      let conflictDays = 0;
      deadlinesByDate.forEach(count => {
        if (count > 1) conflictDays++;
      });

      return {
        meetings: meetingsCount || 0,
        deadlines: deadlinesData?.length || 0,
        submissions: submissionsCount || 0,
        conflicts: conflictDays,
      };
    },
    enabled: !!user,
  });
};
