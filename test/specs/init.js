
const clone = require('tricks/object/clone');
const DareError = require('../../src/utils/error');

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

	it('should throw errors if dare.execute is not defined', async () => {

		const dare = new Dare();

		try {

			await dare
				.sql('SELECT 1=1');

			throw new Error('expected failure');

		}
		catch (err) {

			expect(err).to.be.instanceof(DareError);

		}

	});

	describe('dare.use to extend the instance', () => {

		let dare;

		beforeEach(() => {

			// Create a normal instance
			dare = new Dare({
				schema: {
					'users': {
						name: {
							type: 'string'
						}
					}
				}
			});

		});

		it('should define dare.use to create an instance from another', () => {

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

		it('should inherit but not leak when extending schema', () => {

			const options = {
				schema: {
					'users': {
						name: {
							writable: false
						}
					},
					'different': {
						'fields': true
					}
				}
			};

			const options_cloned = clone(options);

			const dare2 = dare.use(options);

			// Should not leak back into instance it extended
			expect(dare.options.schema.users)
				.to.not.equal(dare2.options.schema.users);

			expect(dare.options.schema.different)
				.to.be.undefined;

			expect(dare.options.schema.users.name.writable)
				.to.not.equal(dare2.options.schema.users.name.writable);

			expect(dare2.options.schema.users)
				.to.deep.equal({
					name: {
						type: 'string',
						writable: false
					}
				});

			// Should not mutate the options object passed through
			expect(options).to.not.deep.equal(options_cloned);

		});

	});

});
