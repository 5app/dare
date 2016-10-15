'use strict';

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');

const error = require('../../src/utils/error');

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
		.patch('test', {id: 1}, {name: 'name'})
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
		.patch('groups', {id: 20000}, {name: 'name'})
		.then(() => {
			done('Should not be called');
		})
		.catch((err) => {
			expect(err).to.eql(error.NOT_FOUND);
			done();
		});
	});

	it('should understand a request object', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('UPDATE test SET name = \'name\' WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare
		.patch({
			table: 'test',
			filter: {id: 1},
			body: {name: 'name'}
		})
		.then(() => {
			done();
		}, done);
	});

	it('should apply the request.limit', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('UPDATE test SET name = \'name\' WHERE id = 1 LIMIT 111'));
			callback(null, {success: true});
		};

		dare
		.patch({
			table: 'test',
			filter: {id: 1},
			body: {name: 'name'},
			limit: 111
		})
		.then(() => {
			done();
		}, done);
	});

	it('should use table aliases', (done) => {

		dare.execute = (query, callback) => {
			// limit: 1
			expect(query).to.match(SQLEXP('UPDATE tablename SET name = \'name\' WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			table_alias: {
				'test': 'tablename'
			}
		};

		dare
		.patch({
			table: 'test',
			filter: {id: 1},
			body: {name: 'name'}
		})
		.then(() => {
			done();
		}, done);
	});


	it('should trigger pre handler, options.patch.[table]', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('UPDATE tbl SET name = \'andrew\' WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			patch: {
				'tbl': (req) => {
					// Augment the request
					req.body.name = 'andrew';
				}
			}
		};

		dare
		.patch({
			table: 'tbl',
			filter: {id: 1},
			body: {name: 'name'}
		})
		.then(() => {
			done();
		}, done);
	});


	it('should trigger pre handler, options.patch.default, and wait for Promise to resolve', (done) => {

		dare.execute = (query, callback) => {
			expect(query).to.match(SQLEXP('UPDATE tbl SET name = \'andrew\' WHERE id = 1 LIMIT 1'));
			callback(null, {success: true});
		};

		dare.options = {
			patch: {
				'default': (req) => {
					// Augment the request
					return Promise.resolve().then(() => {
						req.body.name = 'andrew';
					});
				}
			}
		};

		dare
		.patch({
			table: 'tbl',
			filter: {id: 1},
			body: {name: 'name'}
		})
		.then(() => {
			done();
		}, done);
	});

	it('should trigger pre handler, and handle errors being thrown', (done) => {

		// Should not be called...
		dare.execute = done;

		dare.options = {
			patch: {
				'default': () => {
					// Augment the request
					throw 'Can\'t touch this';
				}
			}
		};

		dare
		.patch({
			table: 'tbl',
			filter: {id: 1},
			body: {name: 'name'}
		})
		.then(done, () => {
			done();
		});
	});
});
