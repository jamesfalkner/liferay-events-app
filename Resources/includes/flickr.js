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
var ImageFactory = require('ti.imagefactory');

liferay.flickr = {};

liferay.flickr.getFullKeyFromMini = function (success, failure) {

    var signature_string = Ti.App.Properties.getString('liferay.flickr.shared_secret') + "api_key" + Ti.App.Properties.getString('liferay.flickr.api_key') + "format" + "json" + "method" + "flickr.auth.getFullToken" + "mini_token" + Ti.App.Properties.getString('liferay.flickr.mini_token') + "nojsoncallback" + "1" + "perms" + "write";
    var api_sig = Ti.Utils.md5HexDigest(signature_string);

    var xhr = Titanium.Network.createHTTPClient();
    xhr.timeout = liferay.settings.server.requestTimeout;
    xhr.onload = function (e) {
        var authobj = JSON.parse(this.responseText);
        if (authobj.stat != "ok") {
            failure(authobj.code + ": " + authobj.message);
        } else {
            var fullKey = authobj.auth.token._content;
            success(fullKey);
        }
    };
    xhr.onerror = function (err) {
        failure(err.error);
    };

    var url = 'https://api.flickr.com/services/rest/?format=json&method=' + "flickr.auth.getFullToken" + '&api_key=' + Ti.App.Properties.getString('liferay.flickr.api_key') + '&mini_token=' + Ti.App.Properties.getString('liferay.flickr.mini_token') + '&nojsoncallback=1&perms=write&api_sig=' + api_sig;

    xhr.open('GET', url);
    xhr.send();
};

liferay.flickr.checkToken = function (token, success, failure) {
    var method = "flickr.auth.checkToken";
    var signature_string = Ti.App.Properties.getString('liferay.flickr.shared_secret') + "api_key" + Ti.App.Properties.getString('liferay.flickr.api_key') + "auth_token" + token + "format" + "json" + "method" + "flickr.auth.checkToken" + "nojsoncallback" + "1" + "perms" + "write";

    var api_sig = Ti.Utils.md5HexDigest(signature_string);

    var xhr = Titanium.Network.createHTTPClient();
    xhr.timeout = liferay.settings.server.requestTimeout;
    xhr.onload = function () {

        var authobj = JSON.parse(this.responseText);
        if (authobj.stat != "ok") {
            failure(authobj.code + ": " + authobj.message);
        } else {
            fullKey = authobj.auth.token._content;
            success(fullKey);
        }
    };
    xhr.onerror = function (err) {
        failure(err);
    };

    var url = "https://api.flickr.com/services/rest/?format=json&method=flickr.auth.checkToken" + '&api_key=' + Ti.App.Properties.getString('liferay.flickr.api_key') + '&auth_token=' + token + '&nojsoncallback=1&perms=write&api_sig=' + api_sig;

    xhr.open('GET', url);
    xhr.send();
}

liferay.flickr.uploadPhoto = function (name, win, take, success, fail) {

    liferay.flickr.checkToken(Ti.App.Properties.getString('liferay.flickr.auth_token'), function () {
        liferay.flickr.selectAndUploadPhoto(name, Ti.App.Properties.getString('liferay.flickr.auth_token'), win, take, success, fail);
    }, function () {
        liferay.flickr.getFullKeyFromMini(function () {
            liferay.flickr.selectAndUploadPhoto(name, this, win, take, success, fail);
        }, function (err) {
            fail("Unable to get full key:" + err);
        });
    });

};

liferay.flickr.selectAndUploadPhoto = function (name, auth_token, win, take, success, fail) {

    if (take) {
        Titanium.Media.showCamera({
            cancel: function (object) {
            },
            error: function (err) {
                fail(err.code);
            },
            mediaTypes: [Titanium.Media.MEDIA_TYPE_PHOTO],
            saveToPhotoGallery: true,
            success: function (pic) {
                liferay.flickr.uploadToFlickr(name, pic, auth_token, win, success, fail);
            }
        });

    } else {
        Titanium.Media.openPhotoGallery({
            allowEditing: false,
            animated: true,
            autohide: true,
            mediaTypes: [Titanium.Media.MEDIA_TYPE_PHOTO],
            success: function (pic) {
                liferay.flickr.uploadToFlickr(name, pic, auth_token, win, success, fail)
            },
            error: function (err) {
                fail(err.code);
            },
            cancel: function (object) {
            }
        });
    }
};

