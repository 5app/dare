'use strict';

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');

describe('patch', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.patch', () => {
		expect(dare.patch).to.be.a('function');
	});

	it('should generate an UPDATE statement and execute dare.execute', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('UPDATE test SET name = \'name\' WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare
		.patch('test', {name: 'name'}, {id: 1})
		.then((resp) => {
			expect(resp).to.have.property('success', true);
			done();
		}, done);
	});

	it('should throw an exception if affectedRows: 0', (done) => {

		dare.sql = () => {
			return Promise.resolve({affectedRows: 0});
		};

		dare
		.patch('groups', {name: 'name'}, {id: 20000})
		.then(() => {
			done('Should not be called');
		})
		.catch((err) => {
			expect(err).to.have.property('status', 404);
			expect(err).to.have.property('message', 'Not Found');
			done();
		});
	});
});
