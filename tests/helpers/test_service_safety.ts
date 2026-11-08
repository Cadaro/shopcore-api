interface TestServiceConfig {
  nodeEnv: string;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  redisHost: string;
  redisPort: number;
  redisDatabase: number;
  ci: boolean;
}

export function assertSafeTestServices(config: TestServiceConfig) {
  const localhost = (host: string) => host === '127.0.0.1' || host === 'localhost';
  const databasePort = config.ci ? 3306 : 3307;
  const redisPort = config.ci ? 6379 : 6380;

  if (
    config.nodeEnv !== 'test' ||
    !localhost(config.databaseHost) ||
    config.databasePort !== databasePort ||
    config.databaseName !== 'shopcore_test' ||
    !localhost(config.redisHost) ||
    config.redisPort !== redisPort ||
    config.redisDatabase !== 1
  ) {
    throw new Error(
      'Refusing to reset test services: expected local shopcore_test database and dedicated Redis database 1 on the configured test ports'
    );
  }
}
