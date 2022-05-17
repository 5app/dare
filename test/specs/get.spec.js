import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';

import DareError from '../../src/utils/error.js';

const id = 1;

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

	it('should not mutate the request object', async () => {

		const original = {
			table: 'test',
			fields: ['id', 'name'],
			groupby: ['name'],
			limit: 10,
			orderby: ['name']
		};

		dare.execute = async () => ([]);

		const request = {...original};

		await dare
			.get(request);

		// Check shallow clone
		expect(request).to.deep.equal(original);

		// Check deep clone
		expect(request).to.have.deep.property('fields', ['id', 'name']);
		expect(request).to.have.deep.property('orderby', ['name']);

	});

	it('should throw an error if table is empty', async () => {

		const request = {

			fields: ['id', 'name']

		};

		const call = dare.get(request);

		return expect(call).to.be.eventually
			.rejectedWith(DareError, '`table` option is undefined')
			.and.have.property('code', DareError.INVALID_REQUEST);

	});


	describe('Simple arguments', () => {

		const basic_record = {
			id,
			name: 'andrew'
		};

		const basic_fields = ['id', 'name'];

		it('should generate a SELECT statement and execute dare.execute', async () => {

			dare.execute = async ({sql, values}) => {

				/*
				 * Defaults
				 * Limit: 1
				 * Fields: *
				 */
				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? LIMIT 1');
				expect(values).to.deep.equal([id]);

				return [basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {id});


			expect(resp).to.be.a('object');
			expect(resp).to.eql(basic_record);

		});

		it('should create a query with fields', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? LIMIT 1');
				expect(values).to.deep.equal([id]);

				return [basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {id});

			expect(resp).to.eql(basic_record);

		});


		it('should support array of value in the query condition', async () => {

			const ids = [1, 2];

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id IN (?, ?) LIMIT 2');
				expect(values).to.deep.equal(ids);

				return [basic_record, basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {id: ids}, {limit: 2});

			expect(resp).to.be.a('array');
			expect(resp.length).to.eql(2);
			expect(resp[0]).to.eql(basic_record);

		});

		it('should support wildcard characters for pattern matching', async () => {

			const name = 'And%';
			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.name LIKE ? LIMIT 5');
				expect(values).to.deep.equal([name]);

				return [basic_record, basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {name}, {limit: 5});

			expect(resp).to.be.a('array');

		});

		it('should ignore $suffixing', async () => {

			const name = 'And%';
			const name$and = '%drew';
			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name, a.prop FROM test a WHERE a.name LIKE ? AND a.name LIKE ? LIMIT 5');
				expect(values).to.deep.equal([name, name$and]);

				return [basic_record, basic_record];

			};

			const resp = await dare
				.get('test', basic_fields.concat(['prop$ignore']), {name, name$and}, {limit: 5});

			expect(resp).to.be.a('array');

		});

		it('should have an overidable limit', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? LIMIT 5');
				expect(values).to.deep.equal([id]);
				return [basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {id}, {limit: 5});

			expect(resp).to.be.a('array');
			expect(resp).to.eql([basic_record]);

		});

		it('should have an overidable limit and start', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? LIMIT 4, 5');
				expect(values).to.deep.equal([id]);
				return [basic_record];

			};

			const resp = await dare
				.get('test', basic_fields, {id}, {limit: 5, start: 4});
			expect(resp).to.be.a('array');
			expect(resp).to.eql([basic_record]);

		});

		it('should throw an error if limit is invalid', () => {

			const test = dare.get('test', basic_fields, {id}, {limit: 0});

			return expect(test)
				.to.be.eventually.rejectedWith(DareError)
				.and.have.property('code', DareError.INVALID_LIMIT);

		});

		it('should throw an error if limit is invalid', () => {

			const test = dare.get('test', basic_fields, {id}, {limit: null});

			return expect(test)
				.to.be.eventually.rejectedWith(DareError)
				.and.have.property('code', DareError.INVALID_LIMIT);

		});


		it('should throw an error where no limit was defined and an empty resultset was returned.', () => {

			dare.execute = async () => ([]);

			const test = dare.get('test', basic_fields, {id});

			return expect(test)
				.to.be.eventually.rejectedWith(DareError)
				.and.have.property('code', DareError.NOT_FOUND);

		});

		it('should return value of notfound where no limit was defined and an empty resultset was returned.', async () => {

			dare.execute = async () => ([]);

			const notfound = 'whoops';

			const value = await dare.get('test', basic_fields, {id}, {notfound});

			expect(value).to.equal(notfound);

		});


		it('should passthrough an orderby', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? ORDER BY a.id LIMIT 1');
				expect(values).to.deep.equal([id]);

				return [basic_record];

			};

			return dare
				.get('test', basic_fields, {id}, {orderby: 'test.id'});

		});

		it('should re-alias orderby', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? ORDER BY a.id LIMIT 1');
				expect(values).to.deep.equal([id]);

				return [basic_record];

			};

			return dare
				.get('test', basic_fields, {id}, {orderby: 'id'});


		});

		it('should passthrough an orderby with direction', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT a.id, a.name FROM test a WHERE a.id = ? ORDER BY a.id DESC LIMIT 1');
				expect(values).to.deep.equal([id]);
				return [basic_record];

			};

			return dare
				.get('test', basic_fields, {id}, {orderby: 'id DESC'});

		});

		it('should use field labels in the orderby', async () => {

			dare.execute = async ({sql, values}) => {

				const expected = `
					SELECT DATE(a.created) AS 'date'
					FROM test a
					ORDER BY \`date\`
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{_count: 10}];

			};

			const resp = await dare.get('test', [{'date': 'DATE(created)'}], null, {orderby: 'date'});

			expect(resp).to.eql({_count: 10});

		});

		it('should use functions in the orderby', async () => {

			dare.execute = async ({sql, values}) => {

				const expected = `
					SELECT DATE(a.created) AS 'date'
					FROM test a
					ORDER BY DATE(a.created)
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{_count: 10}];

			};

			const resp = await dare.get('test', [{'date': 'DATE(created)'}], null, {orderby: 'DATE(created)'});

			expect(resp).to.eql({_count: 10});

		});

		it('should throw an error if fields is an empty array', () => {

			const test = dare.get('test', [], {id}, {groupby: 'id'});

			return expect(test)
				.to.be.eventually.rejectedWith(DareError)
				.and.have.property('code', DareError.INVALID_REQUEST);

		});

		it('should throw an error if missing fields on an unknown schema', () => {

			const test = dare.get('test', {id}, {groupby: 'id'});

			return expect(test)
				.to.be.eventually.rejectedWith(DareError)
				.and.have.property('code', DareError.INVALID_REQUEST);

		});

		it('should let us pass through SQL Functions', async () => {

			dare.execute = async ({sql, values}) => {

				sqlEqual(sql, 'SELECT count(a.*) AS \'_count\' FROM test a WHERE a.id = ? GROUP BY a.name LIMIT 1');
				expect(values).to.deep.equal([id]);
				return [{id}];

			};

			const resp = await dare
				.get('test', [{'_count': 'count(*)'}], {id}, {groupby: 'name'});

			expect(resp).to.eql({id});

		});

		it('should interpret _count as COUNT(*)', async () => {

			dare.execute = async ({sql, values}) => {

				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM test a
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{_count: 10}];

			};

			const resp = await dare
				.get('test', ['_count']);

			expect(resp).to.eql({_count: 10});

		});

		it('should use the special field _count as a label for orderby reference', async () => {

			dare.execute = async ({sql, values}) => {

				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM test a
					ORDER BY \`_count\`
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{_count: 10}];

			};

			const resp = await dare.get('test', ['_count'], null, {orderby: '_count'});

			expect(resp).to.eql({_count: 10});

		});

		it('should interpret _group as a shortcut to the groupby', async () => {

			dare.execute = async ({sql, values}) => {

				const expected = `
					SELECT DATE(a.created_time) AS '_group'
					FROM test a
					GROUP BY DATE(a.created_time)
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{_count: 10}];

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

