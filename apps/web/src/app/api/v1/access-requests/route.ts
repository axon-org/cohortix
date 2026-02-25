import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/v1/access-requests
 *
 * Request access to an organization.
 *
 * Body: { orgSlug: string }
 *
 * TODO (Branch 6 - Settings/Members):
 * - Store request in `access_requests` table:
 *   - id (uuid)
 *   - organization_id (references organizations)
 *   - requester_user_id (uuid)
 *   - status ('pending' | 'approved' | 'rejected')
 *   - created_at, updated_at
 * - Notify org admins via email/in-app notification
 * - Create admin UI in /[orgSlug]/settings/members to review requests
 *
 * For MVP (Branch 4): Just return success to show UI state.
 * No actual persistence or notification system yet.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = (await request.json()) as { orgSlug?: string };
    const { orgSlug } = body;

    if (!orgSlug || typeof orgSlug !== 'string') {
      return NextResponse.json({ error: 'Organization slug is required' }, { status: 400 });
    }

    // 3. Validate org slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(orgSlug) || orgSlug.length < 3 || orgSlug.length > 50) {
      return NextResponse.json({ error: 'Invalid organization slug format' }, { status: 400 });
    }

    // TODO: Look up org by slug and verify it exists
    // TODO: Check user is NOT already a member (if already member, return error)
    // TODO: Store request in database
    // TODO: Send notification to org admins

    // MVP: Just return success
    return NextResponse.json(
      {
        success: true,
        message: 'Access request submitted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
