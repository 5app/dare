import {execSync} from 'node:child_process';
import pg from 'pg';
import fs from 'node:fs';
import QueryStream from 'pg-query-stream';

const {TEST_DB_DATA_PATH, TEST_DB_SCHEMA_PATH} = process.env;

const schemaSql = fs.readFileSync(TEST_DB_SCHEMA_PATH);
const insertDataSql = fs.readFileSync(TEST_DB_DATA_PATH);

export default class Postgres {
	constructor(credentials) {
		this.credentials = credentials;
	}
	async init() {
		// We have to connect to the docker instance to run in the mysql dump via a query
		execSync(
			`docker exec -i --env PGPASSWORD=${this.credentials.password} dare_db psql -U postgres -h ${this.credentials.host} postgres`,
			{
				input: `CREATE DATABASE ${this.credentials.database}; \\c ${this.credentials.database}; ${schemaSql}`,
			}
		);

		const client = new pg.Client({
			...this.credentials,
			user: 'postgres',
		});

		await client.connect();

		// Initiate the connection
		this.conn = client;

		// Extract the tables
		const tables = await this.conn.query(`
			SELECT table_name AS table
			FROM information_schema.tables
			WHERE table_catalog = '${this.credentials.database}' AND table_schema = 'public'
		`);

		this.tables = tables.rows.map(({table}) => table);

		return this.conn;
	}

	async query(request) {
		let index = 0;

		// Format the query
		let query = (typeof request === 'string' ? request : (request.text || request.sql?.replace(/\?/g, () => `$${++index}`))); // Prepared statement, we need to replace ?, ?...? with $1, $2...$n

		// Debug console.log(request, query, request?.values);

		// Return insertId (via rows?.[0]?.id)
		if (query.startsWith('INSERT')) {
			query += ' RETURNING id;';
		}

		const resp = await this.conn.query(query, request?.values);

		const {command, rowCount, rows} = resp;

		// Return SELECT rows
		if (command === 'SELECT') {
			return rows;
		}

		// Else, return a node-mysql'ish response
		return {
			insertId: rows?.[0]?.id,
			affectedRows: rowCount,
		};
	}

	async resetDbState() {
		const resetDataSql = `
			TRUNCATE TABLE ${this.tables.join()};\n
			${insertDataSql}
		`;

		await this.conn.query(resetDataSql);
	}

	stream(request, streamOptions = {objectMode: true, highWaterMark: 5}) {

		let index = 0;

		// Format the query
		const query = (typeof request === 'string' ? request : (request.text || request.sql?.replace(/\?/g, () => `$${++index}`))); // Prepared statement, we need to replace ?, ?...? with $1, $2...$n

		// Stream query results from the DB
		const queryStream = new QueryStream(query, request?.values, streamOptions);

		// @ts-ignore
		this.conn.query(queryStream);

		return queryStream;
	}

	end() {
		return this.conn.end();
	}
}
