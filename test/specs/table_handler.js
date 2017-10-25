'use strict';

const DareError = require('../../src/utils/error');


describe('table_handler', () => {

	let dare;

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		// Setup test schema
		dare = dare.use({
			schema: {
				'users': {

				},
				'emails': {
					user_id: 'users.id'
				}
			},
			table_conditions: {},
			meta: {
				domain_id: 10
			}
		});

	});

	it('table handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('table_handler');
	});


	it('should add joined tables when table_conditions points to another table', () => {

		dare.options.table_conditions.emails = 'users';

		const resp = dare.table_handler({
			table: 'emails',
			alias: 'peeps'
		});

		const unique_alias = dare.get_unique_alias(0);

		expect(resp).to.deep.equal({
			table: 'emails',
			alias: 'peeps',
			joined: {
				[unique_alias]: {
					table: 'users',
					required_join: true
				}
			}
		});

	});

	it('should reuse joined tables when table_conditions points to an existing join table, and add required_join flag', () => {

		dare.options.table_conditions.emails = 'users';

		const resp = dare.table_handler({
			table: 'emails',
			alias: 'peeps',
			joined: {
				users: {
					alias: 'users'
				},
				somethingElse: {
					alias: 'pass through'
				}
			}

		});

		expect(resp).to.deep.equal({
			table: 'emails',
			alias: 'peeps',
			joined: {
				somethingElse: {
					alias: 'pass through'
				},
				users: {
					alias: 'users',
					required_join: true
				}
			}
		});

	});

	it('should throw an error if the table_condition is not a string', () => {

		dare.options.table_conditions.emails = () => {};

		try {
			dare.table_handler({
				table: 'emails',
				alias: 'peeps'
			});
		}
		catch (e) {
			expect(e).to.be.instanceof(DareError);
			expect(e).to.have.property('code', DareError.INVALID_IMPLEMENTATION);
			return;
		}

		throw new Error('Should have thrown an exception');

	});

});
