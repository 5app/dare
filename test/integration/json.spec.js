import assert from 'node:assert/strict';
import SQL from 'sql-template-tag';
import defaultAPI from './helpers/api.js';

// Connect to db

describe('Working with JSON DataType', () => {
	let dare;

	// JSON DataType not supported in MySQL 5.6
	beforeEach(function () {
		if (process.env.MYSQL_VERSION === '5.6') {
			this.skip();
			return;
		}

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
		const settings = {
			digit: 1,
			str: 'string',
			bool: true,
			notnull: 1,
			option: 'two',
			stringy: 'cheese',
		};

		// Create a test user settings and a control, without settings
		await dare.post('users', [
			{username, settings},
			{username: 'another', settings: null},
		]);

		const resp = await dare.get({
			table: 'users',
			fields: ['settings'],
			filter: {
				username,
				settings: {
					digit: 1,
					str: 'string',
					bool: true,
					missing: null, // Is ignored, because absent keys are null

					// Negation
					'-digit': 2,
					'-str': 'something else',
					'-bool': false,
					'-notnull': null,

					// Range
					'~digit': '0..2',
					'-~digit': '10..100',

					// Like operator
					'%stringy': 'chee%', // In MySQL the LIKE operator looks at the "quoted" string, so need to add a quote if comparing against the start or end of a value respectively

					// In operator
					option: ['one', 'two'], // String items, must be quoted?

					/*
					 * // Not supported yet
					 * '-missing': 1, // this yields `settings->'$.missing' != 1` which returns false if `missing` is not present
					 */
				},
			},
			limit: 2,
		});

		assert.deepStrictEqual(resp, [{settings}]);

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
