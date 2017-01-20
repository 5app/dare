'use strict';

// Test Generic DB functions
const SQLEXP = require('../lib/sql-match');

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


	it('should write one to many requests with a subquery and group_concat, and format the response as an array', done => {

		dare.sql = sql => {

			expect(sql.replace(/\s+/g, ' ')).to.match(SQLEXP(`

				SELECT assets.name AS 'asset_name',
				(
					SELECT COUNT(collections.id)
					FROM assetCollections a
					LEFT JOIN collections ON (a.collection_id = collections.id)
					WHERE a.asset_id = assets.id
				) AS collections
				FROM assets
				LIMIT 1

			`));
			return Promise.resolve([{
				asset_name: 'name',
				collections: 42
			}]);
		};

		dare.get({
			table: 'assets',
			fields: {
				'asset_name': 'name',
				'collections': 'COUNT(collections.id)'
			}
		})
		.then(() => {
			done();
		}).catch(done);

	});
});
