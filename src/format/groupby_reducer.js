
const fieldUnwrap = require('../utils/unwrap_field');
const fieldRelativePath = require('../utils/field_relative');
const mapReduce = require('../utils/map_reduce');

module.exports = function groupbyReducer({current_path, extract}) {

	return mapReduce(field => {

		// Get the field address
		const item = fieldUnwrap(field);
		const address = fieldRelativePath(current_path, item.field);

		// Get the parent of the field
		const address_split = address.split('.').filter(a => a);

		if (address_split.length <= 1) {

			// Persist the field...
			return field;

		}

		// Create a groupby in the associate model
		const key = address_split.shift();

		// Replace the field
		item.field = address_split.join('.');

		// Add to groupby
		const value = fieldWrap(item);

		// Extract
		extract(key, [value]);

		/*
		 * Dont return anything
		 * So it wont be included in the reduce list...
		 */

	});

};

function fieldWrap(item) {

	return item.prefix + item.field + item.suffix;

}
