'use strict';

const error = require('../../src/utils/error');

// Test Generic DB functions
const SQLEXP = require('../lib/sql-match');


// Create a schema
const options = {
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
	const limit = 5;

	beforeEach(() => {
		dare = new Dare(options);
	});

	it('should contain the function dare.get', () => {
		expect(dare.get).to.be.a('function');
	});

	it('should generate a SELECT statement and execute dare.sql', done => {

		dare.sql = query => {
			expect(query.replace(/\s+/g, ' ')).to.match(SQLEXP(`

				SELECT activityEvents.created_time, COUNT(*) AS _count, asset.id AS 'asset.id', asset.name AS 'asset.name', DATE(asset.updated_time) AS 'last_updated'
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
						'name',
						{
							'last_updated': 'DATE(asset.updated_time)'
						}
					]
				}
			],
			groupby: 'asset.id',
			orderby: 'count DESC',
			limit
		})
		.then(() => {
			done();
		}).catch(done);

	});


	describe('fields', () => {

		it('should respond with the same structure as the request.fields', done => {

			dare.sql = () =>
				Promise.resolve([{
					name: 'Name',
					'asset.name': 2001
				}]);


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
			.then(resp => {
				expect(resp).to.be.an('array');
				expect(resp.length).to.eql(1);
				const item = resp[0];
				expect(item).to.have.property('name');
				expect(item.asset).to.have.property('name', 2001);
				done();
			}).catch(done);

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

				it(`valid: ${  JSON.stringify(value)}`, done => {

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
				{},
				'string',
				['COUNT(wrong)'],
				[{'asset(*)': 'id'}],
				[{'asset': 'DATE(id'}],
				[{'asset': ['DATE(id)']}]
			].forEach(value => {

				it(`invalid: ${  JSON.stringify(value)}`, done => {

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

				it(`valid: ${JSON.stringify(value)}`, done => {

					dare.sql = (sql, prepared) => {
						for (const x in value) {
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
	});

	describe('generated fields', () => {

		it('should allow bespoke fields to be defined in the schema', done => {

			// Create handler for 'asset.thumbnail'
			dare.options = {
				schema: {
					'assets': {
						thumbnail: fields => {

							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return obj => `/asset/${obj.id}/thumbnail`;
						}
					},
					'picture': {
						asset_id: 'assets.id',
						image(fields) {
							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return obj => `${this.options.meta.root  }/picture/${obj.id}/image`;
						}
					}
				}
			};

			// Stub the execute function
			dare.sql = () =>
				// Ensure that there is no thumbnail field requested.
				Promise.resolve([{
					'id': 1,
					'name': 'Andrew',
					'picture[$$].id': 100
				}]);


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
			.then(resp => {
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
			}).catch(done);


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

	describe('GROUP CONCAT', () => {

		it('should write one to many requests with group concat, and format the response as an array', done => {

			dare.sql = sql => {

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
				const towns = resp[0].town;
				expect(towns).to.be.an('array');
				expect(towns[0].id).to.equal('1');
				expect(towns[0].name).to.equal('a');
				done();
			}).catch(done);

		});

		it('should write one to many requests with group concat, and format the response as an array', done => {

			dare.sql = () =>
				Promise.resolve([{
					'town[$$].id': '',
					'town[$$].name': ''
				}]);

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
				const towns = resp[0].town;
				expect(towns).to.be.an('array');
				expect(towns.length).to.equal(0);
				done();
			}).catch(done);

		});

		it('should not wrap aggregate functions', done => {

			dare.sql = sql => {
				expect(sql).to.contain('SELECT MAX(town.population) AS \'_max\'');
				done();
				return Promise.resolve([]);
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
						town: [
							{_max: 'MAX(population)'}
						]
					}
				],
				limit
			})
			.catch(done);

		});
	});

});

function nosql(done) {
	return () => done(new Error('Unexpected call dare.sql'));
}
