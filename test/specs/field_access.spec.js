import {expect} from 'chai';
import Dare from '../../src/index.js';
// Test whether fields can be declared as immutable and unreadable
import DareError from '../../src/utils/error.js';
import sqlEqual from '../lib/sql-equal.js';

describe('field access', () => {
	let dare;

	beforeEach(() => {
		dare = new Dare({
			models: {
				users: {
					schema: {
						// Write is disabled, whilst id is readable
						id: {
							writeable: false,
						},
						// Name is writeable only on post
						name: {
							writeable: false,
							post: {
								writeable: true,
							},
						},
						// Password is not readable or writable
						password: false,
					},
				},
			},
		});
	});

	describe('get - SELECT', () => {
		[
			'password',
			{
				name: 'password',
			},
			{
				name: 'CHAR(password)',
			},
		].forEach(field => {
			it(`should prevent access to non-readable field: ${JSON.stringify(
				field
			)}`, () => {
				const call = dare.get({
					table: 'users',
					fields: [
						// Password is non-readable
						field,
					],
				});

				return expect(call)
					.to.be.eventually.rejectedWith(
						DareError,
						"Field 'password' is not readable"
					)
					.and.have.property('code', DareError.INVALID_REFERENCE);
			});
		});
	});

	describe('patch - UPDATE', () => {
		it('should prevent mutations on non-writable fields', () => {
			const call = dare.patch({
				table: 'users',
				body: {
					//  'id' cannot be mutated
					id: 1337,
				},
				filter: {
					id: 1,
				},
			});

			return expect(call)
				.to.be.eventually.rejectedWith(
					DareError,
					"Field 'id' is not writeable"
				)
				.and.have.property('code', DareError.INVALID_REFERENCE);
		});
	});

	describe('post - INSERT', () => {
		it('should prevent inserts on non-writable fields', () => {
			const call = dare.post({
				table: 'users',
				body: {
					//  'id' can not be inserted
					id: 1337,
				},
			});

			return expect(call)
				.to.be.eventually.rejectedWith(
					DareError,
					"Field 'id' is not writeable"
				)
				.and.have.property('code', DareError.INVALID_REFERENCE);
		});
		it('should allow inserts, not patch on writeable:false {post: {writeable: true}}', async () => {
			dare.execute = async ({sql, values}) => {
				sqlEqual(sql, 'INSERT INTO users (`name`) VALUES (?)');
				expect(values).to.deep.equal(['me']);
				return {insertId: 1};
			};

			{
				const call = await dare.post({
					table: 'users',
					body: {
						//  Name can be posted
						name: 'me',
					},
				});
				expect(call).to.deep.equal({insertId: 1});
			}

			const call = dare.patch({
				table: 'users',
				body: {
					//  Name can be posted
					name: 'me',
				},
				filter: {
					id: 123,
				},
			});

			return expect(call)
				.to.be.eventually.rejectedWith(
					DareError,
					"Field 'name' is not writeable"
				)
				.and.have.property('code', DareError.INVALID_REFERENCE);
		});
	});
});
