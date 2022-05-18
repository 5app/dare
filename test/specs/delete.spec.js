import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';
import DareError from '../../src/utils/error.js';

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

	it('should use provided table name', async () => {

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'DELETE FROM tablename WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

		};

		dare.options.models = {
			'test': {
				table: 'tablename'
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

			sqlEqual(sql, 'DELETE FROM test WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

		};

		dare.options.models = {
			'test': {
				del(req) {

					// Augment the request
					req.filter.id = 1;

				}
			}
		};

		return dare
			.del({
				table: 'test',
				filter: {id: 2}
			});

	});


	it('should trigger pre handler, options.del.default, and wait for Promise to resolve', async () => {

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'DELETE FROM tbl WHERE id = ? LIMIT 1');
			expect(values).to.deep.equal([1]);
			return {success: true};

		};

		dare.options.models = {
			default: {
				// Augment the request
				async del(req) {

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

		dare.options.models = {
			default: {
				del() {

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

		dare.options.models = {
			default: {
				del(options) {

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

	it('legacy: options.schema, should return options.skip if set and not trigger further operations', async () => {

		const dare2 = dare.use({
			del: {
				default(options) {

					options.skip = true;

				}
			}
		});

		const resp = await dare2
			.del({
				table: 'tbl',
				filter: {id: 2}
			});

		expect(resp).to.eql(true);

	});


	it('disallow nested filters: should throw an exception', () => {

		dare.options.models = {
			tbl: {
				schema: {
					// Create a reference to tblB
					ref_id: 'tblB.id'
				}
			}
		};

		const test = dare
			.del({
				table: 'tbl',
				filter: {
					id: 1,
					tblB: {
						id: 1
					}
				}
			});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.INVALID_REQUEST);

	});

});
