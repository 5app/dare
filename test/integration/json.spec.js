import Dare from '../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';
import {options} from './helpers/api.js';
import SQL from 'sql-template-tag';
const debug = Debug('sql');

const {db} = global;

// Connect to db

describe('Working with JSON DataType', () => {
	let dare;

	// JSON DataType not supported in MySQL 5.6
	if (process.env.MYSQL_VERSION === '5.6') {
		this.skip();
	}

	beforeEach(() => {
		// Initiate
		dare = new Dare(options);

		// Set a test instance
		// eslint-disable-next-line arrow-body-style
		dare.execute = query => {
			// DEBUG
			debug(mysql.format(query.sql, query.values));

			return db.query(query);
		};

		dare.sql(SQL`
            ALTER TABLE users MODIFY COLUMN settings JSON DEFAULT NULL
        `);
	});

	it('JSON fields should be setable and retrievable', async () => {
		const username = 'mightyduck';

		await dare.post('users', {username, settings: {a: 1, b: 2}});

		const {settings} = await dare.get({
			table: 'users',
			fields: ['settings'],
			filter: {
				username,
			},
		});

		expect(settings).to.have.property('a', 1);
	});

	/**
	 * This would allow querying on and exporting values of a JSON object
	 */
	it('JSON fields should be queryable', async () => {
		const username = 'mightyduck';

		await dare.post('users', {username, settings: {a: 1, b: 2}});

		const {settings} = await dare.get({
			table: 'users',
			fields: ['settings'],
			filter: {
				username,
				settings: {
					b: 2,
					a: 1,
				},
			},
		});

		expect(settings).to.have.property('b', 2);

		const resp = await dare.get({
			table: 'users',
			fields: ['settings'],
			filter: {
				username,
				settings: {
					a: 2,
				},
			},
			notfound: null,
		});

		expect(resp).to.equal(null);
	});
});
