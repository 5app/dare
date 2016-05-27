'use strict';

let s = '\'';

module.exports = (sql, prepared) => {
	let i = 0;
	return sql.split(/\B\?\B/).map(pre => pre + value(prepared[i++])).join('');
};

function value(v) {
	let t = typeof v;
	if (t === 'string') {
		return s + v.replace(/\\/, '\\\\\'').replace(/[']/, '\\\'') + s;
	}
	else if (v !== undefined) {
		return v;
	}
	else
		return '';
}
