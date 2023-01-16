import mysql from 'mysql2/promise';


// Initiates the mysql connection
class DB {

	async init(mysqlSettings) {

		this.conn = await mysql.createConnection({
			...mysqlSettings,
			multipleStatements: true
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

}

export default new DB();
