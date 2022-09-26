import Dare from '../../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';

const debug = Debug('sql');

const {db} = global;
const models = {
	teams: {},
	users: {},
	userTeams: {

		schema: {
			'user_id': ['users.id'],
			'team_id': ['teams.id']
		}
	}
};

export const options = {models};

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
