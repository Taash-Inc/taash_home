import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Secret to validate webhook requests from Sanity
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook secret
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!SANITY_WEBHOOK_SECRET || token !== SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Parse the webhook payload
    const body = await request.json();
    const { _type, slug } = body;

    // Only revalidate for post changes
    if (_type === 'post') {
      // Revalidate the blog listing page
      revalidatePath('/blogs');

      // Revalidate the home page (Resources section)
      revalidatePath('/');

      // Revalidate the specific post page if slug exists
      if (slug?.current) {
        revalidatePath(`/blogs/${slug.current}`);
      }

      return NextResponse.json({
        revalidated: true,
        message: `Revalidated post: ${slug?.current || 'unknown'}`,
      });
    }

    return NextResponse.json({ revalidated: false, message: 'No revalidation needed' });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
