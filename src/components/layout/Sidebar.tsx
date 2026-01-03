import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FolderOpen, 
  FileCheck, 
  Bell, 
  Settings,
  LogOut,
  Layers,
  ChevronLeft,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderOpen, label: 'Meetings', path: '/meetings' },
  { icon: Calendar, label: 'Deadlines', path: '/deadlines' },
  { icon: FileCheck, label: 'Submissions', path: '/submissions' },
  { icon: HardDrive, label: 'Shared Files', path: '/shared-files' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const NavItem = ({ icon: Icon, label, path }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    
    const linkContent = (
      <NavLink
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent group',
          isActive 
            ? 'bg-sidebar-accent text-sidebar-primary' 
            : 'text-sidebar-foreground'
        )}
      >
        <Icon className={cn(
          'w-5 h-5 transition-colors',
          isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-primary'
        )} />
        {!collapsed && (
          <span className={cn(
            'font-medium transition-colors',
            isActive ? 'text-sidebar-primary-foreground' : ''
          )}>
            {label}
          </span>
        )}
        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-sidebar z-50 transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-xl font-bold text-primary-foreground">SychDesk</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/settings"
                  className={cn(
                    'flex items-center justify-center p-2.5 rounded-lg',
                    'hover:bg-sidebar-accent text-sidebar-foreground transition-colors'
                  )}
                >
                  <Settings className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className={cn(
                    'flex items-center justify-center p-2.5 rounded-lg w-full',
                    'hover:bg-destructive/10 text-sidebar-foreground hover:text-destructive transition-colors'
                  )}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <NavLink
              to="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'hover:bg-sidebar-accent text-sidebar-foreground transition-colors'
              )}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </NavLink>
            <button
              onClick={signOut}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
                'hover:bg-destructive/10 text-sidebar-foreground hover:text-destructive transition-colors'
              )}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full',
          'bg-card border border-border shadow-md',
          'hover:bg-secondary text-muted-foreground'
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>
    </aside>
  );
};

export default Sidebar;
