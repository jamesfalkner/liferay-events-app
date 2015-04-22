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

liferay.screens.front = new liferay.classes.window();
liferay.screens.front.className = 'liferay.screens.front';
liferay.screens.front.cantunmute = false;
liferay.screens.front.beaconLightsEnabled = false;

liferay.screens.front.tf = Ti.UI.createLabel({
    font: {
        fontSize: "25dp",
        fontWeight: 'bold'
    },
    color: 'red',
    top: 0,
    left: 0,
    text: 'MONITOR'
});

var Barcode = require("ti.barcode");

Barcode.allowInstructions = false;
Barcode.allowMenu = false;
Barcode.allowRotation = false;

liferay.screens.front.render = function() {

	var self = this;

    this.newsTimer = null;

    var evtSelBtn = Titanium.UI.createView(liferay.settings.screens.front.buttons.eventSelect);

    evtSelBtn.width = liferay.tools.getDp(liferay.settings.screens.front.buttons.eventSelect.psize * Titanium.Platform.displayCaps.platformWidth);
    evtSelBtn.height = evtSelBtn.width;

    evtSelBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: evtSelBtn,
            onRestore: function() {
                liferay.screens.front.cancelNewsTimer();
                liferay.screens.front.stopBounce();
                liferay.controller.clearWindows();
                liferay.controller.open(liferay.screens.eventSelect.render(), liferay.screens.eventSelect);
            }
        })
    });

    this.newsBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.news);

    this.newsBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.news.psize * Titanium.Platform.displayCaps.platformWidth);
    this.newsBtn.height = this.newsBtn.width;

    this.newsBtn.addEventListener('click', function(e) {
        if (liferay.screens.front.bounceTimer) {
            liferay.screens.front.stopBounce();
            liferay.controller.showAllNews(liferay.controller.selectedEvent);
        } else {
            liferay.tools.flashButton({
                control: e.source,
                onRestore: function() {
                    liferay.controller.showAllNews(liferay.controller.selectedEvent);
                    liferay.screens.front.stopBounce();
                }
            });
        }
    });

    // beacons muter
    this.beaconButton = Titanium.UI.createView(liferay.settings.screens.all.buttons.beacon);
    this.beaconButton.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.beacon.psize * Titanium.Platform.displayCaps.platformWidth);
    this.beaconButton.height = this.beaconButton.width;
    this.beaconButton.visible = true;

    this.beaconButtonOff = Titanium.UI.createView(liferay.settings.screens.all.buttons.beaconOff);
    this.beaconButtonOff.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.beaconOff.psize * Titanium.Platform.displayCaps.platformWidth);
    this.beaconButtonOff.height = this.beaconButtonOff.width;
    this.beaconButtonOff.visible = false;

    if (liferay.beacons.hasBeaconSupport()) {
        this.beaconButton.addEventListener('click', function (e) {
            liferay.tools.flashButton({
                control: e.source,
                onRestore: function() {
                    liferay.screens.front.showMuteOptions();
                }
            });
        });
        this.beaconButtonOff.addEventListener('click', function (e) {
            liferay.tools.flashButton({
                control: e.source,
                onRestore: function() {
                    liferay.screens.front.showMuteOptions();
                }
            });
        });

        this.beaconButtonRegionActivityLight = Titanium.UI.createView({
            bottom: '5dp',
            left: '5dp',
            width: '8dp',
            height: '8dp',
            backgroundColor: 'transparent'
        });

        this.beaconButtonBeaconActivityLight = Titanium.UI.createView({
            bottom: '5dp',
            right: '5dp',
            width: '8dp',
            height: '8dp',
            backgroundColor: 'transparent'
        });

        this.beaconButton.add(this.beaconButtonRegionActivityLight);
        this.beaconButton.add(this.beaconButtonBeaconActivityLight);

        var liveRegions = liferay.beacons.getUnmutedRegions();
        this.beaconButtonOff.visible = (!liveRegions || liveRegions.length <= 0);
        this.beaconButton.visible = !this.beaconButtonOff.visible;


    } else {
        this.beaconButton.visible = false;
        this.beaconButtonOff.visible = true;
        this.beaconButtonOff.addEventListener('click', function (e) {
            var alertDialog = Titanium.UI.createAlertDialog({
                title : L('ALERT'),
                message : L('BEACON_UNSUPPORTED'),
                buttonNames : [L('BEACON_SUPPORTED_DEVICES'), L('CLOSE')]
            });
            alertDialog.addEventListener('click', function(e) {
                if (e.index == 0) {
                    Ti.Platform.openURL('http://en.m.wikipedia.org/wiki/IBeacon#Compatible_devices');
                }
            });
            alertDialog.show();
        });
    }

    if (liferay.beacons.beaconsDisabled || liferay.controller.selectedEvent.metadata_types.indexOf('beacon') < 0) {
        this.beaconButton.visible = this.beaconButtonOff.visible = false;
    }

    this.surveyBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.survey);

    this.surveyBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.survey.psize * Titanium.Platform.displayCaps.platformWidth);
    this.surveyBtn.height = this.surveyBtn.width;

    this.surveyBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function() {
                liferay.screens.front.showSurvey(liferay.settings.server.eventSurveyId);
            }
        });
    });

    this.surveyBtn.visible = liferay.controller.selectedEvent.survey_questions ? true : false;

    // tag button

    this.tagBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.tag);
    this.tagBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.tag.psize * Titanium.Platform.displayCaps.platformWidth);
    this.tagBtn.height = this.tagBtn.width;

    this.tagBtn.addEventListener('click', function(e) {

        var sponsor = null;
        liferay.data.currentEventData.sponsors.forEach(function(sponsorIt) {
            if (sponsorIt.type && sponsorIt.type == 'scan') {
                sponsor = sponsorIt;
            }
        });


        var overlay = sponsor ? liferay.screens.contacts.getOverlay(sponsor) : null;

        Barcode.displayedMessage = (sponsor ? null : L('SCAN_TITLE')) + "\n\n";

        liferay.screens.contacts.BarcodeSuccessListeners.forEach(function(el) {
            Barcode.removeEventListener('success', el);
        });
        liferay.screens.contacts.BarcodeErrorListeners.forEach(function(el) {
            Barcode.removeEventListener('error', el);
        });
        liferay.screens.contacts.BarcodeSuccessListeners = [];
        liferay.screens.contacts.BarcodeErrorListeners = [];

        Barcode.addEventListener('success', liferay.screens.contacts.onTagSuccess);
        Barcode.addEventListener('error', liferay.screens.contacts.onTagError);
        liferay.screens.contacts.render();
        liferay.screens.contacts.BarcodeSuccessListeners.push(liferay.screens.contacts.onTagSuccess);
        liferay.screens.contacts.BarcodeErrorListeners.push(liferay.screens.contacts.onTagError);
        liferay.tools.flashButton({
            control : e.source,
            onRestore : function() {
                var dic = {
                    animate: true,
                    showCancel: true,
                    showRectangle: true,
                    keepOpen: false,
                    acceptedFormats: [
                        Barcode.FORMAT_QR_CODE
                    ]

                };
                if (overlay != null) {
                    dic.overlay = overlay;
                }
                Barcode.capture(dic);
            }
        });
    });


    // tweet button
    this.tweetBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.tweet);

    this.tweetBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.tweet.psize * Titanium.Platform.displayCaps.platformWidth);
    this.tweetBtn.height = this.tweetBtn.width;

    this.tweetBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function() {
                var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');
                liferay.screens.front.tweet(liferay.controller.selectedEvent.menutitle + ' - ' +
                liferay.controller.selectedEvent.location_label + ' ' + tweetHash, null);
            }
        });
    });

    // fb button
    this.fbBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.fb);

    this.fbBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.fb.psize * Titanium.Platform.displayCaps.platformWidth);
    this.fbBtn.height = this.tweetBtn.width;

    this.fbBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function() {
                liferay.screens.front.fbCheckin();
            }
        });
    });

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.window = liferay.ui.makeWindow({
        swipe: false,
        panelBg: this.panelBg,
        backEnabled: false,
        headerButtons: [evtSelBtn],
        footerButtons: [this.newsBtn, this.beaconButton,
            this.beaconButtonOff, this.surveyBtn, this.tagBtn,
            this.tweetBtn, this.fbBtn]
    });

	var rows = Math.ceil(liferay.settings.screens.front.buttonOrder.length / liferay.settings.screens.front.buttonsPerRow);
	var cols = liferay.settings.screens.front.buttonsPerRow;
	var imgWidth = liferay.tools.getDp(liferay.settings.screens.front.psize * Titanium.Platform.displayCaps.platformWidth);
	var imgHeight = imgWidth;

	for (var i = 0; i < liferay.settings.screens.front.buttonOrder.length; i++) {
		var buttonName = liferay.settings.screens.front.buttonOrder[i];
		var buttonData = liferay.settings.screens.front.buttons[buttonName];
		if (!buttonData) {
			continue;
		}

		var width = 100 / cols;
		var height = 100 / rows;
		var left = width * (i % cols);
		var top = height * Math.floor(i / liferay.settings.screens.front.buttonsPerRow);
		var buttonContainer = Ti.UI.createView({
			left: left + '%',
			top: top + '%',
			width: width + '%',
			height: height + '%',
			backgroundColor: 'white',
			layout: 'vertical',
			borderWidth:.5,
			borderColor: '#EEEEEE',
			screenName: buttonName
		});


		var img = Ti.UI.createView({
			backgroundImage: buttonData.image,
			backgroundSelectedImage: buttonData.imageSel,
			touchEnabled: false,
			width: imgWidth,
			height: imgHeight,
			top: "25%"
		});

		buttonContainer.imgView = img;
		buttonContainer.add(img);

		var lbl = Ti.UI.createLabel({
			textid        : buttonData.textid,
			top: "10%",
			font        : liferay.fonts.h4,
			touchEnabled: false,
			color       : '#89A9C9'
		});

		buttonContainer.add(lbl);

		buttonContainer.addEventListener('click', function(e) {
			var tmpImg = e.source.imgView.backgroundImage;
			e.source.imgView.backgroundImage = e.source.imgView.backgroundSelectedImage;
			setTimeout(function() {
				e.source.imgView.backgroundImage = tmpImg;
			}, 150);
            var view = liferay.screens[e.source.screenName];
            if (view) {
                liferay.controller.open(view.render(), view);
            }
		});
		this.panelBg.add(buttonContainer);
	}

	this.newsTimer = "PLACEHOLDER";
	this.updateNewsTimer();
	return this.window;

};

