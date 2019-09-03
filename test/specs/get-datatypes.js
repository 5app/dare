
// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

// Create a schema
const options = require('../data/options');

describe('get - datatypes', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare(options);
		dare.execute = () => {

			throw new Error('Should not execute');

		};

	});

	it('should return `created_time` using DATE_FORMAT', async () => {

		const created_time = '2019-09-03T12:00:00Z';

		dare.execute = async query => {

			const expected = `
				SELECT DATE_FORMAT(a.created_time,'%Y-%m-%dT%TZ') AS 'created_time'
				FROM users a
				LIMIT 1
			`;

			sqlEqual(query, expected);

			return [{created_time}];

		};

		const resp = await dare
			.get({
				table: 'users',
				fields: ['created_time']
			});

		expect(resp).to.have.property('created_time', created_time);

	});

});

