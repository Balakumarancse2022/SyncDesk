import React, { useState } from 'react';
import { Plus, Search, Video, MapPin, Calendar, FolderOpen, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMeetings, useDeleteMeeting, type Meeting } from '@/hooks/useMeetings';
import MeetingDialog from '@/components/meetings/MeetingDialog';
import MeetingFilesDialog from '@/components/meetings/MeetingFilesDialog';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryColors: Record<string, string> = {
  general: 'bg-secondary text-secondary-foreground',
  class: 'bg-info/10 text-info',
  work: 'bg-warning/10 text-warning',
  project: 'bg-success/10 text-success',
  interview: 'bg-primary/10 text-primary',
  workshop: 'bg-accent text-accent-foreground',
};

const Meetings = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [filesDialogMeeting, setFilesDialogMeeting] = useState<Meeting | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

  const { data: meetings, isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();

  const filteredMeetings = meetings?.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingMeeting) {
      await deleteMeeting.mutateAsync(deletingMeeting.id);
      setDeletingMeeting(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingMeeting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground mt-1">Organize your meetings and files in one place</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />New Meeting
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search meetings..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? 'No meetings match your search' : 'No meetings yet. Create your first meeting!'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => {
            const meetingDate = new Date(meeting.meeting_date);
            const isOnline = meeting.mode === 'online';
            const meetingPast = isPast(meetingDate);

            return (
              <Card key={meeting.id} className={cn("hover:shadow-lg transition-shadow", meetingPast && "opacity-60")}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{meeting.description}</p>
                      )}
                    </div>
                    <Badge className={cn('ml-2 shrink-0', categoryColors[meeting.category || 'general'])}>
                      {meeting.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(meetingDate, 'MMM d, yyyy')} at {format(meetingDate, 'h:mm a')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {isOnline ? (
                      <>
                        <Video className="w-4 h-4 text-info" />
                        {meeting.meeting_link ? (
                          <a 
                            href={meeting.meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-info hover:underline flex items-center gap-1"
                          >
                            Join Meeting <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No link provided</span>
                        )}
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-warning" />
                        <span>{meeting.location || 'No location specified'}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilesDialogMeeting(meeting)}
                      className="text-muted-foreground"
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Files
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(meeting)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeletingMeeting(meeting)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(meetingDate, { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MeetingDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogClose} 
        meeting={editingMeeting}
      />

      {filesDialogMeeting && (
        <MeetingFilesDialog
          open={!!filesDialogMeeting}
          onOpenChange={(open) => !open && setFilesDialogMeeting(null)}
          meetingId={filesDialogMeeting.id}
          meetingTitle={filesDialogMeeting.title}
        />
      )}

      <AlertDialog open={!!deletingMeeting} onOpenChange={(open) => !open && setDeletingMeeting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMeeting?.title}"? This will also delete all attached files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Meetings;
