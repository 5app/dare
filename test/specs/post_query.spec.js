import Dare from '../../src/index.js';

// Test Generic DB functions
import sqlEqual from '../lib/sql-equal.js';

describe('post from query', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare();

		// Should not be called...
		dare.execute = () => {

			throw new Error('execute called');

		};

	});


	it('should generate an INSERT...SELECT statement and execute dare.execute', async () => {

		dare.execute = async ({sql, values}) => {

			sqlEqual(sql, `
				INSERT INTO test (\`origin_id\`, \`name\`)
				SELECT a.id AS 'origin_id', a.name
				FROM origin a
				WHERE a.name = ?
				LIMIT 1000
				ON DUPLICATE KEY UPDATE _rowid=_rowid
			`);
			expect(values).to.deep.equal(['Liz']);
			return {id: 1};

		};

		const resp = await dare
			.post({
				table: 'test',
				query: {
					table: 'origin',
					fields: [{
						origin_id: 'id'
					}, 'name'],
					filter: {
						'name': 'Liz'
					},
					limit: 1000
				},
				duplicate_keys: 'ignore'
			});

		expect(resp).to.have.property('id', 1);

	});

});
