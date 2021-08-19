const Dare = require('../../src/');

describe('get_unique_alias', () => {

	it('should always return a unique alphabet character or a quoted value', () => {

		const dare = new Dare();

		for (let i = 0; i < 100; i++) {

			const alias = dare.get_unique_alias();
			// eslint-disable-next-line security/detect-unsafe-regex
			expect(alias).to.match(/^[a-z]+|(?<tick>`)?(?:.)\k<tick>$/);

		}

	});

});

