'use strict';

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

describe('post', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('should contain the function dare.post', () => {
		expect(dare.post).to.be.a('function');
	});

	it('should generate an INSERT statement and execute dare.execute', done => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'INSERT INTO test (id) VALUES (1)');
			callback(null, {id: 1});
		};

		dare
			.post('test', {id: 1})
			.then(resp => {
				expect(resp).to.have.property('id', 1);
				done();
			}, done);

	});


	it('should accept an Array of records to insert', done => {

		dare.execute = (query, callback) => {
			sqlEqual(query, `
				INSERT INTO test (id, name, field)
				VALUES (1, '1', DEFAULT), (2, '2', 'extra')
			`);
			callback(null, []);
		};

		dare
			.post('test', [{id: 1, name: '1'}, {name: '2', id: 2, field: 'extra'}])
			.then(() => {
				done();
			}, done);

	});


	it('should accept option.duplicate_keys=ignore', done => {

		let called;

		dare.execute = (query, callback) => {
			called = 1;
			sqlEqual(query, 'INSERT IGNORE INTO test (id) VALUES (1)');
			callback(null, {});
		};

		dare
			.post('test', {id: 1}, {duplicate_keys: 'ignore'})
			.then(() => {
				expect(called).to.eql(1);
				done();
			})
			.catch(done);

	});

	it('should understand a request object', done => {

		dare.execute = (query, callback) => {
			// limit: 1
			sqlEqual(query, 'INSERT INTO test (name) VALUES (\'name\')');
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


	it('should trigger pre handler, options.post.[table]', done => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'INSERT INTO tbl (name) VALUES (\'andrew\')');
			callback(null, {success: true});
		};

		dare.options = {
			post: {
				'tbl': req => {
					// Augment the request
					req.body.name = 'andrew';
				}
			}
		};

		dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			})
			.then(() => {
				done();
			}, done);
	});


	it('should trigger pre handler, options.post.default, and wait for Promise to resolve', done => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'INSERT INTO tbl (name) VALUES (\'andrew\')');
			callback(null, {success: true});
		};

		dare.options = {
			post: {
				'default': req =>
					// Augment the request
					Promise.resolve().then(() => {
						req.body.name = 'andrew';
					})
			}
		};

		dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			})
			.then(() => {
				done();
			}, done);
	});

	it('should trigger pre handler, and handle errors being thrown', done => {

		// Should not be called...
		dare.execute = done;

		dare.options = {
			post: {
				'default': () => {
					// Augment the request
					throw new Error('Can\'t touch this');
				}
			}
		};

		dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			})
			.then(done, () => {
				done();
			});
	});

	it('should not exectute if the opts.skip request is marked', done => {

		// Should not be called...
		dare.execute = done;

		const skip = 'true';

		dare.options = {
			post: {
				default(opts) {
					opts.skip = skip;
				}
			}
		};

		dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			})
			.then(resp => {
				expect(resp).to.eql(skip);
				done();
			});
	});
});
