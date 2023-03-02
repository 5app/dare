import Dare from '../../src/index.js';
import Debug from 'debug';
import mysql from 'mysql2/promise';
import {options, castToStringIfNeeded} from './helpers/api.js';

const debug = Debug('sql');

const {db} = global;

// Connect to db

describe(`schema: modelAlias`, () => {
	let dare;

	beforeEach(() => {
		// Initiate
		dare = new Dare(options);

		// Extend
		dare = dare.use({
			// Disable infer intermediate model
			infer_intermediate_models: false,

			// Create a modelAlias
			models: {
				users: {
					schema: {
						myTeams: {
							modelAlias: 'userTeams.teams',
						},
					},
				},
			},
		});

		// Set a test instance
		// eslint-disable-next-line arrow-body-style
		dare.execute = query => {
			// DEBUG
			debug(mysql.format(query.sql, query.values));

			return db.query(query);
		};
	});

	it('should be able to use a modelAlias to describe the model links', async () => {
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
