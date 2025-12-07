import vine from '@vinejs/vine';

export const createAuthValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(254).trim(),
    password: vine.string(),
  })
);