liferay.screens.front.showMuteOptions = function() {

    if (liferay.screens.front.cantunmute) {
        alert(L('MUTE_ALL_WARNING'));
        return;
    }

    var allRegions = liferay.beacons.getAllRegions();

    if (!allRegions || allRegions.length <= 0) {
        liferay.tools.alert(L('ALERT'), (L('FAILED_UPDATE_NETWORK')));
        return;
    }

    var cancelIdx = -1;
    var buttonNames = null;

    var options = [];
    allRegions.forEach(function(el) {
        var isMuted = liferay.beacons.isRegionMuted(el);
        options.push(isMuted ? String.format(L('UNMUTE_AREA'), el.name) : String.format(L('MUTE_AREA'), el.name));
    });
    if (liferay.model.iOS) {
        options.push(L('CANCEL'));
        cancelIdx = options.length - 1;
    } else {
        buttonNames = [L('CANCEL')];
        cancelIdx = 0;
    }

    var optionDialog;

    if (liferay.model.iOS) {
        optionDialog = Titanium.UI.createOptionDialog({
            title : L('NOTIFICATION_AREAS'),
            options: options,
            selectedIndex: -1,
            persistent: true
        });
    } else {
        optionDialog = Titanium.UI.createOptionDialog({
            title : L('NOTIFICATION_AREAS'),
            options: options,
            buttonNames: buttonNames,
            selectedIndex: -1,
//            cancel: cancelIdx,
            cancel: 2112,
            persistent: true
        });
    }

    optionDialog.addEventListener('click', function(e) {
        if (liferay.model.android && e.button) return;
        if (liferay.model.android && e.index == 2112) return;

        if (liferay.model.iOS && (e.cancel == cancelIdx || e.index < 0)) return;

        if (e.index < allRegions.length) {

            if (liferay.beacons.isRegionMuted(allRegions[e.index])) {
                liferay.beacons.unmuteRegion(allRegions[e.index]);
                liferay.screens.front.beaconButtonOff.visible = false;
                liferay.screens.front.beaconButton.visible = true;

            } else {
                liferay.beacons.muteRegion(allRegions[e.index]);
                var unmutes = liferay.beacons.getUnmutedRegions();
                var allMuted = (!unmutes || unmutes.length <= 0);
                if (allMuted) {
                    liferay.screens.front.beaconButtonOff.visible = true;
                    liferay.screens.front.beaconButton.visible = false;
                    liferay.beacons.stopRegionMonitoring();
                    liferay.beacons.clearAllQueuedTriggers();
                    alert(L('MUTE_ALL_WARNING'));
                    liferay.screens.front.cantunmute = true;
                }
            }
        }
    });

    optionDialog.show();

};

