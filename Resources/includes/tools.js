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
var MediaPickerModule = require('/lib/MediaPicker').MediaPicker;
var MediaPicker = new MediaPickerModule();

liferay.tools = {};
liferay.tools.actInd = null;
liferay.tools.actIndProg = null;
liferay.tools.actIndView = null;
liferay.tools.actIndContainer = null;

liferay.tools.osname = Ti.Platform.osname;

liferay.tools.stripTags = function (str) {
    if (!str) {
        return null;
    }
    return (str
        .replace(/(<br>|<br\s*\/>|<p>|<\/p>|<p\s*\/>)/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&[^;]+;/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n */g, '\n')
        .trim());
};

liferay.tools.getBoolean = function (str) {
    return !!(str && ("TRUE" === str.toUpperCase()));

};

liferay.tools.preprocessData = function (arr) {

    arr.forEach(function (item) {
        liferay.settings.server.singleValues.forEach(function (key) {
            if (item[key]) {
                var json = JSON.parse(item[key]);
                item[key] = json[0];
            }
        });

        liferay.settings.server.multiValues.forEach(function (key) {
            if (item[key]) {
                item[key] = JSON.parse(item[key]);
            }
        });

        liferay.settings.server.docLibValues.forEach(function (key) {
            if (item[key]) {
                var json = JSON.parse(item[key]);
                item[key] = '/documents/' + json.groupId + '/' + json.uuid;
            }
        });

        liferay.settings.server.fileUploadValues.forEach(function (key) {
            if (item[key]) {
                var json = JSON.parse(item[key]);
                item[key] = '/documents/ddm/' + json.className + '/' + json.classPK + '/' + key;
            }
        });

        liferay.settings.server.booleanValues.forEach(function (key) {
            if (item[key]) {
                item[key] = liferay.tools.getBoolean(item[key]);
            }
        });

        try {
            liferay.settings.server.customValues.forEach(function (key) {
                if (item[key]) {
                    item[key] = JSON.parse(item[key]);
                }
            });
        } catch (ex) {
            console.log(JSON.stringify(ex));
        }

    });

};

liferay.tools.os = function (/*Object*/ map) {
    var def = map.def || null; //default function or value
    if (map[liferay.tools.osname]) {
        if (typeof map[liferay.tools.osname] == 'function') {
            return map[liferay.tools.osname]();
        }
        else {
            return map[liferay.tools.osname];
        }
    }
    else {
        if (typeof def == 'function') {
            return def();
        }
        else {
            return def;
        }
    }
};

liferay.tools.alert = function (title, msg) {
    var alertDialog = Titanium.UI.createAlertDialog({
        title: title ? title : L('ALERT'),
        message: msg,
        buttonNames: [L('OK')]
    });
    alertDialog.show();
};

liferay.tools.getDp = function (pix) {
    if (!liferay.model.android)
        return pix;
    return (pix / (Ti.Platform.displayCaps.dpi / 160));
};

liferay.tools.getPx = function (dp) {
    if (!liferay.model.android)
        return dp;
    return (dp * (Ti.Platform.displayCaps.dpi / 160));
};

liferay.tools.hideFloatingMessage = function () {
    if (!liferay.tools.actInd) {
        return;
    }
    liferay.tools.actInd.hide();
    liferay.tools.actIndView.remove(liferay.tools.actInd);
    if (liferay.tools.actIndProg) liferay.tools.actIndView.remove(liferay.tools.actIndProg);

    if (liferay.tools.actIndContainer) {
        liferay.tools.actIndContainer.remove(liferay.tools.actIndView);
        liferay.tools.actIndView.hide();
    }
    liferay.tools.actInd = null;
    liferay.tools.actIndProg = null;
    liferay.tools.actIndView = null;
    liferay.tools.actIndContainer = null;
};

liferay.tools.blockingAlert = function (title, message, callback) {
    var alertDialog = Ti.UI.createAlertDialog({
        title: title,
        message: message,
        buttonNames: [L('OK')],
        callback: callback
    });
    alertDialog.addEventListener('click', function (e) {
        callback();
    });
    alertDialog.show();
};

liferay.tools.toastNotification = function (control, msg, win) {

    // longer messages should take more time to disappear
    var displayTime = 1000 + ((msg.length / 28) * 1000);

    if (liferay.model.android) {
        var dur = (displayTime < 3000) ? Ti.UI.NOTIFICATION_DURATION_SHORT : Ti.UI.NOTIFICATION_DURATION_LONG;
        Ti.UI.createNotification({
            message: msg,
            duration: dur
        }).show();
        return;
    }

    if (control) {
        var origTouchEnabledValue = ( typeof control.touchEnabled === 'undefined' ) ? true : control.touchEnabled;
        control.touchEnabled = false;
    }
    var theWin = win || liferay.controller.getCurrentWindow();
    var msgView = Ti.UI.createLabel({
        text: msg,
        font: liferay.fonts.h4,
        color: 'white',
        width: '95%',
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        height: '95%'
    });

    var bg = Ti.UI.createView({
        backgroundColor: 'black',
        width: '80%',
        borderWidth: '5dp',
        borderRadius: '5dp',
        borderColor: 'black',
        height: '20%',
        bottom: '30dp',
        opacity: 0
    });

    bg.add(msgView);
    theWin.add(bg);

    bg.animate({
        opacity: 0.8,
        duration: 200
    });



    setTimeout(function() {
        bg.animate({
            opacity: 0,
            duration: 4000
        }, function () {
            theWin.remove(bg);
            if (control) {
                control.touchEnabled = origTouchEnabledValue;
            }
        });
    }, displayTime);

};


