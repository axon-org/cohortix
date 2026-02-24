'use client';

import * as React from 'react';
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown, PlusCircle, Settings } from 'lucide-react';

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const router = useRouter();
  const { organization: currentOrg, isLoaded: orgLoaded } = useOrganization();
  const {
    userMemberships,
    setActive,
    isLoaded: listLoaded,
  } = useOrganizationList({
    userMemberships: true,
  });

  if (!orgLoaded || !listLoaded) {
    return (
      <div
        className={cn(
          'animate-pulse bg-secondary rounded-md',
          collapsed ? 'w-8 h-8 mx-auto' : 'w-full h-9'
        )}
      />
    );
  }

  const handleOrgSwitch = async (orgId: string, slug: string) => {
    if (setActive) {
      await setActive({ organization: orgId });
      router.push(`/${slug}`);
    }
  };

  const trigger = (
    <button
      className={cn(
        'flex items-center gap-2 rounded-md transition-all outline-none',
        collapsed
          ? 'w-8 h-8 justify-center hover:bg-secondary/50'
          : 'w-full px-2 py-1.5 hover:bg-secondary/50 text-foreground'
      )}
    >
      <Avatar className="w-6 h-6 rounded-sm">
        <AvatarImage src={currentOrg?.imageUrl} alt={currentOrg?.name} />
        <AvatarFallback className="rounded-sm text-[10px] bg-secondary">
          {currentOrg?.name?.charAt(0) || 'O'}
        </AvatarFallback>
      </Avatar>

      {!collapsed && (
        <>
          <span className="flex-1 text-[13px] font-medium truncate text-left">
            {currentOrg?.name}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 bg-[#111113] border-[#27282D] p-1 shadow-xl"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground px-2 py-1.5">
          Workspaces
        </DropdownMenuLabel>

        <div className="space-y-0.5">
          {userMemberships.data?.map((membership) => {
            const org = membership.organization;
            const isActive = currentOrg?.id === org.id;

            return (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSwitch(org.id, org.slug!)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] cursor-pointer transition-colors',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Avatar className="w-5 h-5 rounded-sm flex-shrink-0">
                  <AvatarImage src={org.imageUrl} alt={org.name} />
                  <AvatarFallback className="rounded-sm text-[9px] bg-secondary">
                    {org.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{org.name}</span>
                {membership.role && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 rounded-full bg-[#1A1B1E] text-muted-foreground border-none font-normal lowercase"
                  >
                    {membership.role.replace('org:', '')}
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="bg-[#27282D] my-1" />

        <DropdownMenuItem
          onClick={() => router.push('/create-organization')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create organization</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push(`/${currentOrg?.slug}/settings`)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Manage organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
