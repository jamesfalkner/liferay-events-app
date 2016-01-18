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

var notifications = [];

liferay.controller = {
    className: "liferay.controller",

    init: function () {

        liferay.controller.subscribeToPush();

        if (liferay.model.iOS) {
            if (liferay.model.iOS8) {
                Ti.Geolocation.setPurpose(L('GEO_PERMISSION_PURPOSE'));
                Ti.Geolocation.getCurrentPosition(function (result) {
                });
                Ti.App.iOS.registerUserNotificationSettings({
                    types: [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
                        Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
                       Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
                });
            }
            var tmpMod = require('org.beuckman.tibeacons');
            if (tmpMod.checkProtection && !tmpMod.checkProtection()) {

                notifications.push(Ti.App.iOS.scheduleLocalNotification({
                    alertBody: L('NEW_NOTIFICATION'),
                    badge: (Ti.UI.iPhone.appBadge + 1),
                    date: new Date(new Date().getTime() + 1000),
                    sound: 'chime'
                }));

                liferay.tools.blockingAlert("Liferay Events",
                    L('MISSED_WHILE_LOCKED'),
                    function () {
                        liferay.controller.initUI();
                    }
                );
            } else {
                this.initUI();
            }
        } else {
            this.initUI();
        }
    },

    initUI: function () {

        var self = this;

        // load settings
        if (this.loadSettings() == false) {
            return;
        }

        this.preferredEventId = null;
        this.selectedEvent = null;
        this.appPreferences = [];
        this.news = [];
        this.loadEventPreferences();
        this.loadAppPreferences();
        this.loadNews();


        if (liferay.model.retina || liferay.model.iPad || (liferay.model.android && Ti.Platform.displayCaps.platformWidth > 400)) {
            liferay.tools.updateImagePaths(liferay.settings, "-@2x");
        }

        liferay.list_templates.init();

        // Create hidden TabGroup for window navigation
        this.tabGroup = Titanium.UI.createTabGroup();

        this.window = Titanium.UI.createWindow({
            backgroundImage: liferay.settings.screens.loader.background,
            navBarHidden: true,
            tabBarHidden: true,
            fullscreen: true,
            exitOnClose: true,
            backgroundColor: 'transparent'
        });
        this.window.orientationModes = [Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT];
        if (liferay.model.android) {
            this.window.backgroundImage = "default-android.png";
            var fb = require('facebook');
            if (fb) {
                this.tabGroup.fbProxy = fb.createActivityWorker({lifecycleContainer: this.tabGroup});
            }
        } else if (liferay.model.iOS) {
            if (liferay.model.iPhone) {
                if (Ti.Platform.displayCaps.platformHeight == 568 && liferay.model.retina) {
                    this.window.backgroundImage = "Default-568h@2x.png";
                } else if (Ti.Platform.displayCaps.platformHeight == 480) {
                    if (liferay.model.retina) {
                        this.window.backgroundImage = "Default@2x.png";
                    } else {
                        this.window.backgroundImage = "Default.png";
                    }
                }
            } else if (liferay.model.iPad) {
                if (liferay.model.retina) {
                    this.window.backgroundImage = "Default-Portrait@2x.png";
                } else {
                    this.window.backgroundImage = "Default-Portrait.png";
                }
            }
        }
        this.mainTab = Titanium.UI.createTab({
            title: 'MainTab',
            window: this.window
        });

        this.childWindows = [];
        this.childViews = [];

        this.tabGroup.addTab(this.mainTab);

        this.finalLayout = false;

        this.window.addEventListener('postlayout', function (e) {

            if (liferay.controller.finalLayout) {
                return;
            }

            liferay.controller.finalLayout = true;
            liferay.controller.addFade(function () {

                if (liferay.controller.loadDataFromFile()) {
                    liferay.controller.fetchEventListDataPeriodically(liferay.settings.server.initialBackoffSecs);
                    var selectEvent = true;
                    if (liferay.controller.preferredEventId) {
                        for (var i = 0; i < liferay.data.events.length; i++) {
                            if (liferay.data.events[i].eventid == liferay.controller.preferredEventId) {
                                liferay.controller.selectedEvent = liferay.data.events[i];
                                selectEvent = false;
                                break;
                            }
                        }
                    }
                    if (selectEvent) {
                        liferay.controller.clearWindows();
                        liferay.controller.open(liferay.screens.eventSelect.render(), liferay.screens.eventSelect);
                    } else {
                        liferay.controller.loadAndStartEvent();
                    }
                } else {
                    liferay.tools.alert(L('ALERT'), L('FAILED_UPDATE_NETWORK'));
                }
            });
        });
        if (liferay.model.iOS) {
            this.tabGroup.open();
        } else {
            this.window.open();
        }
    },

    addFade: function (cb) {
        var capsHeight = Titanium.Platform.displayCaps.platformHeight;
        var labelSize;

        if (liferay.model.iPhone) {
            labelSize = 40
        } else if (liferay.model.iPad) {
            labelSize = 58;
        } else {
            labelSize = liferay.tools.getDp(capsHeight * .062);
        }

        var fadeContainer = Ti.UI.createView({
            layout: 'vertical',
            height: Ti.UI.SIZE,
            width: Ti.UI.SIZE
        });

        var fade1 = Ti.UI.createLabel({
            textid: 'SPLASH_FADE_1',
            color: '#DDDDDD',
            font: {
                fontFamily: liferay.tools.os({
                    iphone: liferay.fonts.LIGHT_FONT_NAME,
                    ipad: liferay.fonts.LIGHT_FONT_NAME,
                    android: liferay.fonts.LIGHT_FONT_NAME
                }),
                fontSize: labelSize
            },
            opacity: 0 // will be faded
        });
        var fade2 = Ti.UI.createLabel({
            textid: 'SPLASH_FADE_2',
            color: '#DDDDDD',
            font: {
                fontFamily: liferay.tools.os({
                    iphone: liferay.fonts.LIGHT_FONT_NAME,
                    ipad: liferay.fonts.LIGHT_FONT_NAME,
                    android: liferay.fonts.LIGHT_FONT_NAME
                }),
                fontSize: labelSize
            },
            opacity: 0 // will be faded
        });

        var fade3p = Ti.UI.createLabel({
            textid: 'SPLASH_POWERED_BY',
            color: '#DDDDDD',
            top: '60dp',
            font: {
                fontFamily: liferay.tools.os({
                    iphone: liferay.fonts.LIGHT_FONT_NAME,
                    ipad: liferay.fonts.LIGHT_FONT_NAME,
                    android: liferay.fonts.LIGHT_FONT_NAME
                }),
                fontSize: labelSize * .5
            },
            opacity: 0
        });

        var fade3 = Ti.UI.createImageView({
            top: '10dp',
            image: liferay.settings.screens.loader.logo,
            width: '30%',
            opacity: 0
        });

        fadeContainer.add(fade1);
        fadeContainer.add(fade2);
        fadeContainer.add(fade3p);
        fadeContainer.add(fade3);

        liferay.controller.window.add(fadeContainer);

        fade1.animate({
            opacity: 1,
            duration: 800
        });
        setTimeout(function () {
            fade2.animate({
                opacity: 1,
                duration: 800
            }, function () {
                setTimeout(cb, 500);
                if (liferay.model.android) {
                    setTimeout(function () {
                        var imageSize = liferay.tools.getDp(Titanium.Platform.displayCaps.platformHeight * .2);
                        image = Titanium.UI.createImageView({
                            backgroundImage: liferay.settings.screens.agenda.layout.arrowIcon.backgroundImage,
                            top: '80%',
                            height: imageSize * .4,
                            width: imageSize * .4
                        });

                        image.addEventListener('click', function () {
                            liferay.controller.open(liferay.screens.eventSelect.render(), liferay.screens.eventSelect);
                        });
                        liferay.controller.window.add(image);
                    }, 10000);
                }
            });

            fade3p.animate({
                opacity: 1,
                duration: 800
            });
            fade3.animate({
                opacity: 1,
                duration: 800
            });
        }, 100);
    },

    registerForEventPushTimer : null,

    registerForEventPush: function() {
        // register for push

        clearTimeout(liferay.controller.registerForEventPushTimer);

        if (liferay.controller.pushDeviceToken) {
            var platform = (liferay.model.iOS) ? 'apple' : (liferay.model.android ? 'android' : null);
            var email = liferay.drawer.getEmailAddress();
            liferay.controller.registerToken(liferay.controller.pushDeviceToken,
                platform, liferay.controller.selectedEvent.eventid, email,
                function () {
                }, function (err) {
                    liferay.controller.registerForEventPushTimer = setTimeout(liferay.controller.registerForEventPush, liferay.settings.server.pushRegisterFrequencyMins * 60 * 1000);
                });
        }
    },
    loadAndStartEvent: function () {

        var now = new Date();
        var localOff = now.getTimezoneOffset();
        var diff = (liferay.controller.selectedEvent.event_tz * 60) - localOff;
        var eventEnd = new liferay.classes.date().setFromISO8601(liferay.controller.selectedEvent.end_date + "T" + liferay.controller.selectedEvent.end_time + ":00")
        var eventEndLocal = eventEnd.getTime() + (diff * 60 * 1000);

        // clear agenda filters
        liferay.screens.agenda.filtersCategories = [];
        liferay.screens.agenda.selectedFilters = [];
        liferay.screens.agenda.filterInitFlag = true;

        // go through saved event data and see if we can find the latest cached content
        liferay.forms.loadSurveyAnswers();
        liferay.data.currentEventData = liferay.controller.getBlankEventData();

        for (var i = 0; i < liferay.data.allEventData.length; i++) {
            if (liferay.data.allEventData[i].id == liferay.controller.selectedEvent.eventid) {
                liferay.data.currentEventData = liferay.data.allEventData[i].data;
                break;
            }
        }

        liferay.controller.registerForEventPush();

        if (now.getTime() > eventEndLocal) {
            liferay.controller.fetchEventDataPeriodically(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);
            liferay.beacons.stopRegionMonitoring();
            liferay.beacons.clearAllQueuedTriggers();
            liferay.beacons.beaconsDisabled = true;
            liferay.beacons.currentEventId = liferay.controller.selectedEvent.eventid;
            liferay.beacons.currentEventData = {};
            liferay.tools.blockingAlert(L('NOTE'), L('THANKS_FOR_ATTENDING'), function () {
                liferay.controller.clearWindows();
                liferay.controller.open(liferay.screens.front.render(), liferay.screens.front);
            });
        } else {
            liferay.controller.clearWindows();
            Ti.Gesture.addEventListener('shake', function (e) {
                if (liferay.controller.shaken) {
                    return;
                }
                liferay.controller.shaken = true;
                liferay.controller.fetchEventListDataPeriodically(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);
                liferay.controller.fetchEventDataPeriodically(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);
                setTimeout(function () {
                    liferay.controller.shaken = false;
                }, 10 * 1000);
            });
            if (liferay.model.iOS) {
                Ti.UI.iPhone.appBadge = liferay.controller.getUnreadNewsCount(liferay.controller.selectedEvent.eventid);
            }

            liferay.controller.fetchEventDataPeriodically(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);
            liferay.controller.fetchNewsPeriodically(liferay.controller.selectedEvent);

            // load beacon data
            liferay.beacons.beaconsDisabled = false;
            liferay.beacons.stopRegionMonitoring();
            liferay.beacons.clearAllQueuedTriggers();
            liferay.beacons.loadDataFromFile();
            // go thorugh and see if we can find latest cached content
//            liferay.beacons.currentEventData = liferay.beacons.getBlankData();
            liferay.beacons.currentEventId = liferay.controller.selectedEvent.eventid;
            liferay.beacons.currentEventData = {};

            for (var i = 0; i < liferay.beacons.allEventData.length; i++) {
                if (liferay.beacons.allEventData[i].eventId == liferay.controller.selectedEvent.eventid) {
                    liferay.beacons.currentEventData = liferay.beacons.allEventData[i].data;
                    break;
                }
            }

            liferay.beacons.fetchBeaconsPeriodically(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);

            // load connect data
            liferay.connect.loadDataFromFile();

            // go thorugh and see if we can find latest cached content
            liferay.connect.currentEventId = liferay.controller.selectedEvent.eventid;
            liferay.connect.currentEventData = {};
            liferay.connect.currentEventData.profile = null;
            liferay.connect.chatListeners = [];
            liferay.connect.currentEventData.recommendations = [];
            liferay.connect.currentEventData.queuedInterests = [];
            liferay.connect.currentEventData.queuedMessages = [];
            liferay.connect.currentEventData.uninterestedIds = [];
            liferay.connect.currentEventData.connections = [];
            liferay.connect.currentEventData.messages = [];


            for (var i = 0; i < liferay.connect.allEventData.length; i++) {
                if (liferay.connect.allEventData[i].eventId == liferay.controller.selectedEvent.eventid) {
                    liferay.connect.currentEventData = liferay.connect.allEventData[i].data;
                    break;
                }
            }

            liferay.connect.syncConnectData(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);

            // see if there are new pics
            var seenCount = liferay.controller.getAppPreference("seenPhotoCount", liferay.controller.selectedEvent);
            if (!seenCount) {
                seenCount = 0;
            }
            liferay.screens.gallery.countEventPics(function(count) {
                if (seenCount < count) {
                    liferay.drawer.setNotificationValue(L('GALLERY'), (count - seenCount));
                }
            });

            liferay.controller.open(liferay.screens.front.render(), liferay.screens.front);
        }
    },

    eventDataTimer: null,
    eventListDataTimer: null,

    fetchEventDataPeriodically: function (event, backoff) {
        if (liferay.controller.eventDataTimer) {
            clearTimeout(liferay.controller.eventDataTimer);
        }
        liferay.controller.loadFeedFast({
            onLast: function () {

                liferay.controller.saveDataToFile(liferay.data);
                liferay.controller.childViews.forEach(function (view) {
                    view.refresh();
                });

                liferay.controller.eventDataTimer = setTimeout(function () {
                    liferay.controller.fetchEventDataPeriodically(event, liferay.settings.server.initialBackoffSecs);
                }, liferay.settings.server.eventDataFetchMins * 60 * 1000);

            },
            onFail: function (msg) {
                liferay.controller.eventDataTimer = setTimeout(function () {
                    liferay.controller.fetchEventDataPeriodically(event, backoff * liferay.settings.server.backoffMultiplier);
                }, Math.random() * backoff * 1000);

            }
        });
    },
    fetchEventListDataPeriodically: function (backoff) {
        if (liferay.controller.eventListDataTimer) {
            clearTimeout(liferay.controller.eventListDataTimer);
        }
        liferay.controller.loadEventsFast({
            onLast: function () {

                liferay.data.events.forEach(function(event) {
                    if (liferay.controller.selectedEvent && (event.eventid == liferay.controller.selectedEvent.eventid)) {
                        liferay.controller.selectedEvent = event;
                    }
                });


                liferay.controller.childViews.forEach(function (view) {
                    view.refresh();
                });
                liferay.controller.eventListDataTimer = setTimeout(function () {
                    liferay.controller.fetchEventListDataPeriodically(liferay.settings.server.initialBackoffSecs);
                }, liferay.settings.server.eventListFetchMins * 60 * 1000)

            },
            onFail: function (msg) {
                liferay.controller.eventListDataTimer = setTimeout(function () {
                    liferay.controller.fetchEventListDataPeriodically(backoff * liferay.settings.server.backoffMultiplier);
                }, Math.random() * backoff * 1000);

            }
        });
    },

    open: function (window, view, anim) {
        liferay.controller.childWindows.push(window);
        liferay.controller.childViews.push(view);
        liferay.controller.mainTab.open(window, {
            animated: anim
        });

        var seenViews = this.getAppPreference("com.liferay.seenviews");

        if (!seenViews) {
            seenViews = [];
        }

        if (view.className && (seenViews.indexOf(view.className) == -1)) {
            if (view.helpData) {
                liferay.ui.showHelp(view.helpData);
            }
            seenViews.push(view.className);
            this.setAppPreference("com.liferay.seenviews", seenViews);
            this.saveAppPreferences();
        }

        view.onOpen && view.onOpen();
    },


    getCurrentWindow: function () {
        if (!liferay.controller.childWindows) {
            return null;
        }
        if (liferay.controller.childWindows.length <= 0) {
            return liferay.controller.window;
        } else {
            return liferay.controller.childWindows[liferay.controller.childWindows.length - 1];
        }
    },
    getCurrentView: function () {
        if (!liferay.controller.childViews) {
            return null;
        }
        if (liferay.controller.childViews.length <= 0) {
            return null;
        } else {
            return liferay.controller.childViews[liferay.controller.childViews.length - 1];
        }
    },

    clearWindows: function () {
        var win = liferay.controller.getCurrentWindow();
        while (win != liferay.controller.window) {
            liferay.controller.closeLast(true, true);
            win = liferay.controller.getCurrentWindow();
        }
        liferay.controller.childWindows = [];
        liferay.controller.childViews = [];
    },

    closeLast: function (close, anim) {
        var win = liferay.controller.childWindows.pop();
        if (close) {
            if (liferay.model.iOS) {
                liferay.controller.mainTab.close(win, {
                    animated: anim
                });
            } else {
                win.close({
                    animated: anim
                });
            }
        }
        win = null;
        var view = liferay.controller.childViews.pop();
        return (view);
    },

    mergeSettings: function (obj1, obj2) {
        for (var p in obj2) {
            if (!obj2.hasOwnProperty(p)) continue;
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = this.mergeSettings(obj1[p], obj2[p]);
                } else if (obj2[p].constructor == Array) {
                    for (var i = 0; i < obj2[p].length; i++) {
                        if (obj1[p][i]) {
                            this.mergeSettings(obj1[p][i], obj2[p][i]);
                        } else {
                            // no value at that array offset, so make it
                            obj1[p][i] = obj2[p][i];
                        }
                    }
                } else {
                    obj1[p] = obj2[p];

                }

            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }

        return obj1;
    },

    getBlankEventData: function () {
        return {
            agenda: [],
            rooms: [],
            speakers: [],
            contacts: [],
            activities: [],
            maps: [],
            galleries: [],
            sponsors: []
        };
    },


    loadSettings: function () {
        liferay.data = {
            "events": [],
            "allEventData": [],
            "lastEventListFetch": -1,
            "lastEventDataFetch": -1,
            "currentEventData": liferay.controller.getBlankEventData()
        };


        file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'settings.json');
        if (file.exists()) {
            liferay.settings = JSON.parse(file.read());

            // try to merge model-specific settings
            var file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'settings.' + Ti.Platform.osname + '.json');
            if (file.exists()) {
                var overrides = JSON.parse(file.read());

                liferay.settings = this.mergeSettings(liferay.settings, overrides);
                overrides = null;
            }

            return true;
        } else {
            liferay.tools.alert(L('ALERT'), L('FAILED_LOADING_SETTINGS_FROM_FILE'));
            return false;
        }
    },

    loadEventsFast: function (options) {

        if (this.loadEventsInProgress)
            return;

        if (!Titanium.Network.online) {
            liferay.controller.loadEventsInProgress = false;
            liferay.tools.hideSpinner();
            if (options.onFail) {
                options.onFail(L('NO_NETWORK_FOUND'));
            }
            return;
        }

        liferay.tools.showSpinner({
            container: liferay.controller.getCurrentWindow()
        });

        this.loadEventsInProgress = true;

        Request({
            method: 'POST',
            url: liferay.settings.server.dataHost.host + liferay.settings.server.dataHost.endpoint,
            params: {
                ddlRecordSetId: liferay.settings.server.dataHost.siteListingType
            },
            onSuccess: function (responseObj) {
                if (Array.isArray(responseObj)) {
                    var tmpEvents = [];
                    var badDataFound = false;
                    responseObj.forEach(function (el) {
                        if (el.dynamicElements) {
                            tmpEvents.push(el.dynamicElements);
                        } else {
                            badDataFound = true;
                        }
                    });
                    if (!badDataFound) {
                        liferay.tools.preprocessData(tmpEvents);
                        liferay.data.events = tmpEvents;
                        liferay.data.lastEventListFetch = new Date().getTime();
                        liferay.controller.saveDataToFile(liferay.data);
                        liferay.controller.loadEventsInProgress = false;
                        liferay.tools.hideSpinner();
                        if (options.onLast) {
                            options.onLast();
                        }
                    } else {
                        liferay.controller.loadEventsInProgress = false;
                        liferay.tools.hideSpinner();
                        if (options.onFail) {
                            options.onFail("Bad event data found");
                        }
                    }
                } else {
                    liferay.controller.loadEventsInProgress = false;
                    liferay.tools.hideSpinner();
                    if (options.onFail) {
                        options.onFail(JSON.stringify(responseObj));
                    }
                }
            },

            onFailure: function (msg, response) {
                liferay.controller.loadEventsInProgress = false;
                liferay.tools.hideSpinner();
                if (options.onFail) {
                    options.onFail(msg + '[' + response + ']');
                }
            }
        });
    },

    loadFeedFast: function (options) {

        if (this.loadInProgress)
            return;

        if (!Titanium.Network.online) {
            liferay.controller.loadInProgress = false;
            liferay.tools.hideSpinner();
            if (options.onFail) {
                options.onFail(L('NO_NETWORK_FOUND'));
            }
            return;
        }
        //Ti.API.info("window width: " + this.window.rect.width);

        liferay.tools.showSpinner({
            container: liferay.controller.getCurrentWindow()
        });

        this.loadInProgress = true;

        if (!liferay.controller.selectedEvent.metadata_types) {
            liferay.controller.loadInProgress = false;
            liferay.tools.hideSpinner();
            if (options.onFail) {
                options.onFail(L('INVALID_DATA'));
            }
            return;

        }
        // parse metadata
        var types = {};
        var metadata = liferay.controller.selectedEvent.metadata_types.split(',').map(function (el) {
            return el.trim();
        });
        for (var i = 0; i < metadata.length; i++) {
            var parts = metadata[i].split(":");
            if (parts.length != 2) {
                continue;
            }
            types[parts[0].trim()] = parts[1].trim();
        }

        if (!types.agenda || !types.speakers || !types.contacts || !types.activities || !types.rooms || !types.maps || !types.galleries || !types.sponsors) {
            liferay.controller.loadInProgress = false;
            liferay.tools.hideSpinner();
            if (options.onFail) {
                options.onFail(L('INVALID_DATA'));
            }
            return;
        }


        async.eachSeries([
            'agenda',
            'speakers',
            'contacts',
            'activities',
            'rooms',
            'maps',
            'galleries',
            'sponsors'
        ], function (item, cb) {
            liferay.controller.loadSingleType(item, types[item], liferay.data.currentEventData, {
                onSuccess: function () {
                    cb(null);
                }, onFail: function (err) {
                    cb(err);
                }
            });
        }, function (result) {
            if (!result) {
                liferay.controller.saveToAllEventData();
                liferay.data.lastEventDataFetch = new Date().getTime();
                liferay.controller.saveDataToFile(liferay.data);
                liferay.controller.loadInProgress = false;
                liferay.tools.hideSpinner();
                if (options.onLast) {
                    options.onLast();
                }
            } else {
                liferay.controller.loadInProgress = false;
                liferay.tools.hideSpinner();
                if (options.onFail) {
                    options.onFail(result);
                }
            }
        });
    },
    loadSingleType: function (typeName, typeId, storage_obj, options) {
        Request({
            method: 'POST',
            url: liferay.settings.server.dataHost.host + liferay.settings.server.dataHost.endpoint,
            params: {
                ddlRecordSetId: typeId
            },
            onSuccess: function (responseObj) {
                if (Array.isArray(responseObj)) {
                    var tmpData = [];
                    var badDataFound = false;
                    responseObj.forEach(function (el) {
                        if (el.dynamicElements) {
                            tmpData.push(el.dynamicElements);
                        } else {
                            badDataFound = true;
                        }
                    });
                    if (!badDataFound) {
                        liferay.tools.preprocessData(tmpData);
                        storage_obj[typeName] = tmpData;
                        if (options.onSuccess) {
                            options.onSuccess();
                        }
                    } else {
                        if (options.onFail) {
                            options.onFail('Bad ' + typeName + ' data found');
                        }
                    }
                } else {
                    if (options.onFail) {
                        options.onFail(JSON.stringify(responseObj));
                    }
                }
            },

            onFailure: function (msg, response) {
                if (options.onFail) {
                    options.onFail(msg);
                }
            }
        });
    },
    // end loadFast
    loadDataFromFile: function () {
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.dataFile);
        if (file.exists()) {
            try {
                liferay.data = JSON.parse(file.read());
                return true;
            } catch (ex) {

            }
        }
        file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, liferay.settings.screens.loader.dataFile);
        if (file.exists()) {
            liferay.data = JSON.parse(file.read());
            return true;
        } else {
            return false;
        }
    },

    saveToAllEventData: function () {
        if (!liferay.data.allEventData) {
            liferay.data.allEventData = [];
        }
        for (var i = 0; i < liferay.data.allEventData.length; i++) {
            var foundEvent = false;
            if (liferay.data.allEventData[i].id == liferay.controller.selectedEvent.eventid) {
                liferay.data.allEventData[i].data = liferay.data.currentEventData;
                foundEvent = true;
            }
        }
        if (!foundEvent) {
            liferay.data.allEventData.push({
                id: liferay.controller.selectedEvent.eventid,
                data: liferay.data.currentEventData
            });
        }
    },
    saveDataToFile: function (data) {
        var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
        if (!folder.exists()) {
            folder.createDirectory();
            folder.remoteBackup = false;
        }

        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.dataFile);
        file.write(JSON.stringify(data));
        file.remoteBackup = false;
    },

    loadEventPreferences: function () {

        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.eventSelectPrefsFile);
        if (file.exists()) {
            try {
                this.preferredEventId = JSON.parse(file.read()).id;
            } catch (ex) {
                this.preferredEventId = null;
            }
            return true;
        } else {
            this.preferredEventId = null;
            return false;
        }
    },

    saveEventPreferences: function () {

        var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
        if (!folder.exists()) {
            folder.createDirectory();
            folder.remoteBackup = false;
        }
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.eventSelectPrefsFile);
        file.write(JSON.stringify({
            "id": this.preferredEventId
        }));
        file.remoteBackup = false;
    },

    loadAppPreferences: function () {

        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.appPrefsFile);
        if (file.exists()) {
            try {
                this.appPreferences = JSON.parse(file.read());
            } catch (ex) {
                this.appPreferences = [];
            }
            return true;
        } else {
            this.appPreferences = [];
            return false;
        }
    },

    saveAppPreferences: function () {

        var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
        if (!folder.exists()) {
            folder.createDirectory();
            folder.remoteBackup = false;
        }
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.appPrefsFile);
        file.write(JSON.stringify(this.appPreferences));
        file.remoteBackup = false;
    },

    getAppPreference: function(key, event) {
        var theKey = key;
        if (event) {
            theKey = event.eventid + '.' + theKey;
        }

        for (var i = 0; i < this.appPreferences.length; i++) {
            if (this.appPreferences[i].name === theKey) {
                return this.appPreferences[i].value;
            }
        }
        // no prefernce
        return null;
    },

    setAppPreference: function(key, val, event) {

        var theKey = key;
        if (event) {
            theKey = event.eventid + '.' + theKey;
        }

        for (var i = 0; i < this.appPreferences.length; i++) {
            if (this.appPreferences[i].name === theKey) {
                this.appPreferences[i].value = val;
                this.saveAppPreferences();
                return;
            }
        }
        // no prefernce
        this.appPreferences.push({name: theKey, value: val});
        this.saveAppPreferences();
    },
