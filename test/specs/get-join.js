'use strict';

// Test Generic DB functions
const expectSQLEqual = require('../lib/sql-equal');


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

		dare.sql = sql => {

			const expected = `

				SELECT activityEvents.created_time, COUNT(*) AS '_count', asset.id AS 'asset.id', asset.name AS 'asset.name', DATE(asset.updated_time) AS 'asset.last_updated'
				FROM activityEvents
					LEFT JOIN activitySession ON (activitySession.id = activityEvents.session_id)
					LEFT JOIN apps asset ON (asset.id = activityEvents.ref_id)
				WHERE activityEvents.category = ?
					AND activityEvents.action = ?
					AND activityEvents.created_time > ?
					AND activitySession.domain = ?
				GROUP BY asset.id
				ORDER BY _count DESC
				LIMIT 5

			`;

			expectSQLEqual(sql, expected);

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
							'last_updated': 'DATE(updated_time)'
						}
					]
				}
			],
			groupby: 'asset.id',
			orderby: '_count DESC',
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

	describe('join conditions', () => {

		describe('should accept', () => {

			[
				{
					asset: {
						type: 'mobile'
					}
				}
			].forEach(join => {

				it(`valid: ${JSON.stringify(join)}`, done => {

					dare.sql = sql => {

						const expected = `
							SELECT activityEvents.id, asset.name AS 'asset.name'
							FROM activityEvents
							LEFT JOIN apps asset ON (asset.type = ? AND asset.id = activityEvents.ref_id)
							LIMIT 5
						`;

						expectSQLEqual(sql, expected);

						return Promise.resolve([{}]);
					};

					dare.get({
						table: 'activityEvents',
						fields: [
							'id',
							{asset: ['name']}
						],
						join,
						limit
					})
					.then(() => done())
					.catch(done);

				});

			});
		});

		it('should ignore redundant joins', done => {

			dare.sql = sql => {

				const expected = `
					SELECT activityEvents.id
					FROM activityEvents
					LIMIT 5
				`;

				expectSQLEqual(sql, expected);

				return Promise.resolve([{}]);
			};

			dare.get({
				table: 'activityEvents',
				fields: [
					'id'
				],
				// This defines the join condition,
				// But the table asset is redundant
				// it's neither returning fields, part of the filter, or a required join.
				join: {
					asset: {
						type: 'a'
					}
				},
				limit
			})
			.then(() => done())
			.catch(done);
		});
	});

	describe('GROUP BY inclusion', () => {

		it('should automatically assign a GROUP BY on a 1:n join', done => {

			dare.sql = sql => {

				const expected = `
					SELECT asset.id
					FROM apps asset
					LEFT JOIN activityEvents ON(activityEvents.ref_id = asset.id)
					WHERE activityEvents.type = ?
					GROUP BY asset.id
					LIMIT 5
				`;

				expectSQLEqual(sql, expected);

				return Promise.resolve([{}]);
			};

			dare.get({
				table: 'asset',
				fields: ['id'],
				filter: {
					activityEvents: {
						type: 'a'
					}
				},
				limit
			})
			.then(() => done())
			.catch(done);
		});

		it('should not automatically assign a GROUP on an 1:n join where there are Aggregate ', done => {

			dare.sql = sql => {

				const expected = `
					SELECT COUNT(*) AS '_count'
					FROM apps asset
					LEFT JOIN activityEvents ON(activityEvents.ref_id = asset.id)
					WHERE activityEvents.type = ?
					LIMIT 5
				`;

				expectSQLEqual(sql, expected);

				return Promise.resolve([{}]);
			};

			dare.get({
				table: 'asset',
				fields: ['_count'],
				filter: {
					activityEvents: {
						type: 'a'
					}
				},
				limit
			})
			.then(() => done())
			.catch(done);
		});
	});

	describe('generated fields', () => {

		it('should allow bespoke fields to be defined in the schema', done => {

			// Create handler for 'asset.thumbnail'
			dare.options = {
				schema: {
					'assets': {
						picture_id: 'picture.id',
						thumbnail(fields) {

							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return obj => `/asset/${obj.id}/thumbnail`;
						}
					},
					'picture': {
						image(fields) {
							// Update the current fields array to include any dependencies missing
							if (fields.indexOf('id') === -1) {
								fields.push('id');
							}

							// Return either a SQL string or a function to run on the response object
							return obj => `${this.options.meta.root}/picture/${obj.id}/image`;
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
					'picture.id': 100
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

});
