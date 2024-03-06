import {expect} from 'chai';
import Dare from '../../src/index.js';

describe('get_unique_alias', () => {
	it('should always return a unique alphabet character or a quoted value', () => {
		const dare = new Dare();

		for (let i = 0; i <= 26 * 26; i++) {
			const alias = dare.get_unique_alias();
			// eslint-disable-next-line security/detect-unsafe-regex
			expect(alias).to.match(/^[a-z]|(?<tick>`)[a-z]{2,}\k<tick>$/);
		}

		// Expect the next one to throw an error
		expect(() => dare.get_unique_alias()).to.throw();
	});
});
