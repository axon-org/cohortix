'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Shield, Key, Lock, Smartphone } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function SecurityPage() {
  const { openUserProfile } = useClerk();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security settings and authentication methods.
        </p>
      </div>
      <div className="border-t border-border pt-6 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border border-border flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold">Password</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Secure your account with a strong password.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => openUserProfile()}>
              Change Password
            </Button>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold">Two-Factor Auth</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => openUserProfile()}>
              Manage 2FA
            </Button>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold">Active Sessions</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your active sessions on other devices.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => openUserProfile()}>
              View Sessions
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">Advanced Security</h3>
            <p className="text-sm text-muted-foreground">
              Manage advanced security settings provided by our authentication partner.
            </p>
          </div>
          <div className="p-6 pt-4 px-0">
            <Button onClick={() => openUserProfile()}>Open Advanced Security Settings</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
