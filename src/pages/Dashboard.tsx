import React from 'react';
import { Calendar, FolderOpen, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DeadlineList from '@/components/dashboard/DeadlineList';
import MeetingCard from '@/components/dashboard/MeetingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUpcomingDeadlines, useUpdateDeadline } from '@/hooks/useDeadlines';
import { useUpcomingMeetings } from '@/hooks/useMeetings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: deadlines = [], isLoading: deadlinesLoading } = useUpcomingDeadlines(7);
  const { data: meetings = [], isLoading: meetingsLoading } = useUpcomingMeetings(3);
  const updateDeadline = useUpdateDeadline();

  const handleStatusChange = (id: string, status: string) => {
    updateDeadline.mutate({ id, status });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your work today.</p>
        </div>
        <Button onClick={() => navigate('/deadlines')} className="gradient-primary text-primary-foreground">
          <Clock className="w-4 h-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard title="Active Meetings" value={stats?.meetings || 0} icon={Calendar} variant="primary" subtitle="This week" />
            <StatCard title="Pending Deadlines" value={stats?.deadlines || 0} icon={Clock} variant="warning" subtitle="Next 7 days" />
            <StatCard title="Submissions" value={stats?.submissions || 0} icon={FileCheck} variant="success" subtitle="Validated" />
            <StatCard 
              title="Conflicts" 
              value={stats?.conflicts || 0} 
              icon={AlertTriangle} 
              variant={stats?.conflicts && stats.conflicts > 0 ? 'danger' : 'default'} 
              subtitle={stats?.conflicts && stats.conflicts > 0 ? 'Needs attention' : 'All clear'} 
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Deadlines
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/deadlines')}>View all</Button>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <DeadlineList 
                deadlines={deadlines.map(d => ({
                  id: d.id,
                  title: d.title,
                  due_date: d.due_date,
                  priority: d.priority || 'medium',
                  category: d.category || 'task',
                  status: d.status || 'pending',
                }))} 
                onStatusChange={handleStatusChange}
                fullDeadlines={deadlines}
              />
            )}
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Upcoming Meetings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>View all</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : meetings.length > 0 ? (
              meetings.map(meeting => (
                <MeetingCard 
                  key={meeting.id} 
                  meeting={{
                    id: meeting.id,
                    title: meeting.title,
                    meeting_date: meeting.meeting_date,
                    category: meeting.category || 'general',
                    location: meeting.location || 'TBD',
                    file_count: meeting.file_count,
                  }} 
                  onClick={() => navigate('/meetings')} 
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming meetings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
