'use strict';

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
				references: 'users.id'
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
		dare = new Dare();
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
					LEFT JOIN asset ON (asset.id = activityEvents.ref_id)
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
				activitySession : {
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
			limit,
			join_handler
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
				limit,
				join_handler
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
						limit,
						join_handler
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
						limit,
						join_handler
					})
					.then(done, err => {
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
						limit,
						join_handler
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
					"id OR 1": "1"
				},
				{
					"DATE(field)": "1"
				},
				{
					asset: {
						"id OR 1": "1"
					}
				}
			].forEach(value => {

				it('invalid: ' + JSON.stringify(value), done => {

					dare.sql = nosql(done);

					dare.get({
						table: 'activityEvents',
						fields: ['id'],
						filter: value,
						limit,
						join_handler
					})
					.then(done, err => {
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
						limit: value,
						join_handler
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
						limit: value,
						join_handler
					})
					.then(done, err => {
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
						limit,
						join_handler
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
						limit,
						join_handler
					})
					.then(done, err => {
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
						limit,
						join_handler
					})
					.then(() => (done()))
					.catch(done);        });
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
						limit,
						join_handler
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
						limit,
						join_handler
					})
					.then(done, err => {
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
						limit,
						join_handler
					})
					.then(() => (done()))
					.catch(done);
				});
			});
		});
	});

	describe('join_handler', () => {

		it('should throw and error when the request.join_handler returns an empty join condition', done => {

			dare.sql = () => done(new Error('Unexpected call dare.sql'));

			dare.get({
				table: 'activityEvents',
				filter: {
					activitySession : {
						domain: '5app.com'
					}
				},
				fields: [
					'created_time'
				],
				limit,
				join_handler: (() => null)
			})
			.then(() => {
				done(new Error('Should have thrown an error'));
			}, (err) => {
				expect(err).to.have.property('message');
				done();
			});

		});
	});


	describe('table_alias_handler', () => {
		it('should use request.table_alias_handler for interpretting the table names', done => {

			dare.sql = (sql) => {

				expect(sql).to.contain('FROM activityEvents events');
				expect(sql).to.contain('LEFT JOIN apps asset');

				return Promise.resolve([]);
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
				limit,
				join_handler,
				table_alias_handler: (table) => ({'events': 'activityEvents', 'asset': 'apps'}[table])
			})
			.then(() => {
				done();
			}, done);

		});

		it('should use the given name if no table_alias_handler is defined', done => {

			dare.sql = (sql) => {
				expect(sql).to.contain('LEFT JOIN asset');
				return Promise.resolve([]);
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
				limit,
				join_handler
			})
			.then(() => {
				done();
			}, done);

		});

		describe('Permittable tables: table_alias returns falsly', () => {

			it('should throw an error if falsly on root table', done => {

				dare.sql = nosql(done);

				dare.get({
					table: 'private',
					fields: ['id'],
					limit,
					join_handler,
					table_alias_handler: () => (false)
				})
				.then(done, err => {
					expect(err).to.have.property('message');
					done();
				}).catch(done);
			});

			it('should throw an error if falsly on join table', done => {

				dare.sql = nosql(done);

				dare.get({
					table: 'public',
					filter: ['id'],
					fields: [
						{
							asset: ['name']
						}
					],
					limit,
					join_handler,
					table_alias_handler: (table_alias) => ({'public': 'public'}[table_alias])
				})
				.then(done, err => {
					expect(err).to.have.property('message');
					done();
				}).catch(done);
			});
		});

	});

});


// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks columns on both tables to find one which has a reference field to the other.
function join_handler(join_table, root_table) {

	let schema = options.schema;
	let alias = options.table_alias;

	// Get the references
	let map = {};

	let a = [join_table, root_table];

	for (let i = 0, len = a.length; i < len; i++) {

		// Mark the focus table
		let alias_a = a[i];
		let ref_a = alias[alias_a] || alias_a;
		let table_a = schema[ref_a];

		// Loop through the
		if (table_a) {

			// Get the reference table
			let alias_b = a[(i + 1) % len];
			let ref_b = alias[alias_b] || alias_b;
			// let table_b = schema[ref_b];

			// Loop through the table fields
			for (let field in table_a) {
				let column = table_a[field];
				if (column && column.references && column.references.split('.')[0] === ref_b) {
					map[alias_b + '.' + column.references.split('.')[1]] = alias_a + '.' + field;
				}
			}
		}
	}

	return map;
}


function nosql(done) {
	return () => done(new Error('Unexpected call dare.sql'));
}
