/*
 * Copyright 2015 Liferay, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


function Request(options) {

	if (!options || !options.url || !options.onSuccess) {
		throw "Request Error: Invalid arguments";
	}

	var allParams = [];

	if(options.params) {
		for(var paramName in options.params) {
			if (!options.params.hasOwnProperty(paramName)) continue;
			if (options.sigIgnore && (options.sigIgnore.indexOf(paramName) >= 0)) continue;
			allParams.push({
				name: paramName,
				value: options.params[paramName]
			});
		}
	}

	allParams = allParams.sort(function(a, b) {
		return (a.name.localeCompare(b.name));
	});

	var url = options.url;

    var preSig = Ti.App.Properties.getString("liferay.json_shared_secret", "");

	if (!options.method || options.method == 'GET') {
		url += '?';
	}

	allParams.forEach(function(param) {
		preSig += (param.name + '=' + param.value);
	});

    var hashVal;

    if (options.hashAlg === 'md5') {
		hashVal = Ti.Utils.md5HexDigest(preSig);
    } else  {
		hashVal = Ti.Utils.sha256(preSig)
    }

	allParams.push({
		name: options.sigName ? options.sigName : "api_sig",
		value: hashVal
	});

	if (!options.method || options.method == 'GET') {
		allParams.forEach(function(param, idx) {
			url += (param.name + '=' + encodeURIComponent(param.value));
			if (idx < (allParams.length - 1)) {
				url += '&';
			}
		});
	}

	var	xhr = Ti.Network.createHTTPClient({
        timeout: liferay.settings.server.requestTimeout,
        validatesSecureCertificate: false
    });

	xhr.onload = function(e) {
		if (this.responseText == null) {
			if (options.onFailure) {
				options.onFailure("unknown", "none");
				return;
			}
		}
		var resultObj = null;
		try {
			resultObj = JSON.parse(this.responseText);
		}
		catch (ex) {
			if (options.onFailure) {
				options.onFailure(ex, this.responseText);
				return;
			}
		}
		//console.log("location: " + this.location + " args: " + JSON.stringify(this.lrargs) + " result: " + JSON.stringify(resultObj));
		options.onSuccess(resultObj);
	};

	xhr.onerror = function(e) {
		//console.log("FAILED TO GET: " + this.location + " args: " + JSON.stringify(this.lrargs) + " result: " + JSON.stringify(e));
		if (options.onFailure) {
			options.onFailure('Request failed:' + e.error);
		}
	};
	xhr.open(options.method || 'GET', url);

	var contentType;
	if (!options.contentType) {
		contentType = 'application/x-www-form-urlencoded';
	} else if (options.contentType == 'DEFAULT') {
		contentType = null;
	} else {
		contentType = options.contentType;
	}

	if (contentType) {
		xhr.setRequestHeader('Content-Type', contentType);
	}
	if (options.method == 'POST') {
		var paramObj = {};
		allParams.forEach(function(el) {
			paramObj[el.name] = el.value;
			if (typeof el.value === 'number' && isFinite(el.value)) {
				paramObj[el.name] = el.value.toFixed();
			}
		});
		if (options.sigIgnore) {
			options.sigIgnore.forEach(function(paramName) {
				paramObj[paramName] = options.params[paramName];
			});
		}
		xhr.lrargs = paramObj;
		xhr.send(paramObj);
	} else {
		xhr.send();
	}
}