liferay.screens.front.startBounce = function() {

	if (!liferay.screens.front.bounceTimer) {
		return;
	}
	var btn = this.newsBtn;
	btn.setBackgroundImage(liferay.settings.screens.all.buttons.news.backgroundImageAlt);

	if (liferay.controller.getCurrentWindow() == liferay.screens.front.window) {
		btn.animate({
			top: 0,
			curve: Titanium.UI.ANIMATION_EASE_IN_OUT,
			duration: 150,
			autoreverse: true
		}, function() {
			btn.animate({
                top: "20%",
				curve: Titanium.UI.ANIMATION_EASE_IN_OUT,
				duration: 90,
				autoreverse: true
			}, function() {
				if (liferay.screens.front.bounceTimer) {
					liferay.screens.front.bounceTimer = setTimeout(function() {
						liferay.screens.front.startBounce();
					}, 2000);
				}
			});
		});
	} else {
		if (liferay.screens.front.bounceTimer) {
			liferay.screens.front.bounceTimer = setTimeout(function() {
				liferay.screens.front.startBounce();
			}, 2000);
		}
	}
};

liferay.screens.front.loadAction = function(actionSpec, event_uuid, cb) {
    var action = actionSpec[0].toUpperCase();
    if (action == "SURVEY" && liferay.controller.selectedEvent.survey_questions) {
        liferay.screens.front.showSurvey(liferay.settings.server.eventSurveyId, cb);
    } else if (action == "TWEET") {
        cb();
        var tweetMsg;
        if (actionSpec[1]) {
            tweetMsg = actionSpec[1];
        } else {
            var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');
            tweetMsg = liferay.controller.selectedEvent.menutitle + ' - ' +
                liferay.controller.selectedEvent.location_label + ' ' + tweetHash;
        }
        liferay.screens.front.tweet(tweetMsg, null);
    } else if (action == "FB") {
        cb();
        liferay.screens.front.fbCheckin();
    } else if (action == "NEWS") {
        cb();
        liferay.controller.showAllNews(liferay.controller.selectedEvent);
        liferay.screens.front.stopBounce();
    }
};