liferay.flickr.uploadToFlickr = function (name, pic, auth_token, win, success, failure) {
    var ind;
    var progressBg;

    var flickrXhr = Titanium.Network.createHTTPClient();
    flickrXhr.timeout = 60000 * 5;

    flickrXhr.onload = function () {
        // close window once uploaded
        ind.hide();
        win.remove(progressBg);
        var resXML = Ti.XML.parseString(this.responseText);
        var status = resXML.getElementsByTagName("rsp").item(0).getAttributes().getNamedItem("stat").getValue();
        if (status != "ok") {
            failure("Upload failed:" + status);
        } else {
            var photoid = resXML.getElementsByTagName("photoid").item(0).text;
            liferay.flickr.addToPhotoset(auth_token, photoid, function () {
                success();
            }, function (err) {
                failure(err);
            });
        }
    };
    flickrXhr.onerror = function (err) {
        ind.hide();
        win.remove(progressBg);
        failure(err.error);
    };

    flickrXhr.onsendstream = function (e) {
        ind.value = e.progress;
    };
    var url = 'https://api.flickr.com/services/upload/';
    var d = new Date();
    var title = String.format(L('PICTURE_FROM'), liferay.controller.selectedEvent.menutitle) + ': ' + name;
    var tagsHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag', "#liferay");
    var tags = tagsHash.replace('#', '');
    var desc = title + " - " + String.formatDate(d, 'long') + ' - ' + String.formatTime(d, 'short');
    var signature_string = Ti.App.Properties.getString('liferay.flickr.shared_secret') + "api_key" + Ti.App.Properties.getString('liferay.flickr.api_key') + "auth_token" + auth_token + "description" + desc + "is_public" + "0" + "perms" + "write" + "tags" + tags + "title" + title;
    var api_sig = Ti.Utils.md5HexDigest(signature_string);

    ind = Titanium.UI.createProgressBar({
        min: 0,
        max: 1,
        value: 0,
        message: L('UPLOADING_IMAGE'),
        font: liferay.fonts.h2,
        top: "30%",
        color: 'white',
        width: "auto",
        height: "auto"
    });


    progressBg = Titanium.UI.createView({
        width: "80%",
        height: "50%",
        backgroundColor: 'black',
        opacity: 0.9,
        touchEnabled: true,
        zIndex: 100,
        layout: 'vertical',
        borderColor: '#89A9C9',
        borderRadius: '10dp',
        borderWidth: 2
    });

    var cancelButton = Ti.UI.createView(liferay.settings.screens.gallery.buttons.cancelUpload);
    cancelButton.width = liferay.tools.getDp(liferay.settings.screens.gallery.buttons.cancelUpload.psize * Titanium.Platform.displayCaps.platformWidth);
    cancelButton.height = cancelButton.width;
    cancelButton.zIndex = 200;
    if (liferay.model.iOS) {
        ind.style = Titanium.UI.iPhone.ProgressBarStyle.DEFAULT;
    }
    cancelButton.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                flickrXhr.abort();
                ind.hide();
                win.remove(progressBg);
            }
        });
    });
    progressBg.add(ind);
    progressBg.add(cancelButton);

    var sponsor = null;
    liferay.data.currentEventData.sponsors.forEach(function (sponsorIt) {
        if (sponsorIt.type && sponsorIt.type == 'photo') {
            sponsor = sponsorIt;
        }
    });

    if (sponsor) {
        ind.top = "15%";
        var sponsorLabel = Ti.UI.createLabel(liferay.settings.screens.gallery.labels.streamSponsor);
        sponsorLabel.font = liferay.tools.h3;
        sponsorLabel.width = Ti.UI.SIZE;
        sponsorLabel.height = Ti.UI.SIZE;
        var sponsorWidth = liferay.tools.getDp(.25 * Titanium.Platform.displayCaps.platformWidth);
        var sponsorHeight = sponsorWidth / 1.5;
        var logoContainer = Ti.UI.createView({
            top: '5%',
            width: sponsorWidth * 2,
            height: sponsorHeight,
            borderColor: '#89A9C9',
            borderRadius: '10dp',
            borderWidth: 2,
            backgroundColor: '#BBBBBB'
        });

        var image = Titanium.UI.createImageView({
            backgroundColor: 'transparent',
            preventDefaultImage: true,
            touchEnabled: false,
            width: '95%',
            height: '95%',
            left: '2.5%',
            top: '2.5%'
        });

        liferay.screens.sponsors.loadImage({
            imageView: image,
            url: sponsor.docmedia
        });

        logoContainer.add(image);
        progressBg.add(sponsorLabel);
        progressBg.add(logoContainer);
    }
    win.add(progressBg);

    ind.show();

    var resizedPic = pic.media;
    var picWidth = 0, picHeight = 0;

    if (pic.width > 0 && pic.height > 0) {
        picWidth = pic.width;
        picHeight = pic.height;
    } else if (pic.media.width > 0 && pic.media.height > 0) {
        picWidth = pic.media.width;
        picHeight = pic.media.height;
    } else {
        try {
            var tmpcompress = ImageFactory.compress(image, 1.0);
            if (tmpcompress && tmpcompress.width > 0 && tmpcompress.height > 0) {
                picWidth = tmpcompress.width;
                picHeight = tmpcompress.height;
            }
            tmpcompress = null;
        } catch (ex) {
        }
    }


    if (picWidth > 0 && picHeight > 0) {
        var longestSide = Math.max(picWidth, picHeight);
        if (longestSide > 640) {
            var scale = 640 / longestSide;
            resizedPic = ImageFactory.imageAsResized(resizedPic, {
                width: Math.floor(picWidth * scale),
                height: Math.floor(picHeight * scale),
                format: ImageFactory.JPEG,
                quality: 0.7
            });
        }
    }

    flickrXhr.open('POST', url);
    flickrXhr.setRequestHeader('enctype', 'multipart/form-data');

    flickrXhr.send({
        api_key: Ti.App.Properties.getString('liferay.flickr.api_key'),
        auth_token: Ti.App.Properties.getString('liferay.flickr.auth_token'),
        description: desc,
        is_public: "0",
        perms: "write",
        tags: tags,
        title: title,
        api_sig: api_sig,
        photo: resizedPic
    });

    resizedPic = null;
};

