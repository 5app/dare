import Dare, {DareError} from '../../src/index.js';
import Debug from 'debug';
import {expect} from 'chai';
import mysql from 'mysql2/promise';
import db from './helpers/db.js';
import {options, castToStringIfNeeded} from './helpers/api.js';
const debug = Debug('sql');

// Connect to db

describe(`Dare init tests: options ${Object.keys(options)}`, () => {
	let dare;

	beforeEach(() => {
		// Initiate
		dare = new Dare(options);

		// Set a test instance
		// eslint-disable-next-line arrow-body-style
		dare.execute = query => {
			// DEBUG
			debug(mysql.format(query.sql, query.values));

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

	it('can delete results', async () => {
		const username = 'A Name';
		const {insertId} = await dare.post('users', {username});

		await dare.del('users', {id: insertId});

		await expect(dare.get('users', ['username'], {id: insertId}))
			.to.be.eventually.rejectedWith(DareError)
			.and.have.property('code', DareError.NOT_FOUND);
	});

	it('Can update results with INSERT...ON DUPLICATE KEYS UPDATE', async () => {
		const username = 'A Name';
		const newName = 'New name';
		const {insertId} = await dare.post('users', {username});
		await dare.post(
			'users',
			{id: insertId, username: newName},
			{
				duplicate_keys_update: ['username'],
			}
		);

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
			dare.post('teams', {name: teamName}),
		]);

		// Add to the pivot table
		await dare.post('userTeams', {
			user_id: user.insertId,
			team_id: team.insertId,
		});

		{
			// Same Structure
			const resp = await dare.get({
				table: 'users',
				fields: [
					{
						userTeams: {
							teams: ['id', 'name', 'description'],
						},
					},
				],
			});

			expect(resp).to.deep.nested.include({
				'userTeams[0].teams': {
					id: castToStringIfNeeded(team.insertId),
					name: teamName,
					description: castToStringIfNeeded(null),
				},
			});
		}

		{
			// Same Structure, team join is nulled
			const resp = await dare.get({
				table: 'users',
				fields: [
					{
						userTeams: {
							teams: ['id', 'name', 'description'],
						},
					},
				],
				join: {
					userTeams: {
						teams: {
							name: 'not-available',
						},
					},
				},
			});

			// UserTeams should be an empty array
			expect(resp).to.deep.nested.include({
				userTeams: [],
			});
		}

		{
			// Remap Structure
			const resp = await dare.get({
				table: 'users',
				fields: [
					{
						id: 'userTeams.teams.id',
						name: 'userTeams.teams.name',
						description: 'userTeams.teams.description',
					},
				],
			});

			expect(resp).to.deep.nested.equal({
				id: castToStringIfNeeded(team.insertId),
				name: teamName,
				description: castToStringIfNeeded(null),
			});
		}

		{
			// Remap Structure
			const resp = await dare.get({
				table: 'users',
				fields: [
					{
						id: 'userTeams.teams.id',
						name: 'userTeams.teams.name',
						description: 'userTeams.teams.description',
					},
				],
				join: {
					// When there are no results we get an empty value
					userTeams: {id: -1},
				},
			});

			expect(resp).to.deep.nested.equal({});
		}
	});

	it('Can search via fulltext', async () => {

		await dare.sql(`ALTER TABLE users ADD FULLTEXT KEY fulltext_users_fields (username, first_name, last_name)`);

		const username = 'name@example.com';
		await dare.post('users', [
			{
				username,
				first_name: "First Old'n'Name",
				last_name: 'Last-Name',
			},
		]);

		// Search across multiple fields
		{
			const resp = await dare.get('users', ['username'], {
				'*username,first_name,last_name': '+Fir* +Las*',
			});
			expect(resp).to.have.property('username', username);
		}

		// And use an alias of the fulltext field
		{
			dare.options.models.users.schema.textsearch =
				'username,first_name,last_name';

			const resp = await dare.get('users', ['username'], {
				'*textsearch': 'Fir* Las*',
			});
			expect(resp).to.have.property('username', username);
		}

		// And format the search to be compatible with MySQL Fulltext syntax

		// Emails
		{
			const resp = await dare.get('users', ['username'], {
				'*textsearch': username,
			});
			expect(resp).to.have.property('username', username);
		}

		// Hyphens
		{
			const resp = await dare.get('users', ['username'], {
				'*textsearch': '+last-name',
			});
			expect(resp).to.have.property('username', username);
		}

		// Apostrophe's
		{
			const resp = await dare.get('users', ['username'], {
				'*textsearch': "+Old'n'Name",
			});
			expect(resp).to.have.property('username', username);
		}
	});
});
