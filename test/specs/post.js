'use strict';

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');

describe('post', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.post', () => {
		expect(dare.post).to.be.a('function');
	});

	it('should generate an INSERT statement and execute dare.execute', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('INSERT INTO test (id) VALUES (1)'));
			callback(null, {id: 1});
		};

		dare
		.post('test', {id: 1})
		.then((resp) => {
			expect(resp).to.have.property('id', 1);
			done();
		}, done);

	});


	it('should accept an Array of records to insert', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('INSERT INTO test (id, name, field) VALUES (1, \'1\', DEFAULT), (2, \'2\', \'extra\')'));
			callback(null, []);
		};

		dare
		.post('test', [{id: 1, name: '1'}, {name: '2', id: 2, field: 'extra'}])
		.then(() => {
			done();
		}, done);

	});


	it('should accept option.duplicate_keys=ignore', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('INSERT IGNORE INTO test (id) VALUES (1)'));
			done();
			callback({});
		};

		dare
		.post('test', {id: 1}, {duplicate_keys: 'ignore'});

	});

	it('should understand a request object', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('INSERT INTO test (name) VALUES (\'name\')'));
			callback(null, {success: true});
		};

		dare
		.post({
			table: 'test',
			body: {name: 'name'}
		})
		.then(() => {
			done();
		}, done);
	});

});