liferay.screens.front.stopBounce = function() {
	liferay.screens.front.bounceTimer = null;
	liferay.screens.front.newsBtn.setBackgroundImage(liferay.settings.screens.all.buttons.news.backgroundImage);
};


liferay.screens.front.cancelNewsTimer = function() {
	if (liferay.screens.front.newsTimer) {
		clearTimeout(liferay.screens.front.newsTimer);
		liferay.screens.front.newsTimer = null;
	}
};

liferay.screens.front.updateNewsTimer = function() {

	if (!liferay.screens.front.newsTimer) {
		return;
	}
	if (liferay.controller.newNews && !liferay.screens.front.bounceTimer) {
		liferay.screens.front.bounceTimer = "FOO";
		liferay.screens.front.startBounce();
	}
	liferay.controller.newNews = false;
	liferay.screens.front.newsTimer = setTimeout(function() {
		liferay.screens.front.updateNewsTimer();
	}, 5000);
};


liferay.screens.front.showSurvey = function(surveyId, cb) {

    var readOnly = liferay.forms.hasSubmittedSurvey(liferay.controller.selectedEvent, liferay.settings.server.eventSurveyId);

    var currentName = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [surveyId, liferay.screens.sponsors.sponsorFormType], "NAME");
    var currentEmail = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [surveyId, liferay.screens.sponsors.sponsorFormType], "EMAIL");
    var currentCompany = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [surveyId, liferay.screens.sponsors.sponsorFormType], "COMPANY");
    var headers = [
        liferay.forms.makeHeaderField("NAME", [surveyId, liferay.screens.sponsors.sponsorFormType], L('FMT_NAME').toUpperCase(), currentName, '25dp'),
        liferay.forms.makeHeaderField("EMAIL", [surveyId, liferay.screens.sponsors.sponsorFormType], L('FMT_EMAIL').toUpperCase(), currentEmail, '15dp'),
        liferay.forms.makeHeaderField("COMPANY", [surveyId, liferay.screens.sponsors.sponsorFormType], L('FMT_COMPANY').toUpperCase(), currentCompany, '15dp')
    ];
    liferay.forms.showForm({
        title: L('EVENT_SURVEY').toUpperCase(),
        subTitle: liferay.controller.selectedEvent.menutitle,
        subSubTitle: liferay.controller.selectedEvent.location_label.toUpperCase(),
        intro: L('EVENT_SURVEY_INSTRUCTIONS'),
        headerFields: headers,
        questionSpec: liferay.controller.selectedEvent.survey_questions,
        event: liferay.controller.selectedEvent,
        surveyId: surveyId,
        controlWindow: liferay.screens.front.window,
        readOnly: readOnly,
        sendButtonText: L('SURVEY_SEND'),
        dismissText: L('SURVEY_SAVE_FOR_LATER'),
        submitDialogTitle : L('SURVEY_SUBMIT_TITLE'),
        submitDialogText : L('SURVEY_SUBMIT_PROMPT'),
        submitSuccessMessage: L('EVENT_SURVEY_THANKS'),
        onSuccess: function(result) {
            liferay.tools.toastNotification(null, L('EVENT_SURVEY_THANKS'));
            cb && cb();
        },
        onFail: function(err) {
            liferay.tools.alert(L('ALERT'), String.format(L('EVENT_SURVEY_ERROR'), err));
            cb && cb();
        },
        onClose: function() {
            cb && cb();
        }
    });
};

