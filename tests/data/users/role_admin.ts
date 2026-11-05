import { Role } from '#types/enum/role';
import { randomUUID } from 'crypto';

export function generateRoleAdmin() {
  return {
    email: `${randomUUID()}@example.com`,
    password: 'user123',
    role: Role.ADMIN,
    uuid: randomUUID(),
  };
}
