'use strict';

describe('Dare', () => {

	it('should be a constructor', () => {
		const dare = new Dare();
		expect(dare.constructor).to.eql(Dare);
	});

	it('should define default options', () => {
		const schema = {};
		const dare = new Dare({
			schema
		});
		expect(dare.options).to.have.property('schema', schema);
	});

	it('should throw errors if dare.execute is not defined', done => {

		const dare = new Dare();

		dare
			.sql('SELECT 1=1')
			.then(done, err => {
				expect(err).to.be.instanceof(Error);
				done();
			});
	});

	it('should define dare.use to create an instance from another', () => {

		// Create a normal instance
		const dare = new Dare({
			schema: {
				'users': {
					// name: {required: true}
				}
			}
		});

		// Define the execute handler
		dare.execute = () => {};

		// Create another instance with some alternative options
		const dareChild = dare.use({
			limit: 100
		});

		// Check the child assigned new values
		expect(dareChild.options).to.have.property('limit', 100);

		// Check the child retains parent properties
		expect(dareChild.options).to.have.property('schema');
		expect(dareChild.execute).to.equal(dare.execute);

		// Check the parent was not affected by the child configuration
		expect(dare.options).to.not.have.property('limit');
	});

});
