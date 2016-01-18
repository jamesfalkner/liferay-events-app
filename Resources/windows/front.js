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

liferay.screens.front.helpData = [
    {
        top: '2%',
        left: '20%',
        width: '65%',
        font: liferay.fonts.h1b,
        text: L('SCREEN_FRONT_HELP_1')
    },
    {
        view: {
            center : {
                x: '9%',
                y: '5%'
            },
            width: '13%',
            height: '8%',
            backgroundColor: 'transparent',
            borderWidth: '5dp',
            borderRadius: '3dp',
            borderColor: '#FF6666'
        }
    },
    {
        top: '40%',
        left: '5%',
        width: '50%',
        font: liferay.fonts.h1b,
        text: L('SCREEN_FRONT_HELP_2')
    },
    {
        view: {
            center : {
                x: '75%',
                y: '50%'
            },
            width: '30%',
            height: '20%',
            backgroundColor: 'transparent',
            borderWidth: '5dp',
            borderRadius: '3dp',
            borderColor: '#FF6666'
        }
    },
    {
        top: '80%',
        left: '5%',
        width: '90%',
        font: liferay.fonts.h1b,
        text: L('SCREEN_FRONT_HELP_3')
    },
    {
        view: {
            center : {
                x: '84.23%',
                y: '95%'
            },
            width: '13%',
            height: '8%',
            backgroundColor: 'transparent',
            borderWidth: '5dp',
            borderRadius: '3dp',
            borderColor: '#FF6666'
        }
    }

];

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

