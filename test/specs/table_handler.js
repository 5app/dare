'use strict';

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
			table_conditions: {
				users(item, options) {

					// Add the join condition domain_id
					const cond = {
						domain_id: options.meta.domain_id
					};
					// Update table join conditions
					item.join = Object.assign(item.join || {}, cond);
				}
			},
			meta: {
				domain_id: 10
			}
		});

	});

	it('table handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('table_handler');
	});

	it('should apply the table_conditions rules to a table definitions', () => {

		const resp = dare.table_handler({
			table: 'users',
			alias: 'peeps',
			join_conditions: {
				id: 1000
			}
		});

		expect(resp).to.deep.equal({
			table: 'users',
			alias: 'peeps',
			join_conditions: {
				id: 1000
			},
			join: {
				domain_id: 10
			}
		});

	});

	it('should add joined tables when table_conditions points to another table', () => {

		dare.options.table_conditions.emails = 'users';

		const resp = dare.table_handler({
			table: 'emails',
			alias: 'peeps'
		});

		const unique_alias = dare.current_unique_alias;

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

	it('should apply the rules on dare.get', done => {

		dare.execute = (sql, callback) => {
			// Expect the left join to include the options table_conditions
			expect(sql).to.match(/LEFT JOIN users\s+ON \(users\.domain_id = 10 AND users\.id = emails\.user_id\)/);
			callback(null, [{}]);
		};

		dare.get({
			table: 'emails',
			fields: [
				'email',
				{'users': ['id', 'name']}
			]
		})
			.then(() => done(), done);

	});

});
