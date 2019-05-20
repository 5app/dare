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


	it('should write one to many requests with a subquery', async () => {

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

		const resp = await dare.get({
			table: 'assets',
			fields: {
				'asset_name': 'name',
				'collection_count': 'COUNT(collections.id)'
			}
		});

		expect(resp).to.have.property('asset_name', 'name');
		expect(resp).to.have.property('collection_count', 42);
	});

	it('should export the response in the format given', async () => {

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

		const resp = await dare.get({
			table: 'assets',
			fields: {
				'asset_name': 'name',
				'collections': [{
					'count': 'COUNT(id)'
				}]
			}
		});

		expect(resp.collections).to.have.property('count', 42);
	});

	it('should concatinate many expressions into an array using GROUP_CONCAT', async () => {

		dare.sql = sql => {

			const expected = `

				SELECT a.name AS 'name',
				(
					SELECT CONCAT('[', GROUP_CONCAT(CONCAT_WS('', '[', '"', REPLACE(REPLACE(c.id, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ',', '"', REPLACE(REPLACE(c.name, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ']')), ']')
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

		const resp = await dare.get({
			table: 'assets',
			fields: {
				'name': 'name',
				'collections': ['id', 'name']
			}
		});

		expect(resp.collections).to.be.an('array');
		expect(resp.collections[0]).to.have.property('id', '1');
		expect(resp.collections[0]).to.have.property('name', 'a');
	});

	it('should *not* subquery a nested object without fields', async () => {

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

		const resp = await dare.get({
			table: 'assets',
			fields: {
				'name': 'name'
			},
			join: {
				'collections': {
					name: 'a'
				}
			}
		});

		expect(resp).to.have.property('asset_name', 'name');

	});

	it('should *not* use a subquery when the many table is used in the filter', async () => {

		dare.sql = sql => {

			const expected = `
				SELECT a.name AS 'name',
					CONCAT('[', GROUP_CONCAT(CONCAT_WS('', '[', '"', REPLACE(REPLACE(c.id, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ',', '"', REPLACE(REPLACE(c.name, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ']')), ']') AS 'collections[id,name]'
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

		return dare.get({
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
		});

	});

	it('should *not* subquery a table off a join with a possible set of values', async () => {

		dare.sql = sql => {

			const expected = `
				SELECT a.name AS 'name', CONCAT('[',GROUP_CONCAT(CONCAT_WS('', '[', '"', REPLACE(REPLACE(COUNT(d.id), '\\\\', '\\\\\\\\'),'"','\\"'),'"',']')),']') AS 'assetCollections[collections.descendents]'
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

		return dare.get({
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
		});

	});

	it('should aggregate single field requests in a subquery, aka without group_concat', async () => {


		dare.sql = sql => {

			const expected = `
				SELECT a.id,a.name,a.created_time,
				(
					SELECT CONCAT_WS('', '[', '"', REPLACE(REPLACE(b.id, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ',', '"', REPLACE(REPLACE(b.email, '\\\\', '\\\\\\\\'), '"', '\\"'), '"', ']')
					FROM userEmails b
					WHERE
						b.user_id = a.id
					LIMIT 1
				) AS 'email_id,email'
				FROM users a
				GROUP BY a.id
				ORDER BY a.name
				LIMIT 1`;

			expectSQLEqual(sql, expected);

			return Promise.resolve([{}]);
		};

		dare.options = {
			schema: {
				userEmails: {
					user_id: 'users.id'
				}
			}
		};

		return dare.get({
			table: 'users',
			fields: [
				'id',
				'name',
				{
					email_id: 'userEmails.id',
					email: 'userEmails.email'
				},
				'created_time'
			],
			filter: {},
			join: {},
			groupby: 'id',
			orderby: 'name',
		});

	});

	describe('with groupby', () => {

		it('should allow multiple groupby on nested tables', async () => {

			dare.sql = async sql => {

				expect(sql).to.contain('GROUP BY c.id,a.id');

				return [{
					'AssetID': 1,
					'CollectionID': 2,
					'Collection': 'b'
				}];
			};

			return dare.get({
				'table': 'assets',
				'fields': {
					'AssetID': 'id',
					'CollectionID': 'assetCollections.collections.id',
					'Collection': 'assetCollections.collections.name'
				},
				'groupby': [
					'id',
					'assetCollections.collections.id'
				]
			});

		});
	});
});
