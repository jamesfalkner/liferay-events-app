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

	allParams.push({
		name: 'api_ver',
		value: liferay.settings.server.apiVersion
	});

	var locale = Titanium.Locale.getCurrentLocale().replace('-', '_');
	if (locale) {
		allParams.push({
			name: 'locale',
			value: locale
		});
	}
	if(options.params) {
		for(var paramName in options.params) {
			if (!options.params.hasOwnProperty(paramName)) continue;
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
    
    if (options.hashAlg === 'sha') {
        hashVal = Ti.Utils.sha256(preSig)
    } else  {
        hashVal = Ti.Utils.md5HexDigest(preSig);
    }

	allParams.push({
		name: "api_sig",
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
        //console.log(JSON.stringify(resultObj));
		options.onSuccess(resultObj);
	};

	xhr.onerror = function(e) {
		if (options.onFailure) {
			options.onFailure('Request failed:' + e.error);
		}
	};
	xhr.open(options.method || 'GET', url);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	if (options.method == 'POST') {
		var paramObj = {};
		allParams.forEach(function(el) {
			paramObj[el.name] = el.value;
		});
		xhr.send(paramObj);
	} else {
		xhr.send();
	}
}
