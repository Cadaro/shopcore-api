import { DateTime } from 'luxon';

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
  role: UserRolesEnum;
  createdAt: DateTime;
  updatedAt: DateTime;
};

export type UserCreateDb = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRolesEnum;
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

export enum UserAbilitiesEnum {
  ADMIN = '*',
  USER = 'user',
}

export enum UserRolesEnum {
  ADMIN = 'admin',
  USER = 'user',
}
