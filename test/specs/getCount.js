const Dare = require('../../src/');

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

const id = 1;
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

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, 'SELECT COUNT(DISTINCT a.id) AS \'count\' FROM test a WHERE a.id = ? LIMIT 1');
			expect(values).to.deep.equal([id]);
			return [{count}];

		};

		const resp = await dare
			.getCount('test', {id});

		expect(resp).to.eql(count);

	});

	it('should remove the groupby to the fields section', async () => {

		dare.execute = async ({sql, values}) => {

			const expected = `
				SELECT COUNT(DISTINCT DATE(a.created_time)) AS 'count'
				FROM test a
				LIMIT 1
			`;

			sqlEqual(sql, expected);
			expect(values).to.deep.equal([]);

			return [{count}];

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

		dare.execute = async ({sql, values}) => {

			const expected = `
				SELECT COUNT(DISTINCT DATE(a.created_time), a.name) AS 'count'
				FROM test a
				LIMIT 1
			`;

			sqlEqual(sql, expected);
			expect(values).to.deep.equal([]);

			return [{count}];

		};

		const resp = await dare
			.getCount({
				table: 'test',
				fields: ['id', 'name'],
				groupby: ['DATE(created_time)', 'name'],
				start: 10,
				limit: 10
			});

		expect(resp).to.eql(count);

	});

	it('should not mutate the request object', async () => {

		const original = {
			table: 'test',
			fields: ['id', 'name'],
			groupby: ['DATE(created_time)', 'name'],
			orderby: ['name']
		};

		dare.execute = async () => [{count}];

		const request = {...original};

		await dare
			.getCount(request);

		// Check shallow clone
		expect(request).to.deep.equal(original);

		// Check deep clone
		expect(request).to.have.deep.property('fields', ['id', 'name']);
		expect(request).to.have.deep.property('orderby', ['name']);

	});

});