liferay.screens.front.render = function() {

	var self = this;

    this.newsTimer = null;

    this.evtSelBtn = Titanium.UI.createView(liferay.settings.screens.front.buttons.eventSelect);

    this.evtSelBtn.width = liferay.tools.getDp(liferay.settings.screens.front.buttons.eventSelect.psize * Titanium.Platform.displayCaps.platformWidth);
    this.evtSelBtn.height = this.evtSelBtn.width;
    this.evtSelBtn.touchEnabled = true;

    this.newsBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.news);

    this.newsBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.news.psize * Titanium.Platform.displayCaps.platformWidth);
    this.newsBtn.height = this.newsBtn.width;

    this.newsBtn.addEventListener('click', function(e) {

        var openNews = function() {
            var win = liferay.screens.activityStream;
            liferay.controller.open(win.render(), win);
            win.displayActivityStream();
        };

        if (liferay.screens.front.bounceTimer) {
            liferay.screens.front.stopBounce();
            openNews();
        } else {
            liferay.tools.flashButton({
                control: e.source,
                onRestore: function () {
                    openNews();
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
        liferay.tools.flashButton({
            control : e.source,
            onRestore : function() {
                var sponsor = null;
                liferay.data.currentEventData.sponsors.forEach(function(sponsorIt) {
                    if (sponsorIt.type && sponsorIt.type == 'scan') {
                        sponsor = sponsorIt;
                    }
                });

                liferay.scan.doScan({
                    message: sponsor ? String.format(L('SCAN_SPONSORED_BY'), sponsor.name) : L('SCAN_TITLE'),
                    logo: sponsor ? sponsor.docmedia : null,
                    onSuccess: function(result) {
                        liferay.scan.parseBarcode(result, function(contact) {
                            liferay.screens.contacts.loadContacts();
                            liferay.screens.contacts.saveNewContact(contact);
                            var view = liferay.screens.contactsDetail;
                            liferay.controller.open(view.render(), view, true);
                            view.loadDetails(contact);
                        }, function(err) {
                            liferay.tools.alert(L('ALERT'), err);
                        });

                    },
                    onFailure: function(err) {
                        liferay.tools.alert(L('ALERT'), String.format(L('SCAN_UNABLE'), err));
                    }
                });
            }
        });
    });

    // activities button
    this.activitiesBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.activities);

    this.activitiesBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.activities.psize * Titanium.Platform.displayCaps.platformWidth);
    this.activitiesBtn.height = this.activitiesBtn.width;

    this.activitiesBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function() {
                var win = liferay.screens.activities;
                liferay.controller.open(win.render(), win, true);
            }
        });
    });
    this.activitiesBtn.visible = (liferay.controller.selectedEvent.event_connect_enabled ? true : false);

    // tweet button
    this.tweetBtn = Titanium.UI.createView(liferay.settings.screens.all.buttons.tweet);

    this.tweetBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.tweet.psize * Titanium.Platform.displayCaps.platformWidth);
    this.tweetBtn.height = this.tweetBtn.width;

    this.tweetBtn.addEventListener('click', function(e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function() {
                var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');
                liferay.screens.front.tweet(tweetHash, null);
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
        headerButtons: [this.evtSelBtn],
        footerButtons: [this.newsBtn, this.beaconButton,
            this.beaconButtonOff, this.surveyBtn, this.tagBtn,
            this.tweetBtn, this.fbBtn, this.activitiesBtn]
    });

	var rows = Math.ceil(liferay.settings.screens.front.buttonOrder.length / liferay.settings.screens.front.buttonsPerRow);
	var cols = liferay.settings.screens.front.buttonsPerRow;
	var imgWidth = liferay.tools.getDp(liferay.settings.screens.front.psize * Titanium.Platform.displayCaps.platformWidth);
	var imgHeight = imgWidth;

    var buttonList = liferay.settings.screens.front.buttonOrder;
    if (!liferay.controller.selectedEvent.event_connect_enabled) {
        buttonList = buttonList.map(function (name) {
            if (name == "connectConnections") {
                return "maps";
            } else if (name == "maps") {
                return "activities";
            } else {
                return name;
            }
        });
    }
	for (var i = 0; i < buttonList.length; i++) {
		var buttonName = buttonList[i];
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
            text: buttonData.text,
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

    this.drawerItems = [
        {
            image: {
                image: '/images/MobApp-Agenda-Icon-Mega-@2x.png'
            },
            title: {
                text: L('NEWS')
            },
            properties: {
                itemId: "news"
            },
            onSelect: function(e) {
                self.newsBtn.fireEvent('click', { source: self.newsBtn});
            }
        },
        {
            image: {
                image: '/images/drawer/Agenda-Icon.png'
            },
            title: {
                text: L('AGENDA')
            },
            properties: {
                itemId: "agenda"
            }
        },
        {
            image: {
                image: '/images/drawer/Maps-Icon.png'
            },
            title: {
                text: L('MAPS')
            },
            properties: {
                itemId: "maps"
            }
        },
        {
            enabled: function() {
                return liferay.controller.selectedEvent.event_connect_enabled;
            },
            image: {
                image: '/images/drawer/EventConnect-Icon.png'
            },
            title: {
                text: 'EventConnect'
            },
            properties: {
                itemId: 'connectConnections'
            }
        },
        {
            image: {
                image: '/images/drawer/Live-Polls-Icon.png'
            },
            title: {
                text: L('LIVE_POLLS')
            },
            properties: {
                itemId: 'polls'
            }
        },
        {
            image: {
                image: '/images/drawer/Activities-Icon.png'
            },
            title: {
                text: L('ACTIVITIES')
            },
            properties: {
                itemId: "activities"
            }
        },
        {
            image: {
                image: '/images/drawer/Gallery-Icon.png'
            },
            title: {
                text: L('GALLERY')
            },
            properties: {
                itemId: "gallery"
            }
        },
        {
            image: {
                image: '/images/drawer/Contacts-Icon.png'
            },
            title: {
                text: L('CONTACTS')
            },
            properties: {
                itemId: "contacts"
            }
        },
        {
            image: {
                image: '/images/drawer/Survey-Icon.png'
            },
            title: {
                text: L('EVENT_SURVEY')
            },
            properties: {
                itemId: "survey"
            },
            onSelect: function(e) {
                liferay.screens.front.showSurvey(liferay.settings.server.eventSurveyId);
            }
        },
        {
            enabled: function() {
                return (liferay.controller.selectedEvent.swag_url ? true : false);
            },
            image: {
                image: '/images/MobApp-Icon-Geo-@2x.png'
            },
            title: {
                text: "Digital SWAG"
            },
            properties: {
                itemId: 'swag'
            },
            onSelect: function(e) {
                liferay.screens.front.showSwag();
            }
        },
        {
            image: {
                image: '/images/drawer/Location-Icon.png'
            },
            title: {
                text: L('SWITCH_EVENTS')
            },
            properties: {
                itemId: 'switchevents'
            },
            onSelect: function(e) {
                liferay.screens.front.cancelNewsTimer();
                liferay.screens.front.stopBounce();
                liferay.controller.clearWindows();
                liferay.controller.open(liferay.screens.eventSelect.render(), liferay.screens.eventSelect);
            }
        },
        {
            image: {
                image: '/images/drawer/About-Icon.png'
            },
            title: {
                text: L('ABOUT_APP')
            },
            properties: {
                itemId: 'about'
            },
            onSelect: function(e) {
                liferay.screens.front.showCredits();
            }
        }
    ];

    liferay.drawer.performLogout(false);

    liferay.drawer.createDrawer(this.window, this.drawerItems, this.evtSelBtn);

    return this.window;

};

liferay.screens.front.showSwag = function() {

    var url = liferay.controller.selectedEvent.swag_url + "?";

    if (!liferay.drawer.loggedIn) {

        // prompt for login
        var alertDialog = Titanium.UI.createAlertDialog({
            title : L('LOGIN'),
            message: L('SWAG_INTRO'),
            buttonNames : [L('LOGIN'), L('CANCEL')],
            cancel: 1
        });
        alertDialog.addEventListener('click', function(e) {
            if (e.index == 0) {
                // open login screen
                liferay.drawer.performLogin(true, function(session) {
                    [
                        {name: 'email', value: session.user.emailAddress},
                        {name: 'fname', value: session.user.firstName},
                        {name: 'lname', value : session.user.lastName},
                        {name: 'jobt', value : session.user.jobTitle}
                    ].forEach(function(el, idx, arr) {
                            url += (el.name + '=' + encodeURIComponent(el.value));
                            if (idx < (arr.length - 1)) {
                                url += '&';
                            }
                        });

                    liferay.ui.openWebPageLight(url, "Digital SWAG");
                }, function(err) {
                });

            }
        });
        alertDialog.show();

    } else {
        [
            {name: 'email', value :  liferay.drawer.session.user.emailAddress },
            {name: 'fname', value :  liferay.drawer.session.user.firstName },
            {name: 'lname', value : liferay.drawer.session.user.lastName },
            {name: 'jobt', value :  liferay.drawer.session.user.jobTitle }
        ].forEach(function(el, idx, arr) {
                url += (el.name + '=' + encodeURIComponent(el.value));
                if (idx < (arr.length - 1)) {
                    url += '&';
                }
            });

        liferay.ui.openWebPageLight(url, "Digital SWAG");
    }

};

liferay.screens.front.showCredits = function() {

    var globalCoin = Ti.Media.createSound({url:"/smb_coin.mp3"});

    var self = this;
    //var audioPlayer = Ti.Media.createAudioPlayer({
    //    url: '/data.mp3',
    //    allowBackground: false
    //});
    //

    var audioPlayer = Ti.Media.createAudioPlayer({url: '/data.mp3'});
    setTimeout(function() {
        audioPlayer.volume = 0;
        if (liferay.model.iOS) {
            var intId = setInterval(function () {
                audioPlayer.volume = audioPlayer.volume + .05;
                if (audioPlayer.volume > 1) {
                    audioPlayer.volume = 1;
                    clearInterval(intId);
                }
            }, 100);
        } else {
            audioPlayer.volume = 1;
        }
        audioPlayer.play();
    }, 1000);


    var font = {
        fontSize: liferay.fonts.H1Size,
        fontFamily: "Pixel Emulator"
    };

    var colors = ['#C63500', '#FFAA99', '#4382FA', '#006A1C', '#288883', '#EC7024'];

    function changeObjFonts(obj) {
        if (obj.constructor != Object) {
            return;
        }

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var child = obj[key];
                if (child.constructor == Object) {
                    changeObjFonts(child);
                } else if (child.constructor == Array) {
                    for (var i = 0, l = child.length; i < l; i++) {
                        changeObjFonts(child[i]);
                    }
                } else if (child.constructor == String) {
                    if (key == "fontFamily") {
                        obj[key] = "Pixel Emulator";
                    } else if (key == "color") {
                        obj[key] = colors[Math.floor(Math.random() * colors.length)];
                    }
                }
            }
        }
    }

    function changeFonts(view) {
        if (view.font) {
            view.font = {
                fontSize: view.font.fontSize,
                fontFamily: "Pixel Emulator",
                fontStyle: view.font.fontStyle,
                fontWeight: view.font.fontWeight,
                textStyle: view.font.textStyle
            };

            view.color = colors[Math.floor(Math.random() * colors.length)];
        }


        view.children.forEach(function(child) {
            changeFonts(child);
        });
    }

    function stripViews(view) {
        if (view.children.length <= 0) return;
        view.children.forEach(function(child) {
            if (child.purpose == 'drawer') {
                view.remove(child);
            }
            stripViews(child);
        });
    }

    var eastercount = 0;

    function checkEaster() {
        if (eastercount >= 4) {
            eastercount = 0;
            liferay.controller.getCurrentWindow().addEventListener('click', function () {
                globalCoin.play();
            });

            for (var fontObjKey in liferay.fonts) {
                if (liferay.fonts.hasOwnProperty(fontObjKey)) {
                    liferay.fonts[fontObjKey].fontFamily = "Pixel Emulator";
                }
            }
            changeFonts(liferay.controller.getCurrentWindow());
            stripViews(liferay.controller.getCurrentWindow());
            changeObjFonts(liferay.list_templates);
            changeObjFonts(liferay.settings);
            changeObjFonts(liferay.controller.getCurrentWindow());
            liferay.screens.front.evtSelBtn.visible = false;
            liferay.screens.front.evtSelBtn.touchEnabled = false;

            var newbtn = Ti.UI.createImageView({
                image: '/images/mario.png',
                width: liferay.tools.getDp(liferay.settings.screens.front.buttons.eventSelect.psize * Titanium.Platform.displayCaps.platformWidth),
                height: liferay.tools.getDp(liferay.settings.screens.front.buttons.eventSelect.psize * Titanium.Platform.displayCaps.platformWidth),
                top: '8dp',
                left: '8dp',
                touchEnabled: true
            });

            liferay.controller.getCurrentWindow().add(newbtn);

            globalCoin.play();
            liferay.drawer.createDrawer(liferay.controller.getCurrentWindow(),
                liferay.screens.front.drawerItems, newbtn);

        }

    }
    var win = Ti.UI.createWindow({
        windowSoftInputMode: (liferay.model.android ? Ti.UI.Android.SOFT_INPUT_ADJUST_PAN : null),
        navBarHidden: true,
        tabBarHidden: true,
        fullscreen: true,
        backgroundColor: 'black'
    });

    var close = Ti.UI.createButton({
        title: L('CLOSE'),
        font: liferay.fonts.h4b,
        left: '15dp',
        top: '15dp'
    });

    function shutItDown() {
        win.close();
        audioPlayer && audioPlayer.stop();
        liferay.model.android && audioPlayer && audioPlayer.release();
        audioPlayer = null;
        checkEaster();

    }
    close.addEventListener('click', function(e) {
        shutItDown();
    });

    liferay.model.android && win.addEventListener('close', function(e) {
        shutItDown();
    });



    var credits = [
        {text: "Liferay Events\nCopyright 2015 Liferay, Inc. All Rights Reserved\n" + Ti.App.Properties.getString('liferay.version.string', 'unknown') + "\n\n\n"},
        {image: '/images/lrlogo-rounded.png', width: '160dp', height: '160dp', delayFactor: 8000},
        {text: "Lead Developer\n\nJames Falkner"},
        {image: 'https://www.liferay.com/image/image_gallery?uuid=e99a123a-5cd8-4447-83ed-eeda45cd616a&groupId=10143&t=1244752151618', delayFactor: 9000, width: '280dp', height: '200dp'},
        {text: "Designers\n\nBryan Ho\nYoshiki Hisamoto\nEmily Young"},
        {image: 'http://www.javalobby.org/articles/liferay/images/image008.jpg', delayFactor: 6000, width: '150dp', height: '100dp'},
        {text: "QA Team\n\nJames Falkner\nOlaf Kock\nEddy Dueck\nAngela Wu\nShannon Chang\nAlfredo Del Castillo\nJamie Sammons\nCorné Aussems\nRay Augé"},
        {image: 'https://farm8.staticflickr.com/7340/10428031783_1b67bfc602_m_d.jpg', delayFactor: 8000, width: '240dp', height: '160dp' },
        {text: "Globalization\n\nAlfredo Del Castillo\nAndrea Di Giorgi\nOlaf Kock\nPedro Cabral\nRachel Horvelin\nSherazade FETITA"},
        {image: 'https://farm8.staticflickr.com/7567/15689345016_0fa6dfe069_m_d.jpg', delayFactor: 10000, width: '180dp', height: '240dp' },
        {text: "Team liferay.com\n\nNathan Cook\nRyan Schuler\nLuke Shackelford"},
        {image: 'http://www.quickmeme.com/img/88/88fd9ae70785855b18f7bfcdfe6c61b801cc9c99a23652bf2c3d42f0cb0ad46d.jpg', delayFactor: 8000, width: '200dp', height: '160dp'},
        {text: "Special Thanks\n\nRosetta / LEVEL Studios\nRuud Kluivers\nBruno Admin (Farache)\nCecilia Lam\nPier Paulo Ramon\nKaylin & Camden Falkner\nThe Global Liferay Community"},
        {image: 'http://troll.me/images/y-u-no-guy/liferay-y-u-no-deploy-properly.jpg', width: '200dp', height: '160dp', delayFactor: 8000},
        {text: "This app was made with lots of help from other open source projects\n\n" +
        "Android IBeacon Service Copyright 2013 Radius Networks\n" +
        "async.js Copyright (c) 2010-2014 Caolan McMahon\n" +
        "benCoding.Android.Tools, Securely Copyright 2013 Benjamin Bahrenburg\n" +
        "SHA-1 js Library Copyright (c) 1998 - 2009, Paul Johnston & Contributors\n" +
        "OAuth js Library Copyright 2008 Netflix, Inc", delayFactor: 15000},
        {text: "Oh, there's more!\nOAuth adapter Copyright 2010 David Riccitelli, Interact Spa\n" +
        "vCards Copyright (C) 2012 Niklas Cathor\n" +
        "Liferay Connector module \"Humbly made the spry ladies and gents at SMC Treviso\"\n" +
        "Media Picker Module courtesy of Nils Krämer\n" +
        "Android Drag Sort List View Copyright 2012 Carl Bauer\n" +
        "XCallBackURL Copyright 2013-2015 Fokke Zandbergen", delayFactor: 15000},
        {image: 'https://farm7.staticflickr.com/6233/6866523868_4ae995f58e_m_d.jpg', width: '160dp', height: '120dp', delayFactor: 20000},
        {text: 'Really? You\'re still here?', delayFactor: 20000},
        {text: 'Did you see the easter egg? Watch closer next time and tap the box a few times!', delayFactor: 10000},
        {text: 'Buh bye!'}



    ];

    function computeDelay(idx) {
        if (idx == 0) return 0;
        return computeDelay(idx - 1) +
            (credits[idx-1].image ? (credits[idx-1].delayFactor || 3000 ) : (credits[idx-1].delayFactor || ((credits[idx-1].text.split('\n').length) * 1000)));
    }

    var hidden = Ti.UI.createView({
        top: 0, right: 0, width: '50dp', height: '50dp', backgroundColor: '#000000'
    });


    hidden.addEventListener('click', function() {
        globalCoin.reset();
        globalCoin.play();
        eastercount++;
        if (eastercount >= 4) {
            Ti.Media.createSound({url:"/1up.mp3"}).play();
            hidden.animate({
                backgroundColor: 'blue',
                duration: 200
            }, function() {
                hidden.animate({
                    opacity: 0,
                    duration: 200
                }, function() {
                    hidden.visible = false;
                })
            });
        }
    });

    win.add(hidden);

    [1, 2, 3, 4, 5, 6].forEach(function(num, idx) {
        setTimeout(function() {

            hidden.animate({
                backgroundColor: '#444444',
                duration: 600,
                autoreverse: true
            });
        }, num * 5000);
    });

    credits.forEach(function(phrase, idx) {

        var creditObj;

        if (phrase.text) {
            creditObj = Ti.UI.createLabel({
                text: phrase.text,
                font: font,
                height: liferay.model.iOS ? liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight) : Ti.UI.SIZE,
                width: '95%',
                top: liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight),
                color: 'white',
                textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
                verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP,
                backgroundColor: 'transparent',
                opacity: liferay.model.iOS ? 0 : 1
            });
        } else if (phrase.image) {
            creditObj = Ti.UI.createImageView({
                image: phrase.image,
                width: phrase.width || '40dp',
                height: phrase.height || '40dp',
                top: liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight),
                opacity: liferay.model.iOS ? 0 : 1

            });
        }

        win.add(creditObj);

        var delay = computeDelay(idx);

        creditObj.opacity = 1;
        //liferay.model.iOS && creditObj.animate({
        //    delay: computeDelay(idx),
        //    opacity: 1,
        //    duration: 8000
        //});

        creditObj.animate({
            top: liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight *.1),
            duration: 20000,
            delay:   delay + (Math.random() * 1000),
            curve: Titanium.UI.ANIMATION_CURVE_LINEAR
        }, function() {
            // lbl done

            creditObj.animate({
                top: -10,
                duration: 2000,
                curve: Titanium.UI.ANIMATION_CURVE_LINEAR,
                opacity: 0
            });


            if (idx == credits.length - 1) {

                checkEaster();
                var newVol = 1;
                var intId = setInterval(function () {
                    newVol *= .85;
                    if (audioPlayer) {
                        audioPlayer.volume = newVol;
                    }
                    if (newVol < .1) {
                        if (audioPlayer) audioPlayer.volume = 0;
                        clearInterval(intId);
                        close.fireEvent('click', {source: close});
                    }
                }, 200);
            }
        });

    });

    win.add(close);
    win.opacity = 0;
    win.open();
    win.animate({
        opacity: 1,
        duration: 2000
    });
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

