
// Create a schema

describe('field alias', () => {

	let dare;
	const limit = 5;

	beforeEach(() => {

		// If the storage wants to use 'email', but the interface would optionally like to use 'emailAddress'
		dare = new Dare({
			schema: {
				'users': {
					'emailAddress': 'email'
				}
			}
		});

	});

	describe('get - SELECT', () => {

		it('should map field aliases defined in the schema into SELECT requests Fields and Filters', async () => {

			let sql;

			// Stub the execute function
			dare.sql = _sql => {

				sql = _sql;
				return [];

			};

			await dare.get({
				table: 'users',
				fields: [
					// Return the field using an alias name
					'emailAddress',

					// Return it by another alias
					{
						'field': 'emailAddress'
					},

					// Support a Function
					{
						'emailaddress': 'LOWER(emailAddress)'
					}
				],
				filter: {
					// Filter the results using the aliased name as the key
					'emailAddress': 'andrew%'
				},
				join: {
					'-emailAddress': null
				},
				limit
			});

			expect(sql).to.contain('email AS \'emailAddress\'');
			expect(sql).to.contain('email AS \'field\'');
			expect(sql).to.contain('email LIKE ?');
			expect(sql).to.contain('email IS NOT NULL');

		});

	});

	describe('patch - UPDATE', () => {

		it('should map field aliases defined in the schema into UPDATE filters', async () => {

			let sql;

			// Stub the execute function
			dare.sql = _sql => {

				sql = _sql;
				return [];

			};

			await dare.patch({
				table: 'users',
				body: {
					'emailAddress': 'andrew@example.com'
				},
				filter: {
					// Filter the results using the aliased name as the key
					'emailAddress': 'andrew%'
				}
			});

			expect(sql).to.contain('`email` = ?');
			expect(sql).to.contain('email LIKE ?');

		});

	});

});
