/**
 * This is a JavaScript module for Titanium Mobile made by Dawson Toth. I adapted the majority of this code from other
 * authors to make it easy to share content on social sites through a single interface.
 *
 * Example usage: http://appc.me/social.sample.js
 *
 */


//
// We'll start off by defining what's normally included in external files "sha1.js" and "oauth.js".
// To keep things simple, I'm going to define them inline. (If this violates some licenses and someone
// cares enough to sue me, I'll move them to their own files. Sound good?
//
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;
/* hex output format. 0 - lowercase; 1 - uppercase */
var b64pad = "";
/* base-64 pad character. "=" for strict RFC compliance */
var chrsz = 8;
/* bits per input character. 8 - ASCII; 16 - Unicode */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */

function hex_sha1(s) {
	return binb2hex(core_sha1(str2binb(s), s.length * chrsz));
}

function b64_sha1(s) {
	return binb2b64(core_sha1(str2binb(s), s.length * chrsz));
}

function str_sha1(s) {
	return binb2str(core_sha1(str2binb(s), s.length * chrsz));
}

function hex_hmac_sha1(key, data) {
	return binb2hex(core_hmac_sha1(key, data));
}

function b64_hmac_sha1(key, data) {
	return binb2b64(core_hmac_sha1(key, data));
}

function str_hmac_sha1(key, data) {
	return binb2str(core_hmac_sha1(key, data));
}

function sha1_vm_test() {
	return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

function core_sha1(x, len) {
	x[len >> 5] |= 128 << 24 - len % 32, x[(len + 64 >> 9 << 4) + 15] = len;
	var w = Array(80), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
	for (var i = 0; i < x.length; i += 16) {
		var olda = a, oldb = b, oldc = c, oldd = d, olde = e;
		for (var j = 0; j < 80; j++) {
			j < 16 ? w[j] = x[i + j] : w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
			e = d, d = c, c = rol(b, 30), b = a, a = t;
		}
		a = safe_add(a, olda), b = safe_add(b, oldb), c = safe_add(c, oldc), d = safe_add(d, oldd), e = safe_add(e, olde);
	}
	return Array(a, b, c, d, e);
}

function sha1_ft(t, b, c, d) {
	return t < 20 ? b & c | ~b & d : t < 40 ? b ^ c ^ d : t < 60 ? b & c | b & d | c & d : b ^ c ^ d;
}

function sha1_kt(t) {
	return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514;
}

function core_hmac_sha1(key, data) {
	var bkey = str2binb(key);
	bkey.length > 16 && ( bkey = core_sha1(bkey, key.length * chrsz));
	var ipad = Array(16), opad = Array(16);
	for (var i = 0; i < 16; i++)
		ipad[i] = bkey[i] ^ 909522486, opad[i] = bkey[i] ^ 1549556828;
	var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
	return core_sha1(opad.concat(hash), 672);
}

function safe_add(x, y) {
	var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return msw << 16 | lsw & 65535;
}

function rol(num, cnt) {
	return num << cnt | num >>> 32 - cnt;
}

function str2binb(str) {
	var bin = Array(), mask = (1 << chrsz) - 1;
	for (var i = 0; i < str.length * chrsz; i += chrsz)
		bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << 32 - chrsz - i % 32;
	return bin;
}

function binb2str(bin) {
	var str = "", mask = (1 << chrsz) - 1;
	for (var i = 0; i < bin.length * 32; i += chrsz)
		str += String.fromCharCode(bin[i >> 5] >>> 32 - chrsz - i % 32 & mask);
	return str;
}

function binb2hex(binarray) {
	var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef", str = "";
	for (var i = 0; i < binarray.length * 4; i++)
		str += hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 + 4 & 15) + hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 & 15);
	return str;
}

function binb2b64(binarray) {
	var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", str = "";
	for (var i = 0; i < binarray.length * 4; i += 3) {
		var triplet = (binarray[i >> 2] >> 8 * (3 - i % 4) & 255) << 16 | (binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4) & 255) << 8 | binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4) & 255;
		for (var j = 0; j < 4; j++)
			i * 8 + j * 6 > binarray.length * 32 ? str += b64pad : str += tab.charAt(triplet >> 6 * (3 - j) & 63);
	}
	return str;
}

var hexcase = 0, b64pad = "", chrsz = 8, OAuth;

/*
 * Copyright 2008 Netflix, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE.txt-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* Here's some JavaScript software for implementing OAuth.

 This isn't as useful as you might hope. OAuth is based around
 allowing tools and websites to talk to each other. However,
 JavaScript running in web browsers is hampered by security
 restrictions that prevent code running on one website from
 accessing data stored or served on another.

 Before you start hacking, make sure you understand the limitations
 posed by cross-domain XMLHttpRequest.

 On the bright side, some platforms use JavaScript as their
 language, but enable the programmer to access other web sites.
 Examples include Google Gadgets, and Microsoft Vista Sidebar.
 For those platforms, this library should come in handy.
 */

