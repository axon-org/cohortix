# Avatar Design System — Human vs AI Differentiation

**Version:** 1.0  
**Date:** 2026-02-14  
**Status:** ✅ Approved for Implementation

---

## Overview

Cohortix features both **human users** and **AI agents** as team members. This system provides a clear, accessible visual distinction between the two through avatar styling while maintaining design consistency.

### Design Philosophy

1. **Clarity First** — Users should instantly recognize human vs AI agents
2. **Non-Intrusive** — Distinction should enhance, not overwhelm the UI
3. **Accessible** — Works for colorblind users and meets WCAG 2.1 AA standards
4. **Scalable** — Consistent appearance from 24px to 96px avatar sizes
5. **Brand-Aligned** — Matches shadcn/ui minimal aesthetic

---

## Chosen System: Icon Overlay

After evaluating three approaches (icon overlay, border style, background glow), **Option A: Icon Overlay** was selected for the following reasons:

| Criteria | Icon Overlay | Border Style | Background Glow |
|----------|--------------|--------------|-----------------|
| **Clarity** | ✅ Immediately recognizable | ⚠️ Can be subtle at small sizes | ❌ Ambiguous meaning |
| **Accessibility** | ✅ Works without color | ❌ Relies on color/shape | ❌ Relies on color |
| **Performance** | ✅ Static SVG | ✅ CSS only | ⚠️ Animated (can be distracting) |
| **Scalability** | ✅ Works at all sizes | ⚠️ Border can be too thin | ❌ Glow bleeds at small sizes |
| **Brand Fit** | ✅ Matches minimal style | ✅ Clean | ⚠️ Too decorative |

**Winner:** Icon Overlay provides the clearest, most accessible differentiation.

---

## Visual Specification

### Human Avatar

```
┌─────────┐
│         │  Standard circular avatar
│  Photo  │  No additional indicators
│         │
└─────────┘
```

- **Shape:** Circular
- **Border:** 1px solid `border` (hsl(var(--border)))
- **Background:** User photo or initials fallback
- **No overlay**

### AI Agent Avatar

```
┌─────────┐
│         │  Standard circular avatar
│  Photo  │  + Robot icon overlay (bottom-right)
│      🤖 │
└─────────┘
```

- **Shape:** Circular
- **Border:** 1px solid `border` (same as human)
- **Background:** Agent avatar image or generated gradient
- **Overlay:** Robot icon at bottom-right corner (see specs below)

---

## Robot Icon Overlay Specification

### Asset Details

- **File:** `apps/web/public/icons/robot.svg`
- **Dimensions:** 12×12px viewBox
- **Style:** Minimal line art, 1.5px stroke
- **Color:** `currentColor` (inherits from parent)

### SVG Structure

```svg
<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
  <!-- Robot head/body -->
  <rect x="2" y="3.5" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
  <!-- Eyes -->
  <circle cx="4.5" cy="6" r="0.75" fill="currentColor"/>
  <circle cx="7.5" cy="6" r="0.75" fill="currentColor"/>
  <!-- Antenna -->
  <line x1="6" y1="1.5" x2="6" y2="3.5" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="6" cy="1" r="0.75" fill="currentColor"/>
  <!-- Legs -->
  <line x1="3" y1="8" x2="5" y2="8" stroke="currentColor" stroke-width="1.5"/>
  <line x1="7" y1="8" x2="9" y2="8" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

### Overlay Positioning

| Avatar Size | Overlay Size | Position (bottom-right) | Background Circle |
|-------------|--------------|-------------------------|-------------------|
| 24px        | 10px         | (14px, 14px)            | 12px circle       |
| 32px        | 12px         | (20px, 20px)            | 14px circle       |
| 48px        | 16px         | (32px, 32px)            | 18px circle       |
| 64px        | 20px         | (44px, 44px)            | 22px circle       |
| 96px        | 28px         | (68px, 68px)            | 30px circle       |

**Formula:**
- Overlay size = `avatarSize × 0.375` (rounded)
- Position X/Y = `avatarSize - (overlaySize / 2) - 2px`
- Background circle = `overlaySize + 2px`

---

## Implementation Guide

### React Component (TypeScript)

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SmartAvatarProps {
  type: "human" | "ai"
  src?: string
  alt: string
  fallback: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "h-6 w-6",    // 24px
  md: "h-8 w-8",    // 32px (default)
  lg: "h-12 w-12",  // 48px
  xl: "h-16 w-16",  // 64px
}

const overlayMap = {
  sm: "h-2.5 w-2.5",  // 10px
  md: "h-3 w-3",      // 12px
  lg: "h-4 w-4",      // 16px
  xl: "h-5 w-5",      // 20px
}

export function SmartAvatar({
  type,
  src,
  alt,
  fallback,
  size = "md",
  className,
}: SmartAvatarProps) {
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeMap[size], className)}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      
      {type === "ai" && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full bg-background border border-border flex items-center justify-center",
          overlayMap[size]
        )}>
          <img
            src="/icons/robot.svg"
            alt="AI Agent"
            className="w-full h-full p-0.5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
```

