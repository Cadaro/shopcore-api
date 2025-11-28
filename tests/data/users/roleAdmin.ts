import { UserRolesEnum } from '#types/user';
import { randomUUID } from 'crypto';

export function generateRoleAdmin() {
  return {
    email: `${randomUUID()}@example.com`,
    password: 'user123',
    role: UserRolesEnum.ADMIN,
    uuid: randomUUID(),
  };
}