/* An OAuth message is represented as an object like this:
 {method: "GET", action: "http://server.com/path", parameters: ...}

 The parameters may be either a map {name: value, name2: value2}
 or an Array of name-value pairs [[name, value], [name2, value2]].
 The latter representation is more powerful: it supports parameters
 in a specific sequence, or several parameters with the same name;
 for example [["a", 1], ["b", 2], ["a", 3]].

 Parameter names and values are NOT percent-encoded in an object.
 They must be encoded before transmission and decoded after reception.
 For example, this message object:
 {method: "GET", action: "http://server/path", parameters: {p: "x y"}}
 ... can be transmitted as an HTTP request that begins:
 GET /path?p=x%20y HTTP/1.0
 (This isn't a valid OAuth request, since it lacks a signature etc.)
 Note that the object "x y" is transmitted as x%20y. To encode
 parameters, you can call OAuth.addToURL, OAuth.formEncode or
 OAuth.getAuthorization.

 This message object model harmonizes with the browser object model for
 input elements of an form, whose value property isn't percent encoded.
 The browser encodes each value before transmitting it. For example,
 see consumer.setInputs in example/consumer.js.
 */

/* This script needs to know what time it is. By default, it uses the local
 clock (new Date), which is apt to be inaccurate in browsers. To do
 better, you can load this script from a URL whose query string contains
 an oauth_timestamp parameter, whose value is a current Unix timestamp.
 For example, when generating the enclosing document using PHP:

 <script src="oauth.js?oauth_timestamp=<?=time()?>" ...

 Another option is to call OAuth.correctTimestamp with a Unix timestamp.
 */


