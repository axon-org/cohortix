import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'primary'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-foreground text-background hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]':
              variant === 'default',
            'bg-[#5E6AD2] hover:bg-[#5E6AD2]/90 text-white shadow-sm hover:shadow-md':
              variant === 'primary',
            'border border-border bg-transparent hover:bg-secondary':
              variant === 'outline',
            'hover:bg-secondary hover:text-foreground': variant === 'ghost',
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
