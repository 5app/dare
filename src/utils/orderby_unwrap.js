module.exports = str => {
	let direction = '';
	const field = str.replace(/\s*(DESC|ASC)$/i, m => {
		direction = m;
		return '';
	});

	return {
		field,
		direction
	};
};