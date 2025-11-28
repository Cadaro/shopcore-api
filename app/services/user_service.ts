import User from '#models/user';
import { UserCreatedDto, UserCreateDto, UserData, UserDb } from '#types/user';
import db from '@adonisjs/lucid/services/db';
import { randomUUID } from 'crypto';

export default class UserService {
  async createUser(userData: UserCreateDto): Promise<UserCreatedDto> {
    const user: UserDb = await db.transaction(async (trx) => {
      const exists = await User.findBy({ email: userData.email }, { client: trx });
      if (exists) {
        throw new Error(`Email ${userData.email} already exists`);
      }
      const { email, password, firstName, lastName } = userData;
      const createdUser = await User.create(
        { email, password, firstName, lastName, uuid: randomUUID() },
        { client: trx }
      );
      if (!createdUser) {
        throw new Error(`Cannot create user account for ${userData.email}`);
      }
      return createdUser;
    });
    return { userId: user.uuid };
  }

  async updateUser(userData: Partial<UserData>): Promise<void> {
    await db.transaction(async (trx) => {
      const user = await User.findBy({ uuid: userData.userId }, { client: trx });
      if (!user) {
        throw new Error(`User ${userData.userId} not found`);
      }
      await user.merge({ firstName: userData.firstName, lastName: userData.lastName }).save();
    });
  }

  async fetchUserData(uuid: string): Promise<UserData> {
    const user = await User.findBy({ uuid });
    if (!user) {
      throw new Error(`User ${uuid} not found`);
    }

    const userData: UserData = {
      userId: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return userData;
  }
}
