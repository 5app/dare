// SQL Match
// Convert a SQL string into a regular expression to compare with a generated SQL string

module.exports = (sql) => {
	// Replace spaces
	sql = sql
	// Remove multiple white spaces
	.replace(/\s+/g, ' ')

	// Escape characters
	.replace(/([\*\(\)\'\?])/g, '\\$1')

	// Replace spaces
	.replace(/\s/g, '\\s*')

	;
	// console.log(sql);
	return new RegExp('^\\s*' + sql + '\\s*$', 'i');
};