//	liferay.controller.news : [
//		{
//			eventId: "eventid",
//			lastReadTime: 234234223,
//			news: [
//				{
//					time: 23423342234,
    //              read: true/false
//					item: newsItem {uuid: "123-123", date: "2014-12-12", time: "12:10", content:"blah", picture:"/images/foo.png", url: "http://liferay.com"}
//				}
//			]
//		}
//		],
//

    getAllNewsItems: function(eventid) {
        if (!liferay.controller.news || liferay.controller.news.length <= 0) {
            return [];
        }
            for (var i = 0; i < liferay.controller.news.length; i++) {
                if (liferay.controller.news[i].eventId == eventid) {
                    return liferay.controller.news[i].news;
                }
            }
    },
    getUnreadNewsCount: function (eventid) {
        if (!liferay.controller.news || liferay.controller.news.length <= 0) {
            return 0;
        } else {
            var count = 0;
            liferay.controller.news.forEach(function (evtNews) {
                if (evtNews.eventId == eventid) {
                    evtNews.news.forEach(function (item) {
                        if (!item.read) {
                            count++;
                        }
                    });
                }
            });
            return count;
        }
    },

    getLastReadTime: function (event) {
        if (!liferay.controller.news) {
            return 0;
        }
        for (var i = 0; i < liferay.controller.news.length; i++) {
            var evtNews = liferay.controller.news[i];
            if (evtNews.eventId == event.eventid) {
                return evtNews.lastReadTime;
            }
        }
        return 0;
    },

    setLastReadTime: function(event, time) {
        if (!liferay.controller.news) {
            return 0;
        }
        for (var i = 0; i < liferay.controller.news.length; i++) {
            var evtNews = liferay.controller.news[i];
            if (evtNews.eventId == event.eventid) {
                evtNews.lastReadTime = time;
                liferay.controller.saveNews();
                return;
            }
        }
    },
    fetchNewsPeriodically: function (event) {
        if (liferay.controller.newsTimer) {
            clearTimeout(liferay.controller.newsTimer);
            liferay.controller.newsTimer = null;
        }
        var lastReadTime = liferay.controller.getLastReadTime(event);

        liferay.controller.fetchNews(event, function (news) {

            var now = new Date().getTime();

            news.map(function (el) {
                return {
                    time: (new liferay.classes.date().setFromISO8601(el.date + 'T' + el.time + ':00')).date.getTime(),
                    item: el
                };
            }).filter(function(item) {
                return (item.time <= now);
            }).sort(function (a, b) {
                return b.time - a.time;
            }).forEach(function (item) {
                liferay.controller.saveItemsToNews(event.eventid, item.time, item.item);
                if (item.time > lastReadTime) {
                    liferay.controller.newNews = true;
                }
            });
            liferay.controller.saveNews();
            if (liferay.model.iOS) {
                var unreadcount = liferay.controller.getUnreadNewsCount(event.eventid);
                if (unreadcount > 0) {
                    Ti.UI.iPhone.appBadge = unreadcount;
                }

                liferay.drawer.setNotificationValue(L('NEWS'), unreadcount);
            }

        }, function (err) {
        });

        liferay.controller.newsTimer = setTimeout(function () {
            liferay.controller.fetchNewsPeriodically(event);
        }, liferay.settings.server.newsFrequencyMins * 60 * 1000);
    },

    saveItemsToNews: function (eventid, time, item) {
        if (!liferay.controller.news) {
            return;
        }

        for (var i = 0; i < liferay.controller.news.length; i++) {
            if (liferay.controller.news[i].eventId == eventid) {
                for (var j = 0; j < liferay.controller.news[i].news.length; j++) {
                    if (liferay.controller.news[i].news[j].item &&
                        liferay.controller.news[i].news[j].item.uuid == item.uuid) {
                        liferay.controller.news[i].news[j].item = item;
                        liferay.controller.news[i].news[j].time = time;
                        return;
                    }
                }
                // no news, so push it
                liferay.controller.news[i].news.push({
                    time: time,
                    item: item,
                    read: false
                });
                // sort all news so most recent is first
                liferay.controller.news.forEach(function (evtNews) {
                    evtNews.news = evtNews.news.sort(function (a, b) {
                        return (b.time - a.time);
                    });
                });
                return;
            }
        }
        // no event news, so push it
        liferay.controller.news.push({
            eventId: eventid,
            lastReadTime: 0,
            news: [{
                time: time,
                item: item,
                read: false
            }]
        });
        // sort all news so most recent is first
        liferay.controller.news.forEach(function (evtNews) {
            evtNews.news = evtNews.news.sort(function (a, b) {
                return (b.time - a.time);
            });
        })

    },

    saveNews: function () {
        var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
        if (!folder.exists()) {
            folder.createDirectory();
            folder.remoteBackup = false;
        }
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.newsFile);
        // sort all news so most recent is first
        liferay.controller.news.forEach(function (evtNews) {
            evtNews.news = evtNews.news.sort(function (a, b) {
                return (b.time - a.time);
            });
        })
        file.write(JSON.stringify(liferay.controller.news));
        file.remoteBackup = false;

    },
    loadNews: function () {
        liferay.controller.news = [];

        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.newsFile);
        if (file.exists()) {
            try {
                liferay.controller.news = JSON.parse(file.read());
                return true;
            } catch (ex) {
                liferay.controller.news = [];
            }
        }
        return false;

    },
    fetchNews: function (event, onSuccess, onFail) {
        Request({
            method: 'POST',
            url: liferay.settings.server.dataHost.host + liferay.settings.server.dataHost.endpoint,
            params: {
                ddlRecordSetId: event.news_type
            },
            onSuccess: function (responseObj) {
                if (Array.isArray(responseObj)) {
                    var tmpData = [];
                    var badDataFound = false;
                    responseObj.forEach(function (el) {
                        if (el.dynamicElements) {
                            tmpData.push(el.dynamicElements);
                        } else {
                            badDataFound = true;
                        }
                    });
                    if (!badDataFound) {
                        liferay.tools.preprocessData(tmpData);
                        if (onSuccess) {
                            onSuccess(tmpData);
                        }
                    } else {
                        if (onFail) {
                            onFail("bad data found");
                        }
                    }
                } else {
                    if (onFail) {
                        onFail("bad data found");
                    }
                }
            },

            onFailure: function (msg, response) {
                if (onFail) {
                    onFail(msg);
                }
            }
        });


        liferay.screens.agendaDetail.loadFavorites();
        var favs = liferay.screens.agendaDetail.getAllFavorites(event);
        if (favs) {
            var processedFavs = favs.map(function (el) {
                var info = liferay.screens.agenda.getAgendaItem(el);
                if (!info) return "";
                var date = info.date;
                var roomName = liferay.screens.agendaDetail.getRoomName(info);
                return (date + ' ' + roomName + ' ' + info.title);
            });

            Request({
                method: 'POST',
                url: liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.favoritesServiceEndpoint,
                params: {
                    event: event.eventid,
                    id: Ti.Platform.id,
                    favorites: JSON.stringify(processedFavs)
                },
                onSuccess: function (response) {
                },
                onFailure: function (msg, err) {
                }
            });
        }
        var currentBeacons = liferay.beacons.currentBeacons;
        var currentRegions = liferay.beacons.currentRegions;

        if ((currentBeacons || currentRegions) && (currentBeacons.length > 0 || currentRegions.length > 0)) {
            Request({
                method: 'POST',
                url: liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.beaconServiceEndpoint,
                params: {
                    event: event.eventid,
                    // TODO: put back
                    id: Ti.Platform.id,
                    // id: cid,
                    currentBeacons: currentBeacons ? JSON.stringify(currentBeacons) : "",
                    currentRegions: currentRegions ? JSON.stringify(currentRegions) : ""
                },
                onSuccess: function (response) {
                }
            });
        }
    },

    pushDeviceToken: null,
    subscribeToPush: function() {
      if (liferay.model.iOS) {
          var deviceToken = null;
          // Check if the device is running iOS 8 or later
          if (liferay.model.iOS8) {

              // Wait for user settings to be registered before registering for push notifications
              Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

                  // Remove event listener once registered for push notifications
                  Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

                  Ti.Network.registerForPushNotifications({
                      success: deviceTokenSuccess,
                      error: deviceTokenError,
                      callback: receivePush
                  });
              });

              // Register notification types to use
              Ti.App.iOS.registerUserNotificationSettings({
                  types: [
                      Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
                      Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
                      Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
                  ]
              });
          } else {
              // For iOS 7 and earlier
              Ti.Network.registerForPushNotifications({
                  // Specifies which notifications to receive
                  types: [
                      Ti.Network.NOTIFICATION_TYPE_BADGE,
                      Ti.Network.NOTIFICATION_TYPE_ALERT,
                      Ti.Network.NOTIFICATION_TYPE_SOUND
                  ],
                  success: deviceTokenSuccess,
                  error: deviceTokenError,
                  callback: receivePush
              });
          }
            // Process incoming push notifications
          function receivePush(e) {

              // when app is running in foreground, received any time:
              //e = {
              //    "success": true,
              //    "data": {
              //        "vibrate": true,
              //        "payload": "{\"screen\":\"gallery\",\"title\":\"Liferay Events\",\"smallIcon\":\"ic_stat_lrlogo.png\",\"ticker\":\"New Notification from Liferay Events\",\"screenDetail\":\"\"}",
              //        "alert": "Don't miss out on photos!",
              //        "sound": "default",
              //        "badge": 1,
              //        "aps": {"alert": "Don't miss out on photos!", "badge": 1, "sound": "default"}
              //    },
              //    "code": 0,
              //    "source": {},
              //    "type": "remote",
              //    "inBackground": false
              //};


              var payloadObj = {};

              try {
                  payloadObj = JSON.parse(e.data.payload);
              } catch (ex) {
                  console.log("FAILED To parse payload: " + e.data.payload);
              }

              var message = e.data.alert;

              if (payloadObj.localizedKey) {
                message = L(payloadObj.localizedKey);
              }

              if (payloadObj.localizedKey && payloadObj.localizedArgs) {
                  message = String.format.apply(this, [L(payloadObj.localizedKey)].concat(JSON.parse(payloadObj.localizedArgs)));
              }

              if (e.inBackground && !liferay.controller.getCurrentView()) {
                  // received notification while app not running

                  liferay.controller.missedPush = {
                      title: payloadObj.title,
                      message: message,
                      screen: payloadObj.screen,
                      screenDetail: payloadObj.screenDetail,
                      payload: payloadObj
                  };

              } else if (!e.inBackground || (e.inBackground && liferay.controller.getCurrentView())) {
                  // coming back from backgrounded app or in foreground, so show dialog
                  var eventId = payloadObj.eventId;

                  if (payloadObj.saveToNews) {
                      var picUrl = payloadObj.picUrl;
                      var picLink = payloadObj.picLink;

                      var item = {
                          time: new Date().getTime(),
                          item: {
                              content:message,
                              url:picLink,
                              picture: picUrl,
                              uuid: new Date().getTime()
                          }
                      };
                      liferay.controller.saveItemsToNews(eventId, item.time, item.item);
                      if (liferay.controller.selectedEvent && liferay.controller.selectedEvent.eventid == eventId) {
                          liferay.controller.newNews = true;
                          liferay.controller.saveNews();
                          var unreadcount = liferay.controller.getUnreadNewsCount(eventId);
                          if (unreadcount > 0) {
                              Ti.UI.iPhone.appBadge = unreadcount;
                              liferay.drawer.setNotificationValue(L('NEWS'), unreadcount);
                          }
                      }
                  }

                  var isCurrentEvent = true;
                  if (payloadObj.screen && (!liferay.controller.selectedEvent || (liferay.controller.selectedEvent.eventid != eventId))) {
                      // push has a screen link but for a different event, so don't show
                      isCurrentEvent = false;
                  }

                  var shouldShow = true;
                  if (payloadObj.screen) {
                      shouldShow = liferay.controller.testPushAction(payloadObj.screen, payloadObj.screenDetail);
                  }
                  if (shouldShow) {

                      var dialog = Ti.UI.createAlertDialog({
                          title: payloadObj.title,
                          message: message,
                          buttonNames: [payloadObj.screen ? L('VIEW') : L('OK')],
                          cancel: 1
                      });
                      dialog.addEventListener("click", function (event) {
                          dialog.hide();
                          if (event.index == 0) {
                              /* Do stuff to view the notification */
                              if (payloadObj.screen && !isCurrentEvent) {
                                  liferay.tools.alert(L('NOTE'), L('WRONG_EVENT'));
                                  return;
                              }

                              if (payloadObj.screen) {
                                  liferay.controller.loadPushAction(payloadObj.screen, payloadObj.screenDetail);
                              }
                          }
                      });
                      dialog.show();
                  }
              }

          }
          // Save the device token for subsequent API calls
          function deviceTokenSuccess(e) {
              liferay.controller.pushDeviceToken = e.deviceToken;
              if (liferay.controller.selectedEvent && liferay.controller.pushDeviceToken) {
                  var platform = (liferay.model.iOS) ? 'apple' : (liferay.model.android ? 'android' : null);
                  var emailAddress = liferay.drawer.getEmailAddress();

                  liferay.controller.registerToken(e.deviceToken,
                      platform, liferay.controller.selectedEvent.eventid, emailAddress,
                      function() {
                      }, function(err) {

                      });
              }
          }
          function deviceTokenError(e) {
              console.log('Failed to register for push notifications! ' + JSON.stringify(e));
          }

      }  else if (liferay.model.android) {

          var gcm = require("nl.vanvianen.android.gcm");

          /* If the app is started or resumed act on pending data saved when the notification was received */
          var lastData = gcm.getLastData();
          if (lastData) {
              Ti.API.info("Last notification received " + JSON.stringify(lastData));
                // called when activity opened when app closed
              //var lastData = {
              //    "title": "Liferay Events",
              //    "collapse_key": "do_not_collapse",
              //    "badge": "1",
              //    "sound": "default",
              //    "payload": "{\"body\":\"Don't miss out on stuff!\",\"screen\":\"agendaDetail\",\"title\":\"Liferay Events\",\"ticker\":\"New Notification from Liferay Events\",\"sound\":\"default\",\"screenDetail\":\"James Falkner\",\"vibrate\":true,\"badge\":1}",
              //    "from": "234324224",
              //    "message": "Don't miss out on stuff!",
              //    "ticker": "New Notification from Liferay Events",
              //    "vibrate": "true"
              //};

              var payloadObj = {};

              try {
                  payloadObj = JSON.parse(lastData.payload);
              } catch (ex) {
                  console.log("FAILED To parse payload: " + lastData.payload);
              }

              var message = lastData.message;

              if (payloadObj.localizedKey) {
                  message = L(payloadObj.localizedKey);
              }

              if (payloadObj.localizedKey && payloadObj.localizedArgs) {
                  message = String.format.apply(this, [L(payloadObj.localizedKey)].concat(JSON.parse(payloadObj.localizedArgs)));
              }

              liferay.controller.missedPush = {
                  title: lastData.title,
                  message: message,
                  screen: payloadObj.screen,
                  screenDetail: payloadObj.screenDetail,
                  payload: payloadObj
              };
              gcm.clearLastData();

          }

          gcm.registerPush({
              /* The Sender ID from Google Developers Console, see https://console.developers.google.com/project/XXXXXXXX/apiui/credential */
              /* It's the same as your project id */
              senderId: Ti.App.Properties.getString('liferay.gcm.senderid'),
              notificationSettings: {
                  //sound: 'mysound.mp3', /* Place in platform/android/res/raw/mysound.mp3 */
                  smallIcon: 'ic_stat_lrlogo.png',  /* Place in platform/android/res/drawable/notification_icon.png */
                  largeIcon: 'appicon.png',  /* Same */
                  vibrate: true
              },
              success: function (event) {
                  Ti.API.info("Push registration success: " + JSON.stringify(event));
                  /* Add code to send event.registrationId to your server */
                  liferay.controller.pushDeviceToken = event.registrationId;
                //  liferay.controller.registerToken(liferay.controller.pushDeviceToken);

              },
              error: function (event) {
                  Ti.API.info("Push registration error = " + JSON.stringify(event));
              },
              callback: function (event) {
                  Ti.API.info("Push callback = " + JSON.stringify(event));
                  //event = {
                  //    "data": {
                  //        "title": "Liferay Events",
                  //        "collapse_key": "do_not_collapse",
                  //        "badge": "1",
                  //        "sound": "default",
                  //        "payload": "{\"body\":\"Don't miss out on stuff!\",\"screen\":\"agendaDetail\",\"title\":\"Liferay Events\",\"ticker\":\"New Notification from Liferay Events\",\"sound\":\"default\",\"screenDetail\":\"James Falkner\",\"vibrate\":true,\"badge\":1}",
                  //        "message": "Don't miss out on stuff!",
                  //        "from": "23423342",
                  //        "vibrate": "true",
                  //        "ticker": "New Notification from Liferay Events"
                  //    }
                  //};
                  /* Called when a notification is received and the app is running */
                  gcm.clearLastData();

                  var data = event.data;
                  var payloadObj = {};
                  try {
                      payloadObj = JSON.parse(data.payload);
                  } catch (ex) {
                      console.log("FAILED to parse payload: " + data.payload);
                  }

                  var message = data.message;

                  if (payloadObj.localizedKey) {
                      message = L(payloadObj.localizedKey);
                  }

                  if (payloadObj.localizedKey && payloadObj.localizedArgs) {
                      message = String.format.apply(this, [L(payloadObj.localizedKey)].concat(JSON.parse(payloadObj.localizedArgs)));
                  }
                  var eventId = payloadObj.eventId;

                  if (payloadObj.saveToNews) {
                      var picUrl = payloadObj.picUrl;
                      var picLink = payloadObj.picLink;

                      var item = {
                          time: new Date().getTime(),
                          item: {
                              content:message,
                              url:picLink,
                              picture: picUrl,
                              uuid: new Date().getTime()
                          }
                      };
                      liferay.controller.saveItemsToNews(eventId, item.time, item.item);
                      if (liferay.controller.selectedEvent && liferay.controller.selectedEvent.eventid == eventId) {
                          liferay.controller.newNews = true;
                          liferay.controller.saveNews();
                          var unreadcount = liferay.controller.getUnreadNewsCount(eventId);
                          if (unreadcount > 0) {
                              liferay.drawer.setNotificationValue(L('NEWS'), unreadcount);
                          }
                      }
                  }

                  var isCurrentEvent = true;
                  if (payloadObj.screen && (!liferay.controller.selectedEvent || (liferay.controller.selectedEvent.eventid != eventId))) {
                      // push has a screen link but for a different event, so don't show
                      isCurrentEvent = false;
                  }


                  var shouldShow = true;
                  if (payloadObj.screen) {
                      shouldShow = liferay.controller.testPushAction(payloadObj.screen, payloadObj.screenDetail);
                  }
                  if (shouldShow) {
                      var dialog = Ti.UI.createAlertDialog({
                          title: data.title,
                          message: message,
                          buttonNames: [payloadObj.screen ? L('VIEW'): L('OK')],
                          cancel: 1
                      });
                      dialog.addEventListener("click", function(event) {
                          dialog.hide();
                          if (event.index == 0) {
                              /* Do stuff to view the notification */
                              if (payloadObj.screen && !isCurrentEvent) {
                                  liferay.tools.alert(L('NOTE'), L('WRONG_EVENT'));
                                  return;
                              }

                              if (payloadObj.screen) {
                                  liferay.controller.loadPushAction(payloadObj.screen, payloadObj.screenDetail);
                              }
                          }
                      });
                      dialog.show();
                  }
              }
          });

      }
    },
    testPushAction: function(screen, screenDetail) {
        var windowName = screen;
        var windowParams = [];
        if (screenDetail) windowParams = screenDetail.split(';;');

        var shouldShowAction = false;

        var currentView = liferay.controller.getCurrentView();
        if (currentView === liferay.screens[windowName]) {
            shouldShowAction = currentView.testAction("DUMMY", windowParams, "");
        } else {
            var view = liferay.screens[windowName];
            if (view) {
                shouldShowAction = view.testAction("DUMMY", windowParams, "");
            }
        }

        return !!shouldShowAction;

    },
    loadPushAction: function(screen, screenDetail) {

        liferay.connect.forceSync();

        var windowName = screen;
        var windowParams = [];
        if (screenDetail) windowParams = screenDetail.split(';;');

        var currentView = liferay.controller.getCurrentView();
        if (currentView === liferay.screens[windowName]) {
            currentView.loadAction(windowParams, "", function() {});
        } else {
            var view = liferay.screens[windowName];
            if (view) {
                liferay.controller.open(view.render(), view);
                view.loadAction(windowParams, "", function() {});
            }
        }

    },
    registerToken: function(token, platform, channel, emailAddress, onSuccess, onFailure) {

        Request({
            method: 'POST',
            hashAlg: 'sha',
            sigName: 'signature',
            url: liferay.settings.server.pushHost.host + liferay.settings.server.pushHost.addDeviceEndpoint,
            params: {
                token: token,
                platform: platform,
                channel: channel,
                emailAddress: emailAddress
            },
            onSuccess: function (newDevice) {
                if (newDevice && newDevice.exception) {
                    onFailure && onFailure(newDevice.exception + newDevice.message);
                    return;
                }

                if (!newDevice.pushNotificationsDeviceId) {
                    onFailure && onFailure("No valid push device returned for token:" + token + " platform:" + platform + " channel:" +  channel);
                }
                onSuccess && onSuccess(newDevice);

            },
            onFailure: onFailure
        });
    }
};
