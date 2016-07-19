'use strict';

describe('response_handler', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('response handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('response_handler');
		expect(dare).to.have.property('group_concat');
	});

	it('should expand dot delimited field into a nested object', () => {

		let data = dare.response_handler([{
			'field': 'value',
			'join.id': 1,
			'join.name': 'value'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			join: {
				id: 1,
				name: 'value'
			}
		});
	});

	it('should given a seperator key expand the value field and create an array', () => {

		let data = dare.response_handler([{
			'field': 'value',
			'join[$].id': '1$2',
			'join[$].name': 'a$b'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			join: [{
				id: '1',
				name: 'a'
			},
			{
				id: '2',
				name: 'b'
			}]
		});
	});

});
