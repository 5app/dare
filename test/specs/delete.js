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

	it('should use table aliases', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('DELETE FROM tablename WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			table_alias: {
				'test': 'tablename'
			}
		};

		dare
		.del({
			table: 'test',
			filter: {id: 1},
		})
		.then(() => {
			done();
		}, done);
	});

	it('should trigger pre handler, options.del.[table]', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('DELETE FROM tbl WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			del: {
				'tbl': (req) => {
					// Augment the request
					req.filter.id = 1;
				}
			}
		};

		dare
		.del({
			table: 'tbl',
			filter: {id: 2}
		})
		.then(() => {
			done();
		}, done);
	});


	it('should trigger pre handler, options.del.default, and wait for Promise to resolve', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('DELETE FROM tbl WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			del: {
				'default': (req) => {
					// Augment the request
					return Promise.resolve().then(() => {
						req.filter.id = 1;
					});
				}
			}
		};

		dare
		.del({
			table: 'tbl',
			filter: {id: 2}
		})
		.then(() => {
			done();
		}, done);
	});

	it('should trigger pre handler, and handle errors being thrown', (done) => {

		// Should not be called...
		dare.execute = done;

		dare.options = {
			del: {
				'default': () => {
					// Augment the request
					throw 'Can\'t touch this';
				}
			}
		};

		dare
		.del({
			table: 'tbl',
			filter: {id: 2}
		})
		.then(done, () => {
			done();
		});
	});
});
