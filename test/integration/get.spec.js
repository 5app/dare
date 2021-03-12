const Dare = require('../../src');
const db = require('./helpers/db');

// Connect to db

describe('dare init tests', () => {

	let dare;

	beforeEach(() => {

		// Initiate
		dare = new Dare();

		// Set a test instance
		dare.execute = query => db.query(query);

	});

	it('Can insert and retrieve results ', async () => {

		const name = 'A Name';
		await dare.post('users', {name});

		const resp = await dare.get('users', ['name']);

		expect(resp).to.have.property('name', name);

	});

	it('Can update results', async () => {

		const name = 'A Name';
		const newName = 'New name';
		const {insertId} = await dare.post('users', {name});
		await dare.patch('users', {id: insertId}, {name: newName});

		const resp = await dare.get('users', ['name']);

		expect(resp).to.have.property('name', newName);

	});

});