OAuth == null && ( OAuth = {}), OAuth.setProperties = function(into, from) {
	if (into != null && from != null)
		for (var key in from)
			into[key] = from[key];
	return into;
}, OAuth.setProperties(OAuth, {
	percentEncode : function(s) {
		if (s == null)
			return "";
		if ( s instanceof Array) {
			var e = "";
			for (var i = 0; i < s.length; ++s)
				e != "" && (e += "&"), e += OAuth.percentEncode(s[i]);
			return e;
		}
		return s = encodeURIComponent(s), s = s.replace(/\!/g, "%21"), s = s.replace(/\*/g, "%2A"), s = s.replace(/\'/g, "%27"), s = s.replace(/\(/g, "%28"), s = s.replace(/\)/g, "%29"), s;
	},
	decodePercent : function(s) {
		return s != null && ( s = s.replace(/\+/g, " ")), decodeURIComponent(s);
	},
	getParameterList : function(parameters) {
		if (parameters == null)
			return [];
		if ( typeof parameters != "object")
			return OAuth.decodeForm(parameters + "");
		if ( parameters instanceof Array)
			return parameters;
		var list = [];
		for (var p in parameters)
			list.push([p, parameters[p]]);
		return list;
	},
	getParameterMap : function(parameters) {
		if (parameters == null)
			return {};
		if ( typeof parameters != "object")
			return OAuth.getParameterMap(OAuth.decodeForm(parameters + ""));
		if ( parameters instanceof Array) {
			var map = {};
			for (var p = 0; p < parameters.length; ++p) {
				var key = parameters[p][0];
				map[key] === undefined && (map[key] = parameters[p][1]);
			}
			return map;
		}
		return parameters;
	},
	getParameter : function(parameters, name) {
		if ( parameters instanceof Array) {
			for (var p = 0; p < parameters.length; ++p)
				if (parameters[p][0] == name)
					return parameters[p][1];
			return null;
		}
		return OAuth.getParameterMap(parameters)[name];
	},
	formEncode : function(parameters) {
		var form = "", list = OAuth.getParameterList(parameters);
		for (var p = 0; p < list.length; ++p) {
			var value = list[p][1];
			value == null && ( value = ""), form != "" && (form += "&"), form += OAuth.percentEncode(list[p][0]) + "=" + OAuth.percentEncode(value);
		}
		return form;
	},
	decodeForm : function(form) {
		var list = [], nvps = form.split("&");
		for (var n = 0; n < nvps.length; ++n) {
			var nvp = nvps[n];
			if (nvp == "")
				continue;
			var equals = nvp.indexOf("="), name, value;
			equals < 0 ? ( name = OAuth.decodePercent(nvp), value = null) : ( name = OAuth.decodePercent(nvp.substring(0, equals)), value = OAuth.decodePercent(nvp.substring(equals + 1))), list.push([name, value]);
		}
		return list;
	},
	setParameter : function(message, name, value) {
		var parameters = message.parameters;
		if ( parameters instanceof Array) {
			for (var p = 0; p < parameters.length; ++p)
				parameters[p][0] == name && (value === undefined ? parameters.splice(p, 1) : (parameters[p][1] = value, value = undefined));
			value !== undefined && parameters.push([name, value]);
		} else
			parameters = OAuth.getParameterMap(parameters), parameters[name] = value, message.parameters = parameters;
	},
	setParameters : function(message, parameters) {
		var list = OAuth.getParameterList(parameters);
		for (var i = 0; i < list.length; ++i)
			OAuth.setParameter(message, list[i][0], list[i][1]);
	},
	completeRequest : function(message, accessor) {
		message.method == null && (message.method = "GET");
		var map = OAuth.getParameterMap(message.parameters);
		map.oauth_consumer_key == null && OAuth.setParameter(message, "oauth_consumer_key", accessor.consumerKey || ""), map.oauth_token == null && accessor.token != null && OAuth.setParameter(message, "oauth_token", accessor.token), map.oauth_version == null && OAuth.setParameter(message, "oauth_version", "1.0"), map.oauth_timestamp == null && OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp()), map.oauth_nonce == null && OAuth.setParameter(message, "oauth_nonce", OAuth.nonce(6)), OAuth.SignatureMethod.sign(message, accessor);
	},
	setTimestampAndNonce : function(message) {
		OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp()), OAuth.setParameter(message, "oauth_nonce", OAuth.nonce(6));
	},
	addToURL : function(url, parameters) {
		newURL = url;
		if (parameters != null) {
			var toAdd = OAuth.formEncode(parameters);
			if (toAdd.length > 0) {
				var q = url.indexOf("?");
				q < 0 ? newURL += "?" : newURL += "&", newURL += toAdd;
			}
		}
		return newURL;
	},
	getAuthorizationHeader : function(realm, parameters) {
		//var header = "OAuth realm=\"" + OAuth.percentEncode(realm) + "\"", list = OAuth.getParameterList(parameters);

		var header = "OAuth ", list = OAuth.getParameterList(parameters);
		for (var p = 0; p < list.length; ++p) {
			var parameter = list[p], name = parameter[0];
			name.indexOf("oauth_") == 0 && (header += OAuth.percentEncode(name) + "=\"" + OAuth.percentEncode(parameter[1]) + "\"");
			if (p != list.length - 1) {
				header += ", ";
			}

		}
		return header;
	},
	correctTimestampFromSrc : function(parameterName) {
		parameterName = parameterName || "oauth_timestamp";
		var scripts = document.getElementsByTagName("script");
		if (scripts == null || !scripts.length)
			return;
		var src = scripts[scripts.length - 1].src;
		if (!src)
			return;
		var q = src.indexOf("?");
		if (q < 0)
			return;
		parameters = OAuth.getParameterMap(OAuth.decodeForm(src.substring(q + 1)));
		var t = parameters[parameterName];
		if (t == null)
			return;
		OAuth.correctTimestamp(t);
	},
	correctTimestamp : function(timestamp) {
		OAuth.timeCorrectionMsec = timestamp * 1000 - (new Date).getTime();
	},
	timeCorrectionMsec : 0,
	timestamp : function() {
		var t = (new Date).getTime() + OAuth.timeCorrectionMsec;
		return "" + Math.floor(t / 1000);
	},
	nonce : function(length) {
		var chars = OAuth.nonce.CHARS, result = "";
		for (var i = 0; i < length; ++i) {
			var rnum = Math.floor(Math.random() * chars.length);
			result += chars.substring(rnum, rnum + 1);
		}
		return result;
	}
}), OAuth.nonce.CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz", OAuth.declareClass = function(parent, name, newConstructor) {
	var previous = parent[name];
	parent[name] = newConstructor;
	if (newConstructor != null && previous != null)
		for (var key in previous)key != "prototype" && (newConstructor[key] = previous[key]);
	return newConstructor;
}, OAuth.declareClass(OAuth, "SignatureMethod", function() {
}), OAuth.setProperties(OAuth.SignatureMethod.prototype, {
	sign : function(message) {
		var baseString = OAuth.SignatureMethod.getBaseString(message), signature = this.getSignature(baseString);
		Ti.API.info('basestring ' + baseString);
		return OAuth.setParameter(message, "oauth_signature", signature), signature;
	},
	initialize : function(name, accessor) {
		var consumerSecret;
		accessor.accessorSecret != null && name.length > 9 && name.substring(name.length - 9) == "-Accessor" ? consumerSecret = accessor.accessorSecret : consumerSecret = accessor.consumerSecret, this.key = OAuth.percentEncode(consumerSecret) + "&" + OAuth.percentEncode(accessor.tokenSecret);
	}
}), OAuth.setProperties(OAuth.SignatureMethod, {
	sign : function(message, accessor) {
		var name = OAuth.getParameterMap(message.parameters).oauth_signature_method;
		if (name == null || name == "")
			name = "HMAC-SHA1", OAuth.setParameter(message, "oauth_signature_method", name);
		OAuth.SignatureMethod.newMethod(name, accessor).sign(message);
	},
	newMethod : function(name, accessor) {
		var impl = OAuth.SignatureMethod.REGISTERED[name];
		if (impl != null) {
			var method = new impl;
			return method.initialize(name, accessor), method;
		}
		var err = new Error("signature_method_rejected"), acceptable = "";
		for (var r in OAuth.SignatureMethod.REGISTERED)acceptable != "" && (acceptable += "&"), acceptable += OAuth.percentEncode(r);
		throw err.oauth_acceptable_signature_methods = acceptable, err;
	},
	REGISTERED : {},
	registerMethodClass : function(names, classConstructor) {
		for (var n = 0; n < names.length; ++n)
			OAuth.SignatureMethod.REGISTERED[names[n]] = classConstructor;
	},
	makeSubclass : function(getSignatureFunction) {
		var superClass = OAuth.SignatureMethod, subClass = function() {
			superClass.call(this);
		};
		return subClass.prototype = new superClass, subClass.prototype.getSignature = getSignatureFunction, subClass.prototype.constructor = subClass, subClass;
	},
	getBaseString : function(message) {
		var URL = message.action, q = URL.indexOf("?"), parameters;
		if (q < 0)
			parameters = message.parameters;
		else {
			parameters = OAuth.decodeForm(URL.substring(q + 1));
			var toAdd = OAuth.getParameterList(message.parameters);
			for (var a = 0; a < toAdd.length; ++a)
				parameters.push(toAdd[a]);
		}
		return OAuth.percentEncode(message.method.toUpperCase()) + "&" + OAuth.percentEncode(OAuth.SignatureMethod.normalizeUrl(URL)) + "&" + OAuth.percentEncode(OAuth.SignatureMethod.normalizeParameters(parameters));
	},
	normalizeUrl : function(url) {
		var uri = OAuth.SignatureMethod.parseUri(url), scheme = uri.protocol.toLowerCase(), authority = uri.authority.toLowerCase(), dropPort = scheme == "http" && uri.port == 80 || scheme == "https" && uri.port == 443;
		if (dropPort) {
			var index = authority.lastIndexOf(":");
			index >= 0 && ( authority = authority.substring(0, index));
		}
		var path = uri.path;
		return path || ( path = "/"), scheme + "://" + authority + path;
	},
	parseUri : function(str) {
		var o = {
			key : ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
			parser : {
				strict : /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
			}
		}, m = o.parser.strict.exec(str), uri = {}, i = 14;
		while (i--)
			uri[o.key[i]] = m[i] || "";
		return uri;
	},
	normalizeParameters : function(parameters) {
		if (parameters == null)
			return "";
		var list = OAuth.getParameterList(parameters), sortable = [];
		for (var p = 0; p < list.length; ++p) {
			var nvp = list[p];
			nvp[0] != "oauth_signature" && sortable.push([OAuth.percentEncode(nvp[0]) + " " + OAuth.percentEncode(nvp[1]), nvp]);
		}
		sortable.sort(function(a, b) {
			return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
		});
		var sorted = [];
		for (var s = 0; s < sortable.length; ++s)
			sorted.push(sortable[s][1]);

		return OAuth.formEncode(sorted);
	}
}), OAuth.SignatureMethod.registerMethodClass(["PLAINTEXT", "PLAINTEXT-Accessor"], OAuth.SignatureMethod.makeSubclass(function(baseString) {
	return this.key;
})), OAuth.SignatureMethod.registerMethodClass(["HMAC-SHA1", "HMAC-SHA1-Accessor"], OAuth.SignatureMethod.makeSubclass(function(baseString) {
	b64pad = "=";
	var signature = b64_hmac_sha1(this.key, baseString);
	return signature;
}));

