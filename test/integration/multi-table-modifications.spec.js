import assert from 'node:assert/strict';
import defaultAPI from './helpers/api.js';

describe('Multi table modifications', () => {

	let dare;

	beforeEach(() => {

		dare = defaultAPI();

	});

	it('should be able to patch and delete records based on a cross table join', async () => {

		const teamName = 'my team';

		/*
		 * Setup
		 * Users and teams
		 */
		const [team, users] = await Promise.all([
			dare.post('teams', {name: teamName}),
			dare.post('users', ['qe1', 'qe2'].map(username => ({username})))
		]);
		await dare
			.post({
				table: 'userTeams',
				body: sequence(users).map(user_id => ({
					team_id: team.insertId,
					user_id
				}))
			});

		/*
		 * Test: Delete based on a condition from another table
		 * In this case delete userTeams entries based upon the team name.
		 */
		const {affectedRows} = await dare.del({
			table: 'userTeams',
			filter: {
				teams: {
					name: teamName
				}
			}
		});

		assert.strictEqual(affectedRows, 2, 'Should have inserted 2 records');

	});

});


/**
 * Sequence
 * Creates an Array with a sequence of values
 * @param {object} obj - Obj
 * @param {number} obj.affectedRows - Length
 * @param {number} obj.insertId - Start value
 * @returns {Array<number>} An Array of numbers
 */
export function sequence({affectedRows: len, insertId: start}) {

	const a = [];
	for (let i = 0; i < len; i++) {

		a.push(i + start);

	}
	return a;

}
