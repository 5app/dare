import {expect} from 'chai';
import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';

import DareError from '../../src/utils/error.js';

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

	it('should generate an INSERT statement and execute dare.execute', async () => {
		dare.execute = async ({sql, values}) => {
			sqlEqual(sql, 'INSERT INTO test (`id`) VALUES (?)');
			expect(values).to.deep.equal([1]);
			return {id: 1};
		};

		const resp = await dare.post('test', {id: 1});
		expect(resp).to.have.property('id', 1);
	});

	it('should accept an Array of records to insert', async () => {
		dare.execute = async ({sql, values}) => {
			sqlEqual(
				sql,
				`
				INSERT INTO test (\`id\`, \`name\`, \`field\`)
				VALUES (?, ?, DEFAULT), (?, ?, ?)
			`
			);
			expect(values).to.deep.equal([1, '1', 2, '2', 'extra']);
			return [];
		};

		return dare.post('test', [
			{id: 1, name: '1'},
			{name: '2', id: 2, field: 'extra'},
		]);
	});

	it('should accept option.duplicate_keys=ignore', async () => {
		let called;

		dare.execute = async ({sql, values}) => {
			called = 1;
			sqlEqual(
				sql,
				'INSERT INTO test (`id`) VALUES (?) ON DUPLICATE KEY UPDATE test._rowid=test._rowid'
			);
			expect(values).to.deep.equal([1]);
			return {};
		};

		await dare.post('test', {id: 1}, {duplicate_keys: 'ignore'});

		expect(called).to.eql(1);
	});

	it('should accept option.ignore=true', async () => {
		let called;

		dare.execute = async ({sql, values}) => {
			called = 1;
			sqlEqual(sql, 'INSERT IGNORE INTO test (`id`) VALUES (?)');
			expect(values).to.deep.equal([1]);
			return {};
		};

		await dare.post('test', {id: 1}, {ignore: true});

		expect(called).to.eql(1);
	});

	it('should accept option.update=[field1, field2, ...fieldn]', async () => {
		let called;

		dare.execute = async ({sql, values}) => {
			called = 1;
			sqlEqual(
				sql,
				'INSERT INTO test (`id`, `name`, `age`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `age`=VALUES(`age`)'
			);
			expect(values).to.deep.equal([1, 'name', 38]);
			return {};
		};

		await dare.post(
			'test',
			{id: 1, name: 'name', age: 38},
			{duplicate_keys_update: ['name', 'age']}
		);

		expect(called).to.eql(1);
	});

	it('should understand a request object', async () => {
		dare.execute = async ({sql, values}) => {
			// Limit: 1
			sqlEqual(sql, 'INSERT INTO test (`name`) VALUES (?)');
			expect(values).to.deep.equal(['name']);

			return {success: true};
		};

		return dare.post({
			table: 'test',
			body: {name: 'name'},
		});
	});

	it('should trigger pre handler, options.post.[table]', async () => {
		dare.execute = async ({sql, values}) => {
			sqlEqual(sql, 'INSERT INTO tbl (`name`) VALUES (?)');
			expect(values).to.deep.equal(['andrew']);
			return {success: true};
		};

		dare.options.models = {
			tbl: {
				post(req) {
					// Augment the request
					req.body.name = 'andrew';
				},
			},
		};

		return dare.post({
			table: 'tbl',
			body: {name: 'name'},
		});
	});

	it('should trigger pre handler, options.post.default, and wait for Promise to resolve', async () => {
		dare.execute = async ({sql, values}) => {
			sqlEqual(sql, 'INSERT INTO tbl (`name`) VALUES (?)');
			expect(values).to.deep.equal(['andrew']);
			return {success: true};
		};

		dare.options.models = {
			default: {
				async post(req) {
					// Augment the request
					req.body.name = 'andrew';
				},
			},
		};

		return dare.post({
			table: 'tbl',
			body: {name: 'name'},
		});
	});

	it('should trigger pre handler, and handle errors being thrown', async () => {
		const msg = 'snap';

		dare.options.models = {
			default: {
				post() {
					// Augment the request
					throw new Error(msg);
				},
			},
		};

		const test = dare.post({
			table: 'tbl',
			body: {name: 'name'},
		});

		return expect(test).to.be.eventually.rejectedWith(Error, msg);
	});

	it('should not exectute if the opts.skip request is marked', async () => {
		const skip = 'true';

		dare.options.models = {
			default: {
				post(opts) {
					opts.skip = skip;
				},
			},
		};

		const resp = await dare.post({
			table: 'tbl',
			body: {name: 'name'},
		});

		expect(resp).to.eql(skip);
	});

	describe('validate formatting of input values', () => {
		[
			{
				input: 'field',
			},
			{
				input: null,
			},
		].forEach(({input}) => {
			it(`should pass ${input}`, async () => {
				dare.execute = async ({sql, values}) => {
					// Limit: 1
					sqlEqual(sql, 'INSERT INTO test (`name`) VALUES (?)');
					expect(values).to.deep.equal([input]);
					return {success: true};
				};

				return dare.post({
					table: 'test',
					body: {name: input},
				});
			});
		});

		[
			{
				key: 'value',
			},
			[1, 2, 3],
		].forEach(given => {
			it(`type=json: should accept object, given ${JSON.stringify(
				given
			)}`, async () => {
				dare.options = {
					models: {
						test: {
							schema: {
								meta: {
									type: 'json',
								},
							},
						},
					},
				};

				const output = JSON.stringify(given);

				dare.execute = async ({sql, values}) => {
					// Limit: 1
					sqlEqual(sql, 'INSERT INTO test (`meta`) VALUES (?)');
					expect(values).to.deep.equal([output]);
					return {success: true};
				};

				return dare.post({
					table: 'test',
					body: {meta: given},
				});
			});

			it(`type!=json: should throw an exception, given ${JSON.stringify(
				given
			)}`, async () => {
				const call = dare.patch({
					table: 'test',
					filter: {id: 1},
					body: {name: given},
				});

				return expect(call)
					.to.be.eventually.rejectedWith(
						DareError,
						"Field 'name' does not accept objects as values"
					)
					.and.have.property('code', DareError.INVALID_VALUE);
			});
		});
	});

	describe('DB Engine specific tests', () => {

		const DB_ENGINE = 'postgres:16.3';

		afterEach(() => {
			delete process.env.DB_ENGINE;
		});

		beforeEach(() => {
			process.env.DB_ENGINE = DB_ENGINE;
		});

		it(`${DB_ENGINE} should use ON CONFLICT ... UPDATE ...`, async () => {

			dare.execute = async ({sql, values}) => {
				sqlEqual(
					sql,
					'INSERT INTO test ("id", "name") VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET "name"=EXCLUDED."name"'
				);
				expect(values).to.deep.equal([1, 'name']);
				return {success: true};
			};

			return dare.post({
				table: 'test',
				body: {id: 1, name: 'name'},
				duplicate_keys_update: ['name'],
			});
		});
		it(`${DB_ENGINE} should use ON CONFLICT DO NOTHING`, async () => {

			dare.execute = async ({sql, values}) => {
				sqlEqual(
					sql,
					'INSERT INTO test ("id", "name") VALUES (?, ?) ON CONFLICT DO NOTHING'
				);
				expect(values).to.deep.equal([1, 'name']);
				return {success: true};
			};

			return dare.post({
				table: 'test',
				body: {id: 1, name: 'name'},
				duplicate_keys: 'ignore',
			});
		});
	})
});
