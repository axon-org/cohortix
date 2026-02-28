'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PlaceholderButtonProps {
  label: string;
}

export function PlaceholderButton({ label }: PlaceholderButtonProps) {
  return (
    <Button variant="primary" onClick={() => alert(`${label} creation coming soon!`)}>
      <Plus className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
