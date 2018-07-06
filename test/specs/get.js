'use strict';

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

const DareError = require('../../src/utils/error');

describe('get', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
		dare.execute = () => {
			throw new Error('Should not execute');
		};
	});

	it('should contain the function dare.get', () => {
		expect(dare.get).to.be.a('function');
	});

	describe('Simple arguments', () => {

		const basic_record = {
			id: 1,
			name: 'andrew'
		};

		const basic_fields = ['id', 'name'];

		it('should generate a SELECT statement and execute dare.execute', async() => {

			dare.execute = (query, callback) => {
				// Defaults
				// Limit: 1
				// Fields: *
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 LIMIT 1');
				callback(null, [basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {id: 1});

			expect(resp).to.be.a('object');
			expect(resp).to.eql(basic_record);

		});

		it('should create a query with fields', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 LIMIT 1');
				callback(null, [basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {id: 1});

			expect(resp).to.eql(basic_record);

		});


		it('should support array of value in the query condition', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id IN (1, 2) LIMIT 2');
				callback(null, [basic_record, basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {id: [1, 2]}, {limit: 2});

			expect(resp).to.be.a('array');
			expect(resp.length).to.eql(2);
			expect(resp[0]).to.eql(basic_record);

		});

		it('should support wildcard characters for pattern matching', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.name LIKE \'And%\' LIMIT 5');
				callback(null, [basic_record, basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {name: 'And%'}, {limit: 5});

			expect(resp).to.be.a('array');

		});

		it('should have an overidable limit', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 LIMIT 5');
				callback(null, [basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {id: 1}, {limit: 5});

			expect(resp).to.be.a('array');
			expect(resp).to.eql([basic_record]);

		});

		it('should have an overidable limit and start', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 LIMIT 4, 5');
				callback(null, [basic_record]);
			};

			const resp = await dare
				.get('test', basic_fields, {id: 1}, {limit: 5, start: 4});
			expect(resp).to.be.a('array');
			expect(resp).to.eql([basic_record]);

		});

		it('should throw an error if limit is invalid', async() => {


			try {
				await dare.get('test', basic_fields, {id: 1}, {limit: 0});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err).to.have.property('code', DareError.INVALID_LIMIT);
			}

		});

		it('should throw an error if limit is invalid', async() => {

			try {
				await dare.get('test', basic_fields, {id: 1}, {limit: null});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err).to.have.property('code', DareError.INVALID_LIMIT);
			}

		});


		it('should throw an error where no limit was defined and an empty resultset was returned.', async() => {

			dare.execute = (query, callback) => callback(null, []);

			try {
				await dare.get('test', basic_fields, {id: 1});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err).to.have.property('code', 'NOT_FOUND');
			}

		});


		it('should passthrough an orderby', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 ORDER BY a.id LIMIT 1');
				callback(null, [basic_record]);
			};

			return dare
				.get('test', basic_fields, {id: 1}, {orderby: 'id'});

		});

		it('should re-alias orderby', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 ORDER BY a.id LIMIT 1');
				callback(null, [basic_record]);
			};

			return dare
				.get('test', basic_fields, {id: 1}, {orderby: 'id'});


		});

		it('should passthrough an orderby with direction', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 ORDER BY a.id DESC LIMIT 1');
				callback(null, [basic_record]);
			};

			return dare
				.get('test', basic_fields, {id: 1}, {orderby: 'id DESC'});

		});

		it('should use field labels in the orderby', async() => {

			dare.execute = (query, callback) => {
				const expected = `
					SELECT DATE(a.created) AS 'date'
					FROM test a
					ORDER BY \`date\`
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			const resp = await dare.get('test', [{'date': 'DATE(created)'}], null, {orderby: 'date'});

			expect(resp).to.eql({_count: 10});
		});

		it('should use functions in the orderby', async() => {

			dare.execute = (query, callback) => {
				const expected = `
					SELECT DATE(a.created) AS 'date'
					FROM test a
					ORDER BY DATE(a.created)
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			const resp = await dare.get('test', [{'date': 'DATE(created)'}], null, {orderby: 'DATE(created)'});

			expect(resp).to.eql({_count: 10});
		});

		it('should throw an error if fields is an empty array', async() => {

			try {
				await dare.get('test', [], {id: 1}, {groupby: 'id'});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err).to.have.property('code', DareError.INVALID_REQUEST);
			}

		});

		it('should throw an error if missing fields on an unknown schema', async() => {

			try {
				await dare.get('test', {id: 1}, {groupby: 'id'});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err).to.have.property('code', DareError.INVALID_REQUEST);
			}

		});

		it('should let us pass through SQL Functions', async() => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT count(a.*) AS \'_count\' FROM test a WHERE a.id = 1 GROUP BY a.name LIMIT 1');
				callback(null, [{id: 1}]);
			};

			const resp = await dare
				.get('test', [{'_count': 'count(*)'}], {id: 1}, {groupby: 'name'});

			expect(resp).to.eql({id: 1});
		});

		it('should interpret _count as COUNT(*)', async() => {

			dare.execute = (query, callback) => {

				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM test a
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			const resp = await dare
				.get('test', ['_count']);

			expect(resp).to.eql({_count: 10});

		});

		it('should use the special field _count as a label for orderby reference', async() => {

			dare.execute = (query, callback) => {
				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM test a
					ORDER BY \`_count\`
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			const resp = await dare.get('test', ['_count'], null, {orderby: '_count'});

			expect(resp).to.eql({_count: 10});
		});

		it('should interpret _group as a shortcut to the groupby', async() => {

			dare.execute = (query, callback) => {

				const expected = `
					SELECT DATE(a.created_time) AS '_group'
					FROM test a
					GROUP BY DATE(a.created_time)
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			const resp = await dare
				.get({
					table: 'test',
					fields: ['_group'],
					groupby: 'DATE(created_time)'
				});

			expect(resp).to.eql({_count: 10});

		});
	});
});

