import React, { useState } from 'react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle2, Circle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EditDeadlineDialog from '@/components/deadlines/EditDeadlineDialog';
import { Deadline } from '@/hooks/useDeadlines';

interface DeadlineItem {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  category: string;
  status: string;
  description?: string | null;
  reminder_enabled?: boolean | null;
}

interface DeadlineListProps {
  deadlines: DeadlineItem[];
  onStatusChange?: (id: string, status: string) => void;
  showEditButton?: boolean;
  fullDeadlines?: Deadline[];
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const categoryIcons: Record<string, string> = {
  assignment: '📝',
  exam: '📚',
  project: '🚀',
  task: '✅',
  meeting: '📅',
};

const DeadlineList: React.FC<DeadlineListProps> = ({ 
  deadlines, 
  onStatusChange, 
  showEditButton = true,
  fullDeadlines 
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);

  const getTimeLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const days = differenceInDays(date, new Date());
    if (days <= 7) return `${days} days left`;
    return format(date, 'MMM d');
  };

  const getTimeLabelColor = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'text-destructive';
    if (isToday(date)) return 'text-warning';
    if (isTomorrow(date)) return 'text-warning';
    return 'text-muted-foreground';
  };

  const handleEditClick = (deadline: DeadlineItem) => {
    // Find full deadline data if available
    const fullData = fullDeadlines?.find(d => d.id === deadline.id);
    if (fullData) {
      setSelectedDeadline(fullData);
      setEditDialogOpen(true);
    }
  };

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">No upcoming deadlines</p>
        <p className="text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {deadlines.map((deadline) => {
          const isOverdue = isPast(new Date(deadline.due_date)) && !isToday(new Date(deadline.due_date));
          
          return (
            <div
              key={deadline.id}
              className={cn(
                'p-4 rounded-lg border transition-all duration-200 hover:shadow-sm group',
                isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card',
                deadline.status === 'completed' && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onStatusChange?.(
                    deadline.id, 
                    deadline.status === 'completed' ? 'pending' : 'completed'
                  )}
                  className="mt-0.5 flex-shrink-0"
                >
                  {deadline.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{categoryIcons[deadline.category] || '📋'}</span>
                    <h4 className={cn(
                      'font-medium truncate',
                      deadline.status === 'completed' && 'line-through'
                    )}>
                      {deadline.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={priorityColors[deadline.priority as keyof typeof priorityColors]}>
                      {deadline.priority}
                    </Badge>
                    
                    <div className={cn(
                      'flex items-center gap-1 text-sm',
                      getTimeLabelColor(deadline.due_date)
                    )}>
                      {isOverdue ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{getTimeLabel(deadline.due_date)}</span>
                    </div>
                  </div>
                </div>

                {showEditButton && fullDeadlines && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleEditClick(deadline)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDeadline && (
        <EditDeadlineDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          deadline={selectedDeadline}
        />
      )}
    </>
  );
};

export default DeadlineList;
