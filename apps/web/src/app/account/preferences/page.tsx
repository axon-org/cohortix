'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PreferencesPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  useEffect(() => {
    // Load initial state
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }

    const savedNotifs = localStorage.getItem('notification-prefs');
    if (savedNotifs) {
      const parsed = JSON.parse(savedNotifs);
      setEmailNotifs(parsed.email);
      setInAppNotifs(parsed.inApp);
    }
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleNotifChange = (key: 'email' | 'inApp', value: boolean) => {
    if (key === 'email') setEmailNotifs(value);
    if (key === 'inApp') setInAppNotifs(value);

    const newPrefs = {
      email: key === 'email' ? value : emailNotifs,
      inApp: key === 'inApp' ? value : inAppNotifs,
    };
    localStorage.setItem('notification-prefs', JSON.stringify(newPrefs));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize your interface and notification settings.
        </p>
      </div>
      <div className="border-t border-border pt-6 space-y-8">
        <div className="space-y-4">
          <Label className="text-base">Appearance</Label>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of the application. Automatically switch between day and
            night themes.
          </p>
          <div className="grid max-w-md grid-cols-3 gap-4">
            <Button
              variant="outline"
              className={cn(
                'h-24 flex-col gap-2',
                theme === 'light' && 'border-primary ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="h-6 w-6" />
              <span className="text-xs font-medium">Light</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                'h-24 flex-col gap-2',
                theme === 'dark' && 'border-primary ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="h-6 w-6" />
              <span className="text-xs font-medium">Dark</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                'h-24 flex-col gap-2',
                theme === 'system' && 'border-primary ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => handleThemeChange('system')}
            >
              <Laptop className="h-6 w-6" />
              <span className="text-xs font-medium">System</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Choose what notifications you want to receive.
          </p>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive daily digests and important updates via email.
                </span>
              </Label>
              <Checkbox
                id="email-notifs"
                checked={emailNotifs}
                onCheckedChange={(checked) => handleNotifChange('email', checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="in-app-notifs" className="flex flex-col space-y-1">
                <span>In-app Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive notifications within the dashboard about activity.
                </span>
              </Label>
              <Checkbox
                id="in-app-notifs"
                checked={inAppNotifs}
                onCheckedChange={(checked) => handleNotifChange('inApp', checked as boolean)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
