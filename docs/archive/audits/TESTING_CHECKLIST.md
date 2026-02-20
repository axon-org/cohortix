# 🧪 Cohort Detail Page — Testing Checklist

**Quick Reference for Ahmad's Review**

---

## 🚀 How to Test

### 1. Start the Dev Server

```bash
cd ~/Projects/cohortix
pnpm dev
```

### 2. Navigate to Cohort Detail

```
http://localhost:3000/cohorts/[any-cohort-id]
```

**Example IDs from seeded data:**

- Use any cohort ID from `/cohorts` page
- Or check database for valid IDs

---

## ✅ What to Verify

### Layout Structure:

- [ ] **Header** — Cohort name, status badge, member count, engagement %
- [ ] **Details Card** — Description, start/end dates, created date
- [ ] **Engagement Chart** — Full-width timeline visualization below details
- [ ] **Two-Column Layout:**
  - [ ] Left side (wider): Members table with avatars, roles, status, engagement
        scores
  - [ ] Right side (narrower): Activity log feed

### Responsive Behavior:

- [ ] **Desktop (>1024px):** Two-column layout (2/3 + 1/3)
- [ ] **Mobile (<1024px):** Stacked vertically (members, then activity)

### Data Loading:

- [ ] All components show loading states initially
- [ ] Data populates from APIs:
  - `/api/cohorts/:id/members`
  - `/api/cohorts/:id/timeline`
  - `/api/cohorts/:id/activity`
- [ ] No console errors

### Visual Consistency:

- [ ] **Dark monochrome aesthetic:**
  - Black backgrounds (`#0A0A0B`)
  - White text (`#F2F2F2`, `#FAFAFA`)
  - Subtle borders (`#27282D`)
- [ ] **Linear.app-style:**
  - Consistent spacing (6px gap)
  - Minimal borders
  - Clean card designs

### Interactions:

- [ ] Edit button still works (existing functionality)
- [ ] Delete button still works (existing functionality)
- [ ] Back to Cohorts link works
- [ ] Activity log "View All" button (placeholder)
- [ ] Members "Filter allies..." button (placeholder)
- [ ] Chart period buttons (7D/30D/90D - placeholder)

---

## 🐛 Known Issues (Pre-existing)

These are **NOT** related to this integration:

- TypeScript errors in API routes (type mismatches with `null` vs `undefined`)
- Test errors in other components (vitest matchers)
- Database query type issues in `cohorts.ts`

**My integration has ZERO TypeScript errors.** ✓

---

## 📊 Expected Data

### Members Table Should Show:

- Avatar (or initials if no avatar)
- Agent name + slug
- Role
- Status (Optimal/Idle/Syncing/Offline/Error)
- Engagement score (0-100) with progress bar

### Activity Log Should Show:

- Colored dots indicating action type
- Description text
- Relative time ("2 hours ago", etc.)

### Timeline Chart Should Show:

- Daily interaction counts
- Line graph with white line
- Grid background
- Hover tooltips

---

## 🎯 Success Criteria

✅ **PASS** if:

- All three new components render correctly
- Layout matches Linear.app aesthetic
- Responsive on mobile and desktop
- No TypeScript errors in integrated files
- Data loads from APIs without errors

❌ **FAIL** if:

- Components don't render
- Layout breaks on mobile
- TypeScript errors in new code
- API calls fail (check network tab)

---

**Ready for Ahmad! 🚀**
