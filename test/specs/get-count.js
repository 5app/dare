

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

describe('get - found rows', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare();
		dare.execute = () => {

			throw new Error('Should not execute');

		};

	});

	it('should contain the function dare.count()', () => {

		expect(dare.count).to.be.a('function');

	});

	it('dare.count() should execute FOUND_ROWS() and return a single number', async () => {

		const count = 10;
		dare.execute = (query, callback) => {

			const expected = `
				SELECT FOUND_ROWS() AS count
			`;

			sqlEqual(query, expected);

			callback(null, [{count}]);

		};

		const resp = await dare.count();

		expect(resp).to.eql(count);

	});

	it('should return `count` when defined in request options', async () => {

		const data = [{name: 'hello'}];
		dare.execute = (query, callback) => {

			const expected = `
				SELECT SQL_CALC_FOUND_ROWS a.name
				FROM test a
				LIMIT 10
			`;

			sqlEqual(query, expected);

			callback(null, data);

		};

		const resp = await dare
			.get({
				table: 'test',
				fields: ['name'],
				limit: 10,
				count: true
			});

		expect(resp).to.eql(data);

	});

});

