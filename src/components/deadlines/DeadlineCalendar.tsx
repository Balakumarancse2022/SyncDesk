import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Deadline } from '@/hooks/useDeadlines';

interface DeadlineCalendarProps {
  deadlines: Deadline[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted',
  medium: 'bg-info',
  high: 'bg-warning',
  urgent: 'bg-destructive',
};

const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({
  deadlines,
  selectedDate,
  onSelectDate,
}) => {
  // Group deadlines by date
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach(deadline => {
      const dateKey = new Date(deadline.due_date).toDateString();
      const existing = map.get(dateKey) || [];
      existing.push(deadline);
      map.set(dateKey, existing);
    });
    return map;
  }, [deadlines]);

  // Find conflict dates (multiple deadlines on same day)
  const conflictDates = useMemo(() => {
    const conflicts: Date[] = [];
    deadlinesByDate.forEach((items, dateStr) => {
      if (items.length > 1) {
        conflicts.push(new Date(dateStr));
      }
    });
    return conflicts;
  }, [deadlinesByDate]);

  // Get deadlines for selected date
  const selectedDateDeadlines = useMemo(() => {
    if (!selectedDate) return [];
    return deadlinesByDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, deadlinesByDate]);

  // Custom day rendering to show deadline indicators
  const modifiers = useMemo(() => {
    const deadlineDates: Date[] = [];
    deadlinesByDate.forEach((_, dateStr) => {
      deadlineDates.push(new Date(dateStr));
    });
    
    return {
      deadline: deadlineDates,
      conflict: conflictDates,
    };
  }, [deadlinesByDate, conflictDates]);

  const modifiersStyles = {
    deadline: {
      fontWeight: 'bold',
    },
    conflict: {
      backgroundColor: 'hsl(var(--destructive) / 0.2)',
      borderRadius: '50%',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Deadline Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => {
                const dateDeadlines = deadlinesByDate.get(date.toDateString());
                const hasConflict = conflictDates.some(d => isSameDay(d, date));
                
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {dateDeadlines && dateDeadlines.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {hasConflict ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedDate ? (
              <>
                {format(selectedDate, 'MMMM d, yyyy')}
                {selectedDateDeadlines.length > 1 && (
                  <Badge variant="destructive" className="ml-2 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Conflict
                  </Badge>
                )}
              </>
            ) : (
              'Select a date'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateDeadlines.length > 0 ? (
              <div className="space-y-3">
                {selectedDateDeadlines.length > 1 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                    <div className="flex items-center gap-2 text-destructive font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Scheduling Conflict Detected</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have {selectedDateDeadlines.length} deadlines on this day. Consider rescheduling for better workload distribution.
                    </p>
                  </div>
                )}
                
                {selectedDateDeadlines.map(deadline => (
                  <div
                    key={deadline.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{deadline.title}</h4>
                        {deadline.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {deadline.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          priorityColors[deadline.priority || 'medium'],
                          'text-white'
                        )}
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span className="capitalize">{deadline.category}</span>
                      <span>•</span>
                      <span className="capitalize">{deadline.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deadlines on this date</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Click a date to view deadlines</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeadlineCalendar;
