# Cohortix Mockup Generation Steps

## Current Status

- Google Stitch is open at: https://stitch.withgoogle.com/
- Browser automation is experiencing timeouts
- Screenshot functionality works

## Manual Steps to Generate Mockups

### Mockup 1: Mission Control Dashboard

1. **Navigate to Google Stitch** (already open)
2. **Click on the "Describe your design" textarea**
3. **Paste this prompt:**
   ```
   Create a premium desktop web dashboard (1440x900) for Cohortix Mission Control. MONOCHROME dark theme exactly like Linear.app — pure black background (#0A0A0B), white text (#F2F2F2), dark gray surface cards (#1A1A1E). NO colored accent — black and white with subtle grays only. White glow effects. Left sidebar with white icons. 4 KPI cards, health trend chart with white/gray line, activity feed, alerts panel. Only color for status indicators (green=active, amber=paused, red=at-risk). Clean minimal high-contrast SaaS dashboard.
   ```
4. **Click "Generate" or press Enter**
5. **Wait for generation** (typically 30-60 seconds)
6. **Download/export the generated image**
7. **Save as:** `01-mission-control-monochrome.png`

### Mockup 2: Cohort Grid View

1. **Start a new design in Stitch**
2. **Paste this prompt:**
   ```
   Create a premium desktop data table (1440x900) for Cohortix Cohorts. MONOCHROME dark theme like Linear.app — pure black background, white text, dark gray rows. NO colored accent. Search bar, filters, data table with columns (Name, Status, Members, Engagement, Start Date). Status chips only color: green Active, amber Paused, red At-Risk. Monochrome aesthetic. High contrast. Production SaaS.
   ```
3. **Click "Generate"**
4. **Wait for generation**
5. **Download/export the generated image**
6. **Save as:** `02-cohort-grid-monochrome.png`

## Technical Issues Encountered

- Browser `snapshot` action: timeout after 20s
- Browser `console` action: timeout after 20s
- Only `screenshot` action working reliably
- Skyvern API: authentication/credentials issue

## Alternative Approach: Direct Generation

Since automation is blocked, I'll create design specifications manually and
provide high-fidelity descriptions for manual implementation.
