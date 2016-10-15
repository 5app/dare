'use strict';

const error = require('../../src/utils/error');

// Test Generic DB functions
let SQLEXP = require('../lib/sql-match');


// Create a schema
let options = {
	schema: {
		// Users table
		users: {
			country_id: {
				references: 'country.id'
			}
		},

		// Users have multiple emails
		users_email: {

			// User_id defines a field which references the users table
			user_id: {
				references: ['users.id']
			}

		},

		country: {

		},

		comments: {
			author_id: {
				references: 'users.id'
			}
		},

		activityEvents: {
			session_id: {
				references: 'activitySession.id'
			},
			ref_id: {
				references: 'apps.id'
			}
		},

		apps: {

		}

	},

	table_alias: {
		'author': 'users',
		'events': 'activityEvents',
		'asset': 'apps'
	}
};


describe('get - request object', () => {

	let dare;
	let limit = 5;

	beforeEach(() => {
		dare = new Dare(options);
	});

	it('should contain the function dare.get', () => {
		expect(dare.get).to.be.a('function');
	});

	it('should generate a SELECT statement and execute dare.sql', done => {

		dare.sql = (query) => {
			expect(query.replace(/\s+/g, ' ')).to.match(SQLEXP(`

				SELECT activityEvents.created_time, COUNT(*) AS _count, asset.id AS 'asset.id', asset.name AS 'asset.name'
				FROM activityEvents
					LEFT JOIN activitySession ON (activitySession.id = activityEvents.session_id)
					LEFT JOIN apps asset ON (asset.id = activityEvents.ref_id)
				WHERE activityEvents.category = ?
					AND activityEvents.action = ?
					AND activityEvents.created_time > ?
					AND activitySession.domain = ?
				GROUP BY asset.id
				ORDER BY count DESC
				LIMIT 5

			`));
			return Promise.resolve([]);
		};

		dare.get({
			table: 'activityEvents',
			filter: {
				category: 'asset',
				action: 'open',
				created_time: '2016-03-04T16:08:32Z..',
				activitySession: {
					domain: '5app.com'
				}
			},
			fields: [
				'created_time',
				'_count',
				{
					asset: [
						'id',
						'name'
					]
				}
			],
			groupby: 'asset.id',
			orderby: 'count DESC',
			limit
		})
		.then(() => {
			done();
		}, done);

	});


	describe('fields', () => {

		it('should respond with the same structure as the request.fields', done => {

			dare.sql = () => {
				return Promise.resolve([{
					name: 'Name',
					'asset.name': 2001
				}]);
			};

			dare.get({
				table: 'activityEvents',
				filter: {
					asset: {
						id: 10
					}
				},
				fields: [
					'name',
					{
						asset: [
							'name'
						]
					}
				],
				limit
			})
			.then((resp) => {
				expect(resp).to.be.an('array');
				expect(resp.length).to.eql(1);
				let item = resp[0];
				expect(item).to.have.property('name');
				expect(item.asset).to.have.property('name', 2001);
				done();
			}, done);

		});

		describe('should accept', () => {

			[
				['field'],
				['_field'],
				['asset.field'],
				[{'asset': 'field'}],
				[{'asset': 'DATE(field)'}],
				[{'asset': ['field']}]
			].forEach(value => {

				it('valid: ' + JSON.stringify(value), done => {

					dare.sql = () => {
						done();
						return Promise.resolve([]);
					};

					dare.get({
						table: 'activityEvents',
						fields: value,
						limit
					})
					.catch(done);

				});

			});
		});

		describe('should throw error', () => {

			[
				10,
				null,
				{},
				'string',
				['COUNT(wrong)'],
				[{'asset(*)': 'id'}],
				[{'asset': 'DATE(id'}],
				[{'asset': ['DATE(id)']}]
			].forEach(value => {

				it('invalid: ' + JSON.stringify(value), done => {

					dare.sql = nosql(done);

					dare.get({
						table: 'activityEvents',
						fields: value,
						limit
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
	});

	describe('filter', () => {


		describe('should accept', () => {

			[{
				field: 'value'
			},
			{
				asset: {
					type: 'mobile'
				}
			}
			].forEach(value => {

				it('valid: ' + JSON.stringify(value), done => {

					dare.sql = (sql, prepared) => {
						for (var x in value) {
							expect(sql).to.contain(x);

							// we could iterate through the object, but the main thing was that it was passed through.
							if (typeof value[x] !== 'object') {
								expect(prepared).to.contain(value[x]);
							}
						}
						done();
						return Promise.resolve([]);
					};

					dare.get({
						table: 'activityEvents',
						fields: [
							'id'
						],
						filter: value,
						limit
					})
					.catch(done);

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
			].forEach(value => {

				it('invalid: ' + JSON.stringify(value), done => {

					dare.sql = nosql(done);

					dare.get({
						table: 'activityEvents',
						fields: ['id'],
						filter: value,
						limit
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
	});


	describe('limit', () => {

		describe('should accept', () => {

			['90', 90, '99', 1].forEach(value => {

				it('valid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.contain('LIMIT ' + value);
						done();
						return Promise.resolve([]);
					};

					dare.get({
						table: 'activityEvents',
						fields: [
							'id'
						],
						limit: value
					})
					.catch(done);

				});

			});
		});

		describe('should ignore', () => {

			['nonsense', 0, -1, 101, NaN, {}, null].forEach(value => {

				it('invalid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.get({
						table: 'activityEvents',
						fields: [
							'id'
						],
						limit: value
					})
					.then(done, err => {
						expect(err.code).to.eql(error.INVALID_LIMIT.code);
						expect(err).to.have.property('message');
						done();
					});

				});

			});
		});
	});

	describe('start', () => {

		describe('should accept', () => {

			['90', 90, '99', 1].forEach(value => {

				it('valid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.contain('LIMIT ' + value + ',100');
						done();
						return Promise.resolve([]);
					};

					dare.get({
						table: 'activityEvents',
						fields: [
							'id'
						],
						limit: 100,
						start: value
					})
					.catch(done);

				});

			});
		});

		describe('should ignore', () => {

			['nonsense', -1, NaN, {}, null].forEach(value => {

				it('invalid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.get({
						table: 'activityEvents',
						fields: [
							'id'
						],
						limit: 100,
						start: value
					})
					.then(done, err => {
						expect(err.code).to.eql(error.INVALID_START.code);
						expect(err).to.have.property('message');
						done();
					});

				});

			});
		});
	});

	describe('groupby', () => {

		describe('should accept', () => {

			['table.field', 'DATE(table.created_time)'].forEach(value => {

				it('valid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.contain('GROUP BY ' + value);
						return Promise.resolve([]);
					};

					dare.get({
						table: 'table',
						fields: ['id'],
						groupby: value,
						limit
					})
					.then(() => {
						done();
					}, done)
					.catch(done);
				});

			});
		});

		describe('should throw an error, when:', () => {

			[-1, 101, {}, 'parenthisis(snap', '; ', 't(SELECT 1)'].forEach(value => {

				it('invalid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = nosql(done);

					dare.get({
						table: 'table',
						fields: ['id'],
						groupby: value,
						limit
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

			[NaN, null, 0, undefined].forEach(value => {

				it('ignores: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.not.contain('GROUP BY ');
						return Promise.resolve([]);
					};

					dare.get({
						table: 'table',
						fields: ['id'],
						groupby: value,
						limit
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
			].forEach(value => {

				it('valid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.contain('ORDER BY ' + value);
						return Promise.resolve([]);
					};

					dare.get({
						table: 'table',
						fields: ['id'],
						orderby: value,
						limit
					})
					.then(() => {
						done();
					}, done)
					.catch(done);
				});

			});
		});

		describe('should throw an error', () => {

			[-1, 101, {}, 'table.field WEST'].forEach(value => {

				it('invalid: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = nosql(done);

					dare.get({
						table: 'table',
						fields: ['id'],
						orderby: value,
						limit
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

			[NaN, null, 0, undefined].forEach(value => {

				it('ignores: ' + value + ' (' + (typeof value) + ')', done => {

					dare.sql = (sql) => {
						expect(sql).to.not.contain('ORDER BY ');
						return Promise.resolve([]);
					};

					dare.get({
						table: 'table',
						fields: ['id'],
						orderby: value,
						limit
					})
					.then(() => (done()))
					.catch(done);
				});
			});
		});
	});

	describe('scheme', () => {

		it('should throw an error when there are two tables with an undefined relationship', done => {

			dare.sql = () => done('Unexpected call dare.sql');

			// Redefine the structure
			dare.options = {
				schema: {
					asset: {name: {}},
					comments: {name: {}}
				}
			};

			// The table country has no relationship with assets
			dare.get({
				table: 'asset',
				fields: [
					'name',
					{
						'comments': ['name']
					}
				]
			})
			.then(() => {
				done('Should have thrown an error');
			}, (err) => {
				expect(err.code).to.eql(error.INVALID_REFERENCE.code);
				expect(err).to.have.property('message', 'Could not understand field \'comments\'');
				done();
			});

		});

		it('should understand options.schema which defines table structure which reference other tables.', done => {

			// Set the schema
			dare.sql = () => {
				return Promise.resolve([{}]);
			};

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
			dare.get({
				table: 'asset',
				fields: [
					'name',
					{
						'comments': ['name']
					}
				]
			})
			.then(() => {
				done();
			}, done);

		});

		it('should understand multiple References, and pick the appropriate one.', done => {

			// Set the schema
			dare.sql = () => {
				return Promise.resolve([{}]);
			};

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
			dare.get({
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
			.then(() => {
				done();
			}, done);

		});

		it('should allow simple descriptions of deep links', done => {


			// Set the schema
			dare.sql = () => {
				return Promise.resolve([{}]);
			};

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
			dare.get({
				table: 'street',
				fields: [
					'name',
					{
						'country': ['name']
					}
				]
			})
			.then(() => {
				done();
			}, done);


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


	describe('generated fields', () => {

		it('should allow bespoke fields to be defined in the schema', (done) => {

			// Create handler for 'asset.thumbnail'
			dare.options = {
				schema: {
					'assets': {
						thumbnail: (fields) => {
							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return (obj) => `/asset/${obj.id}/thumbnail`;
						}
					},
					'picture': {
						asset_id: 'assets.id',
						image: function(fields) {
							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return (obj) => this.options.meta.root + `/picture/${obj.id}/image`;
						}
					}
				}
			};

			// Stub the execute function
			dare.sql = () => {

				// Ensure that there is no thumbnail field requested.
				return Promise.resolve([{
					'id': 1,
					'name': 'Andrew',
					'picture[$$].id': 100
				}]);
			};

			dare.get({
				table: 'assets',
				fields: [
					'name',
					'thumbnail',
					{
						picture: ['image']
					}
				],
				meta: {
					root: 'http://example.com'
				}
			})
			.then((resp) => {
				expect(resp).to.deep.equal({
					id: 1,
					name: 'Andrew',
					thumbnail: '/asset/1/thumbnail',
					picture: {
						id: 100,
						image: 'http://example.com/picture/100/image'
					}
				});
				done();
			}, done);


		});
	});


	// describe('join_handler', () => {

	// 	it('should throw and error when the request.join_handler returns an empty join condition', done => {

	// 		dare.sql = () => done(new Error('Unexpected call dare.sql'));

	// 		dare.get({
	// 			table: 'activityEvents',
	// 			filter: {
	// 				activitySession : {
	// 					domain: '5app.com'
	// 				}
	// 			},
	// 			fields: [
	// 				'created_time'
	// 			],
	// 			limit: 100
	// 		})
	// 		.then(() => {
	// 			done(new Error('Should have thrown an error'));
	// 		}, (err) => {
	// 			expect(err).to.have.property('message');
	// 			done();
	// 		});

	// 	});
	// });


	describe('table_alias_handler', () => {
		it('should use options.table_alias_handler for interpretting the table names', done => {

			dare.sql = (sql) => {

				expect(sql).to.contain('FROM activityEvents events');
				expect(sql).to.contain('LEFT JOIN apps asset');

				return Promise.resolve([]);
			};

			dare.table_alias_handler = (table) => ({'events': 'activityEvents', 'asset': 'apps'}[table]);

			dare.get({
				table: 'events',
				filter: {
					asset: {
						id: 10
					}
				},
				fields: [
					{
						asset: ['name']
					}
				],
				limit
			})
			.then(() => {
				done();
			}, done);

		});

		it('should use the options.table_alias hash if no handler is defined', done => {

			dare.sql = (sql) => {
				expect(sql).to.contain('LEFT JOIN apps asset');
				return Promise.resolve([]);
			};

			dare.options.table_alias = {
				'events': 'activityEvents',
				'asset': 'apps'
			};


			dare.get({
				table: 'events',
				filter: {
					asset: {
						id: 10
					}
				},
				fields: [
					{
						asset: ['name']
					}
				],
				limit
			})
			.then(() => {
				done();
			}, done);

		});

		describe('Permittable tables: table_alias returns falsly', () => {

			it('should throw an error if falsly on root table', done => {

				dare.sql = nosql(done);

				dare.table_alias_handler = () => (false);


				dare.get({
					table: 'private',
					fields: ['id'],
					limit
				})
				.then(done, err => {
					expect(err.code).to.eql(error.INVALID_REFERENCE.code);
					expect(err).to.have.property('message');
					done();
				}).catch(done);
			});

			it('should throw an error if falsly on join table', done => {

				dare.sql = nosql(done);

				dare.table_alias_handler = (table_alias) => ({'public': 'public'}[table_alias]);

				dare.get({
					table: 'public',
					fields: [
						{
							asset: ['name']
						}
					],
					limit
				})
				.then(done, err => {
					expect(err.code).to.eql(error.INVALID_REFERENCE.code);
					expect(err).to.have.property('message');
					done();
				}).catch(done);
			});
		});

	});

	describe('GROUP CONCAT', () => {

		it('should write one to many requests with group concat, and format the response as an array', done => {

			dare.sql = (sql) => {

				expect(sql).to.contain('GROUP_CONCAT(CONCAT(\'"\', IFNULL(town.id, \'\'), \'"\') SEPARATOR \'$$\') AS \'town[$$].id\'');
				expect(sql).to.contain('GROUP_CONCAT(CONCAT(\'"\', IFNULL(town.name, \'\'), \'"\') SEPARATOR \'$$\') AS \'town[$$].name\'');
				expect(sql).to.contain('GROUP BY id');

				return Promise.resolve([{
					'town[$$].id': '"1"$$"2"',
					'town[$$].name': '"a"$$"b"'
				}]);
			};

			// Here the schema is a series of tables a street, belongs to 1 town and in return 1 country
			dare.options = {
				schema: {
					town: {
						country_id: 'country.id'
					},
					country: {}
				}
			};

			dare.get({
				table: 'country',
				fields: [
					{
						town: ['id', 'name']
					}
				],
				limit
			})
			.then(resp => {
				let towns = resp[0].town;
				expect(towns).to.be.an('array');
				expect(towns[0].id).to.equal('1');
				expect(towns[0].name).to.equal('a');
				done();
			}).catch(done);

		});
		it('should write one to many requests with group concat, and format the response as an array', done => {

			dare.sql = () => {

				return Promise.resolve([{
					'town[$$].id': '',
					'town[$$].name': ''
				}]);
			};

			// Here the schema is a series of tables a street, belongs to 1 town and in return 1 country
			dare.options = {
				schema: {
					town: {
						country_id: 'country.id'
					},
					country: {}
				}
			};

			dare.get({
				table: 'country',
				fields: [
					{
						town: ['id', 'name']
					}
				],
				limit
			})
			.then(resp => {
				let towns = resp[0].town;
				expect(towns).to.be.an('array');
				expect(towns.length).to.equal(0);
				done();
			}).catch(done);

		});
	});

});

function nosql(done) {
	return () => done(new Error('Unexpected call dare.sql'));
}
