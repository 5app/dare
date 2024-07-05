import MySQL from './MySQL.js';
import Postgres from './Postgres.js';

const {
	DB_ENGINE = 'mysql:5.6',
	DB_HOST = 'mysql',
	DB_PORT = 13_306,
	DB_USER = 'db_user',
	DB_PASSWORD = 'password',
	TEST_DB_PREFIX = 'test_',
} = process.env;

// To support parallel tests, we create a separate db per-process/thread and just reset the state (truncate tables) per-test.
const dbName = `${TEST_DB_PREFIX}${Date.now()}_${process.pid}`;

const dbSettings = {
	host: DB_HOST,
	user: DB_USER,
	port: +DB_PORT,
	password: DB_PASSWORD,
	database: dbName,
};

let dbInstance;
if (DB_ENGINE.startsWith('mysql') || DB_ENGINE.startsWith('mariadb')) {
	dbInstance = new MySQL(dbSettings);
} else if (DB_ENGINE.startsWith('postgres')) {
	dbInstance = new Postgres(dbSettings);
}

export default dbInstance;
