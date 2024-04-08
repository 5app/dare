import {expect} from 'chai';
import Dare from '../../src/index.js';

describe('get_unique_alias', () => {
	it('should always return a unique alphabet character or a quoted value', () => {
		const dare = new Dare();

		for (let i = 0; i < 100; i++) {
			const alias = dare.get_unique_alias();

			expect(alias).to.match(/^[a-z]+|(?<tick>`)?.\k<tick>$/);
		}
	});
});
