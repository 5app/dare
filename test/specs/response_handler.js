'use strict';

describe('response_handler', () => {

	let dare;

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use();
	});

	it('response handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('response_handler');
		expect(dare).to.have.property('group_concat');
	});

	it('should expand dot delimited field into a nested object', () => {

		const data = dare.response_handler([{
			'field': 'value',
			'assoc.id': 1,
			'assoc.name': 'value'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			assoc: {
				id: 1,
				name: 'value'
			}
		});
	});

	it('should given a field with an array of fields in the title split the values', () => {

		const data = dare.response_handler([{
			'field': 'value',
			'assoc.id,assoc.name': '["1","a"]',
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			assoc: {
				id: '1',
				name: 'a'
			}
		});
	});

	it('should given a nested dataset', () => {

		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '[["1","a","a1","aa"],["2","b","b1","ba"]]',
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			collection: [{
				id: '1',
				name: 'a',
				assoc: {
					id: 'a1',
					name: 'aa'
				}
			}, {
				id: '2',
				name: 'b',
				assoc: {
					id: 'b1',
					name: 'ba'
				}
			}]
		});
	});

	it('should return empty value if it cannot be interpretted', () => {

		// Return a response field which is invalid
		// this could be because of GROUP_CONCAT_MAX_LENGTH or bad characters which have not been escaped by dare
		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '[["1","a","a1","aa"],["2","b","b1","ba"... broken json...',
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			collection: []
		});
	});

	it('should remove prop if value is empty', () => {

		// Return a response field which is invalid
		// this could be because of GROUP_CONCAT_MAX_LENGTH or bad characters which have not been escaped by dare
		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '',
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value'
		});
	});

	it('should return the field as is if the label is not consistant', () => {

		const item = {
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name': '[["1","a","a1","aa"]]',
		};

		const data = dare.response_handler([item]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal(item);
	});
});
