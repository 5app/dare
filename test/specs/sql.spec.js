const Dare = require('../../src/');

describe('sql', () => {

	let dare;
	const query = 'SELECT 1';
	const values = [1];


	beforeEach(() => {

		dare = new Dare();

		dare.execute = async ({sql, values}) => {

			expect(sql).to.equal(query);
			return values[0];

		};

	});

	it('should contain the function dare.sql', () => {

		expect(dare.sql).to.be.a('function');

	});

	it('deprecated: should trigger execute from a string', async () => {

		const res = await dare.sql(query, values);
		expect(res).to.eql(values[0]);

	});

	it('should trigger execute from an Object<sql, values>', async () => {

		const res = await dare.sql({sql: query, values});
		expect(res).to.eql(1);

	});

	it('should trigger execute and reject a promise', () => {

		const msg = 'test';

		dare.execute = async () => {

			throw new Error(msg);

		};

		const test = dare.sql({sql: query});

		return expect(test)
			.to.be.eventually.rejectedWith(Error, msg);

	});

});
