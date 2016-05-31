'use strict';

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');

describe('get', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.get', () => {
		expect(dare.get).to.be.a('function');
	});

	describe('Simple arguments', () => {

		it('should generate a SELECT statement and execute dare.execute', (done) => {

			dare.execute = (query, callback) => {
				// Defaults
				// Limit: 1
				// Fields: *
				expect(query).to.match(SQLEXP('SELECT test.* FROM test WHERE test.id = 1 LIMIT 1'));
				callback(null, [{id: 1}]);
			};

			dare
			.get('test', {id: 1})
			.then((resp) => {
				expect(resp).to.be.a('object');
				expect(resp).to.have.property('id', 1);
				done();
			}, done);

		});

		it('should create a query with custom fields', (done) => {

			dare.execute = (query, callback) => {
				expect(query).to.match(SQLEXP('SELECT test.id, test.name FROM test WHERE test.id = 1 LIMIT 1'));
				callback(null, [{id: 1}]);
			};

			dare
			.get('test', ['id', 'name'], {id: 1})
			.then((resp) => {
				expect(resp).to.have.property('id', 1);
				done();
			}, done);

		});


		it('should support array of value in the query condition', (done) => {

			dare.execute = (query, callback) => {
				expect(query).to.match(SQLEXP('SELECT test.id, test.name FROM test WHERE test.id IN (1, 2) LIMIT 2'));
				callback(null, [{id: 1, name: '1'}, {id: 2, name: '2'}]);
			};

			dare
			.get('test', ['id', 'name'], {id: [1, 2]}, {limit: 2})
			.then((resp) => {
				expect(resp).to.be.a('array');
				expect(resp.length).to.eql(2);
				expect(resp[0]).to.eql({id: 1, name: '1'});
				done();
			}, done);

		});

		it('should support wildcard characters for pattern matching', (done) => {

			dare.execute = (query, callback) => {
				expect(query).to.match(SQLEXP('SELECT test.id, test.name FROM test WHERE test.name LIKE \'And%\' LIMIT 5'));
				callback(null, [{id: 1, name: '1'}, {id: 2, name: '2'}]);
			};

			dare
			.get('test', ['id', 'name'], {name: 'And%'}, {limit: 5})
			.then((resp) => {
				expect(resp).to.be.a('array');
				done();
			}, done);

		});
		it('should have an overidable limit', (done) => {

			dare.execute = (query, callback) => {
				expect(query).to.match(SQLEXP('SELECT test.* FROM test WHERE test.id = 1 LIMIT 5'));
				callback(null, [{id: 1}]);
			};

			dare
			.get('test', {id: 1}, {limit: 5})
			.then((resp) => {
				expect(resp).to.be.a('array');
				expect(resp).to.eql([{id: 1}]);
				done();
			}, done);

		});


		it('should throw an error if limit is invalid', (done) => {

			dare.execute = () => {
				done('Should not execute');
			};

			dare
			.get('test', {id: 1}, {limit: null})
			.then(done, err => {
				expect(err).to.have.property('message');
				done();
			});

		});


		it('should throw an error where no limit was defined and an empty resultset was returned.', (done) => {

			dare.execute = (query, callback) => callback(null, []);

			dare
			.get('test', {id: 1})
			.then(done, err => {
				expect(err).to.have.property('code', 'NOT_FOUND');
				done();
			});

		});


		it('should let us pass through SQL functions', (done) => {

			dare.execute = (query, callback) => {
				expect(query).to.match(SQLEXP('SELECT count(*) AS _count FROM test WHERE test.id = 1 GROUP BY name LIMIT 1'));
				callback(null, [{id: 1}]);
			};

			dare
			.get('test', [{'_count': 'count(*)'}], {id: 1}, {groupby: 'name'})
			.then((resp) => {
				expect(resp).to.eql({id: 1});
				done();
			}, done);

		});

	});


	describe('Request Object', () => {



	});
});