liferay.tools.updateFloatingProgress = function (prog) {
    if (liferay.tools.actIndProg) {
        liferay.tools.actIndProg.setValue(prog);
    }
};

liferay.tools.createFloatingMessage = function (options) {
    if (liferay.tools.actInd) {
        liferay.tools.hideFloatingMessage();
    }
    liferay.tools.actInd = Titanium.UI.createActivityIndicator({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#ffffff",
        font: liferay.fonts.h4,
        message: options.text || L('LOADING'),
        zIndex: 101
    });

    if (liferay.model.iOS) {
        liferay.tools.actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG;
    }
    liferay.tools.actIndContainer = options.container;
    liferay.tools.actIndView = Ti.UI.createView({
        width: options.width ? options.width : '80%',
        height: options.height ? options.height : '20%',
        top: options.top ? options.top : '70%',
        opacity: 0.6,
        zIndex: 100,
        backgroundColor: "black",
        borderColor: "black",
        borderRadius: "10"
    });
    liferay.tools.actIndView.add(liferay.tools.actInd);
    if (options.progress) {
        liferay.tools.actIndProg = Ti.UI.createProgressBar({
            width: '80%',
            height: Ti.UI.SIZE,
            bottom: '5%'
        });
        liferay.tools.actIndView.add(liferay.tools.actIndProg);
        liferay.tools.actIndProg.show();
    }
    options.container.add(liferay.tools.actIndView);

    liferay.tools.actInd.show();
};

liferay.tools.showSpinner = function (options) {
    if (!liferay.tools.spinner) {
        liferay.tools.spinner = Titanium.UI.createActivityIndicator({});
    }

    liferay.tools.spinner.left = options.left;
    liferay.tools.spinner.right = options.right;
    liferay.tools.spinner.width = options.width || Ti.UI.SIZE;
    liferay.tools.spinner.height = options.height || Ti.UI.SIZE;
    if (!options.verticalCentered) {
        liferay.tools.spinner.bottom = options.bottom || 5;
    }
    liferay.tools.spinner.zIndex = 1000;
    liferay.tools.spinner.color = '#ffffff';

    if (liferay.tools.spinnerView) {
        liferay.tools.spinnerView.remove(liferay.tools.spinner);
    }

    options.container.add(liferay.tools.spinner);
    liferay.tools.spinnerView = options.container;
    liferay.tools.spinner.show();
};

liferay.tools.hideSpinner = function () {
    if (!liferay.tools.spinner || !liferay.tools.spinnerView) {
        return;
    }
    liferay.tools.spinner.hide();
    liferay.tools.spinnerView.remove(liferay.tools.spinner);

    liferay.tools.spinnerView = null;
};


liferay.tools.expandButton = function (options) {

    options.control.zIndex = 100;

    //create the second transform
    var transform1 = Titanium.UI.create2DMatrix({
        scale: 1.0
    });
    var transform2 = Titanium.UI.create2DMatrix({
        scale: 1.1
    });
    var animation2 = {
        transform: transform2,
        duration: 100,
        autoreverse: true
    };

    if (liferay.model.iOS) {
        options.control.animate({
            transform: transform2,
            duration: 100,
            curve: Titanium.UI.ANIMATION_CURVE_EASE_IN_OUT
        }, function () {
            options.control.animate({
                transform: transform1,
                duration: 100,
                curve: Titanium.UI.ANIMATION_CURVE_EASE_IN_OUT
            }, function () {
                if (options.onRestore) {
                    options.onRestore();
                }
            });
        });
    } else {
        options.control.animate(animation2, function (e) {
            //Ti.API.info("done with ani2");
            if (options.onRestore) {
                options.onRestore();
            }
        });
    }
};

liferay.tools.flashControl = function (control, color, cb) {
    if (control) {
        if (!control.backgroundColor) {
            control.backgroundColor = 'transparent';
        }
        control.animate({
            backgroundColor: color,
            duration: 100,
            autoreverse: true
        });
    }
    cb();
};

liferay.tools.flashButton = function (options) {
    if (!options.control.backgroundImageAlt) {
        if (options.onRestore) {
            options.onRestore();
            return;
        }
    }
    var tmp = options.control.backgroundImage;
    options.control.backgroundImage = options.control.backgroundImageAlt;
    setTimeout(function () {
        options.control.backgroundImage = tmp;
    }, 150);
    if (options.onRestore) {
        options.onRestore();
    }
};

