'use client';

import { useEffect, useState, useRef } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Trash } from 'lucide-react';

export default function GeneralSettingsPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && organization) {
      setName(organization.name);
      setSlug(organization.slug || '');
    }
  }, [isLoaded, organization]);

  if (!isLoaded || !organization) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAdmin = membership?.role === 'org:admin';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      await organization.update({ name });
      setSuccess('Organization settings updated successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update organization.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setError(null);
    setSuccess(null);

    try {
      await organization.setLogo({ file });
      setSuccess('Logo updated successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update logo.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">General Information</h2>

        {/* Messages */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded-md border border-green-500/20">
            {success}
          </div>
        )}

        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border border-border">
            <AvatarImage src={organization.imageUrl} />
            <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
          </Avatar>

          {isAdmin && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended size: 256x256px. Max 10MB.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin || isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Workspace Slug</Label>
            <Input
              id="slug"
              value={slug}
              disabled={true} // Slug is usually immutable or requires special flow
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              The URL slug for your workspace. Cannot be changed.
            </p>
          </div>

          {/* Optional Description - using metadata */}
          {/* <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="What does this organization do?"
              disabled={!isAdmin || isSaving}
            />
          </div> */}

          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
