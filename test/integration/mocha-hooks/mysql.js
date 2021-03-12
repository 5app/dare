/* eslint-disable no-console */
const {execSync} = require('child_process');
const mysql = require('mysql2/promise');
const fs = require('fs');

const {
	MYSQL_HOST = 'mysql',
	MYSQL_PORT = 13306,
	MYSQL_USER = 'root',
	MYSQL_PASSWORD = 'password',
	TEST_DB_DATA_PATH,
	TEST_DB_SCHEMA_PATH,
	TEST_DB_PREFIX = 'test_'
} = process.env;

const mysqlSettings = {
	host: MYSQL_HOST,
	user: MYSQL_USER,
	port: MYSQL_PORT,
	password: MYSQL_PASSWORD
};

const schemaSql = fs.readFileSync(TEST_DB_SCHEMA_PATH);
const insertDataSql = fs.readFileSync(TEST_DB_DATA_PATH);

const defaultDbSuffix = 'eu';
const dbPrefix = `${TEST_DB_PREFIX}${Date.now()}_${process.pid}`;
const dbs = {};
let accumulatedTime = 0;

const timeIt = async (func, id) => {

	const start = Date.now();
	const ret = await func();
	const taken = Date.now() - start;
	accumulatedTime += taken;
	if (process.env.LOGS_LEVEL === 'debug') {

		console.log(`${id} - in pid ${process.pid} took ${taken}`);

	}
	return ret;

};

async function resetDbState({dbConn, dbName, tables}) {

	return timeIt(async () => {

		const truncateTablesSql = `${tables.map(({table_name: table}) => `TRUNCATE TABLE ${table}`).join(';\n')};`;
		const resetDataSql = `
SET FOREIGN_KEY_CHECKS=0;
${truncateTablesSql}
${insertDataSql}
SET FOREIGN_KEY_CHECKS=1;
`;
		await dbConn.query(resetDataSql);

	}, `reset db state for ${dbName}`);

}

async function createNewDb(dbSuffix) {

	const dbName = `${dbPrefix}_${dbSuffix}`;
	if (dbs[dbName]) {

		return dbs[dbName];

	}
	return timeIt(async () => {

		const mysqlCommand = `MYSQL_PWD=${MYSQL_PASSWORD} mysql -u${MYSQL_USER}`;
		/*
		 * We have to use docker-compose because we can't run in the mysql dump via a query
		 * (some of the stuff around triggers, like DELIMITER, is only valid via cli: https://github.com/mysqljs/mysql/issues/2222#issuecomment-497179584)
		 */
		execSync(`docker-compose exec -T mysql sh -c '${mysqlCommand}'`, {input: `CREATE DATABASE ${dbName}; USE ${dbName}; ${schemaSql}`});
		const dbConn = await mysql.createConnection({
			...mysqlSettings,
			multipleStatements: true
		});
		await dbConn.query(`USE ${dbName};`);
		const [tables] = await dbConn.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = "${dbName}";`);

		dbs[dbName] = {
			dbConn, dbName, tables
		};
		return dbs[dbName];

	}, `creating database ${dbName}`);

}

module.exports.mochaHooks = {
	async beforeAll() {

		// BeforeAll happens per-process/thread, so each subsequent test can reset the db without it interfering with other tests in that thread
		this.timeout(5000);
		// To support parallel tests, we create a separate db per-process/thread and just reset the state (truncate tables) per-test.
		const testDb = await createNewDb(defaultDbSuffix);


		const db = require('../helpers/db');

		await db.init({
			...mysqlSettings,
			database: testDb.dbName
		});

		this.db = testDb;
		this.resetDbState = resetDbState;
		this.createNewDb = createNewDb;

	},
	async beforeEach() {

		this.timeout(5000);
		this.currentTest.db = this.db;
		await resetDbState(this.db);

	},
	async afterAll() {

		try {

			// Await db.conn.close();

		}
		catch (e) {

			console.log(`failed to cleanup db connections: ${e}`);

		}
		if (['info', 'debug'].includes(process.env.LOGS_LEVEL)) {

			console.log(`Time spent doing DB setup/teardown (in pid ${process.pid}) was: ${accumulatedTime}ms`);

		}
		// Process (and so pid) gets reused
		accumulatedTime = 0;

	}
};
