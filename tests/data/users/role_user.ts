import { Role } from '#types/enum/role';
import { randomUUID } from 'crypto';

export function generateRoleUser() {
  return {
    email: `${randomUUID()}@example.com`,
    password: 'user123',
    role: Role.CUSTOMER,
    uuid: randomUUID(),
  };
}