liferay.flickr.addToPhotoset = function (auth_token, photo_id, success, failure) {
    var method = "flickr.photosets.addPhoto";
    var photosetid = liferay.controller.selectedEvent.upload_photosetid;
    var signature_string = Ti.App.Properties.getString('liferay.flickr.shared_secret') + "api_key" + Ti.App.Properties.getString('liferay.flickr.api_key') + "auth_token" + auth_token + "format" + "json" + "method" + method + "nojsoncallback" + "1" + "perms" + "write" + "photo_id" + photo_id + "photoset_id" + photosetid;

    var api_sig = Ti.Utils.md5HexDigest(signature_string);

    var xhr = Titanium.Network.createHTTPClient();
    xhr.timeout = liferay.settings.server.requestTimeout;
    xhr.onload = function () {
        var authobj;
        try {
            authobj = JSON.parse(this.responseText);
        } catch (ex) {
            failure(L('UPLOAD_FAILED'));
        }
        if (authobj.stat != "ok") {
            failure(authobj.code + ": " + authobj.message);
        } else {
            success("ok");
        }
    };
    xhr.onerror = function (err) {
        failure.call(err.error);
    };

    var url = "https://api.flickr.com/services/rest/?format=json&method=" + method + '&api_key=' + Ti.App.Properties.getString('liferay.flickr.api_key') + '&auth_token=' + auth_token + '&nojsoncallback=1&perms=write&api_sig=' + api_sig + "&photo_id=" + photo_id + "&photoset_id=" + photosetid;

    xhr.open('POST', url);
    xhr.send();

};