var social = require('includes/social');

liferay.screens.front.tweet = function(text, pic) {

    if (!pic) {
        // try the built-in apps first

        if (liferay.model.android) {

            var url = "twitter://post?message=" + encodeURIComponent(text);
            if (!Ti.Platform.openURL(url)) {
                var intent = Ti.Android.createIntent({
                    action: Ti.Android.ACTION_SEND,
                    type: "text/plain"
                });
                intent.putExtra(Ti.Android.EXTRA_TEXT, text);

                var share = Ti.Android.createIntentChooser(intent, 'Share');
                Ti.Android.currentActivity.startActivity(share);
                return;
            } else {
                // android url open success
                return;
            }
        } else {
            var urls = [
                    "twitter://post?message=" + encodeURIComponent(text),
                    "echofon:///post?" + encodeURIComponent(text),
                    "twitterrific:///post?message=" + encodeURIComponent(text),
                    "tweetbot:///post?text=" + encodeURIComponent(text)
            ];

            for (var i =0 ; i < urls.length; i++) {
                if (Ti.Platform.canOpenURL(urls[i])) {
                    Ti.Platform.openURL(urls[i]);
                    return;
                }
            }
        }
    }

    if (pic && liferay.model.android) {
        // try an intent with binary attachment to fire off local app if possible
        // write blob to temp file
        var fnBase = new Date().getTime();
        var tmpFile = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, fnBase);
        tmpFile.write(pic);
        var intent = Ti.Android.createIntent({
            action: Ti.Android.ACTION_SEND,
            type: pic.mimeType
        });
        intent.putExtra(Ti.Android.EXTRA_TEXT, text);
        intent.putExtraUri(Ti.Android.EXTRA_STREAM, tmpFile.nativePath);

        var share = Ti.Android.createIntentChooser(intent, 'Share');
        try {
            Ti.Android.currentActivity.startActivity(share);
            return;
        } catch (ex) {

        }

    }
	// create a new OAuthAdapter instance by passing by your consumer data and signature method
	var tw = social.create({
		site: 'twitter',
		consumerKey: Ti.App.Properties.getString('liferay.twitter.consumerKey', ''),
		consumerSecret: Ti.App.Properties.getString('liferay.twitter.consumerSecret', '')
	});

	tw.authorize(function() {
		liferay.screens.front.tweetWindow(text, pic, function(toTweet) {
			liferay.tools.createFloatingMessage({
				text: L('MSG_SENDING_PROGRESS'),
				container: liferay.controller.getCurrentWindow(),
				progress: pic ? true : false
			});
			if (!pic) {
				tw.share({
					message: toTweet,
					timeout: liferay.settings.server.requestTimeout,
					success: function(msg) {
						liferay.tools.hideFloatingMessage();
                        liferay.tools.toastNotification(null, L('SCAN_EMAIL_SENT'));
					},
					error: function(msg) {
						liferay.tools.hideFloatingMessage();
						liferay.tools.alert(L('ALERT'), msg);
					}
				});
			} else {
				tw.shareImage({
					message: toTweet,
					image: pic,
					timeout: liferay.settings.server.requestTimeout,
					success: function(msg) {
						liferay.tools.hideFloatingMessage();
                        liferay.tools.toastNotification(null, L('SCAN_EMAIL_SENT'));
					},
					error: function(msg) {
						liferay.tools.hideFloatingMessage();
						liferay.tools.alert(L('ALERT'), msg);
					},
					updateProgress: function(prog) {
						if (prog && prog.progress) {
							liferay.tools.updateFloatingProgress(prog.progress);
						}
					}
				});
			}
		});
	});

};

