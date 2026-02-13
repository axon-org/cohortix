/**
 * LEGACY: Mission Status Chip
 * 
 * ⚠️ TERMINOLOGY UPDATE (2026-02-12):
 * Old "Mission" → Now "Operation" (bounded initiative)
 * This file re-exports from operation-status-chip.tsx for backwards compatibility.
 * 
 * For new code, import from './operation-status-chip' instead.
 */

export { 
  OperationStatusChip as MissionStatusChip,
  type OperationStatus as MissionStatus
} from './operation-status-chip'
