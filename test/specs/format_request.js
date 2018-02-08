// Format Request
// Takes a simple request object and explodes it into a more comprehensive object using the schema

'use strict';

const error = require('../../src/utils/error');

describe('format_request', () => {

	let dare;
	const method = 'get';

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use({
			schema: {}
		});
	});

	it('should be defined in instances of Dare', () => {
		expect(dare).to.have.property('format_request');
	});

	it('should return a promise', () => {
		const fn = dare.format_request().catch(() => {});
		expect(fn).to.have.property('then');
	});

	describe('aliasing', () => {

		it('should call table_alias_handler on the given object and update the table and alias property', async() => {

			const table = 'alias';
			const filter = {id: 1};
			const fields = ['name'];

			const actualtable = 'table';

			dare.table_alias_handler = () => actualtable;

			const resp = await dare.format_request({
				table,
				filter,
				fields
			});

			expect(resp).to.deep.equal({
				fields,
				table: actualtable,
				alias: table,
				field_alias_path: '',
				filter,
				_filter: [
					['id', '= ?', [1]]
				],
				limit: 1,
				single: true
			});

		});

		it('should throw an error if falsly on root table', async() => {

			dare.table_alias_handler = () => (false);

			try {
				await dare.format_request({
					table: 'private',
					fields: ['id']
				});

				throw new Error('expected fail');
			}
			catch (err) {
				expect(err.code).to.eql(error.INVALID_REFERENCE);
				expect(err).to.have.property('message');
			}
		});
	});

	describe('fields', () => {

		const options = {
			table: 'tbl'
		};

		beforeEach(() => {
			dare.options = {
				schema: {
					'asset': {tbl_id: 'tbl.id'}
				}
			};
		});

		describe('should accept', () => {

			[
				['field'],
				['_field'],
				['asset.field'],
				[{'asset': 'field'}],
				{'asset': 'field'},
				[{'asset': 'DATE(field)'}],
				[{'My Fields - and &*^@:£@$ things...': 'DATE(field)'}],
				[{'asset': 'GROUP_CONCAT(DISTINCT field)'}],
				{'asset': ['field']}
			].forEach(fields => {

				it(`valid: ${JSON.stringify(fields)}`, async() => {

					return dare.format_request(Object.assign({}, options, {fields}));

				});

			});
		});

		describe('should throw error', () => {

			[
				10,
				'string',
				['*'],
				['COUNT(wrong)'],
				[{'asset': 'DATE(id'}],
				[{'quote\'s': 'id'}],
				[{'tablename with spaces and -:*...': ['id']}],
				[{'asset': ['DATE(id)']}]
			].forEach(fields => {

				it(`invalid: ${ JSON.stringify(fields)}`, async() => {

					try {
						await dare.format_request(Object.assign({}, options, {fields}));

						throw new Error('expected failure');
					}
					catch (err) {
						expect(err.code).to.eql(error.INVALID_REFERENCE);
						expect(err).to.have.property('message');
					}

				});
			});
		});

		describe('should generate joins where the field definition contains table names', () => {

			[
				['asset.field'],
				[{
					'Field': 'asset.field'
				}],
				[{
					'Field': 'COUNT(DISTINCT asset.field)'
				}],
			].forEach(fields => {

				it(`where ${JSON.stringify(fields)}`, async() => {

					const req = await dare.format_request(Object.assign({}, options, {fields}));

					expect(req._joins[0]).to.have.property('alias', 'asset');

				});
			});
		});
	});

	describe('limiting', () => {

		const options = {
			table: 'tbl',
			fields: ['id']
		};

		describe('limit', () => {

			describe('should accept', () => {

				['90', 90, '99', 1, 10000].forEach(limit => {

					it(`valid: ${ limit } (${ typeof limit })`, async() => {

						return dare.format_request(Object.assign({}, options, {limit}));

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', 0, -1, 10001, NaN, {}, null].forEach(limit => {

					it(`invalid: ${ limit } (${ typeof limit })`, async() => {

						try {
							await dare.format_request(Object.assign({}, options, {limit}));
						}
						catch (err) {
							expect(err.code).to.eql(error.INVALID_LIMIT);
							expect(err).to.have.property('message');
						}

					});

				});
			});
		});

		describe('start', () => {

			describe('should accept', () => {

				['90', 90, '99', 1].forEach(start => {

					it(`valid: ${ start } (${ typeof start })`, async() => {

						return dare.format_request(Object.assign({}, options, {start}));

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', -1, NaN, {}, null].forEach(start => {

					it(`invalid: ${ start } (${ typeof start })`, async() => {

						try {
							await dare.format_request(Object.assign({}, options, {start}));
							throw new Error('expected failure');
						}
						catch (err) {
							expect(err.code).to.eql(error.INVALID_START);
							expect(err).to.have.property('message');
						}

					});

				});
			});
		});

	});


	describe('groupby', () => {

		describe('should accept', () => {

			['table.field', 'DATE(table.created_time)', 'EXTRACT(YEAR_MONTH FROM table.created_time)'].forEach(groupby => {

				it(`valid: ${ groupby } (${ typeof groupby })`, async() => {

					const resp = await dare.format_request({
						table: 'table',
						fields: ['id'],
						groupby
					});

					expect(resp.groupby).to.eql(groupby);
				});

			});
		});

		describe('should throw an error, when:', () => {

			[-1, 101, {}, 'parenthisis(snap', '; ', 'SUM(SE-LECT 1)'].forEach(groupby => {

				it(`invalid: ${ groupby } (${ typeof groupby })`, async() => {

					try {
						await dare.format_request({
							table: 'table',
							fields: ['id'],
							groupby
						});
						throw new Error('expected failure');
					}
					catch (err) {
						expect(err.code).to.eql(error.INVALID_REFERENCE);
						expect(err).to.have.property('message');
					}
				});
			});
		});

		describe('should ignore falsy values:', () => {

			[NaN, null, 0, undefined].forEach(groupby => {

				it(`ignores: ${ groupby } (${ typeof groupby })`, async() => {

					return dare.format_request({
						table: 'table',
						fields: ['id'],
						groupby
					});
				});
			});
		});
	});


	describe('orderby', () => {

		describe('should accept', () => {

			[
				'table.field',
				'table.field ASC',
				'DATE(table.created_time)',
				'DATE(table.created_time) DESC',
				'DATE(table.created_time) DESC, name ASC',
				['name ASC'],
				['DATE(table.created_time) DESC', 'name ASC'],
			].forEach(orderby => {

				it(`valid: ${ orderby } (${ typeof orderby })`, async() => {

					return dare.format_request({
						table: 'table',
						fields: ['id'],
						orderby
					});
				});

			});
		});

		describe('should throw an error', () => {

			[
				-1,
				101,
				{},
				'table.field WEST',
				['name', 1],
				['name ASC', 'id WEST']
			].forEach(orderby => {

				it(`invalid: ${ orderby } (${ typeof orderby })`, async() => {

					try {
						await dare.format_request({
							table: 'table',
							fields: ['id'],
							orderby
						});
						throw new Error('exepected failure');
					}
					catch (err) {
						expect(err.code).to.eql(error.INVALID_REFERENCE);
						expect(err).to.have.property('message');
					}
				});

			});

		});


		describe('should ignore falsy values:', () => {

			[NaN, null, 0, undefined].forEach(orderby => {

				it(`ignores: ${ orderby } (${ typeof orderby })`, async() => {

					return dare.format_request({
						table: 'table',
						fields: ['id'],
						orderby
					});
				});
			});
		});
	});

	['filter', 'join'].forEach(condition_type => {

		describe(condition_type, () => {

			describe('should prep conditions', () => {

				const table = 'table';

				beforeEach(() => {
					dare.options = {
						schema: {
							[table]: {
								date: {
									type: 'datetime'
								}
							}
						}
					};
				});

				const a = [
					[
						{prop: 'string'},
						'prop',
						'= ?',
						['string']
					],
					[
						{'-prop': 'string'},
						'prop',
						'!= ?',
						['string']
					],
					[
						{prop: '%string'},
						'prop',
						'LIKE ?',
						['%string']
					],
					[
						{prop: '!string'},
						'prop',
						'NOT LIKE ?',
						['string']
					],
					[
						{prop: '!patt%rn'},
						'prop',
						'NOT LIKE ?',
						['patt%rn']
					],
					[
						{'-prop': 'patt%rn'},
						'prop',
						'NOT LIKE ?',
						['patt%rn']
					],
					[
						{prop: [1, 2, 3]},
						'prop',
						'IN (?,?,?)',
						[1, 2, 3]
					],
					[
						{'-prop': [1, 2, 3]},
						'prop',
						'NOT IN (?,?,?)',
						[1, 2, 3]
					],
					[
						{'-prop': [1, 2, 3]},
						'prop',
						'NOT IN (?,?,?)',
						[1, 2, 3]
					],
					[
						{prop: null},
						'prop',
						'IS NULL',
						[]
					],
					[
						{'-prop': null},
						'prop',
						'IS NOT NULL',
						[]
					],
					[
						{'-date': '1981-12-05..'},
						'date',
						'(NOT ?? > ? OR ?? IS NULL)',
						['1981-12-05T00:00:00']
					]
				];

				a.forEach(test => {

					const [filter, prop, condition, values] = test;

					it(`should augment condition values ${JSON.stringify(filter)}`, async() => {

						const resp = await dare.format_request({
							table,
							fields: ['id'],
							[condition_type]: filter
						});

						expect(resp[`_${condition_type}`][0]).to.eql([prop, condition, values]);
					});
				});

			});

			describe('should throw error', () => {

				[
					true,
					10,
					'string',
					{
						'id OR 1': '1'
					},
					{
						'DATE(field)': '1'
					},
					{
						asset: {
							'id OR 1': '1'
						}
					}
				].forEach(filter => {

					it(`invalid: ${JSON.stringify(filter)}`, async() => {

						try {
							await dare.format_request({
								table: 'activityEvents',
								fields: ['id'],
								[condition_type]: filter
							});
							throw new Error('expected failure');
						}
						catch (err) {
							expect(err.code).to.eql(error.INVALID_REFERENCE);
							expect(err).to.have.property('message');
						}

					});
				});
			});

			describe('field type=datetime', () => {

				const table = 'table';

				const o = {
					'1981-12-05': [
						'BETWEEN ? AND ?',
						['1981-12-05T00:00:00', '1981-12-05T23:59:59']
					],
					'1981-1-5': [
						'BETWEEN ? AND ?',
						['1981-01-05T00:00:00', '1981-01-05T23:59:59']
					],
					'1981-12-05..1981-12-06': [
						'BETWEEN ? AND ?',
						['1981-12-05T00:00:00', '1981-12-06T23:59:59']
					],
					'1981-12-05..': [
						'?? > ?',
						['1981-12-05T00:00:00']
					],
					'..1981-12-05': [
						'?? < ?',
						['1981-12-05T00:00:00']
					],
					'1981-12': [
						'BETWEEN ? AND ?',
						['1981-12-01T00:00:00', '1981-12-31T23:59:59']
					],
					'1981-1': [
						'BETWEEN ? AND ?',
						['1981-01-01T00:00:00', '1981-01-31T23:59:59']
					],
					'2016': [
						'BETWEEN ? AND ?',
						['2016-01-01T00:00:00', '2016-12-31T23:59:59']
					]
				};

				for (const date in o) {

					const [condition, values] = o[date];

					it(`should augment filter values ${date}`, async() => {

						dare.options = {
							schema: {
								[table]: {
									date: {
										type: 'datetime'
									}
								}
							}
						};

						const resp = await dare.format_request({
							table,
							fields: ['id'],
							[condition_type]: {
								date
							}
						});

						expect(resp[`_${condition_type}`][0]).to.eql(['date', condition, values]);
					});
				}
			});

		});

	});

	describe('table_alias_handler', () => {

		const schema = {
			asset: {
				name: {}
			},
			events: {
				asset_id: 'asset.id'
			},
		};


		it('should use options.table_alias_handler for interpretting the table names', async() => {

			dare.options = {
				schema
			};

			dare.table_alias_handler = table => ({'events': 'events', 'alias': 'asset'}[table]);

			return dare.format_request({
				table: 'events',
				filter: {
					alias: {
						id: 10
					}
				},
				fields: [
					{
						alias: ['name']
					}
				]
			});

		});

		it('should use the options.table_alias hash if no handler is defined', async() => {

			dare.options = {
				schema,
				table_alias: {
					'events': 'events',
					'alias': 'asset'
				}
			};

			return dare.format_request({
				table: 'events',
				filter: {
					alias: {
						id: 10
					}
				},
				fields: [
					{
						alias: ['name']
					}
				]
			});

		});

		describe('Permittable tables: table_alias returns falsly', () => {

			it('should throw an error if falsly on join table', async() => {

				dare.options = {
					schema
				};

				dare.table_alias_handler = table_alias => ({'public': 'public'}[table_alias]);

				try {
					await dare.format_request({
						table: 'public',
						fields: [
							{
								asset: ['name']
							}
						]
					});

					throw new Error('expected failure');
				}
				catch (err) {
					expect(err.code).to.eql(error.INVALID_REFERENCE);
					expect(err).to.have.property('message');
				}
			});
		});
	});


	describe('scheme', () => {

		it('should throw an error when there are two tables with an undefined relationship', async() => {

			// Redefine the structure
			dare.options = {
				schema: {
					asset: {name: {}},
					comments: {name: {}}
				}
			};

			// The table country has no relationship with assets
			try {
				await dare.format_request({
					table: 'asset',
					fields: [
						'name',
						{
							'comments': ['name']
						}
					]
				});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err.code).to.eql(error.INVALID_REFERENCE);
				expect(err).to.have.property('message', 'Could not understand field \'comments\'');
			}

		});

		it('should understand options.schema which defines table structure which reference other tables.', async() => {

			// Redefine the structure
			dare.options = {
				schema: {
					asset: {name: {}},
					comments: {
						name: {},
						asset_id: {
							references: 'asset.id'
						}
					}
				}
			};

			// The table country has no relationship with assets
			return dare.format_request({
				table: 'asset',
				fields: [
					'name',
					{
						'comments': ['name']
					}
				]
			});

		});

		it('should understand multiple References, and pick the appropriate one.', async() => {

			// Redefine the structure
			dare.options = {
				schema: {
					asset: {name: {}},
					assetType: {
						// references can be as simple as a string to another [table].[field]
						asset_id: 'asset.id'
					},
					comments: {
						name: {},
						asset_id: {
							// There can also be multiple references to connect more than one table on this key...
							references: ['asset.id', 'assetType.asset_id']
						}
					}
				}
			};

			// The table country has no relationship with assets
			return dare.format_request({
				table: 'comments',
				fields: [
					'name',
					{
						'asset': ['name']
					},
					{
						'assetType': ['name']
					}
				]
			});

		});

		it('should allow simple descriptions of deep links', async() => {

			// Here the schema is a series of tables a street, belongs to 1 town and in return 1 country
			dare.options = {
				schema: {
					street: {
						// references can be as simple as a string to another [table].[field]
						town_id: 'town.id'
					},
					town: {
						country_id: 'country.id'
					},
					country: {}
				}
			};

			// If we just wanted the street name and country
			// The app should understand the relationship between street and country
			// and join up the town automatically in the SQL
			return dare.format_request({
				table: 'street',
				fields: [
					'name',
					{
						'country': ['name']
					}
				]
			});

		});

	});

	describe('table conditional dependencies', () => {

		it('should automatically require join another table', async() => {

			dare.options = {
				schema: {
					userDomain: {
						// Define a relationship
						user_id: 'users.id'
					}
				},
				table_conditions: {
					users: 'userDomain'
				}
			};

			const resp = await dare.format_request({
				method,
				table: 'users',
				fields: [
					'name'
				]
			});

			const join = resp._joins[0];
			expect(join).to.have.property('table', 'userDomain');
			expect(join).to.have.property('required_join', true);
		});

	});

	describe('method table handlers', () => {

		it('should pass through exceptions raised in the method handlers', async() => {
			const msg = 'snap';
			dare.options = {
				get: {
					users() {
						throw Error(msg);
					}
				},
				method: 'get'
			};

			try {
				await dare.format_request({
					method,
					table: 'users',
					fields: [
						'name'
					]
				});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err.message).to.eql(msg);
			}
		});

		it('should pass through the table scoped request', async() => {

			dare.options = {
				get: {
					users(options) {

						// Add something to the filter...
						options.filter = {
							is_deleted: false
						};

					}
				},
				method: 'get'
			};

			const options = await dare.format_request({
				method,
				table: 'users',
				fields: [
					'name'
				]
			});

			expect(options.filter).to.eql({is_deleted: false});

		});

		it('should await the response from a promise', async() => {

			dare.options = {
				get: {
					users() {
						return new Promise((resolve, reject) => {
							setTimeout(() => reject(Error('snap')));
						});
					}
				},
				method: 'get'
			};

			try {
				await dare.format_request({
					method,
					table: 'users',
					fields: [
						'name'
					]
				});
				throw new Error('expected failure');
			}
			catch (err) {
				expect(err.message).to.eql('snap');
			}

		});
	});

});
