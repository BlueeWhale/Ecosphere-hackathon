export const tenantQuery = (user) => {
  if (!user || user.role === 'admin') return {};
  return user.tenantId ? { tenantId: user.tenantId } : { user: user._id || user.id };
};

export const assertTenantAccess = (user, document) => {
  if (!document || user?.role === 'admin') return true;
  const tenantId = user?.tenantId?.toString();
  return Boolean(tenantId && document.tenantId?.toString() === tenantId);
};