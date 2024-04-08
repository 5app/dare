import {expect} from 'chai';
import Dare from '../../src/index.js';

/*
 * Filter Reducer
 * Extract the filter conditions from the given conditions
 */

import reduceConditions from '../../src/format/reducer_conditions.js';

describe('Filter Reducer', () => {
	let dareInstance;
	const conditional_operators_in_value = null;
	let table_schema = null;

	const extract = () => {
		// Do nothing
	};

	// Mock instance of Dare
	beforeEach(() => {
		dareInstance = new Dare();
		table_schema = {
			textsearch: 'givenname,lastname,email',
		};
	});

	describe('should prep conditions', () => {
		const a = [
			[{prop: 'string'}, 'a.prop = ?', ['string']],
			[
				{
					'givenname,lastname,email': 'test string',
				},
				`(a.givenname = ? OR a.lastname = ? OR a.email = ?)`,
				['test string', 'test string', 'test string'],
			],
			[
				{
					'%givenname,lastname,email': 'test string',
				},
				`(a.givenname LIKE ? OR a.lastname LIKE ? OR a.email LIKE ?)`,
				['test string', 'test string', 'test string'],
			],
			[
				{
					'-givenname,lastname,email': 'test string',
				},
				`NOT (a.givenname = ? OR a.lastname = ? OR a.email = ?)`,
				['test string', 'test string', 'test string'],
			],
			[
				{
					'*givenname,lastname,email': 'test string',
				},
				`MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				['test string'],
			],
			[
				{
					'-*givenname,lastname,email': 'test string',
				},
				`NOT MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				['test string'],
			],
			[
				{
					'*textsearch': 'test string',
				},
				`MATCH(a.givenname, a.lastname, a.email) AGAINST(? IN BOOLEAN MODE)`,
				['test string'],
			],
		];

		a.forEach(async test => {
			const [filter, sql, values, options] = test;

			// Clone filter
			const filter_cloned = structuredClone(filter);

			it(`should transform condition ${JSON.stringify(
				filter
			)} -> ${JSON.stringify(sql)}`, async () => {
				if (options) {
					dareInstance = dareInstance.use(options);
				}
				const [query] = reduceConditions(filter, {
					extract,
					sql_alias: 'a',
					table_schema,
					conditional_operators_in_value,
					dareInstance,
				});

				expect(query.sql).to.equal(sql);
				expect(query.values).to.deep.equal(values);

				// Should not mutate the filters...
				expect(filter).to.deep.eql(filter_cloned);
			});
		});
	});
});
