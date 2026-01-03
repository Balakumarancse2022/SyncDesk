import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, Mail, 
  Smartphone, Save, Loader2, CheckCircle2, 
  Moon, Sun, Monitor, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserProfile {
  full_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface UserSettings {
  email_notifications: boolean;
  deadline_reminders: boolean;
  meeting_reminders: boolean;
  file_change_alerts: boolean;
  reminder_time: number;
  theme: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: user?.email || '',
    mobile_number: '',
    avatar_url: null,
    role: 'user',
  });

  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    deadline_reminders: true,
    meeting_reminders: true,
    file_change_alerts: true,
    reminder_time: 60,
    theme: 'system',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name,
            email: profileData.email || user.email,
            mobile_number: profileData.mobile_number,
            avatar_url: profileData.avatar_url,
            role: profileData.role,
          });
        }

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsData) {
          setSettings({
            email_notifications: settingsData.email_notifications ?? true,
            deadline_reminders: settingsData.deadline_reminders ?? true,
            meeting_reminders: settingsData.meeting_reminders ?? true,
            file_change_alerts: settingsData.file_change_alerts ?? true,
            reminder_time: settingsData.reminder_time ?? 60,
            theme: settingsData.theme ?? 'system',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          mobile_number: profile.mobile_number,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <CheckCircle2 className="w-3 h-3" />
          {profile.role || 'User'}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-fade-in">
          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Your full name"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={profile.mobile_number || ''}
                    onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Account Type
                  </Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                    <Badge variant="outline">{profile.role || 'User'}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2 gradient-primary text-primary-foreground">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 animate-fade-in">
          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Deadline Reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified before deadlines</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.deadline_reminders}
                    onCheckedChange={(checked) => setSettings({ ...settings, deadline_reminders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-medium">Meeting Reminders</p>
                      <p className="text-sm text-muted-foreground">Automatic meeting alerts</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.meeting_reminders}
                    onCheckedChange={(checked) => setSettings({ ...settings, meeting_reminders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">File Change Alerts</p>
                      <p className="text-sm text-muted-foreground">When shared files are modified</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.file_change_alerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, file_change_alerts: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Default Reminder Time
                </Label>
                <Select
                  value={settings.reminder_time.toString()}
                  onValueChange={(value) => setSettings({ ...settings, reminder_time: parseInt(value) })}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2 gradient-primary text-primary-foreground">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 animate-fade-in">
          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how SychDesk looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSettings({ ...settings, theme: option.value })}
                        className={cn(
                          'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:scale-105',
                          settings.theme === option.value
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                          settings.theme === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2 gradient-primary text-primary-foreground">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-fade-in">
          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Account Security Status</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your account is secured with email and password authentication.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Email Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Account Actions</h4>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start gap-2">
                    <Shield className="w-4 h-4" />
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
