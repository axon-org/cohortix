'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCreateOperation, useUpdateOperation } from '@/hooks/use-operations';
import { useMissions } from '@/hooks/use-missions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OperationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation?: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    startDate?: string | null;
    targetDate?: string | null;
    missionId?: string | null;
  };
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function OperationModal({ open, onOpenChange, operation }: OperationModalProps) {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params?.orgSlug ?? '';
  const isEditing = !!operation;
  const createMutation = useCreateOperation();
  const updateMutation = useUpdateOperation();
  const { data: missionsData } = useMissions({ limit: 100 });

  const [formData, setFormData] = useState({
    name: operation?.name || '',
    description: operation?.description || '',
    status: operation?.status || 'planning',
    startDate: operation?.startDate || '',
    targetDate: operation?.targetDate || '',
    missionId: operation?.missionId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 10000) {
      newErrors.description = 'Description must be less than 10,000 characters';
    }

    if (formData.startDate && formData.targetDate) {
      const start = new Date(formData.startDate);
      const target = new Date(formData.targetDate);
      if (target < start) {
        newErrors.targetDate = 'Target date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'archived',
        startDate: formData.startDate || undefined,
        targetDate: formData.targetDate || undefined,
        missionId: formData.missionId === 'none' ? undefined : formData.missionId || undefined,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: operation.id, data: payload });
      } else {
        const newOperation = await createMutation.mutateAsync(payload);
        router.push(`/${orgSlug}/operations/${newOperation.id}`);
      }

      onOpenChange(false);
      // Reset form if creating new
      if (!isEditing) {
        setFormData({
          name: '',
          description: '',
          status: 'planning',
          startDate: '',
          targetDate: '',
          missionId: '',
        });
      }
    } catch (error: any) {
      // Handle validation errors from API
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ submit: error.message || 'Failed to save operation' });
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Operation' : 'Create New Operation'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update operation details and settings.'
              : 'Add a bounded initiative that supports your missions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Q1 Marketing Campaign"
              disabled={isPending}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Briefly describe this operation..."
              rows={3}
              disabled={isPending}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Mission (optional relationship) */}
          <div className="space-y-2">
            <Label htmlFor="missionId">Mission (Optional)</Label>
            <Select
              value={formData.missionId}
              onValueChange={(value) => handleChange('missionId', value)}
              disabled={isPending}
            >
              <SelectTrigger id="missionId">
                <SelectValue placeholder="Select a mission..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No mission</SelectItem>
                {missionsData?.data?.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Link this operation to a mission it supports
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
              disabled={isPending}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleChange('targetDate', e.target.value)}
                disabled={isPending}
                className={errors.targetDate ? 'border-destructive' : ''}
              />
              {errors.targetDate && <p className="text-sm text-destructive">{errors.targetDate}</p>}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Operation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
