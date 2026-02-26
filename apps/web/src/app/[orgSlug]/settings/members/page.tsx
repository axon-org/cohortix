'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Mail } from 'lucide-react';

export default function MembersPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { user } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'org:admin' | 'org:member'>('org:member');
  const [isInviting, setIsInviting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      if (organization) {
        setLoadingMembers(true);
        try {
          // Fetch members (simple pagination for now)
          const response = await organization.getMemberships();
          setMembers(response.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMembers(false);
        }
      }
    }

    if (isLoaded && organization) {
      fetchMembers();
    }
  }, [isLoaded, organization]);

  const isAdmin = membership?.role === 'org:admin';

  const handleInvite = async () => {
    if (!organization || !inviteEmail) return;

    setIsInviting(true);
    setMsg(null);

    try {
      await organization.inviteMember({ emailAddress: inviteEmail, role: inviteRole });
      setMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.errors?.[0]?.message || 'Failed to send invitation' });
    } finally {
      setIsInviting(false);
    }
  };

  if (!isLoaded || !organization) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Members</h2>
          <p className="text-sm text-muted-foreground">Manage who has access to this workspace.</p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to {organization.name}</DialogTitle>
                <DialogDescription>Send an invitation email to add a new member.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org:member">Member</SelectItem>
                      <SelectItem value="org:admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                  {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {msg && (
        <div
          className={`p-3 text-sm rounded-md border ${
            msg.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="rounded-md border border-border">
        {loadingMembers ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((mem) => (
              <div key={mem.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={mem.publicUserData.imageUrl} />
                    <AvatarFallback>
                      {mem.publicUserData.firstName?.charAt(0) ||
                        mem.publicUserData.identifier?.charAt(0) ||
                        '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {mem.publicUserData.firstName} {mem.publicUserData.lastName}
                      {user?.id === mem.publicUserData.userId && (
                        <span className="text-muted-foreground ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{mem.publicUserData.identifier}</p>
                  </div>
                </div>
                <Badge variant={mem.role === 'org:admin' ? 'default' : 'secondary'}>
                  {mem.role === 'org:admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
