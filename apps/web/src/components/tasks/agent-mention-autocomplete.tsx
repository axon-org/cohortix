'use client';

import { useState, useEffect, useRef } from 'react';
import { useAgents } from '@/hooks/use-agents';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentMentionAutocompleteProps {
  onSelect: (agent: any) => void;
  triggerRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
}

export function AgentMentionAutocomplete({
  onSelect,
  open,
  onOpenChange,
  search,
}: AgentMentionAutocompleteProps) {
  const { data: agentsData, isLoading } = useAgents();
  const agents = agentsData?.data || [];
  
  const filteredAgents = agents.filter((agent: any) => 
    agent.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 w-64 mb-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
      <Command className="bg-transparent">
        <CommandList>
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">
              No agents found
            </div>
          ) : (
            <CommandGroup heading="Mention Agent">
              {filteredAgents.map((agent: any) => (
                <CommandItem
                  key={agent.id}
                  onSelect={() => onSelect(agent)}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-secondary transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <span className="text-[10px] text-muted-foreground">{agent.role}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