### Usage Examples

```tsx
// Human user
<SmartAvatar
  type="human"
  src="/avatars/john-doe.jpg"
  alt="John Doe"
  fallback="JD"
  size="md"
/>

// AI agent
<SmartAvatar
  type="ai"
  src="/avatars/agent-triage.png"
  alt="Smart Triage Agent"
  fallback="ST"
  size="md"
/>

// Avatar group (mixed human + AI)
<div className="flex -space-x-2">
  <SmartAvatar type="human" src="..." alt="Alice" fallback="A" size="sm" />
  <SmartAvatar type="ai" src="..." alt="Agent" fallback="AI" size="sm" />
  <SmartAvatar type="human" src="..." alt="Bob" fallback="B" size="sm" />
</div>
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

1. **Color Independence**
   - Icon overlay is **not** color-dependent
   - Robot icon is recognizable in grayscale
   - Works for colorblind users (Deuteranopia, Protanopia, Tritanopia)

2. **Contrast Requirements**
   - Robot icon uses `currentColor` (inherits from `muted-foreground`)
   - Default: `hsl(215.4 16.3% 46.9%)` provides 4.5:1 contrast on white background
   - Background circle: `bg-background` with `border-border` ensures clear separation

3. **Screen Reader Support**
   - Robot icon has `aria-hidden="true"` (decorative, not semantic)
   - Avatar `alt` text includes agent type: "Smart Triage Agent" (not "AI Robot Avatar")
   - Use semantic HTML for avatar groups: `<ul>` with `role="list"`

4. **Keyboard Navigation**
   - Interactive avatars must have `tabindex="0"` and clear focus ring
   - Non-interactive avatars: `aria-hidden="true"` or descriptive `alt` only

### Testing Checklist

- [ ] Test with browser zoom at 200% (avatar remains clear)
- [ ] Test in high contrast mode (Windows/macOS)
- [ ] Test with colorblind simulators (Chrome DevTools)
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Validate color contrast with WebAIM Contrast Checker

---

## Design Token Reference

```css
/* Avatar Design Tokens */
--avatar-border: hsl(var(--border));           /* #E5E7EB */
--avatar-bg: hsl(var(--background));           /* #FFFFFF */
--avatar-text: hsl(var(--muted-foreground));   /* #6B7280 */

/* Overlay Tokens */
--overlay-bg: hsl(var(--background));          /* #FFFFFF */
--overlay-border: hsl(var(--border));          /* #E5E7EB */
--overlay-icon: hsl(var(--muted-foreground));  /* #6B7280 */
```

---

## Avatar Fallback Patterns

When avatar images fail to load or user has no photo:

### Human Fallback: Initials

```tsx
<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
  {initials}
</AvatarFallback>
```

**Gradient options (randomly assigned):**
- Blue to Purple: `from-blue-500 to-purple-600`
- Green to Teal: `from-green-500 to-teal-600`
- Orange to Red: `from-orange-500 to-red-600`
- Pink to Rose: `from-pink-500 to-rose-600`

### AI Agent Fallback: Generated Pattern

```tsx
<AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600">
  <svg viewBox="0 0 32 32" className="w-4 h-4 text-white">
    {/* Simplified robot icon */}
  </svg>
</AvatarFallback>
```

**AI-specific gradient:**
- Cyan to Blue: `from-cyan-500 to-blue-600` (tech/AI brand color)

---

## Common Use Cases

### 1. Operations Card Assignee

```tsx
<div className="flex items-center gap-2">
  <SmartAvatar
    type={assignee.type}
    src={assignee.avatar}
    alt={assignee.name}
    fallback={assignee.initials}
    size="sm"
  />
  <span className="text-sm font-medium">{assignee.name}</span>
