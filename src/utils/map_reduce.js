// Create a map reduce function which converts content as well as filters out undefined
module.exports = callback => {
	return (list, item, index) => {
		const response = callback(item, index);

		if (response) {
			list.push(response);
		}

		return list;
	};
};