liferay.tools.flashLabel = function (options) {

    var tmp = options.control.color;
    options.control.color = '#00a9aa';
    setTimeout(function () {
        options.control.color = tmp;
    }, 150);
    if (options.onRestore) {
        options.onRestore();
    }
};

liferay.tools.updateImagePaths = function (object, prefix) {
    if (object.constructor != Object) {
        return;
    }

    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var child = object[key];
            if (child.constructor == Object) {
                liferay.tools.updateImagePaths(child, prefix);
            } else if (child.constructor == Array) {
                for (var i = 0, l = child.length; i < l; i++) {
                    liferay.tools.updateImagePaths(child[i], prefix);
                }
            } else if (child.constructor == String) {
                object[key] = liferay.tools.appendImagePrefix(child, prefix);
            }
        }
    }
};

liferay.tools.appendImagePrefix = function (path, prefix) {
    return path.replace(/(.png$|.jpg$)/, prefix + "$1");
};

liferay.tools.makeRelativeDateString = function(date) {


    var  now = new Date().getTime();
    var secsDiff = (now - date.getTime()) / 1000;
    var mins = secsDiff / 60;
    var hours = mins / 60;
    var days = hours / 24;


    if (secsDiff < 120) {
        return L('MOMENTS_AGO')
    } else if (mins < 120) {
        return String.format(L('ABOUT_X_MINS_AGO'), Math.round(mins).toString());
    } else if (hours < 48) {
        if (hours > 18) {
            return L('YESTERDAY');
        } else {
            return String.format(L('ABOUT_X_HOURS_AGO'), Math.round(hours).toString());
        }
    } else if (days < 30) {
        return String.format(L('ABOUT_X_DAYS_AGO'), Math.round(days).toString());
    } else {
        return String.formatDate(date, 'long');
    }
};

liferay.tools.makeBlob = function(picSpec, callback) {
    var finalBlob;

    if (picSpec.media) {
        finalBlob = picSpec.media;
        if (picSpec.cropRect) {
            try {
                finalBlob = finalBlob.imageAsCropped(picSpec.cropRect);
            } catch (ex) {
                console.log("exception during crop: " + JSON.stringify(ex));
            }
        }
        var picWidth = 0, picHeight = 0;

        if (finalBlob.width > 0 && finalBlob.height > 0) {
            picWidth = finalBlob.width;
            picHeight = finalBlob.height;
        } else if (picSpec.media.width > 0 && picSpec.media.height > 0) {
            picWidth = pic.media.width;
            picHeight = pic.media.height;
        }

        callback(finalBlob, picWidth, picHeight);

    } else if (picSpec.apiName && picSpec.apiName == 'Ti.Blob') {
        callback(picSpec, picSpec.width, picSpec.height);
    } else if (picSpec.url || picSpec.id) {
        // from multiselector
        MediaPicker.getImageByURL({
            key: picSpec.url,
            id: picSpec.id,
            success:  function (e) {
                if (e.image && e.image.apiName == 'Ti.Blob') {
                    // e.image is a blob
                    callback(e.image, e.width, e.height);
                } else {
                    var file = Ti.Filesystem.getFile('file://' + e.image);
                    try {
                        callback(file.read(), e.width, e.height);
                    } catch (ex) {
                        callback(null, 0, 0);
                    }
                }
            }
        });
    }
};

liferay.tools.downsizePic = function(pic, maxSideSize, callback) {

    liferay.tools.makeBlob(pic, function(blob, width, height) {

        var resizedPic = blob;
        if (width <= 0 || height <= 0) {
            try {
                var tmpcompress = ImageFactory.compress(resizedPic, 1.0);
                if (tmpcompress && tmpcompress.width > 0 && tmpcompress.height > 0) {
                    picWidth = tmpcompress.width;
                    picHeight = tmpcompress.height;
                }
                tmpcompress = null;
            } catch (ex) {
            }
        }


        if (width > 0 && height > 0) {
            var longestSide = Math.max(width, height);
            if (longestSide > maxSideSize) {
                var scale = maxSideSize / longestSide;
                resizedPic = ImageFactory.imageAsResized(resizedPic, {
                    width: Math.floor(width * scale),
                    height: Math.floor(height * scale),
                    format: ImageFactory.JPEG,
                    quality: 0.7
                });
            }
        }
        callback(resizedPic);
    });
};

liferay.tools.clipImage = function(localpath, bounds) {

    try {
        var file = Titanium.Filesystem.getFile(localpath);
        if (!file) {
            return null;
        }

        var croppedImg = file.read().imageAsCropped(bounds);

        file.write(croppedImg);

        return localpath;
    } catch (ex) {
        return null;
    }

};

liferay.tools.selectPhotos = function(onSuccess) {
    MediaPicker.show(onSuccess, 20, 'photos', L('CHOOSE_MULTI_PHOTOS'));
};