import {expect} from 'chai';
import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';

// Create a schema
import options from '../data/options.js';

describe('get - datatypes', () => {
	let dare;

	beforeEach(() => {
		dare = new Dare(options);
		dare.execute = () => {
			throw new Error('Should not execute');
		};
	});

	it('should return `created_time` using DATE_FORMAT', async () => {
		const created_time = '2019-09-03T12:00:00Z';

		dare.execute = async ({sql, values}) => {
			const expected = `
				SELECT DATE_FORMAT(a.created_time,'%Y-%m-%dT%TZ') AS 'created_time'
				FROM users a
				LIMIT 1
			`;

			sqlEqual(sql, expected);
			expect(values).to.deep.equal([]);

			return [{created_time}];
		};

		const resp = await dare.get({
			table: 'users',
			fields: ['created_time'],
		});

		expect(resp).to.have.property('created_time', created_time);
	});

	describe('type=json', () => {
		it('should JSON parse an string as object if type=json', async () => {
			const meta = {param: 1};
			const metaString = JSON.stringify(meta);

			dare.execute = async ({sql, values}) => {
				const expected = `
					SELECT a.meta
					FROM users a
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{meta: metaString}];
			};

			const resp = await dare.get({
				table: 'users',
				fields: ['meta'],
			});

			expect(resp).to.have.property('meta').to.deep.equal(meta);
		});

		it('should JSON parse a nested field with object if type=json', async () => {
			const meta = {param: 1};
			const metaString = JSON.stringify(meta);

			dare.execute = async ({sql, values}) => {
				const expected = `
					SELECT b.meta AS 'users.meta'
					FROM users_email a
					LEFT JOIN users b ON (b.id = a.user_id)
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{users: {meta: metaString}}];
			};

			const resp = await dare.get({
				table: 'users_email',
				fields: [
					{
						users: ['meta'],
					},
				],
			});

			expect(resp)
				.to.have.property('users')
				.to.have.property('meta')
				.to.deep.equal(meta);
		});

		it('should return an empty object if response value is falsy', async () => {
			dare.execute = async ({sql, values}) => {
				const expected = `
					SELECT a.meta
					FROM users a
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{meta: null}];
			};

			const resp = await dare.get({
				table: 'users',
				fields: ['meta'],
			});

			expect(resp).to.have.property('meta').to.deep.equal({});
		});
	});

	describe('type=function', () => {
		it('should construct a generated function, which can be labelled', async () => {
			const id = 123;

			dare.execute = async ({sql, values}) => {
				const expected = `
					SELECT b.id AS 'users.id'
					FROM users_email a
					LEFT JOIN users b ON (b.id = a.user_id)
					LIMIT 1
				`;

				sqlEqual(sql, expected);
				expect(values).to.deep.equal([]);

				return [{users: {id}}];
			};

			const resp = await dare.get({
				table: 'users_email',
				fields: [
					{
						users: [
							{
								URL: 'url',
							},
						],
					},
				],
			});

			expect(resp)
				.to.have.property('users')
				.to.have.property('URL', `/user/${id}`);
		});
	});
});
