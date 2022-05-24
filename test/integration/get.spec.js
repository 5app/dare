import Dare from '../../src/index.js';
// DEBUG import mysql from 'mysql2/promise';

const {db} = global;
const models = {
	teams: {},
	users: {},
	userTeams: {

		schema: {
			'user_id': ['users.id'],
			'team_id': ['teams.id']
		}
	}
};

// Legacy schema
const schema = {
	teams: {},
	users: {},
	userTeams: {
		'user_id': ['users.id'],
		'team_id': ['teams.id']
	}
};

// Connect to db

[{models}, {schema}].forEach(options => {

	describe(`Dare init tests: options ${Object.keys(options)}`, () => {

		let dare;

		beforeEach(() => {

			// Initiate
			dare = new Dare(options);

			// Set a test instance
			// eslint-disable-next-line arrow-body-style
			dare.execute = query => {

				// DEBUG console.log(mysql.format(query.sql, query.values));

				return db.query(query);

			};

		});

		it('Can insert and retrieve results ', async () => {

			const username = 'A Name';
			await dare.post('users', {username});

			const resp = await dare.get('users', ['username']);

			expect(resp).to.have.property('username', username);

		});

		it('Can update results', async () => {

			const username = 'A Name';
			const newName = 'New name';
			const {insertId} = await dare.post('users', {username});
			await dare.patch('users', {id: insertId}, {username: newName});

			const resp = await dare.get('users', ['username']);

			expect(resp).to.have.property('username', newName);

		});

		it('Can update results with INSERT...ON DUPLICATE KEYS UPDATE', async () => {

			const username = 'A Name';
			const newName = 'New name';
			const {insertId} = await dare.post('users', {username});
			await dare.post('users', {id: insertId, username: newName}, {
				duplicate_keys_update: ['username']
			});

			const resp = await dare.get('users', ['username']);

			expect(resp).to.have.property('username', newName);

		});

		it('should be able to return nested values', async () => {

			const teamName = 'A Team';

			// Create users, team and add the two
			const [user, team] = await Promise.all([

				// Create user
				dare.post('users', {username: 'user123'}),

				// Create team
				dare.post('teams', {name: teamName})

			]);

			// Add to the pivot table
			await dare.post('userTeams', {user_id: user.insertId, team_id: team.insertId});


			{

				// Same Structure
				const resp = await dare.get({
					table: 'users',
					fields: [
						{
							'userTeams': {
								'teams': [
									'id',
									'name',
									'description'
								]
							}
						}
					]
				});

				expect(resp)
					.to.deep.nested.include({'userTeams[0].teams': {
						id: String(team.insertId),
						name: teamName,
						description: ''
					}});

			}

			{

				// Remap Structure
				const resp = await dare.get({
					table: 'users',
					fields: [
						{
							'id': 'userTeams.teams.id',
							'name': 'userTeams.teams.name',
							'description': 'userTeams.teams.description'
						}
					]
				});

				expect(resp)
					.to.deep.nested.equal({
						id: String(team.insertId),
						name: teamName,
						description: ''
					});

			}


			{

				// Remap Structure
				const resp = await dare.get({
					table: 'users',
					fields: [
						{
							'id': 'userTeams.teams.id',
							'name': 'userTeams.teams.name',
							'description': 'userTeams.teams.description'
						}
					],
					join: {
					// When there are no results we get an empty value
						userTeams: {id: -1}
					}
				});

				expect(resp)
					.to.deep.nested.equal({});

			}

		});

	});

});
