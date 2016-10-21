// Format Request
// Takes a simple request object and explodes it into a more comprehensive object using the schema

'use strict';

const error = require('../../src/utils/error');

describe('format_request', () => {

	let dare;

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
		expect(dare.format_request()).to.have.property('then');
	});

	describe('aliasing', () => {

		it('should call table_alias_handler on the given object and update the table and alias property', done => {

			const table = 'alias';
			const filter = {id: 1};
			const fields = ['name'];

			const actualtable = 'table';

			dare.table_alias_handler = () => actualtable;

			dare.format_request({
				table,
				filter,
				fields
			}).then(resp => {
				expect(resp).to.deep.equal({
					fields,
					table: actualtable,
					alias: table,
					filter,
					limit: 1,
					single: true
				});
				done();
			})
			.catch(done);

		});

		it('should throw an error if falsly on root table', done => {

			// Should not call sql
			dare.sql = done;

			dare.table_alias_handler = () => (false);

			dare.get({
				table: 'private',
				fields: ['id']
			})
			.then(done, err => {
				expect(err.code).to.eql(error.INVALID_REFERENCE.code);
				expect(err).to.have.property('message');
				done();
			}).catch(done);
		});
	});


	describe('limiting', () => {

		const options = {
			table: 'tbl',
			fields: ['id']
		};

		describe('limit', () => {

			describe('should accept', () => {

				['90', 90, '99', 1].forEach(limit => {

					it(`valid: ${  limit  } (${  typeof limit  })`, done => {

						dare.format_request(Object.assign({}, options, {limit}))
						.then(() => done())
						.catch(done);

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', 0, -1, 101, NaN, {}, null].forEach(limit => {

					it(`invalid: ${  limit  } (${  typeof limit  })`, done => {

						dare.format_request(Object.assign({}, options, {limit}))
						.then(done, err => {
							expect(err.code).to.eql(error.INVALID_LIMIT.code);
							expect(err).to.have.property('message');
							done();
						})
						.catch(done);

					});

				});
			});
		});

		describe('start', () => {

			describe('should accept', () => {

				['90', 90, '99', 1].forEach(start => {

					it(`valid: ${  start  } (${  typeof start  })`, done => {

						dare.format_request(Object.assign({}, options, {start}))
						.then(() => done())
						.catch(done);

					});

				});
			});

			describe('should ignore', () => {

				['nonsense', -1, NaN, {}, null].forEach(start => {

					it(`invalid: ${  start  } (${  typeof start  })`, done => {

						dare.format_request(Object.assign({}, options, {start}))
						.then(done, err => {
							expect(err.code).to.eql(error.INVALID_START.code);
							expect(err).to.have.property('message');
							done();
						})
						.catch(done);

					});

				});
			});
		});

	});


	describe('groupby', () => {

		describe('should accept', () => {

			['table.field', 'DATE(table.created_time)'].forEach(groupby => {

				it(`valid: ${  groupby  } (${  typeof groupby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						groupby
					})
					.then(opts => {
						expect(opts.groupby).to.eql(groupby);
						done();
					}, done)
					.catch(done);
				});

			});
		});

		describe('should throw an error, when:', () => {

			[-1, 101, {}, 'parenthisis(snap', '; ', 't(SELECT 1)'].forEach(groupby => {

				it(`invalid: ${  groupby  } (${  typeof groupby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						groupby
					})
					.then(done, err => {
						expect(err.code).to.eql(error.INVALID_REFERENCE.code);
						expect(err).to.have.property('message');
						done();
					})
					.catch(done);
				});
			});
		});

		describe('should ignore falsy values:', () => {

			[NaN, null, 0, undefined].forEach(groupby => {

				it(`ignores: ${  groupby  } (${  typeof groupby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						groupby
					})
					.then(() => done())
					.catch(done);
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
			].forEach(orderby => {

				it(`valid: ${  orderby  } (${  typeof orderby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						orderby
					})
					.then(() => done())
					.catch(done);
				});

			});
		});

		describe('should throw an error', () => {

			[-1, 101, {}, 'table.field WEST'].forEach(orderby => {

				it(`invalid: ${  orderby  } (${  typeof orderby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						orderby
					})
					.then(done, err => {
						expect(err.code).to.eql(error.INVALID_REFERENCE.code);
						expect(err).to.have.property('message');
						done();
					})
					.catch(done);
				});

			});

		});


		describe('should ignore falsy values:', () => {

			[NaN, null, 0, undefined].forEach(orderby => {

				it(`ignores: ${  orderby  } (${  typeof orderby  })`, done => {

					dare.format_request({
						table: 'table',
						fields: ['id'],
						orderby
					})
					.then(() => done())
					.catch(done);
				});
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


		it('should use options.table_alias_handler for interpretting the table names', done => {

			dare.options = {
				schema
			};

			dare.table_alias_handler = table => ({'events': 'events', 'alias': 'asset'}[table]);

			dare.format_request({
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
			})
			.then(() => done())
			.catch(done);

		});

		it('should use the options.table_alias hash if no handler is defined', done => {

			dare.options = {
				schema,
				table_alias: {
					'events': 'events',
					'alias': 'asset'
				}
			};

			dare.format_request({
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
			})
			.then(() => {
				done();
			}).catch(done);

		});

		describe('Permittable tables: table_alias returns falsly', () => {

			it('should throw an error if falsly on join table', done => {

				dare.options = {
					schema
				};

				dare.table_alias_handler = table_alias => ({'public': 'public'}[table_alias]);

				dare.format_request({
					table: 'public',
					fields: [
						{
							asset: ['name']
						}
					]
				})
				.then(done, err => {
					expect(err.code).to.eql(error.INVALID_REFERENCE.code);
					expect(err).to.have.property('message');
					done();
				}).catch(done);
			});
		});
	});


	describe('scheme', () => {

		it('should throw an error when there are two tables with an undefined relationship', done => {

			// Redefine the structure
			dare.options = {
				schema: {
					asset: {name: {}},
					comments: {name: {}}
				}
			};

			// The table country has no relationship with assets
			dare.format_request({
				table: 'asset',
				fields: [
					'name',
					{
						'comments': ['name']
					}
				]
			})
			.then(done, err => {
				expect(err.code).to.eql(error.INVALID_REFERENCE.code);
				expect(err).to.have.property('message', 'Could not understand field \'comments\'');
				done();
			})
			.catch(done);

		});

		it('should understand options.schema which defines table structure which reference other tables.', done => {

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
			dare.format_request({
				table: 'asset',
				fields: [
					'name',
					{
						'comments': ['name']
					}
				]
			})
			.then(() => done())
			.catch(done);

		});

		it('should understand multiple References, and pick the appropriate one.', done => {

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
			dare.format_request({
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
			})
			.then(() => done())
			.catch(done);

		});

		it('should allow simple descriptions of deep links', done => {

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
			dare.format_request({
				table: 'street',
				fields: [
					'name',
					{
						'country': ['name']
					}
				]
			})
			.then(() => done())
			.catch(done);


			// // Users table
			// users: {
			// 	country_id: {
			// 		references: 'country.id'
			// 	}
			// },

			// // N:M
			// userGroups: {
			// 	user_id: 'users.id',
			// 	group_id: 'group.id'
			// },

			// group: {
			// 	id: {}
			// }


		});

	});
});
