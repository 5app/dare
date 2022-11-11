import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';

import DareError from '../../src/utils/error.js';
import {expect} from 'chai';

const id = 1;
const name = 'name';

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


		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'UPDATE test a SET a.`name` = ? WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([name, id]);

			return {success: true};

		};

		const resp = await dare
			.patch('test', {id}, {name});
		expect(resp).to.have.property('success', true);

	});

	it('should throw an exception if affectedRows: 0', () => {


		dare.sql = async () => ({affectedRows: 0});

		const test = dare
			.patch('groups', {id: 20000}, {name});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.NOT_FOUND);

	});

	it('should throw an exception if affectedRows: 0', async () => {

		const notfound = false;

		dare.sql = async () => ({affectedRows: 0});

		const test = await dare
			.patch('groups', {id: 20000}, {name}, {notfound});

		expect(test).to.equal(notfound);

	});


	describe('validate formatting of input values', () => {

		[
			'field',
			null
		].forEach(input => {

			it(`should convert ${input}`, async () => {

				const id = 1;

				dare.execute = async ({sql, values}) => {

					// Limit: 1
					sqlEqual(sql, 'UPDATE test a SET a.`input` = ? WHERE a.id = ? LIMIT 1');
					expect(values).to.deep.equal([input, id]);
					return {success: true};

				};

				return dare
					.patch({
						table: 'test',
						filter: {id},
						body: {input}
					});

			});

		});


		[
			{
				key: 'value'
			},
			[
				1, 2, 3
			]
		].forEach(input => {

			it(`should throw an exception, given ${JSON.stringify(input)}`, async () => {

				const call = dare
					.patch({
						table: 'test',
						filter: {id},
						body: {name: input}
					});

				return expect(call).to.be.eventually
					.rejectedWith(DareError, 'Field \'name\' does not accept objects as values')
					.and.have.property('code', DareError.INVALID_VALUE);

			});

		});


		describe('type=json', () => {

			beforeEach(() => {

				dare.options.models = {
					'test': {
						schema: {
							meta: {
								type: 'json'
							}
						}
					}
				};

			});

			// Invalid inputs...
			['string', true, false, 0, NaN, a => a]
				.forEach(given => {

					it(`should throw an exception, given ${given}`, async () => {

						const call = dare
							.patch({
								table: 'test',
								filter: {id},
								body: {meta: given}
							});

						return expect(call).to.be.eventually
							.rejectedWith(DareError, 'Field \'meta\' must be an object')
							.and.have.property('code', DareError.INVALID_VALUE);

					});

				});

			// Valid inputs
			[{}, [], null]
				.forEach(input => {


					it(`should accept typeof object, given ${JSON.stringify(input)}`, async () => {

						const id = 1;
						const meta = input ? JSON.stringify(input) : null;

						dare.execute = async ({sql, values}) => {

							// Limit: 1
							sqlEqual(sql, 'UPDATE test a SET a.`meta` = ? WHERE a.id = ? LIMIT 1');
							expect(values).to.deep.equal([meta, id]);
							return {success: true};

						};

						return dare
							.patch({
								table: 'test',
								filter: {id},
								body: {meta: input}
							});

					});

				});

		});


	});


	it('should apply the request.limit', async () => {

		const limit = 11;

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'UPDATE test a SET a.`name` = ? WHERE a.id = ? LIMIT 11');
			expect(values).to.deep.equal([name, id]);

			return {success: true};

		};

		return dare
			.patch({
				table: 'test',
				filter: {id},
				body: {name},
				limit
			});

	});

	it('should apply the request.duplicate_keys', async () => {

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'UPDATE IGNORE test a SET a.`name` = ? WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([name, id]);
			return {success: true};

		};

		return dare
			.patch({
				table: 'test',
				filter: {id},
				body: {name},
				duplicate_keys: 'ignore'
			});

	});

	it('should use table aliases', async () => {

		dare.execute = async ({sql, values}) => {

			// Limit: 1
			sqlEqual(sql, 'UPDATE tablename a SET a.`name` = ? WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([name, id]);
			return {success: true};

		};

		dare.options.models = {
			test: {
				table: 'tablename'
			}
		};

		return dare
			.patch({
				table: 'test',
				filter: {id},
				body: {name}
			});

	});


	it('should trigger pre handler, options.patch.[table]', async () => {

		const newName = 'andrew';

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'UPDATE tbl a SET a.`name` = ? WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([newName, id]);

			return {success: true};

		};

		dare.options.models = {
			tbl: {
				patch(req) {

					// Augment the request
					req.body.name = newName;

				}
			}
		};

		return dare
			.patch({
				table: 'tbl',
				filter: {id},
				body: {name}
			});

	});


	it('should trigger pre handler, options.patch.default, and wait for Promise to resolve', async () => {

		const newName = 'andrew';

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'UPDATE tbl a SET a.`name` = ? WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([newName, id]);
			return {success: true};

		};

		dare.options.models = {
			default: {
				async patch(req) {

					req.body.name = newName;

				}
			}
		};

		return dare
			.patch({
				table: 'tbl',
				filter: {id},
				body: {name}
			});

	});

	it('should trigger pre handler, and handle errors being thrown', async () => {

		const msg = 'snap';

		dare.options.models = {
			default: {
				patch() {

					// Augment the request
					throw new Error(msg);

				}
			}
		};

		const test = dare.patch({
			table: 'tbl',
			filter: {id},
			body: {name}
		});

		return expect(test)
			.to.be.eventually.rejectedWith(Error, msg);

	});

	it('should not exectute if the opts.skip request is marked', async () => {

		const skip = 'true';

		dare.options.models = {
			default: {
				patch(opts) {

					opts.skip = skip;

				}
			}
		};

		const resp = await dare
			.patch({
				table: 'tbl',
				filter: {id},
				body: {name}
			});


		expect(resp).to.eql(skip);

	});

	it('legacy: should support default patch()', async () => {

		const skip = 'true';

		const dare2 = dare.use({
			patch: {
				default(opts) {

					opts.skip = skip;

				}
			}
		});

		const resp = await dare2
			.patch({
				table: 'tbl',
				filter: {id},
				body: {name}
			});


		expect(resp).to.eql(skip);

	});


	it('should allow complex filters', async () => {

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'UPDATE tbl a SET a.`name` = ? WHERE a.id = ? AND (NOT a.number < ? OR a.number IS NULL) LIMIT 1');
			expect(values).to.deep.equal(['andrew', 1, '100']);
			return {success: true};

		};

		await dare
			.patch({
				table: 'tbl',
				filter: {id: 1, '-number': '..100'},
				body: {name: 'andrew'}
			});


	});


	it('disallow nested filters: should throw an exception', () => {

		dare.options.models = {
			tbl: {
				schema: {
					// Create a reference to tblB
					ref_id: ['tblB.id']
				}
			}
		};

		const test = dare
			.patch({
				table: 'tbl',
				filter: {
					id: 1,
					tblB: {
						id: 1
					}
				},
				body: {name: 'andrew'}
			});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.INVALID_REQUEST);

	});

});
