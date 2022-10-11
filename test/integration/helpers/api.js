import Dare from '../../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';
import options from '../../data/options.js';

const debug = Debug('sql');

const {db} = global;

export {options};

export default function() {

	// Initiate
	const dare = new Dare(options);

	// Set a test instance
	// eslint-disable-next-line arrow-body-style
	dare.execute = query => {

		// DEBUG
		debug(mysql.format(query.sql, query.values));

		return db.query(query);

	};

	return dare;

}