</div>
```

### 2. Task List Row

```tsx
<td className="px-4 py-2">
  <SmartAvatar
    type={task.assignee.type}
    src={task.assignee.avatar}
    alt={task.assignee.name}
    fallback={task.assignee.initials}
    size="sm"
  />
</td>
```

### 3. Avatar Stack (Multiple Assignees)

```tsx
<div className="flex -space-x-2">
  {assignees.slice(0, 3).map((assignee) => (
    <SmartAvatar
      key={assignee.id}
      type={assignee.type}
      src={assignee.avatar}
      alt={assignee.name}
      fallback={assignee.initials}
      size="sm"
      className="ring-2 ring-background"
    />
  ))}
  {assignees.length > 3 && (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
      +{assignees.length - 3}
    </div>
  )}
</div>
```

### 4. Detail Page Header (Large Avatar)

```tsx
<SmartAvatar
  type={operation.lead.type}
  src={operation.lead.avatar}
  alt={operation.lead.name}
  fallback={operation.lead.initials}
  size="xl"
/>
```

---

## Animation Guidelines

### Hover States (Interactive Avatars)

```css
.avatar-interactive {
  transition: transform 150ms ease-out;
}

.avatar-interactive:hover {
  transform: scale(1.05);
}

.avatar-interactive:active {
  transform: scale(0.98);
}
```

### Loading State

```tsx
<div className="relative">
  <Skeleton className="h-8 w-8 rounded-full" />
  {type === "ai" && (
    <Skeleton className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full" />
  )}
</div>
```

### Tooltip on Hover

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <SmartAvatar {...props} />
    </TooltipTrigger>
    <TooltipContent side="top">
      <p className="font-medium">{assignee.name}</p>
      <p className="text-xs text-muted-foreground">
        {assignee.type === "ai" ? "AI Agent" : "Team Member"}
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Migration Path (Existing Avatars)

### Step 1: Update Avatar Component

Add `type` prop to existing `<Avatar>` components:

```tsx
// Before
<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>

// After
<SmartAvatar
  type={user.type} // "human" | "ai"
  src={user.avatar}
  alt={user.name}
  fallback={user.initials}
/>
```

### Step 2: Update Data Models

Add `type` field to user/assignee objects:

```typescript
// Before
interface User {
  id: string
  name: string
  avatar?: string
}

// After
interface User {
  id: string
  name: string
  avatar?: string
  type: "human" | "ai" // New field
}
```

### Step 3: Database Migration

```sql
ALTER TABLE users ADD COLUMN type VARCHAR(10) DEFAULT 'human';
UPDATE users SET type = 'ai' WHERE email LIKE '%@agent.cohortix.app';
```

---

## Testing & Quality Assurance

### Visual Regression Tests

```typescript
describe("SmartAvatar", () => {
  it("renders human avatar without overlay", () => {
    render(<SmartAvatar type="human" alt="User" fallback="U" />)
    expect(screen.queryByAltText("AI Agent")).not.toBeInTheDocument()
  })

  it("renders AI avatar with robot overlay", () => {
    render(<SmartAvatar type="ai" alt="Agent" fallback="AI" />)
    expect(screen.getByAltText("AI Agent")).toBeInTheDocument()
  })

  it("maintains correct proportions at all sizes", () => {
    const sizes = ["sm", "md", "lg", "xl"]
    sizes.forEach(size => {
      const { container } = render(
        <SmartAvatar type="ai" alt="Agent" fallback="AI" size={size} />
      )
      // Assert overlay size relative to avatar
    })
  })
})
```

### Accessibility Audit

```bash
# Run axe-core accessibility tests
npm run test:a11y

# Manual checklist
- [ ] Keyboard navigation works
- [ ] Screen reader announces avatar correctly
- [ ] High contrast mode displays clearly
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
```

---

## Future Enhancements (Not in v1)

1. **Agent Status Indicators**
   - Online/Offline dot on AI avatars
   - "Processing" animation for active agents

2. **Agent Type Badges**
   - Different icons for different agent types (Triage, Research, etc.)
   - Tooltip shows agent specialty

3. **Animated Transitions**
   - Subtle glow when agent completes a task
   - Pulse effect for active agents

4. **Custom Robot Icons**
   - Allow custom robot designs per agent type
   - Personality-based variations

---

## References

- **Design Tokens:** `/docs/design/DESIGN_SYSTEM.md`
- **shadcn/ui Avatar:** https://ui.shadcn.com/docs/components/avatar
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-14 | Initial design system documentation |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Lubna to implement `SmartAvatar` component in Week 1 sprint
