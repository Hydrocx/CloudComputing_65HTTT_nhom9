export const canAccess = (role, allowedRoles = []) => {
  if (!role) return false;
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(role);
};
