'use strict';

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

const DareError = require('../../src/utils/error');

describe('get', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.get', () => {
		expect(dare.get).to.be.a('function');
	});

	describe('Simple arguments', () => {

		it('should generate a SELECT statement and execute dare.execute', done => {

			dare.execute = (query, callback) => {
				// Defaults
				// Limit: 1
				// Fields: *
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1})
				.then(resp => {
					expect(resp).to.be.a('object');
					expect(resp).to.have.property('id', 1);
					done();
				})
				.catch(done);

		});

		it('should create a query with fields', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id = 1 LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', ['id', 'name'], {id: 1})
				.then(resp => {
					expect(resp).to.have.property('id', 1);
					done();
				})
				.catch(done);

		});


		it('should support array of value in the query condition', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.id IN (1, 2) LIMIT 2');
				callback(null, [{id: 1, name: '1'}, {id: 2, name: '2'}]);
			};

			dare
				.get('test', ['id', 'name'], {id: [1, 2]}, {limit: 2})
				.then(resp => {
					expect(resp).to.be.a('array');
					expect(resp.length).to.eql(2);
					expect(resp[0]).to.eql({id: 1, name: '1'});
					done();
				})
				.catch(done);

		});

		it('should support wildcard characters for pattern matching', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT a.id, a.name FROM test a WHERE a.name LIKE \'And%\' LIMIT 5');
				callback(null, [{id: 1, name: '1'}, {id: 2, name: '2'}]);
			};

			dare
				.get('test', ['id', 'name'], {name: 'And%'}, {limit: 5})
				.then(resp => {
					expect(resp).to.be.a('array');
					done();
				})
				.catch(done);

		});
		it('should have an overidable limit', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 LIMIT 5');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1}, {limit: 5})
				.then(resp => {
					expect(resp).to.be.a('array');
					expect(resp).to.eql([{id: 1}]);
					done();
				})
				.catch(done);

		});

		it('should have an overidable limit and start', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 LIMIT 4, 5');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1}, {limit: 5, start: 4})
				.then(resp => {
					expect(resp).to.be.a('array');
					expect(resp).to.eql([{id: 1}]);
					done();
				})
				.catch(done);

		});

		it('should throw an error if limit is invalid', done => {

			dare.execute = () => {
				done('Should not execute');
			};

			dare
				.get('test', {id: 1}, {limit: 0})
				.then(done, err => {
					expect(err).to.have.property('message');
					done();
				})
				.catch(done);

		});

		it('should throw an error if limit is invalid', done => {

			dare.execute = () => {
				done('Should not execute');
			};

			dare
				.get('test', {id: 1}, {limit: null})
				.then(done, err => {
					expect(err).to.have.property('message');
					done();
				})
				.catch(done);

		});


		it('should throw an error where no limit was defined and an empty resultset was returned.', done => {

			dare.execute = (query, callback) => callback(null, []);

			dare
				.get('test', {id: 1})
				.then(done, err => {
					expect(err).to.have.property('code', 'NOT_FOUND');
					done();
				})
				.catch(done);

		});


		it('should passthrough an orderby', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 ORDER BY a.id LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1}, {orderby: 'id'})
				.then(() => {
					done();
				})
				.catch(done);

		});

		it('should re-alias orderby', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 ORDER BY a.id LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1}, {orderby: 'test.id'})
				.then(() => {
					done();
				})
				.catch(done);

		});

		it('should passthrough an orderby with direction', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT * FROM test a WHERE a.id = 1 ORDER BY a.id DESC LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', {id: 1}, {orderby: 'id DESC'})
				.then(() => {
					done();
				})
				.catch(done);

		});

		it('should throw an error if missing fields', done => {

			dare.execute = done;

			dare
				.get('test', [], {id: 1}, {groupby: 'id'})
				.then(done, err => {
					expect(err).to.have.property('code', DareError.INVALID_REQUEST);
					done();
				})
				.catch(done);

		});

		it('should let us pass through SQL Functions', done => {

			dare.execute = (query, callback) => {
				sqlEqual(query, 'SELECT count(*) AS \'_count\' FROM test a WHERE a.id = 1 GROUP BY a.name LIMIT 1');
				callback(null, [{id: 1}]);
			};

			dare
				.get('test', [{'_count': 'count(*)'}], {id: 1}, {groupby: 'name'})
				.then(resp => {
					expect(resp).to.eql({id: 1});
					done();
				})
				.catch(done);

		});

		it('should interpret _count as COUNT(*)', done => {

			dare.execute = (query, callback) => {

				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM test a
					LIMIT 1
				`;

				sqlEqual(query, expected);

				callback(null, [{_count: 10}]);
			};

			dare
				.get('test', ['_count'])
				.then(resp => {
					expect(resp).to.eql({_count: 10});
					done();
				})
				.catch(done);

		});

		it('should interpret _group as a shortcut to the groupby', done => {

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

			dare
				.get({
					table: 'test',
					fields: ['_group'],
					groupby: 'DATE(created_time)'
				})
				.then(resp => {
					expect(resp).to.eql({_count: 10});
					done();
				})
				.catch(done);

		});
	});
});

