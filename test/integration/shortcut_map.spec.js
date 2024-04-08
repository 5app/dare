import Dare from '../../src/index.js';
import Debug from 'debug';
import {expect} from 'chai';
import mysql from 'mysql2/promise';
import db from './helpers/db.js';
import {options, castToStringIfNeeded} from './helpers/api.js';

const debug = Debug('sql');

// Connect to db

describe(`model.shortcut_map`, () => {
	let dare;

	beforeEach(() => {
		// Initiate
		dare = new Dare(options);

		// Extend
		dare = dare.use({
			// Disable infer intermediate model
			infer_intermediate_models: false,

			// Create a shortcut_map
			models: {
				users: {
					// Create a shortcut definition on the `users' model
					shortcut_map: {
						myTeams: 'userTeams.teams',
					},
				},
			},
		});

		// Set a test instance

		dare.execute = query => {
			// DEBUG
			debug(mysql.format(query.sql, query.values));

			return db.query(query);
		};
	});

	it('should be able to use a shortcut_map entries to dictate the model links', async () => {
		const teamName = 'A Team';

		// Create users, team and add the two
		const [user, team] = await Promise.all([
			// Create user
			dare.post('users', {username: 'user123'}),

			// Create team
			dare.post('teams', {name: teamName}),
		]);

		// Add to the pivot table
		await dare.post('userTeams', {
			user_id: user.insertId,
			team_id: team.insertId,
		});

		// Test
		const resp = await dare.get({
			table: 'users',
			fields: [
				{
					// Direct link to userTeams, automatically uses pivot table userTeams
					myTeams: ['id', 'name'],
				},
			],
			join: {
				myTeams: {
					'%name': '%team%',
				},
			},
		});

		expect(resp).to.deep.nested.include({
			'myTeams[0]': {
				id: castToStringIfNeeded(team.insertId),
				name: teamName,
			},
		});
	});
});
