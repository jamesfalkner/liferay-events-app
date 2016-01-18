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

liferay.scan = {
    torchOn: false
};


liferay.scan.doScan = function (options) {

    try {
        if (liferay.model.android) {
            liferay.scan.doScanAndroid(options);
        } else if (liferay.model.iOS) {
            liferay.scan.doScanIOS(options);
        } else {
            if (options.onFailure) {
                options.onFailure( Ti.Platform.name + " unsupported");
            }
        }
    } catch (ex) {
        if (options.onFailure) {
            options.onFailure(ex.message);
        }
    }
};

liferay.scan.doScanAndroid = function(options) {
    var tiqr = require('de.evopark.tiqr');

    tiqr.onCodeReceived = function(code) {

        if (!liferay.scan.parseCodeType(code)) {
            invalidMsg.text = String.format(L('SCAN_INVALID_TYPE'), L('FMT_UNKNOWN'));
            invalidMsg.animate({
                opacity: 0.8,
                duration: 300
            }, function() {
                setTimeout(function() {
                    invalidMsg.animate({
                        opacity: 0,
                        duration: 300
                    });
                }, 5000);
            });
            return;
        }
        win.close({animated: true});
        options.onSuccess && options.onSuccess(code);
    };

    var scannerView = tiqr.createCameraView();

    var win = Ti.UI.createWindow({
        backgroundColor: 'black',
        fullscreen: true,
        navBarHidden: true,
        tabBarHidden: true
    });

    var targetBox = Ti.UI.createView({
        backgroundColor: 'transparent',
        width: '350dp',
        height: '350dp',
        borderSize: '3dp',
        borderColor: 'red',
        top: '45%'
    });

    var labelShader = Ti.UI.createView({
        top: 0,
        left: 0,
        width: Ti.UI.FILL,
        height: '42%',
        backgroundColor: 'black',
        opacity: 0.6
    });

    var labelMsg = Ti.UI.createLabel({
        height: '20%',
        width: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
        font: liferay.fonts.h4b,
        color: 'white',
        top: 0,
        text: options.message
    });

    var invalidMsg = Ti.UI.createLabel({
        height: Ti.UI.SIZE,
        width: '80%',
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h4b,
        backgroundColor: 'black',
        color: 'red',
        text: '',
        opacity: 0
    });

    var logoContainer = Ti.UI.createView({
        width: Ti.UI.FILL,
        top: '20%',
        height: '22%'
    });

    var logo = Ti.UI.createImageView({
        height: 'auto',
        width: 'auto'
    });

    if (options.logo) {
        liferay.screens.front.loadImage({
            imageView: logo,
            setImage: true,
            url: options.logo
        });
    }
    logoContainer.add(logo);

    var flashBtn = Ti.UI.createImageView({
        image: '/images/MobApp-MainMenu-Icon-News-@2x.png',
        width: '30dp',
        height: '30dp',
        right: '20dp',
        bottom: '20dp',
        touchEnabled: 'true'
    });

    if (tiqr.setTorchMode) tiqr.setTorchMode(false);

    liferay.scan.torchOn = false;

    flashBtn.addEventListener('click', function(e) {
        if (tiqr.setTorchMode) {
            tiqr.setTorchMode(!liferay.scan.torchOn);
            liferay.scan.torchOn = !liferay.scan.torchOn;
        }
    });
    win.add(scannerView);
    win.add(targetBox);
    targetBox.add(invalidMsg);
    win.add(labelShader);
    win.add(labelMsg);
    win.add(logoContainer);

    //if (tiqr.isTorchModeSupported && tiqr.isTorchModeSupported()) {
    //    win.add(flashBtn);
    //}
    //
    win.addEventListener('close', function(e) {
        tiqr.setScanning(false);
    });
    win.open({animated: true});

    tiqr.setScanning(true);

};

