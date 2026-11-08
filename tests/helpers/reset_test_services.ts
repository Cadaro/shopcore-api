import { createConnection, escapeId } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import redis from '@adonisjs/redis/services/main';
import env from '#start/env';
import { assertSafeTestServices } from '#tests/helpers/test_service_safety';
import { waitForRedis } from '#tests/helpers/wait_for_redis';

export async function resetTestServices() {
  assertSafeTestServices({
    nodeEnv: env.get('NODE_ENV'),
    databaseHost: env.get('DB_HOST'),
    databasePort: env.get('DB_PORT'),
    databaseName: env.get('DB_DATABASE'),
    redisHost: env.get('REDIS_HOST'),
    redisPort: env.get('REDIS_PORT'),
    redisDatabase: env.get('REDIS_DB'),
    ci: process.env.CI === 'true',
  });

  const redisConnection = redis.connection();
  await waitForRedis(redisConnection.ioConnection);

  const connection = await createConnection({
    host: env.get('DB_HOST'),
    port: env.get('DB_PORT'),
    user: env.get('DB_USER'),
    password: env.get('DB_PASSWORD'),
    database: env.get('DB_DATABASE'),
  });

  try {
    const [objects] = await connection.query<RowDataPacket[]>(
      'SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [env.get('DB_DATABASE')]
    );
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const object of objects) {
      const kind = object.TABLE_TYPE === 'VIEW' ? 'VIEW' : 'TABLE';
      await connection.query(`DROP ${kind} IF EXISTS ${escapeId(object.TABLE_NAME)}`);
    }
  } finally {
    await connection.end();
  }

  await redisConnection.flushdb();
}
