import mysql from 'mysql2/promise';
import {PassThrough} from 'node:stream';

// Initiates the mysql connection
class DB {
	async init(mysqlSettings) {
		this.conn = await mysql.createConnection({
			...mysqlSettings,
			multipleStatements: true,
		});

		return this.conn;
	}
	async query(query) {
		const [rows] = await this.conn.query(query);

		return rows;
	}
	end() {
		// Close this connection
		return this.conn.end();
	}

	stream(query, streamOptions = {objectMode: true, highWaterMark: 5}) {
		const resultStream = new PassThrough(streamOptions);

		// Stream query results from the DB

		// @ts-ignore
		this.conn.connection.query(query).stream().pipe(resultStream);

		return resultStream;
	}
}

export default new DB();
