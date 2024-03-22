import assert from 'node:assert/strict';
import SQL from 'sql-template-tag';
import defaultAPI from './helpers/api.js';

// Connect to db

describe('Working with JSON DataType', function () {
	let dare;

	// JSON DataType not supported in MySQL 5.6
	if (process.env.MYSQL_VERSION === '5.6') {
		// @ts-ignore
		this.skip();
	}

	beforeEach(() => {
		// Initiate
		dare = defaultAPI();

		dare.sql(SQL`
            ALTER TABLE users MODIFY COLUMN settings JSON DEFAULT NULL
        `);
	});

	it('JSON fields should be setable and retrievable', async () => {
		const username = 'mightyduck';

		const settings = {a: 1, b: 2};

		await dare.post('users', {username, settings});

		const resp = await dare.get({
			table: 'users',
			fields: ['settings'],
			filter: {
				username,
			},
		});

		assert.deepStrictEqual(resp.settings, settings);
	});

	/**
	 * This would allow querying on and exporting values of a JSON object
	 */
	it('JSON fields should be queryable', async () => {
		const username = 'mightyduck';
		const settings = {a: 1, b: 2};

		await dare.post('users', {username, settings});

		const resp = await dare.get({
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

		assert.deepStrictEqual(resp.settings, settings);

		const noMatch = await dare.get({
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

		assert.strictEqual(noMatch, null);
	});
});
