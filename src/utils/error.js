'use strict';

var SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'Duplicate entry',
	NOT_FOUND: 'Could not find any results matching the query'
};

var SQL_ERROR_STATUSCODES = {
	INVALID_START: 0,
	INVALID_LIMIT: 0,
	INVALID_REFERENCE: 0,
	ER_DUP_ENTRY: 409,
	NOT_FOUND: 404
};

module.exports = function error(err) {
	var message = SQL_ERROR_DICTIONARY[err.code] || 'request failed';
	return {
		status: err.status || SQL_ERROR_STATUSCODES[err.code] || 500,
		code: err.code,
		message: message
	};
};

for (let x in SQL_ERROR_STATUSCODES) {
	module.exports[x] = {
		status: SQL_ERROR_STATUSCODES[x] || 500,
		code: x,
		message: SQL_ERROR_DICTIONARY[x]
	};
}
