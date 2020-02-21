

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

			// Limit: 1
			sqlEqual(query, 'UPDATE test SET `name` = \'name\' WHERE id = 1 LIMIT 1');
			callback(null, {success: true});

		};

		const resp = await dare
			.patch('test', {id: 1}, {name: 'name'});
		expect(resp).to.have.property('success', true);

	});

	it('should throw an exception if affectedRows: 0', () => {

		dare.sql = () => Promise.resolve({affectedRows: 0});

		const test = dare
			.patch('groups', {id: 20000}, {name: 'name'});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.NOT_FOUND);

	});


	describe('validate formatting of input values', () => {

		[
			{
				given: 'field',
				expect: '\'field\''
			},
			{
				given: null,
				expect: 'null'
			}
		].forEach(({given, expect}) => {

			it(`should convert ${given} to ${expect}`, async () => {

				dare.execute = (query, callback) => {

					// Limit: 1
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


		[
			{
				key: 'value'
			},
			[
				1, 2, 3
			]
		].forEach(given => {

			it(`should throw an exception, given ${JSON.stringify(given)}`, async () => {

				const call = dare
					.patch({
						table: 'test',
						filter: {id: 1},
						body: {name: given}
					});

				return expect(call).to.be.eventually
					.rejectedWith(DareError, 'Field \'name\' does not accept objects as values')
					.and.have.property('code', DareError.INVALID_VALUE);

			});

		});


		describe('type=json', () => {

			beforeEach(() => {

				dare.options = {
					schema: {
						'test': {
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
								filter: {id: 1},
								body: {meta: given}
							});

						return expect(call).to.be.eventually
							.rejectedWith(DareError, 'Field \'meta\' must be an object')
							.and.have.property('code', DareError.INVALID_VALUE);

					});

				});

			// Valid inputs
			[{}, [], null]
				.forEach(given => {


					it(`should accept typeof object, given ${JSON.stringify(given)}`, async () => {

						const expect = given ? `'${JSON.stringify(given)}'` : 'null';

						dare.execute = (query, callback) => {

							// Limit: 1
							sqlEqual(query, `UPDATE test SET \`meta\` = ${expect} WHERE id = 1 LIMIT 1`);
							callback(null, {success: true});

						};

						return dare
							.patch({
								table: 'test',
								filter: {id: 1},
								body: {meta: given}
							});

					});

				});

		});


	});


	it('should apply the request.limit', async () => {

		dare.execute = (query, callback) => {

			// Limit: 1
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

			// Limit: 1
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

		const test = dare.patch({
			table: 'tbl',
			filter: {id: 1},
			body: {name: 'name'}
		});

		return expect(test)
			.to.be.eventually.rejectedWith(Error, msg);

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
