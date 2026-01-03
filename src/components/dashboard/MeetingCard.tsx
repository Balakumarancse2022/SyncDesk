import React from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Clock, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_date: string;
  category: string;
  location?: string;
  file_count?: number;
}

interface MeetingCardProps {
  meeting: Meeting;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  class: 'bg-info/10 text-info border-info/20',
  work: 'bg-primary/10 text-primary border-primary/20',
  project: 'bg-accent/10 text-accent border-accent/20',
  personal: 'bg-warning/10 text-warning border-warning/20',
  general: 'bg-muted text-muted-foreground border-border',
};

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onClick }) => {
  const date = new Date(meeting.meeting_date);
  const dateLabel = isToday(date) 
    ? 'Today' 
    : isTomorrow(date) 
    ? 'Tomorrow' 
    : format(date, 'MMM d');

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border bg-card transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-primary/30 group'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge 
          variant="outline" 
          className={cn('capitalize', categoryColors[meeting.category])}
        >
          {meeting.category}
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">{dateLabel}</span>
      </div>
      
      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
        {meeting.title}
      </h4>
      
      {meeting.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {meeting.description}
        </p>
      )}
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{format(date, 'h:mm a')}</span>
        </div>
        
        {meeting.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-24">{meeting.location}</span>
          </div>
        )}
        
        {meeting.file_count !== undefined && meeting.file_count > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Folder className="w-4 h-4" />
            <span>{meeting.file_count} files</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
