// SQL Match
// Convert a SQL string into a regular expression to compare with a generated SQL string

module.exports = (a, b) => {

	// Reformat both sql statements and compare
	expect(reformat(a)).to.equal(reformat(b));

};

function reformat(sql) {
	return sql.replace(/[\s]+/g, '');
}