liferay.screens.front.tweetWindow = function(text, picBlob, callback) {

	// VALIDATE INPUT
	// just in case someone only wants to send a callback
	if (typeof(text)=='function' && typeof(callback)=='undefined') {
		callback = text;
		text = '';
	}
	if (typeof(text)=='undefined') {
		text = '';
	}

	var chars = (typeof(text)!='undefined' && text!=null)?text.length:0;

	var winBG = Titanium.UI.createWindow({
		backgroundColor:'#000',
		opacity:0.60
	});

	// the UI window looks completely different on iPhone vs. Android
	// iPhone UI
	var winTW = Titanium.UI.createWindow({
		height:'49%', // half because the keyboard takes up half
		width:'95%',
		top:'2.5%',
		left:'2.5%',
		borderColor:'#224466',
		borderWidth:3,
		backgroundColor:'#559abb',
		borderRadius:10
	});

	var twContainer = Ti.UI.createView({
		left: '5%',
		top: '5%',
		width: '90%',
		height: '95%',
		layout: 'vertical'
	})

	var tweetPicContainer = Ti.UI.createView({
		height: '75%',
		width: Ti.UI.FILL
	});

	var tweet = Ti.UI.createTextArea({
		value:text,
		height:Ti.UI.FILL,
		width: Ti.UI.FILL,
		font:liferay.fonts.h2,
		color: 'black',
		backgroundImage: liferay.settings.screens.agendaDetail.layout.notesTextArea.backgroundImage,
		backgroundColor: 'transparent'
	});

	tweetPicContainer.add(tweet);

	if (picBlob) {
		var img = Ti.UI.createImageView({
			bottom: '10dp',
			right: '10dp',
			width: '20%',
			height: 'auto',
			image: picBlob,
			opacity: 0.7,
			zIndex: 20
		});
		tweetPicContainer.add(img);
	}

	var btnContainer = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: '15%',
		top: '2%'
	});

	var btnScruncher = Ti.UI.createView({
		layout: 'horizontal',
		horizontalWrap: false,
		width: Ti.UI.SIZE
	});

	var btnCancel = Ti.UI.createButton({
		title:L('CANCEL'),
		font: {
			fontSize: liferay.fonts.H2Size
		},
		color: 'black'
	});
	var btnShorten = Ti.UI.createButton({
		title:L('SHORTEN'),
		left: '15px',
		font: {
			fontSize: liferay.fonts.H2Size
		},
		color: 'black'
	});
	var btnTW = Ti.UI.createButton({
		title:L('TWEET'),
		left: '15px',
		font: {
			fontSize: liferay.fonts.H2Size
		},
		color: 'black'
	});

	var charcount = Ti.UI.createLabel({
		color:'black',
		text:(parseInt((140-chars))+''),
		font: liferay.fonts.h2,
		bottom: '2%'
	});
	if (picBlob) {
		charcount.left = '2%';
	} else {
		charcount.right = '2%';
	}
	// show keyboard on load
	winTW.addEventListener('open',function(){
		tweet.focus();
	});

	tweet.addEventListener('change',function(e) {
		chars = (140-e.value.length);
		if (chars<11) {
			charcount.color = '#FF3333'
			charcount.font = liferay.fonts.h4;
		} else if (chars<20) {
			charcount.color = '#5C0002';
			charcount.font = liferay.fonts.h3;
		} else {
			charcount.color = 'black';
			charcount.font = liferay.fonts.h2;
		}
		charcount.text = parseInt(chars)+'';
	});
	btnShorten.addEventListener('click',function() {
		liferay.tools.showSpinner({
			container: winBG
		});

		// replace URLs in the text with shortened URLs
		var urlRegex = /(https?:\/\/[^\s]+)/gi;
		var urls = [];
		(tweet.value).replace(urlRegex, function(url) {
			urls.push(url);
		});
		for (var i=0; i<urls.length; i++) {
			// get shorturl
			liferay.screens.front.shorten_url(urls[i],function(shorturl, oldurl){
				if (shorturl!=false) {
					tweet.value = (tweet.value).replace(oldurl, shorturl);
					tweet.fireEvent('change', {
						value: tweet.value
					});
					liferay.tools.hideSpinner();
					return true;
				} else {
					liferay.tools.hideSpinner();
					return false;
				}
			});
		}
	});
	btnTW.addEventListener('click',function() {
		// hide the keyboard on Android because it doesn't automatically
		if (Ti.Platform.osname=='android') {
			Titanium.UI.Android.hideSoftKeyboard();
		}
		callback(tweet.value);

		winBG.close();
		winTW.close();

	});

	btnCancel.addEventListener('click',function() {
		// hide the keyboard on Android because it doesn't automatically
		if (Ti.Platform.osname=='android') {
			Titanium.UI.Android.hideSoftKeyboard();
		}
		winBG.close();
		winTW.close();
	});

	btnScruncher.add(btnCancel);
	btnScruncher.add(btnShorten);
	btnScruncher.add(btnTW);

	btnContainer.add(btnScruncher);
	twContainer.add(tweetPicContainer);
	twContainer.add(btnContainer);
	tweetPicContainer.add(charcount);

	winTW.add(twContainer);
	winBG.open();
	winTW.open();

};

