import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function GET() {
  const context = await getAuthenticatedContext();
  if (!context.configured) {
    return Response.json({ configured: false, user: null });
  }
  if (context.error) {
    return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!context.user) return Response.json({ configured: true, user: null });

  let canReviewDoctorApplications = false;
  const { data: reviewerAccess, error: reviewerAccessError } = await context.supabase
    .rpc('can_review_any_doctor_applications');
  if (reviewerAccessError) {
    console.error('Unable to verify doctor application review access:', { code: reviewerAccessError.code || null });
  } else {
    canReviewDoctorApplications = reviewerAccess === true;
  }

  return Response.json({
    configured: true,
    user: {
      id: context.user.id,
      email: context.user.email,
      role: context.role,
      canReviewDoctorApplications,
    },
  });
}
