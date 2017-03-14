'use strict';

// Test Generic DB functions
const SQLEXP = require('../lib/sql-match');
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
		}
	}
};


describe('get - subquery', () => {

	beforeEach(() => {
		dare = new Dare(options);
	});


	it('should write one to many requests with a subquery', done => {

		dare.sql = sql => {

			expect(sql.replace(/\s+/g, ' ')).to.match(SQLEXP(`

				SELECT assets.name AS 'asset_name',
				(
					SELECT COUNT(collections.id)
					FROM assetCollections a
					LEFT JOIN collections ON (collections.id = a.collection_id)
					WHERE a.asset_id = assets.id
					LIMIT 1
				) AS 'collection_count'
				FROM assets
				GROUP BY assets.id
				LIMIT 1

			`));
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

			expect(sql.replace(/\s+/g, ' ')).to.match(SQLEXP(`

				SELECT assets.name AS 'asset_name',
				(
					SELECT COUNT(collections.id)
					FROM assetCollections a
					LEFT JOIN collections ON (collections.id = a.collection_id)
					WHERE a.asset_id = assets.id
					LIMIT 1
				) AS 'collections.count'
				FROM assets
				GROUP BY assets.id
				LIMIT 1

			`));
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

				SELECT assets.name AS 'name',
				(
					SELECT CONCAT('[', GROUP_CONCAT(CONCAT('[', '"', REPLACE(collections.id, '"', '\\"'), '"', ',', '"', REPLACE(collections.name, '"', '\\"'), '"', ']')), ']')
					FROM assetCollections a
					LEFT JOIN collections ON (collections.id = a.collection_id)
					WHERE a.asset_id = assets.id
					LIMIT 1
				) AS 'collections[id,name]'
				FROM assets
				GROUP BY assets.id
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
});
