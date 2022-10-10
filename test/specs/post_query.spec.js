import Dare from '../../src/index.js';
import DareError from '../../src/utils/error.js';

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
				ON DUPLICATE KEY UPDATE test._rowid=test._rowid
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

	it('should throw an error if query fields include a nested structures', async () => {

		// Update the Dare model
		dare = dare.use({
			// Update models
			models: {
				originB: {
					schema: {
						// Join the origin and originRelative
						origin_id: ['originA.id']
					}
				}
			}
		});

		const test = dare
			.post({
				table: 'test',
				query: {
					table: 'originA',
					fields: [{
						originB: ['this', 'makes', 'no', 'sense']
					}, 'name']
				},
				duplicate_keys: 'ignore'
			});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.INVALID_REQUEST);

	});

	it('should throw an error if query includes a generated function', async () => {

		// Update the Dare model
		dare = dare.use({
			// Update models
			models: {
				origin: {
					schema: {
						// Generated function returns generated
						generated: () => () => 'Whoops'
					}
				}
			}
		});

		const test = dare
			.post({
				table: 'test',
				query: {
					table: 'origin',
					fields: ['generated', 'ok']
				},
				duplicate_keys: 'ignore'
			});

		return expect(test)
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.INVALID_REQUEST);

	});

});
