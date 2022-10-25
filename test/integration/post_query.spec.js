import assert from 'node:assert/strict';
import defaultAPI from './helpers/api.js';

describe('post from query', () => {

	let dare;

	beforeEach(() => {

		dare = defaultAPI();

	});

	it('should perform an INSERT...SELECT operation', async () => {

		// Get country_id
		const {country_id} = await dare.get('country', [{'country_id': 'id'}], {code: 'UK'});

		// Setup
		const [team] = await Promise.all([
			dare.post('teams', {name: 'my team'}),
			dare.post('users', ['qe1', 'qe2'].map(username => ({username, country_id})))
		]);

		// Run Tests
		const {affectedRows} = await dare
			.post({
				table: 'userTeams',
				query: {
					table: 'users',
					fields: [{
						user_id: 'id',
						team_id: team.insertId
					}],
					filter: {
						username: 'qe%',
						country: {
							code: 'UK'
						}
					},
					limit: 1000
				},
				duplicate_keys: 'ignore'
			});

		assert.strictEqual(affectedRows, 2, 'Should have inserted 2 records');

	});

});
