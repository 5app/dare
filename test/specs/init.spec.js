/**
 * @import {QueryOptions} from '../../src/index.js'
 */

import {expect} from 'chai';
import Dare, {DareError} from '../../src/index.js';
import clone from 'tricks/object/clone.js';

describe('Dare', () => {
	it('should be a constructor', () => {
		const dare = new Dare();
		expect(dare.constructor).to.eql(Dare);
	});

	it('should define default options', () => {
		const models = {
			mytable: {},
		};
		const dare = new Dare({
			models,
		});
		expect(dare.options).to.have.property('models', models);
	});

	it('should export the DareError object', () => {
		expect(Dare.DareError).to.eql(DareError);
	});

	it('should throw errors if dare.execute is not defined', () => {
		const dare = new Dare();

		const test = dare.sql('SELECT 1=1');

		return expect(test).to.be.eventually.rejectedWith(
			DareError,
			'Define dare.execute to continue'
		);
	});

	it('execute should be able to call addRow', async () => {
		const dare = new Dare();

		dare.execute = async function () {
			this.addRow({name: 'Jupiter'});
		};

		const resp = await dare.get({
			table: 'test',
			fields: ['name'],
		});

		expect(resp).to.have.property('name', 'Jupiter');
	});

	describe('dare.use to extend the instance', () => {
		let dare;

		/**
		 * @type {QueryOptions}
		 */
		let options;

		beforeEach(() => {
			options = {
				models: {
					users: {
						schema: {
							name: {
								type: 'string',
							},
						},
					},
				},
			};

			// Create a normal instance
			dare = new Dare(options);
		});

		it('should define dare.use to create an instance from another', () => {
			// Create another instance with some alternative options
			const dareChild = dare.use({
				limit: 100,
			});

			// Check the child assigned new values
			expect(dareChild.options).to.have.property('limit', 100);

			// Check the child retains parent properties
			expect(dareChild.options).to.have.property('models');
			expect(dareChild.execute).to.equal(dare.execute);

			// Check the parent was not affected by the child configuration
			expect(dare.options).to.not.have.property('limit');
		});

		it('should inherit but not leak when extending schema', () => {
			const options2 = {
				models: {
					users: {
						schema: {
							name: {
								writable: false,
							},
						},
					},
					different: {
						schema: {fields: true},
					},
				},
			};

			const options_cloned = clone(options);

			const options2_cloned = clone(options2);

			const dare2 = dare.use(options2);

			// Should not share same objects as instance it extended
			expect(dare.options.models.users).to.not.equal(
				dare2.options.models.users
			);

			// Should not mutate instance it extended
			// eslint-disable-next-line no-unused-expressions
			expect(dare.options.models.different).to.be.undefined;

			expect(dare.options.models.users.schema.name.writable).to.not.equal(
				dare2.options.models.users.schema.name.writable
			);

			// Should merge settings for field definitiions... e.g.
			expect(dare2.options.models.users.schema).to.deep.equal({
				name: {
					type: 'string',
					writable: false,
				},
			});

			// Should not mutate the inheritted options
			expect(options).to.deep.equal(options_cloned);

			// Should not mutate the new options input
			expect(options2).to.deep.equal(options2_cloned);
		});
	});
});
