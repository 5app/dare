import assert from 'node:assert/strict';
import Dare from '../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';
import options from '../data/options.js';

const debug = Debug('sql');

const {db} = global;

function dareStream() {

	// Initiate
	const dare = new Dare(options);

	// Set a test instance
	dare.execute = async function(query) {

		// Define the current Dare Instance
		const dareInstance = this;

		// Debug: Show the formatted version
		debug(mysql.format(query.sql, query.values));

		// Return a promise out of a stream...
		return new Promise((accept, reject) => {

			// Note we're making a request for the Stream Object
			const resultStream = db.stream(query);

			// Event handlers...
			resultStream.on('data', row => {

				dareInstance.addRow(row);

			});
			resultStream.on('end', accept);
			resultStream.on('error', reject);

		});

	};

	return dare;

}

describe('Stream', () => {

	let dare;

	beforeEach(() => {

		dare = dareStream();

	});

	it('should expose the stream of data through rowHandler', async () => {

		// Populate users
		const postUsers = Array(100).fill(0)
			.map((_, index) => ({username: `User${index}`}));

		await dare.post('users', postUsers);

		// Push data out
		const data = [];

		// Retrieve a list of users via a stream
		const resp = await dare.get({
			table: 'users',
			fields: ['username', 'generatedUrl'],
			limit: 100,
			rowHandler(row) {

				data.push(row);

			}
		});

		assert.strictEqual(resp, undefined, 'Resolved value should be undefined');
		assert.strictEqual(data.length, 100, 'Intercept handler should contain 100 items');
		assert.deepStrictEqual(data[0], {
			username: 'User0',
			generatedUrl: '/user/1'
		}, 'Should return formated data');


	});

});
