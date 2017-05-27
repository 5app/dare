// Prevent a bad format from killing the service, instead return undefined
module.exports = value => {
	try {
		return JSON.parse(value
			.replace(/\t/g, '\\t')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			.replace(/\f/g, '\\f')
		);
	}
	catch (e) {
		return;
	}
};