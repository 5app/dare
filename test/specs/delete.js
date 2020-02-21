

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');
const DareError = require('../../src/utils/error');

describe('del', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare();

		// Should not be called...
		dare.execute = () => {

			throw new Error('execute called');

		};

	});

	it('should contain the function dare.del', () => {

		expect(dare.del).to.be.a('function');

	});

	it('should generate an DELETE statement and execute dare.execute', async () => {

		dare.execute = (query, callback) => {

			// Limit: 1
			sqlEqual(query, 'DELETE FROM test WHERE id = 1 LIMIT 1');
			callback(null, {success: true});

		};

		const resp = await dare.del('test', {id: 1});

		expect(resp).to.have.property('success', true);

	});

	it('should throw an exception if affectedRows: 0', async () => {

		dare.sql = async () => ({affectedRows: 0});

		const test = dare.del('groups', {name: 'name'}, {id: 20000});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.NOT_FOUND);

	});

	it('should use table aliases', async () => {

		dare.execute = (query, callback) => {

			// Limit: 1
			sqlEqual(query, 'DELETE FROM tablename WHERE id = 1 LIMIT 1');
			callback(null, {success: true});

		};

		dare.options = {
			table_alias: {
				'test': 'tablename'
			}
		};

		return dare
			.del({
				table: 'test',
				filter: {id: 1}
			});

	});

	it('should trigger pre handler, options.del.[table]', async () => {

		dare.execute = (query, callback) => {

			sqlEqual(query, 'DELETE FROM tbl WHERE id = 1 LIMIT 1');
			callback(null, {success: true});

		};

		dare.options = {
			del: {
				'tbl': req => {

					// Augment the request
					req.filter.id = 1;

				}
			}
		};

		return dare
			.del({
				table: 'tbl',
				filter: {id: 2}
			});

	});


	it('should trigger pre handler, options.del.default, and wait for Promise to resolve', async () => {

		dare.execute = (query, callback) => {

			sqlEqual(query, 'DELETE FROM tbl WHERE id = 1 LIMIT 1');
			callback(null, {success: true});

		};

		dare.options = {
			del: {
				// Augment the request
				'default': async req => req.filter.id = 1
			}
		};

		return dare
			.del({
				table: 'tbl',
				filter: {id: 2}
			});

	});

	it('should trigger pre handler, and handle errors being thrown', () => {

		const msg = 'test';

		dare.options = {
			del: {
				'default': () => {

					// Augment the request
					throw new Error(msg);

				}
			}
		};

		const test = dare.del({
			table: 'tbl',
			filter: {id: 2}
		});

		return expect(test)
			.to.be.eventually.rejectedWith(Error, msg);

	});

	it('should return options.skip if set and not trigger further operations', async () => {

		dare.options = {
			del: {
				'default': options => {

					options.skip = true;

				}
			}
		};

		const resp = await dare
			.del({
				table: 'tbl',
				filter: {id: 2}
			});

		expect(resp).to.eql(true);

	});

});