liferay.screens.front.onOpen = function() {

    var data = liferay.controller.missedPush;

    if (!data) return;
    var payloadObj = data.payload || {};

    liferay.controller.missedPush = null;
    var isCurrentEvent = true;

    var eventId = payloadObj.eventId;

    if (payloadObj.screen && (!liferay.controller.selectedEvent || (liferay.controller.selectedEvent.eventid != eventId))) {
        isCurrentEvent = false;
    }

    var dialog = Ti.UI.createAlertDialog({
        title: data.title,
        message: data.message,
        buttonNames: [data.screen ? L('VIEW'): L('OK')],
        cancel: 1
    });
    dialog.addEventListener("click", function(event) {
        dialog.hide();
        if (event.index == 0) {

            if (data.screen && !isCurrentEvent) {
                liferay.tools.alert(L('NOTE'), L('WRONG_EVENT'));
                return;
            }
            if (data.screen) {
                liferay.controller.loadPushAction(data.screen, data.screenDetail);
            }
        }
    });


    if (payloadObj.saveToNews) {
        var picUrl = payloadObj.picUrl;
        var picLink = payloadObj.picLink;

        var item = {
            time: new Date().getTime(),
            item: {
                content:payloadObj.message,
                url:picLink,
                picture: picUrl,
                uuid: new Date().getTime()
            }
        };
        liferay.controller.saveItemsToNews(eventId, item.time, item.item);
        liferay.controller.saveNews();
        if (liferay.controller.selectedEvent && liferay.controller.selectedEvent.eventid == eventId) {
            liferay.controller.newNews = true;
            var unreadcount = liferay.controller.getUnreadNewsCount(eventId);
            if (unreadcount > 0) {
                if (liferay.model.iOS) {
                    Ti.UI.iPhone.appBadge = unreadcount;
                }
                liferay.drawer.setNotificationValue(L('NEWS'), unreadcount);
            }
        }
    }

    dialog.show();


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
            tweetMsg = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');
        }
        liferay.screens.front.tweet(tweetMsg, null);
    } else if (action == "FB") {
        cb();
        liferay.screens.front.fbCheckin();
    } else if (action == "NEWS") {
        cb();
        liferay.controller.showAllNews(liferay.controller.selectedEvent);
        liferay.screens.front.stopBounce();
    } else if (action == 'SWAG' && liferay.controller.selectedEvent.swag_url) {
        liferay.screens.front.showSwag();
    } else if (action == 'WEB') {
        Titanium.Platform.openURL(actionSpec[1]);
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

    liferay.drawer.setEnabled(false);
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
            liferay.drawer.setEnabled(true);
            liferay.tools.toastNotification(null, L('EVENT_SURVEY_THANKS'));
            cb && cb();
        },
        onFail: function(err) {
            liferay.drawer.setEnabled(true);
            liferay.tools.alert(L('ALERT'), String.format(L('EVENT_SURVEY_ERROR'), err));
            cb && cb();
        },
        onClose: function() {
            liferay.drawer.setEnabled(true);
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
        enableReturnKey: true,
        autocorrect : true,
        tintColor : "black",
        suppressReturn: false,
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

        if (urls.length <= 0) {
            liferay.tools.hideSpinner();
            return;
        }
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
	XHR.open("POST", 'https://www.googleapis.com/urlshortener/v1/url?key=' + encodeURIComponent(Ti.App.Properties.getString('liferay.google.apikey')));

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

liferay.screens.front.fbCheckin = function() {
	var placeUrl = liferay.controller.selectedEvent.event_url ? liferay.controller.selectedEvent.event_url : Ti.App.Properties.getString("liferay.default_event_url", "");
	var placePic = liferay.controller.selectedEvent.event_pic_url ? liferay.controller.selectedEvent.event_pic_url : Ti.App.Properties.getString("liferay.default_event_logo_url", "");
	var placeDesc = liferay.controller.selectedEvent.inactive_msg ? liferay.controller.selectedEvent.inactive_msg.substring(0, 50) : "";
	var data = {
		link : placeUrl,
		name : liferay.controller.selectedEvent.menutitle,
		description : liferay.controller.selectedEvent.location_label,
		picture : placePic,
		caption : placeDesc,
		actions: '{"name": "' + L('FMT_WEBSITE') + '", "link" : "' + placeUrl + '"}'
	};

	liferay.screens.front.fbFeed(data);
};

liferay.screens.front.fbFeed = function(data) {

    var fb = require('facebook');

    fb.addEventListener('shareCompleted', function (e) {
        if (e.success) {
            liferay.tools.toastNotification(null, L('SCAN_EMAIL_SENT'));
        } else if (e.error) {
            liferay.tools.alert(L('ALERT'), e.error);
        }
    });

    try {
        if (fb.getCanPresentShareDialog()) {
            fb.presentShareDialog(data);
        } else {
            fb.presentWebShareDialog(data);
        }
    } catch (ex) {
        liferay.tools.alert(L('ALERT'), ex.message);

    }
};