liferay.scan.doScanIOS = function (options) {
    var SquareCamera = require('com.mfogg.squarecamera');

// open a single window
    var win = Ti.UI.createWindow({
        backgroundColor: 'black',
        fullscreen: true,
        navBarHidden: true,
        tabBarHidden: true,
        orientationModes: [Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT]
    });

    var cameraView = SquareCamera.createView({
        height: Ti.UI.FILL,
        width: Ti.UI.FILL,
        detectCodes: true,
        backgroundColor: 'transparent',
        frontQuality: SquareCamera.QUALITY_HIGH,
        backQuality: SquareCamera.QUALITY_HD,
        camera: "back"
    });

    var width = liferay.tools.getPx(.7 * Ti.Platform.displayCaps.platformWidth);

    var targetBox = Ti.UI.createView({
        backgroundColor: 'transparent',
        width: width,
        height: width,
        borderSize: '3dp',
        borderColor: 'red',
        top: '30%'
    });

    var labelShader = Ti.UI.createView({
        top: 0,
        left: 0,
        width: Ti.UI.FILL,
        height: liferay.fonts.H4Size * 2.3,
        backgroundColor: 'black',
        opacity: 0.6
    });

    var labelMsg = Ti.UI.createLabel({
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h4b,
        color: 'white',
        top: '5dp',
        text: options.message
    });

    var invalidMsg = Ti.UI.createLabel({
        height: Ti.UI.SIZE,
        width: '280dp',
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h4b,
        backgroundColor: 'black',
        color: 'red',
        text: '',
        opacity: 0
    });

    var logoContainer = Ti.UI.createView({
        width: Ti.UI.FILL,
        top: liferay.fonts.H4Size * 2.2,
        bottom: '70%'
    });

    var logo = Ti.UI.createImageView({
        height: 'auto',
        width: 'auto'
    });

    if (options.logo) {
        liferay.screens.front.loadImage({
            imageView: logo,
            setImage: true,
            url: options.logo
        });
    }

    logoContainer.add(logo);

    var cancelBtn = Ti.UI.createButton({
        title: L('CANCEL'),
        font: liferay.fonts.h4b,
        left: '10dp',
        bottom: '10dp'
    });

    cancelBtn.addEventListener('click', function(e) {
        win.close({animated: true});
        options.onCancel && options.onCancel();
    });

    var flashBtn = Ti.UI.createImageView({
        image: '/images/MobApp-MainMenu-Icon-News-@2x.png',
        width: '30dp',
        height: '30dp',
        right: '20dp',
        bottom: '20dp',
        touchEnabled: 'true'
    });

    cameraView.turnFlashOff();
    liferay.scan.torchOn = false;
    flashBtn.addEventListener('click', function(e) {
        if (liferay.scan.torchOn) {
            cameraView.turnFlashOff();
            liferay.scan.torchOn = false;
        } else {
            cameraView.turnFlashOn();
            liferay.scan.torchOn = true;
        }
    });


    cameraView.addEventListener("code", function (e) {
        if (e.codeType && (e.codeType.toLowerCase().indexOf('qrcode') == -1)) {
            invalidMsg.text = String.format(L('SCAN_INVALID_TYPE'), e.codeType);
            invalidMsg.animate({
                opacity: 0.8,
                duration: 300
            });
            return;
        }
        win.close({animated: true});
        options.onSuccess && options.onSuccess(e.value);
    });

    win.add(cameraView);
    cameraView.add(invalidMsg);
    win.add(targetBox);
    win.add(labelShader);
    win.add(labelMsg);
    win.add(logoContainer);
    win.add(cancelBtn);
    win.add(flashBtn);
    win.open({animated: true});

};

liferay.scan.parseCodeType = function(data) {

    if (/^MECARD:/.test(data.trim())) {
        return "mecard";
    } else if (/^BEGIN:VCARD/.test(data.trim())) {
        return "vcard";
    } else {
        return null;
    }

};

