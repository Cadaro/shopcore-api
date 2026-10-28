import { UserRolesEnum } from '#types/user';
import { randomUUID } from 'crypto';

export function generateRoleUser() {
  return {
    email: `${randomUUID()}@example.com`,
    password: 'user123',
    role: UserRolesEnum.USER,
    uuid: randomUUID(),
  };
}
