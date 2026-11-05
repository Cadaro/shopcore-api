import { Role } from '#types/enum/role';
import { randomUUID } from 'crypto';

export function generateRoleStaff() {
  return {
    email: `${randomUUID()}@example.com`,
    password: 'user123',
    role: Role.STAFF,
    uuid: randomUUID(),
  };
}
