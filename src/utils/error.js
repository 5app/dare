'use strict';

var SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'duplicate entry',
	NOT_FOUND: 'Not Found'
};

var SQL_ERROR_STATUSCODES = {
	ER_DUP_ENTRY: 409,
	NOT_FOUND: 404
};

module.exports = function error(err) {
	var message = SQL_ERROR_DICTIONARY[err.code] || 'request failed';
	return {
		status: err.status || SQL_ERROR_STATUSCODES[err.code] || 500,
		code: err.code,
		error: message,
		message: message
	};
};