try {
	OAuth.correctTimestampFromSrc();
} catch (e) {
}

/*
 *
 * Copyright 2010 David Riccitelli, Interact SpA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE.txt-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var OAuthAdapter = function(pConsumerSecret, pConsumerKey, pSignatureMethod) {
	function showLoading(e) {

		if (e && e.url.indexOf('liferay.com/security') !== -1) {
			e.url.split('?')[1].split('&').forEach(function(el) {
				if (el.indexOf('oauth_verifier') == 0) {
					pin = el.split('=')[1];
				}
			});

			pin ? ( destroyAuthorizeUI(), receivePinCallback()) : (loadingView && loadingView.hide(), loadingContainer && loadingContainer.hide(), webView && webView.show()), loading = !1, clearInterval(intervalID), estimates[estimateID] = (new Date).getTime() - startTime, Ti.App.Properties.setString("Social-LoadingEstimates", JSON.stringify(estimates));
			return;
		}

		if (loading)
			return;
		loading = !0, loadingView.value = 0, estimateID = firstLoad ? "tokenRequest" : "pageLoad", estimates[estimateID] || (estimates[estimateID] = firstLoad ? 2000 : 1000), firstLoad = !1, startTime = (new Date).getTime(), intervalID = setInterval(updateProgress, 1000), webView && webView.hide(), loadingView && loadingView.show(), loadingContainer && loadingContainer.show();
	}

	function updateProgress() {
		loadingView && (loadingView.value = ((new Date).getTime() - startTime) / estimates[estimateID]);
	}

	function authorizeUICallback(e) {

		if (e.url.indexOf('linkedin') !== -1) {
			var response = e.source.evalJS("(p = document.getElementsByClassName(\"access-code\")) && p[0].innerHTML");
			response ? ( pin = response, destroyAuthorizeUI(), receivePinCallback()) : (loadingView && loadingView.hide(), loadingContainer && loadingContainer.hide(), webView && webView.show()), loading = !1, clearInterval(intervalID), estimates[estimateID] = (new Date).getTime() - startTime, Ti.App.Properties.setString("Social-LoadingEstimates", JSON.stringify(estimates));
		} else if (e.url.indexOf('liferay.com/security') !== -1) {
		}
	}

	var consumerSecret = pConsumerSecret, consumerKey = pConsumerKey, signatureMethod = pSignatureMethod, pin = null, requestToken = null, requestTokenSecret = null, accessToken = null, accessTokenSecret = null, accessor = {
		consumerSecret : consumerSecret,
		tokenSecret : ""
	}, window = null, view = null, webView = null, loadingView = null, loadingContainer = null, receivePinCallback = null, accessTokenStore = {};

	this.sendTwitterImage = function(options) {
		var pUrl = "https://api.twitter.com/1.1/statuses/update_with_media.json";
		var pTitle = options.title;
		var pSuccessMessage = options.onSuccess, pErrorMessage = options.onError;
		if (accessToken == null || accessTokenSecret == null) {
			Ti.API.debug("The send status cannot be processed as the client doesn't have an access token. Authorize before trying to send.");
			return;
		}
		accessor.tokenSecret = accessTokenSecret;
		var message = createMessage(pUrl);

		message.parameters.push(["oauth_token", accessToken]);
		message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
		message.parameters.push(["oauth_nonce", OAuth.nonce(42)]);
		message.parameters.push(["oauth_version", "1.0"]);

		OAuth.SignatureMethod.sign(message, accessor);
		var parameterMap = OAuth.getParameterMap(message.parameters);
		client = Ti.Network.createHTTPClient({
			onload : function() {
				if (client.status == 200) {
					pSuccessMessage && pSuccessMessage(this.responseText)
				} else {
					pErrorMessage && pErrorMessage(this.responseText);
				}
			},
			onerror : function() {
				Ti.API.error("Social.js: FAILED to send a request!");
				Ti.API.error(this.responseText);
				pErrorMessage && pErrorMessage(this.responseText);
			}
		});
		if (options.updateProgress) {
			client.onsendstream = options.updateProgress;
		}

		if (options.timeout) {
			client.setTimeout(options.timeout);
		}
		client.open("POST", pUrl);

		header = OAuth.getAuthorizationHeader(pUrl, message.parameters);
		client.setRequestHeader("Authorization", header);
		if (!Ti.Android) {
			client.setRequestHeader("Content-Type", "multipart/form-data");
		}
		client.send(options.params);
	}, this.loadAccessToken = function(pService) {
		var token;
		if (accessTokenStore[pService])
			token = accessTokenStore[pService];
		else {
			var raw = Ti.App.Properties.getString("Social.js-AccessToken-" + pService, "");
			if (!raw)
				return;
			try {
				token = accessTokenStore[pService] = JSON.parse(raw);
			} catch (err) {
				Ti.API.error("Failed to parse stored access token for " + pService + "!"), Ti.API.error(err);
				return;
			}
		}
		token.accessToken && ( accessToken = token.accessToken), token.accessTokenSecret && ( accessTokenSecret = token.accessTokenSecret);
	}, this.saveAccessToken = function(pService) {
		accessTokenStore[pService] = {
			accessToken : accessToken,
			accessTokenSecret : accessTokenSecret
		}, Ti.App.Properties.setString("Social.js-AccessToken-" + pService, JSON.stringify(accessTokenStore[pService]));
	}, this.clearAccessToken = function(pService) {
		delete accessTokenStore[pService], Ti.App.Properties.setString("Social.js-AccessToken-" + pService, null), accessToken = null, accessTokenSecret = null;
	}, this.isAuthorized = function() {
		return accessToken != null && accessTokenSecret != null;
	};
	var createMessage = function(pUrl) {
		var message = {
			action : pUrl,
			method : "POST",
			parameters : []
		};
		return message.parameters.push(["oauth_consumer_key", consumerKey]), message.parameters.push(["oauth_callback", "http://www.liferay.com/security"]), message.parameters.push(["oauth_signature_method", signatureMethod]), message;
	};
	this.getPin = function() {
		return pin;
	}, this.getRequestToken = function(pUrl, callback) {
		accessor.tokenSecret = "";
		var message = createMessage(pUrl);
		OAuth.setTimestampAndNonce(message), OAuth.SignatureMethod.sign(message, accessor);
		var done = !1, client = Ti.Network.createHTTPClient({
			onload : function() {
				var responseParams = OAuth.getParameterMap(this.responseText);
				requestToken = responseParams.oauth_token, requestTokenSecret = responseParams.oauth_token_secret, callback({
					success : !0,
					token : this.responseText
				}), done = !0;
			},
			onerror : function() {
				Ti.API.error("Social.js: FAILED to getRequestToken!"), Ti.API.error(this.responseText), callback({
					success : !1
				}), done = !0;
			}
		});
		client.setTimeout(20000);
		client.open("POST", pUrl), client.send(OAuth.getParameterMap(message.parameters));
	};
	var destroyAuthorizeUI = function() {

		if (window == null)
			return;
		try {
			webView && webView.removeEventListener("load", authorizeUICallback), webView && webView.removeEventListener("beforeload", showLoading), loadingView.hide(), window.close(), loading = null, webView = null, loadingView = null, loading = !1, firstLoad = !0, view = null, window = null;
		} catch (ex) {
			console.log("Cannot destroy the authorize UI. Ignoring.");
		}
	}, firstLoad = !0, loading = !1, estimates = JSON.parse(Ti.App.Properties.getString("Social-LoadingEstimates", "{}")), estimateID, startTime, intervalID = 0;
	this.showLoadingUI = function() {
		window = Ti.UI.createWindow({
			backgroundColor : "transparent",
			zIndex : 1000
		}), Ti.Android || (window.opacity = 0, window.transform = Ti.UI.create2DMatrix().scale(0)), view = Ti.UI.createView({
			top : 10,
			right : 10,
			bottom : 10,
			left : 10,
			backgroundColor : "#52D3FE",
			border : 10,
			borderColor : "#52D3FE",
			borderRadius : 10,
			borderWidth : 4,
			zIndex : -1
		});
		var closeLabel = Ti.UI.createButton({
			font : {
				fontSize : 11,
				fontWeight : "bold"
			},
			backgroundColor : "#52D3FE",
			borderColor : "#52D3FE",
			color : "#fff",
			style : 0,
			borderRadius : 6,
			title : "X",
			top : 8,
			right : 8,
			width : 30,
			height : 30
		});
		closeLabel.addEventListener("click", destroyAuthorizeUI), window.open();
		var offset = 0;
		Ti.Android && ( offset = "10dp"), loadingContainer = Ti.UI.createView({
			top : offset,
			right : offset,
			bottom : offset,
			left : offset,
			backgroundColor : "#fff"
		}), loadingView = Ti.UI.createProgressBar({
			top : 10,
			right : 10,
			bottom : 10,
			left : 10,
			min : 0,
			max : 1,
			value : 0.5,
			message : L('LOADING'),
			backgroundColor : "#fff",
			font : {
				fontSize : 14,
				fontWeight : "bold"
			},
			style : 0
		}), view.add(loadingContainer), loadingContainer.add(loadingView), loadingView.show(), window.add(view), window.add(closeLabel);
		if (!Ti.Android) {
			var tooBig = Ti.UI.createAnimation({
				transform : Ti.UI.create2DMatrix().scale(1.1),
				opacity : 1,
				duration : 350
			}), shrinkBack = Ti.UI.createAnimation({
				transform : Ti.UI.create2DMatrix(),
				duration : 400
			});
			tooBig.addEventListener("complete", function() {
				window.animate(shrinkBack);
			}), window.animate(tooBig);
		}
		showLoading();
	}, this.showAuthorizeUI = function(pUrl, pReceivePinCallback) {
		receivePinCallback = pReceivePinCallback;
		var offset = 0;
		Ti.Android && ( offset = "10dp"), webView = Ti.UI.createWebView({
			url : pUrl,
			top : offset,
			right : offset,
			bottom : offset,
			left : offset
		}), webView.addEventListener("beforeload", showLoading), webView.addEventListener("load", authorizeUICallback), view.add(webView);
	}, this.getAccessToken = function(pUrl, callback) {
		accessor.tokenSecret = requestTokenSecret;
		var message = createMessage(pUrl);

		message.parameters.push(["oauth_token", requestToken]), message.parameters.push(["oauth_verifier", pin]), OAuth.setTimestampAndNonce(message), OAuth.SignatureMethod.sign(message, accessor);
		var parameterMap = OAuth.getParameterMap(message.parameters), client = Ti.Network.createHTTPClient({
			onload : function() {
				var responseParams = OAuth.getParameterMap(this.responseText);
				Ti.API.info("access token: " + responseParams.oauth_token);

				Ti.API.info("access token secret: " + responseParams.oauth_token_secret);

				accessToken = responseParams.oauth_token, accessTokenSecret = responseParams.oauth_token_secret, callback({
					success : !0
				});
			},
			onerror : function() {
				Ti.API.error("Social.js: FAILED to getAccessToken!"), Ti.API.error(this.responseText), callback({
					success : !1
				});
			}
		});
		client.setTimeout(20000);
		client.open("POST", pUrl), client.send(parameterMap);

	}, this.getProfileLinkedin = function(options) {
		Ti.API.info("token: " + accessToken + " secret: " + accessTokenSecret);
		var pUrl = "http://api.linkedin.com/v1/people/~?format=json";
		var pSuccessMessage = options.onSuccess;
		var pErrorMessage = options.onError;

		accessor.tokenSecret = accessTokenSecret;
		var message = createMessage(pUrl);

		message.method = 'get';
		message.parameters.push(["oauth_nonce", OAuth.nonce(42)]);
		message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
		message.parameters.push(["oauth_token", accessToken]);
		message.parameters.push(["oauth_version", "1.0"]);

		OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters);
		Ti.API.info(JSON.stringify(message));

		client = Ti.Network.createHTTPClient({
			onload : function() {
				if (client.status == 200) {
					pSuccessMessage && pSuccessMessage(this.responseText)
				} else {
					pErrorMessage && pErrorMessage(this.responseText);
				}
			},
			onerror : function() {
				Ti.API.error("Social.js: FAILED to send a request!");
				Ti.API.error(this.responseText);
				pErrorMessage && pErrorMessage(this.responseText);
			}
		});

		client.open("GET", pUrl);
		header = OAuth.getAuthorizationHeader("", message.parameters);

		client.setRequestHeader("Authorization", header);
		if (options.timeout) {
			client.setTimeout(options.timeout);
		}
		client.send();

	}, this.shareLinkedin = function(options) {
		var pUrl = "http://api.linkedin.com/v1/people/~/shares";

		var pSuccessMessage = options.onSuccess;
		var pErrorMessage = options.onError;

		accessor.tokenSecret = accessTokenSecret;
		var message = createMessage(pUrl);

		//used to get Oauth sig, do not change

		message.parameters.push(["oauth_nonce", OAuth.nonce(42)]);
		message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
		message.parameters.push(["oauth_token", accessToken]);
		message.parameters.push(["oauth_version", "1.0"]);

		OAuth.SignatureMethod.sign(message, accessor);

		client = Ti.Network.createHTTPClient({
			onload : function() {
				if (client.status == 200 || client.status == 201) {
					pSuccessMessage && pSuccessMessage(this.responseText)
				} else {
					pErrorMessage && pErrorMessage(this.responseText);
				}
			},
			onerror : function() {
				Ti.API.error("Social.js: FAILED to send a request!");
				Ti.API.error(this.responseText);
				pErrorMessage && pErrorMessage(this.responseText);
			}
		});

		client.open("POST", pUrl);
		header = OAuth.getAuthorizationHeader("", message.parameters);
		client.setRequestHeader("Content-Type", "application/json");
		client.setRequestHeader("x-li-format", "json");
		client.setRequestHeader("Authorization", header);

		if (options.timeout) {
			client.setTimeout(options.timeout);
		}
		var payload = JSON.stringify(options.parameters);

		client.send(payload);

	}, this.send = function(options, callback) {
		var pUrl = options.url, pParameters = options.parameters, pTitle = options.title, pSuccessMessage = options.onSuccess, pErrorMessage = options.onError;
		if (accessToken == null || accessTokenSecret == null) {
			Ti.API.debug("The send status cannot be processed as the client doesn't have an access token. Authorize before trying to send.");
			return;
		}
		accessor.tokenSecret = accessTokenSecret;
		var message = createMessage(pUrl);
		message.parameters.push(["oauth_token", accessToken]);

		pParameters.forEach(function(el) {
			message.parameters.push(el);
		});
//		for (p in pParameters)
//			message.parameters.push(pParameters[p]);


		OAuth.setTimestampAndNonce(message), OAuth.SignatureMethod.sign(message, accessor);

		var parameterMap = OAuth.getParameterMap(message.parameters), client = Ti.Network.createHTTPClient({
			onload : function() {
				client.status == 200 ? pSuccessMessage && pSuccessMessage(this.responseText) : pErrorMessage && pErrorMessage(this.responseText);
			},
			onerror : function() {
				Ti.API.info(this.responseText);
				Ti.API.error("Social.js: FAILED to send a request!"), pErrorMessage && pErrorMessage(this.responseText);
			}
		});

		if (options.timeout) {
			client.setTimeout(options.timeout);
		}
		client.open("POST", pUrl);
		client.send(parameterMap);

	};
}, supportedSites = {
	twitter : {
		accessToken : "https://api.twitter.com/oauth/access_token",
		requestToken : "https://api.twitter.com/oauth/request_token",
		authorize : "https://api.twitter.com/oauth/authorize?",
		update : "https://api.twitter.com/1.1/statuses/update.json"
	},
	linkedin : {
		accessToken : "https://api.linkedin.com/uas/oauth/accessToken",
		requestToken : "https://api.linkedin.com/uas/oauth/requestToken?scope=rw_nus",
		authorize : "https://api.linkedin.com/uas/oauth/authorize?",
		update : "http://api.linkedin.com/v1/people/~/shares?format=json"
	}
};

exports.create = function(settings) {
	var site = (settings.site || "twitter").toLowerCase(), adapter = new OAuthAdapter(settings.consumerSecret, settings.consumerKey, "HMAC-SHA1");
	adapter.loadAccessToken(site);
	var urls = supportedSites[site];
	return urls == null ? (alert("The Social.js module does not support " + site + " yet!"), null) : {
		isAuthorized : function() {
			return adapter.isAuthorized();
		},
		deauthorize : function(callback) {
			adapter.clearAccessToken(site);
			if (!adapter.isAuthorized())
				callback && callback(true);
		},
		authorize : function(onSuccess, onError) {
			if (!adapter.isAuthorized()) {
				function receivePin() {

					adapter.getAccessToken(urls.accessToken, function(evt) {

						evt.success ? (adapter.saveAccessToken(site), onSuccess && onSuccess(true)) : (onError && onError("Cannot get acess token"));
					});
				}


				adapter.showLoadingUI(), adapter.getRequestToken(urls.requestToken, function(evt) {
					evt.success ? adapter.showAuthorizeUI(urls.authorize + evt.token, receivePin) : (onError && onError("Cannot get acess token"));
				});
			} else
				onSuccess && onSuccess(true);
		},
		shareImage : function(options) {
			this.authorize(function() {
				adapter.sendTwitterImage({
					params : {
						media : options.image,
						status : options.message
					},
					timeout: options.timeout,
					title : "Twitter",
					onSuccess : options.success,
					onError : options.error,
					updateProgress: options.updateProgress
				});
			}, function(err) {
				options.error(err);
			});
		},
		share : function(options) {
			this.authorize(function() {
				adapter.send({

					url : urls.update,
					parameters : [["status", options.message]],
					timeout: options.timeout,
					title : "Twitter",
					onSuccess : options.success,
					onError : options.error
				});
			}, function(err) {
				options.error(err);
			});
		},
		shareToLinkedin : function(options) {
			this.authorize(function() {
				adapter.shareLinkedin({
					site : 'linkedin',
					url : urls.update,
					parameters : options.message,
					title : "Linkedin",
					onSuccess : options.success,
					onError : options.error
				});
			}, function(err) {
				options.error(err);
			});
		},
		getProfileLinkedin : function(options) {
			this.authorize(function() {
				adapter.getProfileLinkedin({
					site : 'linkedin',
					url : urls.update,
					parameters : options.message,
					title : "Linkedin",
					onSuccess : options.success,
					onError : options.error
				});
			}, function(err) {
				options.error(err);
			});
		}
	};
};
