import Dare from '../../src/index.js';

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
			'a,b': Buffer.from('["1","2"]'),
			'ignore,null': null
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			assoc: {
				id: '1',
				name: 'a'
			},
			a: '1',
			b: '2'
		});

	});


	it('should given a nested dataset', () => {

		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '[["1","a","a1","aa"],["2","b","b1","ba"]]'
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

	it('should transform a deep linked nested', () => {

		const data = dare.response_handler([{
			'field': 'value',
			'asset.id': 1,
			'asset.collection[id,name,assoc.id,assoc.name]': '[["1","a","a1","aa"],["2","b","b1","ba"]]',
			'asset$planb.collection[id,name]': '[["1","a"],["2","b"]]',
			'asset.name': 'name'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			asset: {
				id: 1,
				name: 'name',
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
			},
			'asset$planb': {
				collection: [{
					id: '1',
					name: 'a'
				}, {
					id: '2',
					name: 'b'
				}]
			}
		});

	});

	it('should transform a deep linked nested array with generated fields', () => {

		const handler = row => row.id + 2;
		const field = 'something';

		const extraFields = ['id'];

		// Create a list of generated fields
		dare.generated_fields = [
			{
				label: 'generated',
				field,
				field_alias_path: '',
				handler,
				extraFields
			},
			{
				label: 'generated2',
				field,
				field_alias_path: 'asset.',
				handler,
				extraFields
			},
			{
				label: 'generated3',
				field,
				field_alias_path: 'asset.collection.',
				handler,
				extraFields: []
			},
			{
				label: 'generated4',
				field,
				field_alias_path: 'asset.collection.assoc.',
				handler,
				extraFields
			},
			{
				label: 'willnotappear',
				field,
				field_alias_path: 'doesnotmatch.',
				handler,
				extraFields
			}
		];

		const data = dare.response_handler([{
			'field': 'value',
			'id': 1,
			'asset.id': 10,
			'asset.collection[id,name,assoc.id,assoc.name]': '[["1","a","1a","aa"],["2","b","1b","ba"]]',
			'asset.name': 'name'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			generated: 3,
			field: 'value',
			asset: {
				generated2: 12,
				name: 'name',
				collection: [{
					id: '1',
					generated3: '12',
					name: 'a',
					assoc: {
						generated4: '1a2',
						name: 'aa'
					}
				}, {
					id: '2',
					generated3: '22',
					name: 'b',
					assoc: {
						generated4: '1b2',
						name: 'ba'
					}
				}]
			}
		});

	});

	it('should transform a nested arrays to single root level', () => {

		const empty = 'empty';
		const handler = row => (row.id ? row.id + 2 : empty);

		const extraFields = ['id', 'name'];

		// Create a list of generated fields
		dare.generated_fields = [
			{
				label: 'LabelA',
				field: 'a.id',
				field_alias_path: '',
				handler,
				extraFields
			},
			{
				label: 'LabelB',
				field: 'b.id',
				field_alias_path: '',
				handler,
				extraFields
			},
			{
				label: 'LabelC',
				field: 'c.id',
				field_alias_path: '',
				handler,
				extraFields
			},
			{
				label: 'LabelD',
				field: 'd.id',
				field_alias_path: '',
				handler,
				extraFields
			},
			{
				label: 'LabelE',
				field: 'e.id',
				field_alias_path: '',
				handler,
				extraFields
			}
		];

		const data = dare.response_handler([{
			'a[id,name]': '[["1","a"]]',
			'b[id,name]': '[["1","a"],["2","b"]]',
			'c[id,name]': '[]',
			'd[id,name]': '[[]]',
			'e[id,name]': null
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			// @todo remove this b prop.
			b: [{
				id: '2',
				name: 'b'
			}],
			LabelA: '12',
			LabelB: '12',
			LabelC: empty,
			LabelD: empty,
			LabelE: empty
		});

	});

	it('should return empty value if it cannot be interpretted', () => {

		/*
		 * Return a response field which is invalid
		 * this could be because of GROUP_CONCAT_MAX_LENGTH or bad characters which have not been escaped by dare
		 */
		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '[["1","a","a1","aa"],["2","b","b1","ba"... broken json...'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value',
			collection: []
		});

	});

	it('should remove prop if value is empty', () => {

		/*
		 * Return a response field which is invalid
		 * this could be because of GROUP_CONCAT_MAX_LENGTH or bad characters which have not been escaped by dare
		 */
		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': ''
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			field: 'value'
		});

	});

	it('should exclude a series of empty strings, a side-effect of inline GROUP_CONCAT', () => {

		// Return a response field which is invalid
		const data = dare.response_handler([{
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name]': '[["","","",""], ["","","",""]]'
		}]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal({
			collection: [],
			field: 'value'
		});

	});

	it('should return the field as is if the label is not consistant', () => {

		const item = {
			'field': 'value',
			'collection[id,name,assoc.id,assoc.name': '[["1","a","a1","aa"]]'
		};

		const data = dare.response_handler([item]);

		expect(data).to.be.an('array');
		expect(data[0]).to.deep.equal(item);

	});


});


describe('response_row_handler', () => {

	let dare;

	beforeEach(() => {

		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use();

	});

	it('response handler should be defined in instances of Dare', () => {

		expect(dare).to.not.have.property('response_row_handler');

	});

	it('should allow additional formatting with response_row_handler', () => {

		// Define a new response_row_handler
		dare.response_row_handler = item => {

			// Adds "prefix" to item.fiele
			item.field = `prefix${item.field}`;

			// Must return item
			return item;

		};

		const data = dare.response_handler([{
			'field': 'value',
			'assoc.id': 1,
			'assoc.name': 'value'
		}]);

		expect(data)
			.to.be.an('array')
			.and.to.have.lengthOf(1);

		expect(data[0]).to.deep.equal({
			field: 'prefixvalue',
			assoc: {
				id: 1,
				name: 'value'
			}
		});

	});

	it('should return empty array if response_row_handler returns undefined', () => {

		// Define a new response_row_handler to return nothing
		dare.response_row_handler = () => {
			// Does nothing...
		};

		const data = dare.response_handler([{
			'field': 'value',
			'assoc.id,assoc.name': '["1","a"]',
			'a,b': Buffer.from('["1","2"]')
		}]);

		// eslint-disable-next-line no-unused-expressions
		expect(data).to.be.an('array').that.is.empty;

	});

});