liferay.screens.front.shorten_url = function(url,callback) {


	var XHR = Titanium.Network.createHTTPClient();
	XHR.open("POST", 'https://www.googleapis.com/urlshortener/v1/url');

	XHR.onload = function () {
		try {
			resp = JSON.parse(XHR.responseText);
			if (resp.id) {
				callback(resp.id, url);
			}

		} catch(e) {
			callback(null, null);
		}
	};
	XHR.onerror = function(e) {
		callback(null, null);
	};
	XHR.setRequestHeader('Content-Type', 'application/json');
	XHR.send('{"longUrl" : "' + url + '"}');
}

liferay.screens.front.fbLogin = function(onSuccess, onFail, onCancel) {

	var fb = require('facebook');
	fb.appid = Ti.App.Properties.getString("ti.facebook.appid", "");
	fb.permissions = ['publish_stream']; // Permissions your app needs
	fb.forceDialogAuth = true;
	if (fb.getLoggedIn()) {
		onSuccess(fb);
	} else {
		fb.addEventListener('login', function(e) {
			if (e.success) {
				onSuccess(fb);
			} else if (e.error) {
				onFail(e.error);
			} else if (e.cancelled) {
				onCancel();
			} else {
				console.log("unknown FB login result");
			}
		});
		fb.authorize();
	}
};

liferay.screens.front.fbCheckin = function() {
	var placeUrl = liferay.controller.selectedEvent.event_url ? liferay.controller.selectedEvent.event_url : Ti.App.Properties.getString("liferay.default_event_url", "");
	var placePic = liferay.controller.selectedEvent.event_pic_url ? liferay.controller.selectedEvent.event_pic_url : Ti.App.Properties.getString("liferay.default_event_logo_url", "");
	var placeDesc = liferay.controller.selectedEvent.inactive_msg ? liferay.controller.selectedEvent.inactive_msg : "";
	var data = {
		link : placeUrl,
		name : liferay.controller.selectedEvent.menutitle,
		message : "Wish you were here!",
		caption : liferay.controller.selectedEvent.location_label,
		picture : placePic,
		description : placeDesc,
		actions: '{"name": "' + L('FMT_WEBSITE') + '", "link" : "' + placeUrl + '"}'
	};

	liferay.screens.front.fbFeed(data);
};

liferay.screens.front.fbFeed = function(data) {
	liferay.screens.front.fbLogin(function(fb) {
		fb.dialog("feed", data, function(e) {
			if(e.success && e.result) {
                liferay.tools.toastNotification(null,  L('SCAN_EMAIL_SENT'));
			} else {
				if (e.error) {
					liferay.tools.alert(L('ALERT'), e.error);
				}
			}
		});

	}, function(msg) {
		liferay.tools.alert(L('ALERT'), msg);
	}, function() {

	});
};

