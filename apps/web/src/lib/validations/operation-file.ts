/**
 * Operation File Validation Schemas
 * Operations Redesign feature
 */

import { z } from 'zod'

export const fileTypeEnum = z.enum(['pdf', 'zip', 'figma', 'image', 'generic'])
export type FileType = z.infer<typeof fileTypeEnum>

export const createOperationFileSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters')
    .trim(),
  fileType: fileTypeEnum,
  fileSize: z.number().int().positive('File size must be positive'),
  storagePath: z.string().min(1, 'Storage path is required'),
  mimeType: z.string().max(100).optional().nullable(),
})

export type CreateOperationFileInput = z.infer<typeof createOperationFileSchema>

export const operationFileQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  fileType: fileTypeEnum.optional(),
})

export type OperationFileQueryParams = z.infer<typeof operationFileQuerySchema>
