import assert from 'node:assert/strict';
import defaultAPI from './helpers/api.js';

describe('post from query', () => {

	let dare;

	beforeEach(() => {

		dare = defaultAPI();

	});

	it('should perform an INSERT...SELECT operation', async () => {

		// Setup
		await Promise.all([
			dare.post('users', [
				{
					username: 'qe1'
				},
				{
					username: 'qe2'
				}
			]),
			dare.post('teams',
				/*
				 * Hack: so team_id is the same as user_id.
				 * TODO: Allow passing scalar values when constucting a query
				 */
				Array(2)
					.fill(null)
					.map((_, i) => ({name: `my team ${i}`}))
			)
		]);

		// Run Tests
		const {affectedRows} = await dare
			.post({
				table: 'userTeams',
				query: {
					table: 'users',
					fields: [{
						user_id: 'id',
						team_id: 'id' // TODO: make this an actual team.id value
					}],
					filter: {
						'username': 'qe%'
					},
					limit: 1000
				},
				duplicate_keys: 'ignore'
			});

		assert.strictEqual(affectedRows, 2, 'Should have inserted 2 records');

	});

});
