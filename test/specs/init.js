
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

	it('should export the DareError object', () => {

		expect(Dare.DareError).to.eql(DareError);

	});

	it('should throw errors if dare.execute is not defined', () => {

		const dare = new Dare();

		const test = dare
			.sql('SELECT 1=1');

		return expect(test)
			.to.be.eventually.rejectedWith(DareError, 'Define dare.execute to continue');

	});

	describe('dare.use to extend the instance', () => {

		let dare;
		let options;

		beforeEach(() => {

			options = {
				schema: {
					'users': {
						name: {
							type: 'string'
						}
					}
				}
			};

			// Create a normal instance
			dare = new Dare(options);

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

			const options2 = {
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

			const options2_cloned = clone(options2);

			const dare2 = dare.use(options2);

			// Should not share same objects as instance it extended
			expect(dare.options.schema.users)
				.to.not.equal(dare2.options.schema.users);

			// Should not mutate instance it extended
			expect(dare.options.schema.different)
				.to.be.undefined;

			expect(dare.options.schema.users.name.writable)
				.to.not.equal(dare2.options.schema.users.name.writable);

			// Should merge settings for field definitiions... e.g.
			expect(dare2.options.schema.users)
				.to.deep.equal({
					name: {
						type: 'string',
						writable: false
					}
				});

			// Should not mutate the inheritted options
			expect(options).to.deep.equal(options_cloned);

			// Should not mutate the new options input
			expect(options2).to.deep.equal(options2_cloned);

		});

	});

});
