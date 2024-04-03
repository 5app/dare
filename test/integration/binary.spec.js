import assert from 'node:assert/strict';
import {dare} from './helpers/api.js';

describe(`Binary handling`, () => {
	beforeEach(async () => {
		await dare.sql(
			`ALTER TABLE users ADD COLUMN uuid BINARY(16) DEFAULT NULL`
		);
	});

	it('Can insert, query and patch binary fields', async () => {
		const uuid = Buffer.from('12345678901234567890123456789012', 'hex');

		const {insertId} = await dare.post('users', {uuid});

		const resp = await dare.get('users', ['id', 'uuid'], {uuid});

		assert.deepStrictEqual(resp, {id: insertId, uuid});

		{
			const uuidPatch = {
				uuid: Buffer.from('12345678901234567890123456789013', 'hex'),
			};

			await dare.patch('users', {uuid}, uuidPatch);

			const resp = await dare.get('users', ['id', 'uuid'], uuidPatch);

			assert.deepStrictEqual(resp, {id: insertId, ...uuidPatch});
		}
	});
});
