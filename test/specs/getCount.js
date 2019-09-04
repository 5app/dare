

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

describe('getCount', () => {

	let dare;
	const count = 123;

	beforeEach(() => {

		dare = new Dare();
		dare.execute = () => {

			throw new Error('Should not execute');

		};

	});

	it('should contain the function dare.getCount', () => {

		expect(dare.getCount).to.be.a('function');

	});

	it('should generate a SELECT statement and execute dare.execute', async () => {

		dare.execute = (query, callback) => {

			sqlEqual(query, 'SELECT COUNT(DISTINCT a.id) AS \'count\' FROM test a WHERE a.id = 1 LIMIT 1');
			callback(null, [{count}]);

		};

		const resp = await dare
			.getCount('test', ['id', 'name'], {id: 1});

		expect(resp).to.eql(count);

	});


	it('should remove the groupby to the fields section', async () => {

		dare.execute = (query, callback) => {

			const expected = `
				SELECT COUNT(DISTINCT DATE(a.created_time)) AS 'count'
				FROM test a
				LIMIT 1
			`;

			sqlEqual(query, expected);

			callback(null, [{count}]);

		};

		const resp = await dare
			.getCount({
				table: 'test',
				fields: ['_group'],
				groupby: 'DATE(created_time)'
			});

		expect(resp).to.eql(count);

	});

	it('should apply multiple groupby', async () => {

		dare.execute = (query, callback) => {

			const expected = `
				SELECT COUNT(DISTINCT DATE(a.created_time), a.name) AS 'count'
				FROM test a
				LIMIT 1
			`;

			sqlEqual(query, expected);

			callback(null, [{count}]);

		};

		const resp = await dare
			.getCount({
				table: 'test',
				fields: ['id', 'name'],
				groupby: ['DATE(created_time)', 'name']
			});

		expect(resp).to.eql(count);

	});

});

