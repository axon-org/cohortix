'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Globe, Loader2, Info } from 'lucide-react';
import { useCreateOrganization } from '@/hooks/use-create-organization';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgModal({ open, onOpenChange }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const { mutate: createOrg, isPending } = useCreateOrganization();

  useEffect(() => {
    if (!isCustomSlug && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }, [name, isCustomSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrg(
      { name, slug },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border shadow-2xl">
        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2 ring-1 ring-primary/20">
              <Building2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Create Organization
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium italic">
              Create a new workspace for your team and agents to collaborate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="org-name"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Organization Name
                </Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Madsgency"
                  className="h-11 bg-muted/20 border-muted focus:bg-background transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="org-slug"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Workspace URL
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono h-4 border-dashed bg-muted/10 opacity-60"
                  >
                    clerk.org_id sync
                  </Badge>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium tracking-tight">
                    <Globe className="h-3 w-3" />
                    <span>cohortix.ai/</span>
                  </div>
                  <Input
                    id="org-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setIsCustomSlug(true);
                    }}
                    className="pl-[95px] h-11 bg-muted/20 border-muted focus:bg-background transition-all font-mono text-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 italic font-medium px-1">
                  <Info className="h-3 w-3 text-primary/60" /> Your team members will join using
                  this unique workspace slug.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="font-semibold text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !name || !slug}
                className="min-w-[120px] font-bold text-xs tracking-widest uppercase"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Org'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