liferay.scan.parseBarcode = function(data, onSuccess, onFailure) {

    if (/^MECARD:/.test(data.trim())) {
        liferay.scan.parseMECARD(data, onSuccess, onFailure);
    } else if (/^BEGIN:VCARD/.test(data.trim())) {
        liferay.scan.parseVCARD(data.trim(), onSuccess, onFailure);
    } else {
        onFailure && onFailure(L('SCAN_NOT_CONTACT'));
    }
};

liferay.scan.parseMECARD = function(data, onSuccess, onFailure) {
    var contact = {};

    var name = [].concat(data.match(/(N:)([^;]+)(;)/))[2];
    if (name) {
        var parts = name.split(',');
        if (parts.length > 1) {
            contact.firstname = parts[1];
            contact.lastname = parts[0];
        } else {
            contact.firstname = parts[0];
        }
    }

    contact.companyname = [].concat(data.match(/(ORG:)([^;]+)(;)/))[2] || '';
    contact.title = [].concat(data.match(/(TITLE:)([^;]+)(;)/))[2] || '';
    contact.phone = [].concat(data.match(/(TEL:)([^;]+)(;)/))[2] || '';
    contact.email = [].concat(data.match(/(EMAIL:)([^;]+)(;)/))[2] || '';
    contact.notes = [].concat(data.match(/(NOTE:)([^;]+)(;)/))[2] || '';
    contact.url = [].concat(data.match(/(URL:)([^;]+)(;)/))[2] || '';
    contact.readonly = false;
    var address = [].concat(data.match(/(ADR:)([^;]+)(;)/))[2];
    if (address) {
        var parts = address.split(',');
        contact.street = parts[0];
        contact.city = parts[1];
        contact.state = parts[2];
        contact.zip = parts[3];
        contact.country = parts[4];
    }

    if (contact.email) {
        var hash = Ti.Utils.md5HexDigest(contact.email);
        var picUrl = 'http://gravatar.com/avatar/' + hash;

        contact.picture = picUrl;
    }

//    this.saveNewContact(contact);
    onSuccess && onSuccess(contact);
};

liferay.scan.parseVCARD = function(data, onSuccess, onFailure) {


    VCF.parse(data, function(vc) {

        var contact = {};

        var name = vc.n;

        if (vc.n) {
            contact.firstname = (vc.n['given-name'] && vc.n['given-name'][0]) ? vc.n['given-name'][0] : '';
            contact.lastname = (vc.n['family-name'] && vc.n['family-name'][0]) ? vc.n['family-name'][0] : '';
        }
        else if (vc.fn) {
            var parts = vc.fn.split(' ');
            if (parts.length > 1) {
                contact.firstname = parts[0].trim();
                contact.lastname = parts[1].trim();
            } else {
                contact.firstname = parts[0].trim();
            }
        }

        contact.companyname = (vc.org && vc.org[0] && vc.org[0]['organization-name']) ? vc.org[0]['organization-name'] : '';
        contact.title = (vc.title && vc.title[0]) ? vc.title[0] : '';
        contact.phone = (vc.tel && vc.tel[0]) ? vc.tel[0].value : '';
        contact.email = (vc.email && vc.email[0]) ? vc.email[0].value : '';
        contact.notes = (vc.note && vc.note[0]) ? vc.note[0] : '';
        contact.url = (vc.url && vc.url[0]) ? vc.url[0] : '';
        contact.readonly = false;

        var address = (vc.adr && vc.adr.value) ? vc.adr.value : '';

        if (address) {
            var parts = address.split(',');
            contact.street = parts[0];
            contact.city = parts[1];
            contact.state = parts[2];
            contact.zip = parts[3];
            contact.country = parts[4];
        }

        if (contact.email) {
            var hash = Ti.Utils.md5HexDigest(contact.email);
            var picUrl = 'http://gravatar.com/avatar/' + hash;

            contact.picture = picUrl;
        }

//    this.saveNewContact(contact);
        onSuccess && onSuccess(contact);

    })


};
