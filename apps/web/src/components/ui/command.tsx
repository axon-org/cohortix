'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

type CommandGroupProps = DivProps & {
  heading?: string;
};

const Command = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
));
Command.displayName = 'Command';

const CommandList = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col', className)} {...props} />
));
CommandList.displayName = 'CommandList';

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {heading ? (
        <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </div>
      ) : null}
      <div className="flex flex-col">{children}</div>
    </div>
  )
);
CommandGroup.displayName = 'CommandGroup';

const CommandItem = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-2 py-1.5 text-sm', className)} {...props} />
));
CommandItem.displayName = 'CommandItem';

export { Command, CommandList, CommandGroup, CommandItem };
