'use strict';

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');

describe('del', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.del', () => {
		expect(dare.del).to.be.a('function');
	});

	it('should generate an DELETE statement and execute dare.execute', (done) => {

		dare.execute = (sql, callback) => {
			// limit: 1
			expect(sql).to.match(SQLEXP('DELETE FROM test WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare
		.del('test', {id: 1})
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
		.del('groups', {name: 'name'}, {id: 20000})
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
