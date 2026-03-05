import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardData, Agent } from './types';
import { useState, useEffect } from 'react';
import { Check, X, Loader2, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function Step6DiscoverAgents({
  data,
  cohortId,
  onNext,
}: {
  data: WizardData;
  cohortId: string;
  onNext: () => void;
}) {
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'main', name: 'Main', workspace: '~/.openclaw/workspace', status: 'online' },
    {
      id: 'researcher',
      name: 'Researcher',
      workspace: '~/.openclaw/workspace-researcher',
      status: 'online',
    },
  ]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['main', 'researcher']);
  const [importing, setImporting] = useState(false);

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate import
    await new Promise((r) => setTimeout(r, 1500));
    setImporting(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We found the following agents on your gateway. Select which ones to import into Cohortix.
        </p>

        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={agent.id}
                checked={selectedAgents.includes(agent.id)}
                onCheckedChange={() => toggleAgent(agent.id)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={agent.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {agent.name}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({agent.id})
                  </span>
                </Label>
                <p className="text-xs text-muted-foreground">Workspace: {agent.workspace}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleImport} disabled={selectedAgents.length === 0 || importing}>
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            `Import ${selectedAgents.length} Agents`
          )}
        </Button>
      </div>
    </div>
  );
}
