import assert from 'node:assert';
import Dare from '../../../src/postgres16.ts';

// Test Generic DB functions
import sqlEqual from '../../lib/sql-equal.ts';

import {describe, it, beforeEach} from 'node:test';

const id = 1;
const name = 'name';

describe('patch', () => {
	let dare: any;

	beforeEach(() => {
		dare = new Dare();

		// Should not be called...
		dare.execute = () => {
			throw new Error('execute called');
		};
	});

	it(`should use the correct syntax for postgres`, async () => {
		const dareInst = dare.use({engine: 'postgres:16.3'});

		dareInst.execute = async ({sql, values}) => {
			sqlEqual(sql, 'UPDATE tbl SET "name" = ? WHERE tbl.id = ?');
			assert.deepStrictEqual(values, [name, id]);
			return {success: true};
		};

		return dareInst.patch({
			table: 'tbl',
			filter: {id},
			body: {name},
		});
	});
});
