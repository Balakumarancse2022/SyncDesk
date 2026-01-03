import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FileUpload from '@/components/ui/file-upload';
import { useCreateMeeting, useUpdateMeeting, type Meeting } from '@/hooks/useMeetings';
import { useMeetingFiles } from '@/hooks/useMeetingFiles';
import { format } from 'date-fns';
import { Video, MapPin, Loader2 } from 'lucide-react';

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
}

const MeetingDialog: React.FC<MeetingDialogProps> = ({ open, onOpenChange, meeting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<'online' | 'offline'>('offline');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const { uploadFiles } = useMeetingFiles(meeting?.id || '');

  const isEditing = !!meeting;

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setDescription(meeting.description || '');
      setCategory(meeting.category || 'general');
      const meetingDate = new Date(meeting.meeting_date);
      setDate(format(meetingDate, 'yyyy-MM-dd'));
      setTime(format(meetingDate, 'HH:mm'));
      setMode((meeting.mode as 'online' | 'offline') || 'offline');
      setLocation(meeting.location || '');
      setMeetingLink(meeting.meeting_link || '');
    } else {
      resetForm();
    }
  }, [meeting, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setDate('');
    setTime('');
    setMode('offline');
    setLocation('');
    setMeetingLink('');
    setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const meetingDate = new Date(`${date}T${time}`);
    const meetingData = {
      title,
      description: description || null,
      category,
      meeting_date: meetingDate.toISOString(),
      mode,
      location: mode === 'offline' ? location : null,
      meeting_link: mode === 'online' ? meetingLink : null,
    };

    try {
      if (isEditing && meeting) {
        await updateMeeting.mutateAsync({ id: meeting.id, ...meetingData });
        if (files.length > 0) {
          await uploadFiles(files, meeting.id);
        }
      } else {
        const newMeeting = await createMeeting.mutateAsync(meetingData);
        if (files.length > 0 && newMeeting) {
          await uploadFiles(files, newMeeting.id);
        }
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save meeting:', error);
    }
  };

  const isLoading = createMeeting.isPending || updateMeeting.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Meeting' : 'Create New Meeting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting description..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'online' | 'offline')} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offline" id="offline" />
                <Label htmlFor="offline" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  Offline
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                  <Video className="w-4 h-4" />
                  Online
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === 'offline' ? (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room 101, Building A..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}

          <div>
            <Label>Attach Files</Label>
            <FileUpload onUpload={setFiles} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDialog;
