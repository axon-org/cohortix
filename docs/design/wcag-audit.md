# WCAG 2.1 AA Contrast Audit — Brand-Light Theme

<!-- Purpose: WCAG accessibility audit results for brand-light theme -->
<!-- Owner: Alim (CEO) -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: docs/specs/visual-identity-redesign.md -->

- **Date:** 2026-03-20
- **Status:** Pass (after fixes)
- **Tool:** axe-core 4.9.1 (injected via browser)
- **Page tested:** /login (brand-light theme, default)

## Results

### Color Contrast

**Initial scan:** 2 violations (serious)

| Element | Foreground | Background | Ratio | Required | Status |
|---------|-----------|------------|-------|----------|--------|
| `text-muted-foreground` ("Sign in to continue") | `#7e7e8b` | `#faf8f5` | 3.77:1 | 4.5:1 | ❌ FAIL |
| `text-muted-foreground` ("OpenClaw Agent Orchestration") | `#7e7e8b` | `#faf8f5` | 3.77:1 | 4.5:1 | ❌ FAIL |

**Fix applied:** Darkened `--text-muted` from `240 5% 52%` to `240 5% 44%` in both `tokens.css` and `globals.css` brand-light override.

**Post-fix scan:** 0 color contrast violations ✅

### Other Violations (not related to visual identity)

| Issue | Impact | Notes |
|-------|--------|-------|
| `landmark-one-main` | moderate | Login page missing `<main>` element — structural, not visual |
| `region` | moderate | Content not in landmarks — structural, not visual |

### Meta Viewport

**Initial:** `maximumScale: 1` blocked user zoom — critical WCAG violation.
**Fix applied:** Removed `maximumScale: 1` from `layout.tsx` viewport config.

### Additional Visual Checks

- ✅ Warm paper background renders correctly
- ✅ Indigo "Sign in" button has sufficient contrast
- ✅ Error state uses soft red background (semantic token)
- ✅ Input fields have visible borders
- ✅ Focus rings visible on tab navigation
- ✅ Text labels ("Username", "Password") readable

### Remaining Copy Fix

- Changed "OpenClaw Agent Orchestration" → "Project Management for Everyone" across all i18n message files

## Conclusion

Brand-light theme passes WCAG 2.1 AA for color contrast after the `--text-muted` fix. No further color-related accessibility issues found on the login page.

**Note:** Full dashboard audit requires valid login credentials. Login page covers the key token combinations (primary text, muted text, primary button, error state, input fields).
