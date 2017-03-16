module.exports = function formatDateTime(values) {
	if (typeof values === 'string') {

		if (values.indexOf('..') === -1) {
			values = `${values}..${values}`;
		}

		let i = 0;

		const a = values.split('..').map(str => {

			const date = new Date(str);

			if (i++) {

				const [yyyy, mm, dd, hh, i, s] = str.split(/\D+/);

				if (!mm) {
					date.setFullYear(date.getFullYear() + 1);
				}
				else if (!dd) {
					date.setMonth(date.getMonth() + 1);
				}
				else if (!hh) {
					date.setDate(date.getDate() + 1);
				}
				else if (!i) {
					date.setHour(date.getHour() + 1);
				}
				if (!s) {
					date.setSeconds(date.getSeconds() - 1);
				}
			}

			return date.toISOString().replace(/\.\d+Z/, '');
		});

		if (a[0] === a[1]) {
			return a[0];
		}

		return a.join('..');
	}
	return values;
};
