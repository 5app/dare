'use strict';

// Test Generic DB functions
const expectSQLEqual = require('../lib/sql-equal');

// Dare instance
let dare;

// Create a schema
const options = {
	schema: {

		// Define Datasets
		assets: {},
		collections: {},

		// Define a table to associate datasets
		assetCollections: {
			asset_id: 'assets.id',
			collection_id: 'collections.id'
		},

		// Collection children
		collectionChildren: {
			collection_id: 'collections.id'
		}
	}
};


describe('get - subquery', () => {

	beforeEach(() => {
		dare = new Dare(options);
	});


	it('should write one to many requests with a subquery', done => {

		dare.sql = sql => {

			const expected = `

				SELECT a.name AS 'asset_name',
				(
					SELECT COUNT(c.id)
					FROM assetCollections b
					LEFT JOIN collections c ON (c.id = b.collection_id)
					WHERE b.asset_id = a.id
					LIMIT 1
				) AS 'collection_count'
				FROM assets a
				GROUP BY a.id
				LIMIT 1

			`;

			expectSQLEqual(sql, expected);

			return Promise.resolve([{
				asset_name: 'name',
				collection_count: 42
			}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'asset_name': 'name',
				'collection_count': 'COUNT(collections.id)'
			}
		})
			.then(resp => {
				expect(resp).to.have.property('asset_name', 'name');
				expect(resp).to.have.property('collection_count', 42);
				done();
			}).catch(done);

	});

	it('should export the response in the format given', done => {

		dare.sql = sql => {

			const expected = `

				SELECT a.name AS 'asset_name',
				(
					SELECT COUNT(c.id)
					FROM assetCollections b
					LEFT JOIN collections c ON (c.id = b.collection_id)
					WHERE b.asset_id = a.id
					LIMIT 1
				) AS 'collections.count'
				FROM assets a
				GROUP BY a.id
				LIMIT 1

			`;

			expectSQLEqual(sql, expected);

			return Promise.resolve([{
				asset_name: 'name',
				'collections.count': 42
			}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'asset_name': 'name',
				'collections': [{
					'count': 'COUNT(id)'
				}]
			}
		})
			.then(resp => {
				expect(resp.collections).to.have.property('count', 42);
				done();
			}).catch(done);

	});

	it('should concatinate many expressions into an array using GROUP_CONCAT', done => {

		dare.sql = sql => {

			const expected = `

				SELECT a.name AS 'name',
				(
					SELECT CONCAT('[', GROUP_CONCAT(CONCAT('[', '"', REPLACE(c.id, '"', '\\"'), '"', ',', '"', REPLACE(c.name, '"', '\\"'), '"', ']')), ']')
					FROM assetCollections b
					LEFT JOIN collections c ON (c.id = b.collection_id)
					WHERE b.asset_id = a.id
					LIMIT 1
				) AS 'collections[id,name]'
				FROM assets a
				GROUP BY a.id
				LIMIT 1

			`;
			expectSQLEqual(sql, expected);

			return Promise.resolve([{
				asset_name: 'name',
				'collections[id,name]': '[["1","a"],["2","b"]]'
			}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'name': 'name',
				'collections': ['id', 'name']
			}
		})
			.then(resp => {
				expect(resp.collections).to.be.an('array');
				expect(resp.collections[0]).to.have.property('id', '1');
				expect(resp.collections[0]).to.have.property('name', 'a');
				done();
			}).catch(done);

	});

	it('should *not* subquery a nested object without fields', done => {

		dare.sql = sql => {

			const expected = `

				SELECT a.name AS 'name'
				FROM assets a
				LIMIT 1

			`;
			expectSQLEqual(sql, expected);

			return Promise.resolve([{
				asset_name: 'name'
			}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'name': 'name'
			},
			join: {
				'collections': {
					name: 'a'
				}
			}
		})
			.then(resp => {
				expect(resp).to.have.property('asset_name', 'name');
				done();
			}).catch(done);

	});

	it('should *not* use a subquery when the many table is used in the filter', done => {

		dare.sql = sql => {

			const expected = `
				SELECT a.name AS 'name',
					CONCAT('[', GROUP_CONCAT(CONCAT('[', '"', REPLACE(c.id, '"', '\\"'), '"', ',', '"', REPLACE(c.name, '"', '\\"'), '"', ']')), ']') AS 'collections[id,name]'
				FROM assets a
				LEFT JOIN assetCollections b ON(b.asset_id = a.id)
				LEFT JOIN collections c ON (c.id = b.collection_id)
				WHERE c.name = ?
				GROUP BY a.id
				LIMIT 1
			`;

			expectSQLEqual(sql, expected);

			return Promise.resolve([{}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'name': 'name',
				'collections': ['id', 'name']
			},
			filter: {
				collections: {
					name: 'myCollection'
				}
			}
		})
			.then(() => {
				done();
			}).catch(done);

	});

	it('should *not* subquery a table off a join with a possible set of values', done => {

		dare.sql = sql => {

			const expected = `
				SELECT a.name AS 'name', CONCAT('[',GROUP_CONCAT(CONCAT('[','"',REPLACE(COUNT(d.id),'"','\\"'),'"',']')),']') AS 'assetCollections[collections.descendents]'
				FROM assets a
				LEFT JOIN assetCollections b ON(b.asset_id = a.id)
				LEFT JOIN collections c ON(c.id = b.collection_id)
				LEFT JOIN collectionChildren d ON(d.collection_id = c.id)
				WHERE b.is_deleted = ?
				GROUP BY a.id
				LIMIT 1
			`;

			expectSQLEqual(sql, expected);

			return Promise.resolve([{}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'name': 'name',
				'assetCollections': {
					'collections': {
						descendents: 'COUNT(collectionChildren.id)'
					}
				}
			},
			filter: {
				assetCollections: {
					is_deleted: false
				}
			}
		})
			.then(() => {
				done();
			}).catch(done);

	});
});
