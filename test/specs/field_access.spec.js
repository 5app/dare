const Dare = require('../../src/');
// Test whether fields can be declared as immutable and unreadable
const DareError = require('../../src/utils/error');

describe('field access', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare({
			models: {
				'users': {
					schema: {

						// Write is disabled, whilst id is readable
						'id': {
							writeable: false
						},
						// Password is not readable or writable
						'password': false
					}
				}
			}
		});

	});

	describe('get - SELECT', () => {

		[
			'password',
			{
				'name': 'password'
			},
			{
				'name': 'CHAR(password)'
			}
		]
			.forEach(field => {

				it(`should prevent access to non-readable field: ${JSON.stringify(field)}`, () => {

					const call = dare.get({
						table: 'users',
						fields: [
							// Password is non-readable
							field
						]
					});

					return expect(call).to.be.eventually
						.rejectedWith(DareError, 'Field \'password\' is not readable')
						.and.have.property('code', DareError.INVALID_REFERENCE);

				});

			});

	});

	describe('patch - UPDATE', () => {

		it('should prevent mutations on non-writable fields', () => {

			const call = dare.patch({
				table: 'users',
				body: {
					//  'id' cannot be mutated
					'id': 1337
				},
				filter: {
					'id': 1
				}
			});

			return expect(call).to.be.eventually
				.rejectedWith(DareError, 'Field \'id\' is not writeable')
				.and.have.property('code', DareError.INVALID_REFERENCE);

		});

	});

	describe('post - INSERT', () => {

		it('should prevent inserts on non-writable fields', () => {

			const call = dare.post({
				table: 'users',
				body: {
					//  'id' can not be inserted
					'id': 1337
				}
			});

			return expect(call).to.be.eventually
				.rejectedWith(DareError, 'Field \'id\' is not writeable')
				.and.have.property('code', DareError.INVALID_REFERENCE);

		});

	});

});
