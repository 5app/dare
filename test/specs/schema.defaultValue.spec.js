import Dare from '../../src/index.js';

import fieldAttributes from '../../src/utils/field_attributes.js';

describe('schema.defaultValue', () => {

	let dare;

	beforeEach(() => {

		// Create a new instance
		dare = new Dare();

	});

	describe('fieldAttributes', () => {

		it('defaultValue should not occur by default', () => {

			const attr = fieldAttributes({});
			expect(attr).to.not.have.property('defaultValue');

		});

		it('defaultValue object should be passed-through verbatim', () => {

			const defaultValue = {
				post: 'postValue',
				get: 123,
				patch: null
			};

			const attr = fieldAttributes({defaultValue});
			expect(attr).to.have.property('defaultValue', defaultValue);

		});

		[undefined, 1, null, 'string'].forEach(defaultValue => {

			it(`should expand defaultValue, ${defaultValue}`, () => {

				const attr = fieldAttributes({defaultValue});
				expect(attr).to.have.property('defaultValue')
					.to.deep.equal({
						post: defaultValue,
						get: defaultValue,
						patch: defaultValue,
						del: defaultValue
					});

			});

		});

	});

	describe('POST', () => {

		beforeEach(() => {

			dare = dare.use({
				models: {
					mytable: {
						schema: {
							status: {
								defaultValue: 'active'
							}
						}
					}
				}
			});

		});

		it('should insert default values into post operations', () => {

			dare.execute = ({sql, values}) => {

				expect(sql).to.include('`status`');
				expect(values).to.include('active');

			};

			dare.post('mytable', {
				title: 'hello'
			});

		});

		it('should be overrideable', () => {

			dare.execute = ({sql, values}) => {

				expect(sql).to.include('`status`');
				expect(values).to.include('overridden');

			};

			dare.post('mytable', {
				title: 'hello',
				status: 'overridden'
			});

		});

		it('should be removed', () => {

			dare.execute = ({sql, values}) => {

				expect(sql).to.include('`status`');
				expect(sql).to.include('DEFAULT');
				expect(values).to.not.include(undefined);

			};

			dare.post('mytable', {
				title: 'hello',
				status: undefined
			});

		});

	});

});
