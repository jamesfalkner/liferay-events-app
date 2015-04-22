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


var liferay = {
	classes: {},
	screens: {},
	settings: {}
};

var version = Ti.Platform.version.split('.');

liferay.model = {
	android: Ti.Platform.name == 'android',
    iPhone: Ti.Platform.osname == 'iphone',
	iPad: Ti.Platform.osname == 'ipad',
	iPad3: (Ti.Platform.osname == 'ipad' && Ti.Platform.displayCaps.density == 'high'),
    iOS: (Ti.Platform.name == 'iPhone OS'),
    iOS7: ((Ti.Platform.name == 'iPhone OS') && version && version[0] && parseInt(version[0]) >= 7),
    iOS8: ((Ti.Platform.name == 'iPhone OS') && version && version[0] && parseInt(version[0]) >= 8),
	retina: ((Ti.Platform.name == 'iPhone OS') && Ti.Platform.displayCaps.density == 'high')
};

/**
 * Class: Window
 */

liferay.classes.window = function() {
	//Ti.API.info("new liferay.classes.window()");
	this.className = 'liferay.classes.window';
};

liferay.classes.window.prototype.render = function() {
	//Ti.API.info(this.className + ".render()");
	// Override this method to display screen elements
	this.window = Titanium.UI.createWindow();
	return this.window;
};

liferay.classes.window.prototype.open = function(options) {
	//Ti.API.info(this.className + ".open()");
	this.render();
	this.window.open(options);
};

liferay.classes.window.prototype.refresh = function(options) {
    //Ti.API.info(this.className + ".refresh()");
};
liferay.classes.window.prototype.loadAction = function(action, id, cb) {
    cb();
};


liferay.classes.window.prototype.testAction = function(msgTemplate, action, id) {
    return msgTemplate;
};

liferay.classes.window.prototype.getLocalImage = function(options) {
    var filename = Ti.Utils.md5HexDigest(options.url) + '.png';
    var cacheFilePath = liferay.cache.getFilePath(filename);
    var cacheFile = Titanium.Filesystem.getFile(cacheFilePath);
    if (cacheFile.exists()) {
        return cacheFile.nativePath;
    } else {
        return null;
    }
};

liferay.classes.window.prototype.loadImage = function(options) {

	var filename = Ti.Utils.md5HexDigest(options.url) + '.png';
	var url = options.url;
	if (url.substring(0, 1) == '/')
		url = liferay.settings.server.dataHost.host + url;

	var cacheFilePath = liferay.cache.getFilePath(filename);
	var cacheFile = Titanium.Filesystem.getFile(cacheFilePath);
	if (cacheFile.exists()) {
		if (!options.setImage) {
			options.imageView.backgroundImage = cacheFile.getNativePath();
		} else {
			options.imageView.image = cacheFile.getNativePath();
		}
		if (options.onLoad) { options.onLoad(options.imageView); }
	} else {
		if (Titanium.Network.online) {
			liferay.cache.downloadFile(url, filename, function(localpath) {
				if (!options.setImage) {
					options.imageView.backgroundImage = localpath;
				} else {
					options.imageView.image = localpath;
				}
				if (options.onLoad) { options.onLoad(options.imageView); }
			});
		} else {
			if (!options.setImage) {
				options.imageView.backgroundImage = liferay.cache.getFilePath(filename);
			} else {
				options.imageView.image = liferay.cache.getFilePath(filename);
			}
		}
		if (options.onRequest) { options.onRequest(); }
	}
};

liferay.classes.date = function(options) {
	this.date = new Date(options);
};

liferay.classes.date.prototype.getTime = function() {
	return this.date.getTime();
};
// Accepts an iso 8601 formatted date
liferay.classes.date.prototype.setFromISO8601 = function(isostr) {
	var parts = isostr.match(/\d+/g);
	this.date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
	return this;
};

liferay.classes.date.prototype.toString = function() {
	return this.date.toString();
};

//Ti.API.info("mobile.js loaded");
