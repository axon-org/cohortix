/**
 * Individual Operation File API Route - GET (download), DELETE
 * Operations Redesign feature. Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateData } from '@/lib/validation'
import { uuidSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

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
// GET /api/v1/operation-files/:id (download/signed URL)
// ============================================================================

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const fileId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    // Get file metadata
    const { data: file, error } = await supabase
      .from('operation_files')
      .select('*')
      .eq('id', fileId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !file) throw new NotFoundError('Operation file', fileId)

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('operation-files')
      .createSignedUrl(file.storage_path, 3600)

    if (urlError || !signedUrlData) {
      logger.error('Failed to generate signed URL', { 
        correlationId, 
        error: { message: urlError?.message } 
      })
      throw urlError || new Error('Failed to generate download URL')
    }

    return NextResponse.json({ 
      data: {
        ...file,
        downloadUrl: signedUrlData.signedUrl,
      }
    })
  }
)

// ============================================================================
// DELETE /api/v1/operation-files/:id
// ============================================================================

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const fileId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('operation_files')
      .select('id, name, storage_path')
      .eq('id', fileId)
      .eq('organization_id', organizationId)
      .single()
    
    if (fetchError || !file) throw new NotFoundError('Operation file', fileId)

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('operation-files')
      .remove([file.storage_path])

    if (storageError) {
      logger.error('Failed to delete file from storage', { 
        correlationId, 
        error: { message: storageError.message } 
      })
      // Continue anyway to delete DB record
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('operation_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      logger.error('Failed to delete file record', { 
        correlationId, 
        error: { message: dbError.message, code: dbError.code } 
      })
      throw dbError
    }

    logger.info('Operation file deleted', { correlationId, fileId, fileName: file.name })
    return new NextResponse(null, { status: 204 })
  }
)
