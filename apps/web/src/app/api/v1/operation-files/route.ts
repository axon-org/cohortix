/**
 * Operation Files API Route - GET (list) and POST (upload)
 * Operations Redesign feature. Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateData } from '@/lib/validation'
import {
  createOperationFileSchema,
  operationFileQuerySchema,
  type CreateOperationFileInput,
  type OperationFileQueryParams,
  type FileType,
} from '@/lib/validations/operation-file'

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new UnauthorizedError('Authentication required')

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) throw new ForbiddenError('User is not associated with any organization')

  return { supabase, organizationId: membership.organization_id, userId: user.id }
}

// ============================================================================
// Helper: Determine file type from MIME type
// ============================================================================

function getFileType(mimeType: string): FileType {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return 'zip'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/octet-stream' && mimeType.includes('figma')) return 'figma'
  return 'generic'
}

// ============================================================================
// GET /api/v1/operation-files?projectId=xxx
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(operationFileQuerySchema, searchParams) as OperationFileQueryParams

  const { supabase, organizationId } = await getAuthContext()

  logger.info('Fetching operation files', { correlationId, organizationId, projectId: query.projectId })

  let queryBuilder = supabase
    .from('operation_files')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', query.projectId)
    .order('created_at', { ascending: false })

  if (query.fileType) queryBuilder = queryBuilder.eq('file_type', query.fileType)

  const { data: files, error } = await queryBuilder

  if (error) {
    logger.error('Failed to fetch operation files', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  return NextResponse.json({ data: files || [] })
})

// ============================================================================
// POST /api/v1/operation-files (upload)
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const { supabase, organizationId, userId } = await getAuthContext()

  // Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file) throw new ValidationError('File is required')
  if (!projectId) throw new ValidationError('Project ID is required')

  const fileType = getFileType(file.type)
  const fileName = file.name
  const fileSize = file.size
  const timestamp = Date.now()
  const storagePath = `${organizationId}/${projectId}/${timestamp}-${fileName}`

  logger.info('Uploading operation file', { 
    correlationId, 
    userId, 
    organizationId, 
    projectId, 
    fileName,
    fileSize,
    fileType 
  })

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('operation-files')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    logger.error('Failed to upload file to storage', { 
      correlationId, 
      error: { message: uploadError.message } 
    })
    throw uploadError
  }

  // Create database record
  const fileData: CreateOperationFileInput = {
    projectId,
    name: fileName,
    fileType,
    fileSize,
    storagePath,
    mimeType: file.type,
  }

  const validated = validateData(createOperationFileSchema, fileData)

  const { data: fileRecord, error: dbError } = await supabase
    .from('operation_files')
    .insert({
      organization_id: organizationId,
      project_id: validated.projectId,
      name: validated.name,
      file_type: validated.fileType,
      file_size: validated.fileSize,
      storage_path: validated.storagePath,
      mime_type: validated.mimeType || null,
      uploaded_by_type: 'user',
      uploaded_by_id: userId,
    })
    .select()
    .single()

  if (dbError) {
    // Rollback: delete uploaded file
    await supabase.storage.from('operation-files').remove([storagePath])
    logger.error('Failed to create file record', { correlationId, error: { message: dbError.message, code: dbError.code } })
    throw dbError
  }

  logger.info('Operation file uploaded', { correlationId, fileId: fileRecord.id })
  return NextResponse.json({ data: fileRecord }, { status: 201 })
})
