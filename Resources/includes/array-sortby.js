/*
---
script: array-sortby.js
version: 1.2.2
description: Array.sortBy is a prototype function to sort arrays of objects by a given key.
license: MIT-style
source: http://github.com/eneko/Array.sortBy

authors:
- Eneko Alonso: (http://github.com/eneko)
- Fabio M. Costa: (http://github.com/fabiomcosta)

credits:
- Olmo Maldonado (key path as string idea)

provides:
- Array.sortBy

...
*/

(function(){

	var keyPaths = [];

	var saveKeyPath = function(path) {
		keyPaths.push({
			sign: (path[0] === '+' || path[0] === '-')? parseInt(path.shift()+1) : 1,
			path: path
		});
	};

	var valueOf = function(object, path) {
		var ptr = object;
		for (var i=0,l=path.length; i<l; i++) {
			ptr = ptr[path[i]];
		}
		if (typeof(ptr) == 'boolean') {
			return (ptr ? 1 : -1);
		} else {
			return ptr;
		}
	};

	var comparer = function(a, b) {
		for (var i = 0, l = keyPaths.length; i < l; i++) {
			var aVal = valueOf(a, keyPaths[i].path);
			var bVal = valueOf(b, keyPaths[i].path);
			if (aVal > bVal) {
				return keyPaths[i].sign;
			}
			if (aVal < bVal) {
				return -keyPaths[i].sign;
			}
		}
		return 0;
	};

	Array.prototype.rotate = function(n) {
		this.unshift.apply(this, this.splice(n, this.length));
		return this;
	};

	Array.prototype.sortBy = function() {
		keyPaths = [];
		for (var i=0,l=arguments.length; i<l; i++) {
			switch (typeof(arguments[i])) {
				case "object": saveKeyPath(arguments[i]); break;
				case "string": saveKeyPath(arguments[i].match(/[+-]|[^.]+/g)); break;
			}
		}
		return this.sort(comparer);
	};

})();
