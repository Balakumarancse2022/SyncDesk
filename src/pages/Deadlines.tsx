import React, { useState } from 'react';
import { Plus, Calendar, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import DeadlineList from '@/components/dashboard/DeadlineList';
import DeadlineCalendar from '@/components/deadlines/DeadlineCalendar';
import AddDeadlineDialog from '@/components/deadlines/AddDeadlineDialog';
import { useDeadlines, useUpdateDeadline } from '@/hooks/useDeadlines';

const Deadlines = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { data: deadlines = [], isLoading } = useDeadlines();
  const updateDeadline = useUpdateDeadline();

  const handleStatusChange = (id: string, status: string) => {
    updateDeadline.mutate({ id, status });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deadlines</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your deadlines</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          ) : (
            <DeadlineCalendar
              deadlines={deadlines}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                All Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
        </TabsContent>
      </Tabs>

      <AddDeadlineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Deadlines;
