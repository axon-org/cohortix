import { NextRequest, NextResponse } from 'next/server';
import { getAuthContextBasic } from '@/lib/auth-helper';
import { isValidSlug as validateSlug } from '@/lib/slug-utils';

const RESERVED_SLUGS = [
  'api',
  'app',
  'admin',
  'account',
  'onboarding',
  'sign-in',
  'sign-up',
  'access-denied',
  'settings',
  'help',
  'docs',
  'blog',
  'pricing',
  'about',
  'status',
  'health',
  'ready',
  'dashboard',
  'inbox',
  'my-tasks',
  'missions',
  'operations',
  'cohorts',
  'agents',
  'tasks',
  'visions',
];

function generateSuggestion(baseSlug: string, attempt: number = 1): string {
  if (attempt === 1) {
    return `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
  }
  return `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthContextBasic();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    // Validate format
    if (!validateSlug(slug).valid) {
      return NextResponse.json({
        available: false,
        suggestion: null,
        reason: 'Invalid format: must be lowercase alphanumeric with hyphens, 3-50 characters',
      });
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
      return NextResponse.json({
        available: false,
        suggestion: generateSuggestion(slug),
        reason: 'This slug is reserved by the system',
      });
    }

    // Check uniqueness
    const { data: existing, error } = await supabase
      .from('organizations')
      .select('id')
      .ilike('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (slug is available)
      console.error('Slug check error:', error);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        available: false,
        suggestion: generateSuggestion(slug),
        reason: 'This slug is already taken',
      });
    }

    return NextResponse.json({
      available: true,
      suggestion: null,
    });
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
