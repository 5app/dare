import assert from 'node:assert/strict';
import SQL from 'sql-template-tag';
import defaultAPI from './helpers/api.js';

// Connect to db

describe('Working with JSON DataType', () => {
	let dare;
	const username = 'mightyduck';

	// JSON DataType not supported in MySQL 5.6
	beforeEach(function () {
		if (process.env.DB_ENGINE?.startsWith('mysql:5.6')) {
			this.skip();
			return;
		}

		// Initiate
		dare = defaultAPI();

		if (process.env.DB_ENGINE?.startsWith('mysql')) {
			dare.sql(SQL`
				ALTER TABLE users MODIFY COLUMN settings JSON DEFAULT NULL
			`);
		}
	});

	it('JSON fields should be retrievable', async () => {
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

	it('entire JSON field should be queryable as a string', async function() {

		if(!process.env.DB_ENGINE?.startsWith('mysql')) {
			this.skip();
			return;
		}
			

		const testString = 'testString';
		const settings = {
			testString,
		};

		// Create a test user settings and a control, without settings
		const {insertId} = await dare.post('users', [{username, settings}]);

		const resp = await dare.get({
			table: 'users',
			fields: ['id'],
			filter: {
				username,
				// Likey operator
				'%settings': [`%${testString}%`],
			},
		});

		assert.deepStrictEqual(resp.id, insertId);
	});

	it('JSON fields should be queryable using nested values', async () => {
		const settings = {
			digit: 1,
			str: 'string',
			bool: true,
			notnull: 1,
			option: 'two',
			stringy: 'cheese',
		};

		// Create a test user settings and a control, without settings
		const {insertId} = await dare.post('users', [
			{username, settings},
			{username: 'another', settings: null},
		]);

		await dare.post('users_email', [
			{user_id: insertId, email: 'a@example.com'},
			{user_id: insertId + 1, email: 'b@example.com'},
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

		// Test the shorthand filter
		{
			const resp = await dare.get({
				table: 'users_email',
				fields: [{users: ['settings']}],
				filter: {
					'users.settings.str': 'string',
				},
				limit: 2,
			});
			assert.deepStrictEqual(resp, [{users: {settings}}]);
		}

		// Test the failure to match
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
