import vine from '@vinejs/vine';
import { Role } from '#types/enum/role';

/**
 * Validator to validate the payload when creating
 * a new user.
 */
export const createUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().minLength(3).maxLength(50).optional(),
    lastName: vine.string().minLength(2).maxLength(50).optional(),
    email: vine.string().email().maxLength(254).trim(),
    password: vine.string(),
  })
);

export const updateUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().minLength(3).maxLength(50).optional(),
    lastName: vine.string().minLength(2).maxLength(50).optional(),
  })
);

export const updateUserRoleValidator = vine.create({
  role: vine.enum([Role.CUSTOMER, Role.STAFF, Role.ADMIN]),
});
