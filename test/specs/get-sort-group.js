const options = require('../data/options');

// Test Generic DB functions
const expectSQLEqual = require('../lib/sql-equal');

const limit = 5;

[{
	prop: 'orderby',
	SQL_EXPR: 'ORDER BY'
}, {
	prop: 'groupby',
	SQL_EXPR: 'GROUP BY'
}].forEach(({prop, SQL_EXPR}) => {

	describe(`Prop ${prop}`, () => {

		// Conditionally add ASC/DESCing if we're testing orderby
		const {ASC, DESC} = (prop === 'orderby' ? {ASC: ' ASC', DESC: ' DESC'} : {ASC: '', DESC: ''});

		let dare;

		beforeEach(() => {
			dare = new Dare(options);
		});

		it('should add orderby using nested tables', async() => {

			dare.sql = async sql => {

				const expected = `
					SELECT a.email, b.name AS 'name'
					FROM users_email a
					LEFT JOIN users b ON(b.id = a.user_id)
					${SQL_EXPR} b.name
					LIMIT 5
				`;

				expectSQLEqual(sql, expected);
				return [{}];
			};

			return dare.get({
				table: 'users_email',
				fields: ['users.name', 'email'],
				[prop]: [
					'users.name'
				],
				limit
			});
		});

		it('should use the field label', async() => {

			dare.sql = async sql => {

				const expected = `
					SELECT a.email, DATE(c.created) AS 'users.country.date', c.name AS 'CountryName'
					FROM users_email a
					LEFT JOIN users b ON(b.id = a.user_id)
					LEFT JOIN country c ON(c.id = b.country_id)
					${SQL_EXPR} \`users.country.date\`${DESC}, c.name${ASC}
					LIMIT 5
				`;

				expectSQLEqual(sql, expected);
				return [{}];
			};

			return dare.get({
				table: 'users_email',
				fields: [
					'email',
					{
						users: {
							country: {
								'date': 'DATE(created)'
							}
						}
					},
					{
						'CountryName': 'users.country.name'
					}
				],
				[prop]: [
					`users.country.date${DESC}`,
					`CountryName${ASC}`
				],
				limit
			});
		});
	});
});
