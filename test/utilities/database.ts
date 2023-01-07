import { Connection, createConnection, useContainer } from 'typeorm';
import { testDatabseConfig } from './database.config';

export const createTestDatabaseConnection = async (): Promise<Connection> => {
   
    const connection = await createConnection(testDatabseConfig as any);
    return connection;
};

export const closeTestDatabase = async (connection: Connection) => {
    await connection.close();
};
