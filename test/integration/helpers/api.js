import Dare from '../../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';
import options from '../../data/options.js';

const debug = Debug('sql');

const {db} = global;

export {options};

export default function () {
	// Initiate
	const dare = new Dare(options);

	// Set a test instance
	// eslint-disable-next-line arrow-body-style
	dare.execute = async query => {
		// DEBUG
		debug(mysql.format(query.sql, query.values));

		const resp = await db.query(query);

		if (!Array.isArray(resp)) {
			debug(`Affected rows: ${resp.affectedRows}`);
		}

		return resp;
	};

	return dare;
}

export function castToStringIfNeeded(a) {
	// MySQL 5.6, uses CONCAT_WS, rather than type safe JSON_ARRAY
	if (process.env.MYSQL_VERSION === '5.6') {
		return a === null ? '' : String(a);
	}

	return a;
}
