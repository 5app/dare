
// Create a schema

describe('field alias', () => {

	let dare;
	const limit = 5;

	beforeEach(() => {

		// If the storage wants to use 'email', but the interface would optionally like to use 'emailAddress'
		dare = new Dare({
			schema: {
				'users': {
					'emailAddress': 'email',
					'country_id': 'country.id'
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
					},

					// Should not map a reference, even though it has a similar string structure
					'country_id'

				],
				filter: {
					// Filter the results using the aliased name as the key
					'emailAddress': 'andrew%',

					// Should not map a reference, even though it has a similar string structure
					'country_id': 1
				},
				join: {
					// Should equally apply the alias mapping to joins
					'-emailAddress': null,

					// Should not map a reference, even though it has a similar string structure
					'-country_id': null
				},
				limit
			});

			expect(sql).to.contain('email AS \'emailAddress\'');
			expect(sql).to.contain('email AS \'field\'');
			expect(sql).to.contain('LOWER(a.email) AS \'emailaddress\'');
			expect(sql).to.contain(',a.country_id');
			expect(sql).to.contain('email LIKE ?');
			expect(sql).to.contain('country_id = ?');
			expect(sql).to.contain('email IS NOT NULL');
			expect(sql).to.contain('country_id IS NOT NULL');


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
					// Should map this to `email`
					'emailAddress': 'andrew@example.com',

					// Should not change this, aka map this to `country_id``
					'country_id': 1
				},
				filter: {
					// Filter the results using the aliased name as the key
					'emailAddress': 'andrew%'
				}
			});

			expect(sql).to.contain('`email` = ?');
			expect(sql).to.contain('`country_id` = ?');
			expect(sql).to.contain('email LIKE ?');

		});

	});

	describe('del - DELETE', () => {

		it('should map field aliases defined in the schema into DELETE filters', async () => {

			let sql;

			// Stub the execute function
			dare.sql = _sql => {

				sql = _sql;
				return [];

			};

			await dare.del({
				table: 'users',
				filter: {
					// Filter the results using the aliased name as the key
					'emailAddress': 'andrew%',

					// Should not map a reference, even though it has a similar string structure
					'country_id': 1
				}
			});

			expect(sql).to.contain('email LIKE ?');

			expect(sql).to.contain('country_id = ?');

		});

	});


	describe('post - INSERT', () => {

		it('should map field aliases defined in the schema into INSERT body', async () => {

			let sql;

			// Stub the execute function
			dare.sql = _sql => {

				sql = _sql;
				return [];

			};

			await dare.post({
				table: 'users',
				body: [{
					// Should map this to `email`
					'emailAddress': 'andrew@example.com',

					// Should leave this unchanged and map to country_id
					'country_id': 1
				}],
				duplicate_keys_update: ['emailAddress', 'country_id']
			});

			expect(sql).to.contain('(`email`,`country_id`)');

			// ON DUPLICATE KEY UPDATE
			expect(sql).to.contain('email=VALUES(email)');
			expect(sql).to.contain('country_id=VALUES(country_id)');


		});

	});

});
