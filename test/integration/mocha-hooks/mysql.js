/* eslint-disable no-console */
const {execSync} = require('child_process');
const mysql = require('mysql2/promise');
const fs = require('fs');

/*
 * Mocha recreates the require cache in watch mode (--watch)
 * And so would create a new instance of helpers/db on each run of the tests
 * In order to reference the same instance of helpers/db it is defined as a global here.
 */
global.db = require('../helpers/db');

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

const dbName = `${TEST_DB_PREFIX}${Date.now()}_${process.pid}`;
let dbTables = [];
let dbConn;

/**
 * Reset Database - Truncate Tables
 * @returns {void}
 */
async function resetDbState() {

	const truncateTablesSql = `${dbTables.map(({table_name: table}) => `TRUNCATE TABLE ${table}`).join(';\n')};`;
	const resetDataSql = `
SET FOREIGN_KEY_CHECKS=0;
${truncateTablesSql}
${insertDataSql}
SET FOREIGN_KEY_CHECKS=1;
`;
	await dbConn.query(resetDataSql);

}

/**
 * Create new DB
 * @returns {void}
 */
async function createNewDb() {

	if (dbConn) {

		return dbConn;

	}

	// We have to connect to the docker instance to run in the mysql dump via a query
	execSync(
		`docker-compose exec -T mysql sh -c 'MYSQL_PWD=${MYSQL_PASSWORD} mysql -u${MYSQL_USER}'`,
		{input: `CREATE DATABASE ${dbName}; USE ${dbName}; ${schemaSql}`}
	);

	// Create a connection
	dbConn = await mysql.createConnection({
		...mysqlSettings,
		database: dbName,
		multipleStatements: true
	});

	// Extract the tables
	const [tables] = await dbConn.query(`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = "${dbName}"
	`);

	dbTables = tables;

}

module.exports.mochaHooks = {
	async beforeAll() {

		// BeforeAll happens per-process/thread, so each subsequent test can reset the db without it interfering with other tests in that thread
		this.timeout(5000);

		// To support parallel tests, we create a separate db per-process/thread and just reset the state (truncate tables) per-test.
		await createNewDb();

		// Initiate the global database connection
		await global.db.init({
			...mysqlSettings,
			database: dbName
		});

	},
	async beforeEach() {

		this.timeout(5000);
		await resetDbState();

	}
};
