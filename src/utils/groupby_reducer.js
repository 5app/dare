
const fieldUnwrap = require('./unwrap_field');
const fieldRelativePath = require('./field_relative');
const mapReduce = require('./map_reduce');

module.exports = function groupbyReducer(current_path, join) {

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

		// Set up a join table...
		if (!join[key]) {
			join[key] = {};
		}

		// Get/Set groupby
		const a = (join[key].groupby || []);

		// Replace the field
		item.field = address_split.join('.');

		// Add to groupby
		a.push(fieldWrap(item));

		// Update groupby
		join[key].groupby = a;

		// Dont return anything
		// So it wont be included in the reduce list...
	});
};

function fieldWrap(item) {
	return item.prefix + item.field + item.suffix;
}