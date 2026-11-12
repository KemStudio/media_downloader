import { ROLES } from '../../model/Account.js';

const VALID_ROLES = new Set(Object.values(ROLES));

export function assertRole(role) {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}
