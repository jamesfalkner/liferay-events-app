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

liferay.tools.toastNotification = function (control, msg) {
    if (control) {
        var origTouchEnabledValue = ( typeof control.touchEnabled === 'undefined' ) ? true : control.touchEnabled;
        control.touchEnabled = false;
    }
    var win = liferay.controller.getCurrentWindow();
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
        opacity: 0,
        zIndex: 2
    });

    bg.add(msgView);
    win.add(bg);

    bg.animate({
        opacity: 0.8,
        duration: 200
    });

    // longer messages should take more time to disappear
    var displayTime = 1000 + ((msg.length / 25) * 1000);


    setTimeout(function() {
        bg.animate({
            opacity: 0,
            duration: 4000
        }, function () {
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
        liferay.tools.spinner = Titanium.UI.createActivityIndicator({
            width: 'auto',
            height: 'auto',
            bottom: 5,
            color: "#ffffff",
            zIndex: 101
        });
    }

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
