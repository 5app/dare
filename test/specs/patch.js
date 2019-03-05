'use strict';

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

const DareError = require('../../src/utils/error');

describe('patch', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();

		// Should not be called...
		dare.execute = () => {
			throw new Error('execute called');
		};
	});

	it('should contain the function dare.patch', () => {
		expect(dare.patch).to.be.a('function');
	});

	it('should generate an UPDATE statement and execute dare.execute', async () => {

		dare.execute = (query, callback) => {
			// limit: 1
			sqlEqual(query, 'UPDATE test SET `name` = \'name\' WHERE id = 1 LIMIT 1');
			callback(null, {success: true});
		};

		const resp = await dare
			.patch('test', {id: 1}, {name: 'name'});
		expect(resp).to.have.property('success', true);
	});

	it('should throw an exception if affectedRows: 0', async () => {

		dare.sql = () => Promise.resolve({affectedRows: 0});

		try {
			await dare
				.patch('groups', {id: 20000}, {name: 'name'});

			throw new Error('expected failure');
		}
		catch (err) {
			expect(err.code).to.eql(DareError.NOT_FOUND);
		}
	});


	[
		{
			given: 'field',
			expect: '\'field\''
		},
		{
			given: null,
			expect: 'null'
		},
		{
			given: {
				obj: 'be stringified'
			},
			expect: '\'{"obj":"be stringified"}\''
		}
	].forEach(({given, expect}) => {

		it(`should convert ${given} to ${expect}`, async () => {

			dare.execute = (query, callback) => {
				// limit: 1
				sqlEqual(query, `UPDATE test SET \`name\` = ${expect} WHERE id = 1 LIMIT 1`);
				callback(null, {success: true});
			};

			return dare
				.patch({
					table: 'test',
					filter: {id: 1},
					body: {name: given}
				});
		});

	});


	it('should apply the request.limit', async () => {

		dare.execute = (query, callback) => {
			// limit: 1
			sqlEqual(query, 'UPDATE test SET `name` = \'name\' WHERE id = 1 LIMIT 11');
			callback(null, {success: true});
		};

		return dare
			.patch({
				table: 'test',
				filter: {id: 1},
				body: {name: 'name'},
				limit: 11
			});
	});

	it('should use table aliases', async () => {

		dare.execute = (query, callback) => {
			// limit: 1
			sqlEqual(query, 'UPDATE tablename SET `name` = \'name\' WHERE id = 1 LIMIT 1');
			callback(null, {success: true});
		};

		dare.options = {
			table_alias: {
				'test': 'tablename'
			}
		};

		return dare
			.patch({
				table: 'test',
				filter: {id: 1},
				body: {name: 'name'}
			});
	});


	it('should trigger pre handler, options.patch.[table]', async () => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'UPDATE tbl SET `name` = \'andrew\' WHERE id = 1 LIMIT 1');
			callback(null, {success: true});
		};

		dare.options = {
			patch: {
				'tbl': req => {
					// Augment the request
					req.body.name = 'andrew';
				}
			}
		};

		return dare
			.patch({
				table: 'tbl',
				filter: {id: 1},
				body: {name: 'name'}
			});
	});


	it('should trigger pre handler, options.patch.default, and wait for Promise to resolve', async () => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'UPDATE tbl SET `name` = \'andrew\' WHERE id = 1 LIMIT 1');
			callback(null, {success: true});
		};

		dare.options = {
			patch: {
				'default': async req => {
					req.body.name = 'andrew';
				}
			}
		};

		return dare
			.patch({
				table: 'tbl',
				filter: {id: 1},
				body: {name: 'name'}
			});
	});

	it('should trigger pre handler, and handle errors being thrown', async () => {

		const msg = 'snap';

		dare.options = {
			patch: {
				'default': () => {
					// Augment the request
					throw new Error(msg);
				}
			}
		};

		try {
			await dare
				.patch({
					table: 'tbl',
					filter: {id: 1},
					body: {name: 'name'}
				});
		}
		catch (err) {
			expect(err).to.have.property('message', msg);
		}
	});

	it('should not exectute if the opts.skip request is marked', async () => {

		const skip = 'true';

		dare.options = {
			patch: {
				default(opts) {
					opts.skip = skip;
				}
			}
		};

		const resp = await dare
			.patch({
				table: 'tbl',
				filter: {id: 1},
				body: {name: 'name'}
			});


		expect(resp).to.eql(skip);
	});
});
