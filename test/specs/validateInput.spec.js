const Dare = require('../../src/');

describe('validateInput', () => {

	let dare;

	beforeEach(() => {

		dare = new Dare({
			models: {

				// Member model
				member: {
					schema: {
						name: {
							required: true
						},
						age: {
							type: 'number'
						},
						// This is immutable and unreadable
						password: false
					}
				}
			}
		});

		// Should not be called...
		dare.execute = () => {

			throw new Error('execute called');

		};

	});


	it('should trigger the validateInput handler', async () => {

		const dareInst = dare.use({
			/**
			 * This is an example validateInput function
			 * @param {object} fieldAttributes - the Field Schema
			 * @param {string} field - the field name
			 * @param {*} value - A value of any data type
			 * @returns {void} Returns nothing or throws an error in an exception
			 */
			validateInput(fieldAttributes, field, value) {

				if (fieldAttributes?.required && value === undefined) {

					throw new Error(`${field} is a required field`);

				}

			}
		});

		const test = dareInst
			.post({
				table: 'member',
				body: {age: 'one'}
			});

		return expect(test)
			.to.be.eventually.rejectedWith(Error, 'name is a required field');


	});

	['post', 'patch'].forEach(method => {

		describe(method, () => {

			it('should trigger the validateInput handler and pass through exceptions', async () => {

				const dareInst = dare.use({

					validateInput(fieldAttributes, field, value) {

						// Desconstruct the field schema options
						const {type} = fieldAttributes;

						if (type === 'number' && typeof value !== 'number') {

							throw new Error(`${field} should be a number`);

						}

					}
				});

				const test = dareInst[method]({
					table: 'member',
					filter: {
						id: 1
					},
					body: {age: 'one'}
				});

				return expect(test)
					.to.be.eventually.rejectedWith(Error, 'age should be a number');

			});

			it('should pass through undefined for fieldAttributes when the field is not defined in the schema', async () => {

				const dareInst = dare.use({

					validateInput(fieldAttributes, field) {

						if (!fieldAttributes) {

							throw new Error(`${field} is unknown`);

						}

					}
				});

				const test = dareInst[method]({
					table: 'member',
					filter: {
						id: 1
					},
					body: {age: 'one', hello: 'i shouldn\'t be here'}
				});

				return expect(test)
					.to.be.eventually.rejectedWith(Error, 'hello is unknown');

			});

			it('should parse falsy fieldDefinitions', async () => {

				const dareInst = dare.use({

					validateInput(fieldAttributes, field) {

						if (fieldAttributes.writeable === false) {

							throw new Error(`${field} is immutable`);

						}

					}
				});

				const test = dareInst[method]({
					table: 'member',
					filter: {
						id: 1
					},
					body: {password: '!@£RTYU'}
				});

				return expect(test)
					.to.be.eventually.rejectedWith(Error, 'password is immutable');

			});

		});

	});

});
