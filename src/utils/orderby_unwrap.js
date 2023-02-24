export default str => {
	let direction = '';
	const field = str.replace(/\s*(?:desc|asc)$/i, m => {
		direction = m.toUpperCase();
		return '';
	});

	return {
		field,
		direction,
	};
};
