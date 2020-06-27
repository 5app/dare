const fieldUnwrap = require('./unwrap_field');
const fieldRelativePath = require('./field_relative');
const mapReduce = require('./map_reduce');
const orderbyUnwrap = require('./orderby_unwrap');
const getFieldAttributes = require('./field_attributes');

module.exports = ({current_path, extract, table_schema}) => mapReduce(entry => {

	let field = entry;
	let direction = '';
	if (typeof field === 'string') {

		const obj = orderbyUnwrap(entry);
		field = obj.field;
		direction = obj.direction;

	}

	// Get the field address
	const item = fieldUnwrap(field);

	// Add direction
	item.direction = direction;

	const address = fieldRelativePath(current_path, item.field);

	// Get the parent of the field
	const address_split = address.split('.').filter(a => a);

	if (address_split.length <= 1) {

		// Get the alias
		const {alias} = getFieldAttributes(table_schema[item.field_name]);

		if (alias) {

			// This is an alias column, override the field
			item.field = alias;

		}

		// Persist the field...
		return fieldWrap(item);

	}

	// Create a groupby in the associate model
	const key = address_split.shift();

	// Replace the field
	item.field = address_split.join('.');

	// Add to orderby
	const value = fieldWrap(item);

	// Extract
	extract(key, [value]);

	/*
	 * Dont return anything
	 * So it wont be included in the reduce list...
	 */

});

function fieldWrap(item) {

	return item.prefix + item.field + item.suffix + item.direction;

}
