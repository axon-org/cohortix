'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, X, Search, Zap, Code, Globe, MessageSquare, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Skill {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    category: 'General',
    icon: <Globe className="h-3 w-3" />,
  },
  {
    id: 'coding-agent',
    name: 'Coding Agent',
    category: 'Development',
    icon: <Code className="h-3 w-3" />,
  },
  {
    id: 'database-query',
    name: 'Database Query',
    category: 'Backend',
    icon: <Database className="h-3 w-3" />,
  },
  {
    id: 'slack-post',
    name: 'Slack Post',
    category: 'Social',
    icon: <MessageSquare className="h-3 w-3" />,
  },
  { id: 'mem0', name: 'Mem0 Memory', category: 'Memory', icon: <Zap className="h-3 w-3" /> },
];

interface SkillsManagerProps {
  initialSkills?: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsManager({ initialSkills = ['web-search'], onChange }: SkillsManagerProps) {
  const [enabledSkills, setEnabledSkills] = useState<string[]>(initialSkills);
  const [search, setSearch] = useState('');

  const toggleSkill = (id: string) => {
    const next = enabledSkills.includes(id)
      ? enabledSkills.filter((s) => s !== id)
      : [...enabledSkills, id];
    setEnabledSkills(next);
    onChange(next);
  };

  const filteredSkills = AVAILABLE_SKILLS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-bold tracking-tight uppercase">
              Agent Capabilities
            </CardTitle>
            <CardDescription className="text-[11px] font-medium text-muted-foreground">
              Manage which skills are available to this agent.
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5"
          >
            {enabledSkills.length} Enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for skills..."
            className="pl-8 text-xs h-9 bg-muted/30 border-muted"
          />
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {enabledSkills.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No skills enabled.</span>
          ) : (
            enabledSkills.map((skillId) => {
              const skill = AVAILABLE_SKILLS.find((s) => s.id === skillId);
              return (
                <Badge
                  key={skillId}
                  variant="secondary"
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary flex items-center gap-1.5 px-2 py-1 transition-colors"
                >
                  {skill?.icon}
                  {skill?.name || skillId}
                  <button onClick={() => toggleSkill(skillId)} className="hover:text-foreground">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })
          )}
        </div>

        <div className="pt-2 flex flex-col space-y-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            Available Skills
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSkills
              .filter((s) => !enabledSkills.includes(s.id))
              .map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-background rounded-md border border-border group-hover:border-primary/30 transition-colors">
                      {skill.icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold tracking-tight">{skill.name}</span>
                      <span className="text-[9px] text-muted-foreground">{skill.category}</span>
                    </div>
                  </div>
                  <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
