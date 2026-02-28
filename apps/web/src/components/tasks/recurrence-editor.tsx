'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Repeat, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecurrenceEditorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function RecurrenceEditor({ value = 'none', onChange }: RecurrenceEditorProps) {
  const [type, setType] = useState(
    value === 'none' ? 'none' : value.includes('*') ? 'custom' : value
  );
  const [cron, setCron] = useState(value.includes('*') ? value : '0 9 * * *');

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'none') {
      onChange('none');
    } else if (newType === 'daily') {
      onChange('0 9 * * *');
    } else if (newType === 'weekly') {
      onChange('0 9 * * 1');
    } else if (newType === 'monthly') {
      onChange('0 9 1 * *');
    } else if (newType === 'custom') {
      onChange(cron);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 rounded-xl border border-border bg-muted/30">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center gap-2">
          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recurrence
          </Label>
        </div>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom (Cron)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'custom' && (
        <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-muted-foreground">
              Cron Expression
            </Label>
            <Badge variant="outline" className="text-[9px] font-mono py-0 h-4">
              0 9 * * *
            </Badge>
          </div>
          <Input
            value={cron}
            onChange={(e) => {
              setCron(e.target.value);
              onChange(e.target.value);
            }}
            className="font-mono text-xs bg-background"
            placeholder="0 9 * * *"
          />
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
            <Info className="h-3 w-3" /> Standard cron format: minute hour day month day-of-week
          </p>
        </div>
      )}

      {type !== 'none' && (
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            Estimated Next Instance:
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
            <CalendarIcon className="h-3 w-3" />
            <span>Tomorrow at 9:00 AM</span>
          </div>
        </div>
      )}
    </div>
  );
}
