import { DateTime } from 'luxon';
import { Role } from '#types/enum/role';

export type UserData = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
};

export type UserDb = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  uuid: string;
  role: Role;
  createdAt: DateTime;
  updatedAt: DateTime;
};

export type UserCreateDb = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  uuid: string;
};

export type UserCreateDto = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type UserCreatedDto = {
  userId: string;
};
