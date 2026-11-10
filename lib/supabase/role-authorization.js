export function authorizeRoleContext(context, allowedRoles) {
  if (!context.configured) {
    return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (context.error) {
    return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!context.user) {
    return Response.json({ error: 'Sign in is required.' }, { status: 401 });
  }
  if (!allowedRoles.includes(context.role)) {
    return Response.json({ error: 'This account does not have permission for this action.' }, { status: 403 });
  }
  return null;
}
