// Format Request
// Takes a simple request object and explodes it into a more comprehensive object using the schema

'use strict';

const error = require('../../src/utils/error');

describe('format_request', () => {

	let dare;

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use();
	});

	it('should be defined in instances of Dare', () => {
		expect(dare).to.have.property('format_request');
	});

	it('should return a promise', () => {
		expect(dare.format_request()).to.have.property('then');
	});

	describe('aliasing', () => {

		it('should call table_alias_handler on the given object and update the table and alias property', done => {

			let table = 'alias';
			let filter = {id: 1};
			let fields = ['name'];

			let actualtable = 'table';

			dare.table_alias_handler = () => actualtable;

			dare.format_request('put', {
				table,
				filter,
				fields
			}).then(resp => {
				expect(resp).to.deep.equal({
					fields,
					table: actualtable,
					alias: table,
					filter,
					limit: 1,
					single: true
				});
				done();
			})
			.catch(done);

		});

		it('should throw an error if falsly on root table', done => {

			// Should not call sql
			dare.sql = done;

			dare.table_alias_handler = () => (false);

			dare.get({
				table: 'private',
				fields: ['id']
			})
			.then(done, err => {
				expect(err.code).to.eql(error.INVALID_REFERENCE.code);
				expect(err).to.have.property('message');
				done();
			}).catch(done);
		});
	});


	describe('limiting', () => {

		let options = {
			table: 'tbl',
			fields: ['id']
		};

		describe('limit', () => {

			describe('should accept', () => {

				['90', 90, '99', 1].forEach(limit => {

					it('valid: ' + limit + ' (' + (typeof limit) + ')', done => {

						dare.format_request('get', Object.assign({}, options, {limit}))
						.then(() => done())
						.catch(done);

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', 0, -1, 101, NaN, {}, null].forEach(limit => {

					it('invalid: ' + limit + ' (' + (typeof limit) + ')', done => {

						dare.format_request('get', Object.assign({}, options, {limit}))
						.then(done, err => {
							expect(err.code).to.eql(error.INVALID_LIMIT.code);
							expect(err).to.have.property('message');
							done();
						});

					});

				});
			});
		});

		describe('start', () => {

			describe('should accept', () => {

				['90', 90, '99', 1].forEach(start => {

					it('valid: ' + start + ' (' + (typeof start) + ')', done => {

						dare.format_request('get', Object.assign({}, options, {start}))
						.then(() => done())
						.catch(done);

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', -1, NaN, {}, null].forEach(start => {

					it('invalid: ' + start + ' (' + (typeof start) + ')', done => {

						dare.format_request('get', Object.assign({}, options, {start}))
						.then(done, err => {
							expect(err.code).to.eql(error.INVALID_START.code);
							expect(err).to.have.property('message');
							done();
						});

					});

				});
			});
		});

	});
});
