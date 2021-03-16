const Dare = require('../../src/');

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

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'DELETE FROM test WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

		};

		const resp = await dare.del('test', {id: 1});

		expect(resp).to.have.property('success', true);

	});

	it('should throw an exception if affectedRows: 0', async () => {

		dare.sql = async () => ({affectedRows: 0});

		const test = dare.del('groups', {id: 20000});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.NOT_FOUND);

	});

	it('should return opts.notfound if affectedRows: 0', async () => {

		const notfound = false;
		dare.sql = async () => ({affectedRows: 0});

		const test = await dare.del('groups', {id: 20000}, {notfound});
		return expect(test).to.equal(notfound);

	});

	it('should use table aliases', async () => {

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'DELETE FROM tablename WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

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

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'DELETE FROM tbl WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

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

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'DELETE FROM tbl WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

		};

		dare.options = {
			del: {
				// Augment the request
				async default(req) {

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
