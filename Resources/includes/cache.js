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

liferay.cache = {
	className: "liferay.cache"
};

liferay.cache.saveImage = function(image, filename) {
	//Ti.API.info(this.className + ".saveImage(): " + filename);
	return this.saveFile(image.toImage(), filename);
};

liferay.cache.saveFile = function(content, filename) {

	var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationCacheDirectory);
	if (!folder.exists()) {
		folder.createDirectory();
		folder.remoteBackup = false;
	}

	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationCacheDirectory, filename);
    if (file.exists()) {
        return file;
    }
	file.write(content);
	file.remoteBackup = false;
	return file;
};

liferay.cache.loadFile = function(filename) {
	//Ti.API.info(this.className + ".loadFile(): " + Titanium.Filesystem.applicationCacheDirectory + Titanium.Filesystem.separator + filename);
	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
	if (file.exists()) {
		return file.read();
	} else {
		return null;
	}
};

liferay.cache.downloadFile = function(url, filename, onLoad, onProgress, onError) {

	var request = Titanium.Network.createHTTPClient();

    request.ondatastream = function(e) {
        if (onProgress) {
            onProgress(e);
        }
    };
	request.setTimeout(30000);
	request.onload = function() {
		var file = liferay.cache.saveFile(this.responseData, filename);
		if (onLoad) onLoad(file.nativePath);
	};
	request.onerror = function(e) {
        if (onError) {
            onError(e);
        }
	};
	request.open('GET', url);
	request.send();
	return request;
};

liferay.cache.getFilePath = function(filename) {
	return Titanium.Filesystem.applicationCacheDirectory + Titanium.Filesystem.separator + filename;
};

liferay.cache.getLocalFilePath = function(url, ext) {
    var filename = Ti.Utils.md5HexDigest(url) + '.' + ext;
    var cacheFilePath = liferay.cache.getFilePath(filename);
    var cacheFile = Titanium.Filesystem.getFile(cacheFilePath);
    if (cacheFile.exists()) {
        return cacheFile.nativePath;
    } else {
        return null;
    }
};

liferay.cache.deleteFile = function(localfile) {
    var cacheFile = Titanium.Filesystem.getFile(localfile);
    if (cacheFile.exists()) {
        cacheFile.deleteFile();
    }
};

liferay.cache.downloadAndCache = function(options) {
    var filename = Ti.Utils.md5HexDigest(options.url) + '.' + options.ext;
    return liferay.cache.downloadFile(options.url, filename, options.onLoad, options.onProgress, options.onError);

};