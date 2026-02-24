## [ERR-20260224-001] rg (ripgrep) missing

**Logged**: 2026-02-24T09:33:01Z **Priority**: low **Status**: pending **Area**:
infra

### Summary

Attempted to use rg for repository search; command not found on this host.

### Error

```
zsh:1: command not found: rg
```

### Context

- Command:
  `rg -n "ignored-build|ignoreBuild|deploymentEnabled|rootDirectory" /Users/alimai/Projects/cohortix -g"*.json" -g"*.js" -g"*.ts" -g"*.yml"`
- Environment: macOS host (zsh)

### Suggested Fix

- Use `grep -R` as fallback, or install ripgrep (`brew install ripgrep`).

### Metadata

- Reproducible: yes
- Related Files: N/A
- See Also: N/A

---
