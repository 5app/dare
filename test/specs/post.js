'use strict';

// Test Generic DB functions
const sqlEqual = require('../lib/sql-equal');

describe('post', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();

		// Should not be called...
		dare.execute = () => {
			throw new Error('execute called');
		};
	});

	it('should contain the function dare.post', () => {
		expect(dare.post).to.be.a('function');
	});

	it('should generate an INSERT statement and execute dare.execute', async() => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'INSERT INTO test (id) VALUES (1)');
			callback(null, {id: 1});
		};

		const resp = await dare
			.post('test', {id: 1});
		expect(resp).to.have.property('id', 1);

	});


	it('should accept an Array of records to insert', async() => {

		dare.execute = (query, callback) => {
			sqlEqual(query, `
				INSERT INTO test (id, name, field)
				VALUES (1, '1', DEFAULT), (2, '2', 'extra')
			`);
			callback(null, []);
		};

		return dare
			.post('test', [{id: 1, name: '1'}, {name: '2', id: 2, field: 'extra'}]);

	});


	it('should accept option.duplicate_keys=ignore', async() => {

		let called;

		dare.execute = (query, callback) => {
			called = 1;
			sqlEqual(query, 'INSERT IGNORE INTO test (id) VALUES (1)');
			callback(null, {});
		};

		await dare
			.post('test', {id: 1}, {duplicate_keys: 'ignore'});

		expect(called).to.eql(1);

	});

	it('should understand a request object', async() => {

		dare.execute = (query, callback) => {
			// limit: 1
			sqlEqual(query, 'INSERT INTO test (name) VALUES (\'name\')');
			callback(null, {success: true});
		};

		return dare
			.post({
				table: 'test',
				body: {name: 'name'}
			});
	});


	it('should trigger pre handler, options.post.[table]', async() => {

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

		return dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			});
	});


	it('should trigger pre handler, options.post.default, and wait for Promise to resolve', async() => {

		dare.execute = (query, callback) => {
			sqlEqual(query, 'INSERT INTO tbl (name) VALUES (\'andrew\')');
			callback(null, {success: true});
		};

		dare.options = {
			post: {
				'default': async req => {
					// Augment the request
					req.body.name = 'andrew';
				}
			}
		};

		return dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			});
	});

	it('should trigger pre handler, and handle errors being thrown', async() => {

		const msg = 'snap';

		dare.options = {
			post: {
				'default': () => {
					// Augment the request
					throw new Error(msg);
				}
			}
		};

		try {
			await dare
				.post({
					table: 'tbl',
					body: {name: 'name'}
				});

			throw new Error('expected failure');
		}
		catch (err) {
			expect(err.message).to.eql(msg);
		}
	});

	it('should not exectute if the opts.skip request is marked', async() => {

		const skip = 'true';

		dare.options = {
			post: {
				default(opts) {
					opts.skip = skip;
				}
			}
		};

		const resp = await dare
			.post({
				table: 'tbl',
				body: {name: 'name'}
			});

		expect(resp).to.eql(skip);
	});
});
