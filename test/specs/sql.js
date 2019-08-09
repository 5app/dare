
describe('sql', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare();
		dare.execute = () => {

			throw new Error('Should not execute');

		};

	});

	it('should contain the function dare.sql', () => {

		expect(dare.sql).to.be.a('function');

	});

	it('should trigger execute and resolve callback', async () => {

		dare.execute = (sql, callback) => {

			callback(null, 1);

		};

		const res = await dare.sql('SELECT 1');
		expect(res).to.eql(1);

	});

	it('should trigger execute and resolve promise', async () => {

		dare.execute = () => Promise.resolve(1);

		const res = await dare.sql('SELECT 1');
		expect(res).to.eql(1);

	});

	it('should trigger execute and reject a promise', async () => {

		dare.execute = () => Promise.reject(new Error('test'));

		try {

			await dare.sql('SELECT 1');
			throw new Error('should not get here');

		}
		catch (e) {

			expect(e).to.have.property('message', 'test');

		}

	});

});
