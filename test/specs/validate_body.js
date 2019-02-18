const DareError = require('../../src/utils/error');

describe('validate_body', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();

		// Should not be called...
		dare.execute = () => {
			throw new Error('execute called');
		};
	});

	['post', 'patch'].forEach(method => {

		describe(`${method} should throw an invalid_request on the following`, () => {

			[
				{},
				[],
				null,
				1,
				'string'
			].forEach(body => {

				it(JSON.stringify(body), async () => {
					try {
						await dare[method]({
							table: 'tbl',
							filter: {
								id: 1
							},
							body
						});

						throw new Error('expected exception');
					}
					catch (err) {
						expect(err).to.have.property('code', DareError.INVALID_REQUEST);
					}
				});
			});
		});
	});
});
