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

var TiBeacons = null;
var listenersAdded = false;
var iOSBTStatus = true;
var iOSBTStatusChecked = false;

var androidPlatformTools = null;
var notifications = [];
var androidNotificationIds = 0;
if (Ti.Platform.osname == 'android') {
    if (Ti.Platform.Android.API_LEVEL >= 18) {
        TiBeacons = require('com.liferay.beacons');
        TiBeacons.disableAutoRanging();
        androidPlatformTools = require('bencoding.android.tools').createPlatform();
        var wasInForeGround = true;

        setInterval(function() {
            var isInForeground = androidPlatformTools.isInForeground();

            if (wasInForeGround !== isInForeground) {
                wasInForeGround = isInForeground;
                TiBeacons.setBackgroundMode(!isInForeground);
                // if coming back into fg, cancel notifications
                if (isInForeground) {
                    Ti.Android.NotificationManager.cancelAll();
                    notifications = [];
                }
            }
        }, 5000);
    }

}



Ti.App.addEventListener("resume", function(e) {
    liferay.beacons.inBackground = false;
});

Ti.App.addEventListener("resumed", function(e) {
    if (!liferay.beacons.currentEventId) {
        return;

    }
    liferay.beacons.inBackground = false;
    if (liferay.beacons.inactive) {
        // coming back from a temporary interruption, so no need to restart stuff
        liferay.beacons.inactive = false;
        return;
    }
    if (liferay.controller.selectedEvent) {
        Ti.UI.iPhone.appBadge = liferay.controller.getUnreadNewsCount(liferay.controller.selectedEvent.eventid);
    }

    // pick up history
    var historyStr = Ti.App.Properties.getString("com.liferay.beacons.history");
    if (historyStr) {
        try {
            liferay.beacons.currentEventData.history = JSON.parse(historyStr);
            liferay.beacons.saveDataToFile();
        } catch (ex) {
        }
    }

    liferay.beacons.startRegionMonitoring();
});

Ti.App.addEventListener("paused", function(e) {
    liferay.beacons.inBackground = true;
    liferay.beacons.inactive = false;
    liferay.beacons.stopRegionMonitoring();
    liferay.beacons.clearAllQueuedTriggers();
});

Ti.App.addEventListener("pause", function(e) {
    liferay.beacons.inactive = true;

    if (!liferay.beacons.currentEventId) {
        return;
    }


    Ti.App.Properties.setString("com.liferay.beacons.prefs", JSON.stringify(liferay.beacons.currentEventData.preferences));
    Ti.App.Properties.setString("com.liferay.beacons.regs", JSON.stringify(liferay.beacons.getUnmutedRegions()));
    Ti.App.Properties.setString("com.liferay.beacons.eventName", liferay.controller.selectedEvent.menutitle);
    Ti.App.Properties.setInt("com.liferay.badge", Ti.UI.iPhone.appBadge);

    if (liferay.beacons.currentEventData.beacon_region_events) {
        Ti.App.Properties.setString("com.liferay.beacons.region_events", JSON.stringify(liferay.beacons.currentEventData.beacon_region_events));
    }

    if (liferay.beacons.currentEventData.history) {
        Ti.App.Properties.setString("com.liferay.beacons.history", JSON.stringify(liferay.beacons.currentEventData.history));
    }

    if (!liferay.screens.agenda.processedAgenda || liferay.screens.agenda.processedAgenda.length <= 0) {
        liferay.screens.agenda.processAgenda();
    }
    Ti.App.Properties.setString("com.liferay.beacons.eventAgenda", JSON.stringify(liferay.screens.agenda.processedAgenda));
    Ti.App.Properties.setString("com.liferay.beacons.eventRooms", JSON.stringify(liferay.data.currentEventData.rooms));
    Ti.App.Properties.setString("com.liferay.beacons.eventSpeakers", JSON.stringify(liferay.data.currentEventData.speakers));


});

liferay.beacons = {
    allEventData: [
//        {
//            eventId: "",
//            data: {
//                history: [],
//                preferences: [],
//                beacon_regions: [],
//                beacon_region_events: [],
//                beacon_individual_events: [],
//                beacon_forms: []
//            }
//        }
    ],
    inBackground: false,
    currentRegions: [],
    currentBeacons: [],
    currentEventData: {},
    currentEventId: "",
    queuedTriggers: [],
    queueDeathRow: [],
    shortCircuitTimers: [],
    lastGlobalTrigger: 0,
    tempMute: false,
    tempMuteTimeout: null
};

liferay.beacons.initModule = function() {
    if (TiBeacons != null) return;

    if (liferay.model.iOS7) {
        TiBeacons = require('org.beuckman.tibeacons');
        Ti.App.iOS.registerBackgroundService({url:'includes/beacons-bg-ios.js'});
        Ti.App.iOS.addEventListener("notification", liferay.beacons.handleBgEvent);

        TiBeacons.addEventListener("bluetoothStatus", function(e){
            iOSBTStatusChecked = true;
            iOSBTStatus = (e.status === 'on');
        });

        TiBeacons.requestBluetoothStatus();

    }

};

liferay.beacons.hasBeaconSupport = function() {
    if (liferay.model.android) {
        if (Ti.Platform.Android.API_LEVEL >= 18) {
            if (TiBeacons != null) {
                return TiBeacons.checkAvailability();
            } else {
                return false;
            }
        }
    } else if (liferay.model.iOS7) {
        var tmpMod = require('org.beuckman.tibeacons');
        if (tmpMod.checkAvailability) {
            return tmpMod.checkAvailability();
        } else if (iOSBTStatusChecked) {
            return iOSBTStatus;
        } else {
            return true;
        }
    } else {
        return false;
    }
};

liferay.beacons.handleRangeEvent = function(e) {

    liferay.beacons.flashBeaconLight();

    if (e.count > 0 && e.identifier) {
        if (liferay.beacons.currentRegions.indexOf(e.identifier) < 0) {
            liferay.beacons.handleRegionEnter({
                identifier: e.identifier
            });
        }
    }


};

liferay.beacons.startRegionMonitoring = function() {

    if (liferay.beacons.inBackground) {
        return;
    }
    if (!liferay.beacons.currentEventData.beacon_regions) {
        return;
    }

    liferay.beacons.initModule();

    if (!TiBeacons) {
        return;
    }

    if (!liferay.beacons.hasBeaconSupport()) {
        return;
    }



    var monitoring = false;
    var monitoredRegions = [];
    var unmutedRegions = [];
    liferay.beacons.currentEventData.beacon_regions.forEach(function(region) {
        if (!region.muted && !liferay.beacons.isRegionMuted(region)) {
            unmutedRegions.push(region);
        }

        monitoring = true;
        monitoredRegions.push(region);
    });

    if (monitoring) {

        liferay.screens.front.beaconButtonOff.visible = (unmutedRegions.length <= 0);
        liferay.screens.front.beaconButton.visible = !liferay.screens.front.beaconButtonOff.visible;

        if (!listenersAdded) {
            TiBeacons.addEventListener("enteredRegion", liferay.beacons.handleRegionEnter);
            TiBeacons.addEventListener("exitedRegion", liferay.beacons.handleRegionExit);
            TiBeacons.addEventListener("determinedRegionState", liferay.beacons.handleRegionDeterminedState);

            TiBeacons.addEventListener("beaconProximity", liferay.beacons.handleProximityEvent);
            TiBeacons.addEventListener("beaconRanges", liferay.beacons.handleRangeEvent);
            listenersAdded = true;
        }

        monitoredRegions.forEach(function(region) {
            var reg = {
                identifier: region.name,
                uuid: region.beacon_uuid
            };

            if (region.beacon_major) {
                reg.major = parseInt(region.beacon_major);
            }

            if (region.beacon_minor) {
                reg.minor = parseInt(region.beacon_minor);
            }
            TiBeacons.startMonitoringForRegion(reg);

        });

    } else {
        liferay.beacons.stopRegionMonitoring();
    }
};

liferay.beacons.handleBgEvent = function(e) {

    if (!e.userInfo || !e.userInfo.event || !e.userInfo.action) return;

    var region_name = e.userInfo.event;
    var action = e.userInfo.action;
    var event_override_uuid = e.userInfo.event_override_uuid;

    if (action == "entered") {
        liferay.beacons.handleRegionEnter({
            identifier: region_name,
            event_override_uuid: event_override_uuid
        });
    } else if (action == "exited") {
        liferay.beacons.handleRegionExit({
            identifier: region_name,
            event_override_uuid: event_override_uuid
        });
    }
};

liferay.beacons.getRegionForBeaconData = function(uuid, major, minor) {
    var bestRegMatch = null;
    var bestRegMatchCount = 0;
    for (var i = 0; i < liferay.beacons.currentEventData.beacon_regions.length; i++) {
        var matchCount;
        var reg = liferay.beacons.currentEventData.beacon_regions[i];
        if (reg.beacon_uuid && reg.beacon_uuid.toUpperCase() == uuid.toUpperCase()) {
            if (reg.beacon_major && reg.beacon_major == major) {
                if (reg.beacon_minor && reg.beacon_minor == minor) {
                    matchCount = 3;
                } else {
                    matchCount = 2;
                }
            } else {
                matchCount = 1;
            }
        } else {
            matchCount = 0;
        }

        if (matchCount > bestRegMatchCount) {
            bestRegMatch = reg;
            bestRegMatchCount = matchCount;
        }
    }

    return bestRegMatch;
};

liferay.beacons.getIndividualBeaconEvent = function(uuid, major, minor) {

    var reg = liferay.beacons.getRegionForBeaconData(uuid, major, minor);
    if (!reg) return null;

    if (liferay.beacons.currentEventData && liferay.beacons.currentEventData.beacon_individual_events) {
        for (var i = 0; i < liferay.beacons.currentEventData.beacon_individual_events.length; i++) {

            var individual_event = liferay.beacons.currentEventData.beacon_individual_events[i];

            if (individual_event.region_name != reg.name) continue;

            var matchEvent = false;
            if (!reg.beacon_major && !reg.beacon_minor) {
                if (individual_event.beacon_major == major && individual_event.beacon_minor == minor) {
                    matchEvent = true;
                }
            } else if (reg.beacon_major && !reg.beacon_minor) {
                if (individual_event.beacon_minor == minor) {
                    matchEvent = true;
                }
            } else if (!reg.beacon_major && reg.beacon_minor) {
                // should not happen, so fail
                matchEvent = false;
            } else {
                matchEvent = true;
            }
            if (matchEvent) {
                return individual_event;
            }
        }
    }
    return null;
};

liferay.beacons.flashBeaconLight = function() {
    if (liferay.screens.front && liferay.screens.front.beaconLightsEnabled && liferay.screens.front.beaconButtonBeaconActivityLight) {

        setTimeout(function() {
            liferay.screens.front.beaconButtonBeaconActivityLight.backgroundColor = 'green';
            setTimeout(function () {
                liferay.screens.front.beaconButtonBeaconActivityLight.backgroundColor = 'transparent';
            }, 100 + (Math.random() * 200));
        }, 20 + Math.random() * 500);

        setTimeout(function() {
            liferay.screens.front.beaconButtonRegionActivityLight.backgroundColor = 'orange';
            setTimeout(function() {
                liferay.screens.front.beaconButtonRegionActivityLight.backgroundColor = 'transparent';
            }, 100 + (Math.random() * 200));

        }, 50 + Math.random() * 600);
    }
};

liferay.beacons.handleProximityEvent = function(e) {
    liferay.beacons.flashBeaconLight();

    if (liferay.beacons.inBackground) {
        return;
    }

    // record presence
    var ind_event = liferay.beacons.getIndividualBeaconEvent(e.uuid, e.major, e.minor);
    if (ind_event) {
        var bi = -1;
        for (var i = 0; i < liferay.beacons.currentBeacons.length; i++) {
            if (liferay.beacons.currentBeacons[i].beacon_name == ind_event.beacon_name) {
                bi = i;
                break;
            }
        }

        if (bi >= 0) {
            if (e.proximity == "unknown") {
                liferay.beacons.currentBeacons.splice(bi, 1);
            } else {
                liferay.beacons.currentBeacons[bi].proximity = e.proximity;
            }
        } else {
            if (e.proximity != "unknown") {
                liferay.beacons.currentBeacons.push({
                    beacon_name: ind_event.beacon_name,
                    proximity: e.proximity
                });
            }
        }

        var region = liferay.beacons.getRegionForBeaconData(e.uuid, e.major, e.minor);

        if (!region || region.muted || liferay.beacons.isRegionMuted(region)) {
            return;
        }

        var count = liferay.beacons.getCount(ind_event);
        var last = liferay.beacons.getLastTrigger(ind_event);
        var timeSinceLast = new Date().getTime() - last;
        if (((ind_event.on_proximity.indexOf("any") >= 0) || (ind_event.on_proximity.indexOf(e.proximity) >= 0)) && timeSinceLast >= (ind_event.min_repeat_period * 1000) && count < ind_event.repeat) {
            liferay.beacons.triggerEvent(ind_event);
        }
    }
};

liferay.beacons.handleRegionDeterminedState = function(e) {
    liferay.beacons.flashBeaconLight();

    if (liferay.beacons.inBackground) {
        return;
    }
//    e.identifier (region name)
//    e.regionState - inside,outside,unknown

    if (e.regionState == "inside") {
        liferay.beacons.handleRegionEnter(e);
    } else if (e.regionState == "outside") {
        // only trigger if we think we were in the zone at some point in the past
        if (liferay.beacons.currentRegions.indexOf(e.identifier) >= 0) {
            liferay.beacons.handleRegionExit(e);
        }
    }
};

liferay.beacons.handleRegionEnter = function(e) {
    if (liferay.beacons.inBackground) {
        return;
    }
    var region = liferay.beacons.getRegionByName(e.identifier);
    if (!region) return;

    // record entry
    var ci = liferay.beacons.currentRegions.indexOf(e.identifier);
    if (ci < 0) {
        liferay.beacons.currentRegions.push(e.identifier);
    }

    // turn on ranging
    TiBeacons.startRangingForBeacons({
        identifier: region.name,
        uuid: region.beacon_uuid,
        major: region.major ? region.major : null,
        minor: region.minor ? region.minor : null
    });

    liferay.beacons.manageDeathRow(region, "entry", "exit");

    if (e.event_override_uuid) {
        var event = liferay.beacons.getRegionEventByUuid(e.event_override_uuid);
        if (event) {
            liferay.beacons.executeEventTrigger(event, false);
        }
    } else {
        liferay.beacons.handleRegionEvent(e.identifier, "entry");
    }
};

liferay.beacons.handleRegionExit = function(e) {
    if (liferay.beacons.inBackground) {
        return;
    }
    var region = liferay.beacons.getRegionByName(e.identifier);
    if (!region) return;

    // record exit
    liferay.beacons.currentRegions = liferay.beacons.currentRegions.filter(function(el) {
       return el != region.name;
    });

    liferay.beacons.manageDeathRow(region, "exit", "entry");

    if (e.event_override_uuid) {
        var event = liferay.beacons.getRegionEventByUuid(e.event_override_uuid);
        if (event) {
            liferay.beacons.executeEventTrigger(event, false);
        }
    } else {
        liferay.beacons.handleRegionEvent(e.identifier, "exit");
    }
};

liferay.beacons.clearAllQueuedTriggers = function() {
    // kill all queued triggers and erase the queue death row
    liferay.beacons.queuedTriggers.forEach(function(trigger) {
        clearTimeout(trigger.timer);
    });
    liferay.beacons.queueDeathRow.forEach(function(trigger) {
        clearTimeout(trigger.timer);
    });

    liferay.beacons.shortCircuitTimers.forEach(function(timer) {
        clearTimeout(timer);
    });

    liferay.beacons.queuedTriggers = [];
    liferay.beacons.queueDeathRow = [];
    liferay.beacons.shortCircuitTimers = [];

};

liferay.beacons.manageDeathRow = function(region, action, pardoner) {
    // pardon any deathrow inmates

    liferay.beacons.queueDeathRow = liferay.beacons.queueDeathRow.filter(function(timer) {
        if (timer.region_name == region.name && timer.pardoner == action) {
            clearTimeout(timer.timer);
            return false;
        } else {
            return true;
        }
    });

    // put new queued events for this region on deathrow
    liferay.beacons.queuedTriggers.forEach(function(trigger) {
        if (trigger.region_name == region.name && trigger.action != action) {
            var timeLeft = trigger.eta - (new Date().getTime());
            var deathTimer = setTimeout(function () {
                clearTimeout(trigger.timer);
                liferay.beacons.queuedTriggers = liferay.beacons.queuedTriggers.filter(function(el) {
                    return el != trigger;
                });

                liferay.beacons.queueDeathRow = liferay.beacons.queueDeathRow.filter(function(dr) {
                    return (dr.origTimer != trigger.timer);
                });

            }, timeLeft / 2);
            liferay.beacons.queueDeathRow.push({
                timer: deathTimer,
                origTimer: trigger.timer,
                eta: new Date().getTime() + (timeLeft / 2),
                region_name: region.name,
                pardoner: pardoner
            });
        }
    });

};

liferay.beacons.handleRegionEvent = function(region_name, type) {
    if (liferay.beacons.currentEventData && liferay.beacons.currentEventData.beacon_region_events) {
        var region = liferay.beacons.getRegionByName(region_name);
        if (!region || region.muted || liferay.beacons.isRegionMuted(region)) return;

        liferay.beacons.currentEventData.beacon_region_events.forEach(function(region_event) {
            if (region_event.region_name == region.name && region_event.on == type) {
                var count = liferay.beacons.getCount(region_event);
                var last = liferay.beacons.getLastTrigger(region_event);
                var timeSinceLast = new Date().getTime() - last;
                if (timeSinceLast >= (region_event.min_repeat_period * 1000) && count < region_event.repeat) {
                    liferay.beacons.triggerEvent(region_event);
                }
            }
        });
    }
};

liferay.beacons.triggerEvent = function(event) {
    // check dates
    var now = new Date();
    if (event.start_date && event.start_time) {
        var startDate = new liferay.classes.date().setFromISO8601(event.start_date + 'T' + event.start_time + ':00').date;
        if (startDate.getTime() > now.getTime()) {
            return;
        }

    }
    if (event.end_date && event.end_time) {
        var endDate = new liferay.classes.date().setFromISO8601(event.end_date + 'T' + event.end_time + ':00').date;
        if (endDate.getTime() < now.getTime()) {
            return;
        }

    }

    if (event.preferences_gate) {
        var prefsRequired = event.preferences_gate.split(',').map(function(el) { return el.trim();});
        for (var i = 0 ; i < prefsRequired.length; i++) {
            var prefRequired = prefsRequired[i];
            if (prefRequired.indexOf('!') == 0) {
                var negPref = prefRequired.substring(1);
                if (liferay.beacons.getPreference(negPref)) {
                    return;
                }
            } else {
                if (!liferay.beacons.getPreference(prefRequired)) {
                    return;
                }
            }
        }
    }

    // if the exact same region event is in the queue to be fired in the future, don't add a new one
    for (i = 0; i < liferay.beacons.queuedTriggers.length; i++) {
        var trigger = liferay.beacons.queuedTriggers[i];
        if (trigger.target_event == event) {
            return;
        }
    }


    if (event.initial_delay <= 0) {

        if (liferay.beacons.tempMute || (new Date().getTime() - liferay.beacons.lastGlobalTrigger) < (liferay.settings.server.beaconGlobalFrequencyLimitSecs * 1000)) {
            // tempMute or global trigger limit in effect, but don't lose the thing!
            liferay.beacons.shortCircuitTimers.push(setTimeout(function() {
                liferay.beacons.executeEventTrigger(event, true);
            }, liferay.settings.server.beaconGlobalFrequencyLimitSecs * 1000));
        } else {
            liferay.beacons.executeEventTrigger(event, true);
        }
    } else {

        trigger = {
            region_name: event.region_name,
            eta: (new Date().getTime() + (event.initial_delay * 1000)),
            action: event.on,
            target_event: event
        };

        trigger.timer = setTimeout(function () {
            // remove from queue
            liferay.beacons.queuedTriggers = liferay.beacons.queuedTriggers.filter(function (el) {
                return el != trigger;
            });

            liferay.beacons.executeEventTrigger(event, true);

        }, event.initial_delay * 1000);

        if (event.cancelable) {
            liferay.beacons.queuedTriggers.push(trigger);
        }
    }
};

liferay.beacons.executeEventTrigger = function(event, recordFlag) {
    if (liferay.beacons.tempMute) {
        return;
    }
//    // TODO: remove
//    liferay.beacons.currentEventData.preferences = [];
//    liferay.beacons.currentEventData.history = [];

    // one last check to avoid multiple popups for short circuit queued events
    if (recordFlag) {
        var count = liferay.beacons.getCount(event);
        var last = liferay.beacons.getLastTrigger(event);
        var timeSinceLast = new Date().getTime() - last;
        if (timeSinceLast < (event.min_repeat_period * 1000) || count >= event.repeat) {
            return;
        }

        if (event.preferences_gate) {
            var prefsRequired = event.preferences_gate.split(',').map(function(el) { return el.trim();});
            for (i = 0 ; i < prefsRequired.length; i++) {
                var prefRequired = prefsRequired[i];
                if (prefRequired.indexOf('!') == 0) {
                    var negPref = prefRequired.substring(1);
                    if (liferay.beacons.getPreference(negPref)) {
                        return;
                    }
                } else {
                    if (!liferay.beacons.getPreference(prefRequired)) {
                        return;
                    }
                }
            }
        }

    }

    var message = event.message.trim();
    if (message.indexOf('[') == 0) {
        var msgArr = JSON.parse(message);
        var newMsgArr = msgArr.filter((function(m) {
            return (m.indexOf('BG:') != 0)
        }));
        if (!newMsgArr || newMsgArr.length ==0 ) {
            newMsgArr = [msgArr[0].substring(3)];
        }

        var rnd = Math.floor(Math.random() * newMsgArr.length);
        message = newMsgArr[rnd];
    }
    if (!event.actions) {
        if (recordFlag) {
            liferay.beacons.recordTrigger(event.uuid);
        }
        liferay.beacons.lastGlobalTrigger = new Date().getTime();
        liferay.tools.alert(L('NOTE'), message);
        return;
    }
    var actionSpec = event.actions.split('&&').map(function(el) { return el.trim();});

    var buttonNames = actionSpec.map(function(el) {
        return el.substring(0, el.indexOf(';;')).trim();
    });

    var actions = actionSpec.map(function(el) {
        return el.substring(el.indexOf(';;') + 2).trim();
    });

    var finalButtons = [];
    var finalActions = [];
    actions.forEach(function(el, idx) {
        var newMsg = liferay.beacons.testAction(message, el, event.uuid);
        if (newMsg != null) {
            message = newMsg;
            finalActions.push(el);
            finalButtons.push(buttonNames[idx]);
        }
    });

    if (finalActions.length <= 0) {
        // no actions would be successful!
        return;
    }

    finalButtons.push(L('MUTE') + '...');
    finalActions.push("mute;;" + event.region_name);

    if (liferay.model.iOS) {
        finalButtons.push(L('CLOSE'));
        finalActions.push("noop;;");
    }

    var alertDialog = Titanium.UI.createAlertDialog({
        title : liferay.controller.selectedEvent.menutitle,
        message : message,
        buttonNames : finalButtons,
        persistent: true
    });

    if (liferay.model.iOS) {
        alertDialog.cancel = finalButtons.length - 1;
    }

    // failsafe turn beacons back in in 5 minutes
    if (liferay.beacons.tempMuteTimeout) clearTimeout(liferay.beacons.tempMuteTimeout);
    liferay.beacons.tempMuteTimeout = setTimeout(function() {
        liferay.beacons.tempMute = false;
    }, 5 * 60 * 1000);

    alertDialog.addEventListener('click', function(e) {
        if (e.index < 0) {
            clearTimeout(liferay.beacons.tempMuteTimeout);
            liferay.beacons.tempMuteTimeout = null;
            liferay.beacons.tempMute = false;
            return;
        }

        liferay.beacons.executeAction(finalActions[e.index], event.uuid, function() {
            clearTimeout(liferay.beacons.tempMuteTimeout);
            liferay.beacons.tempMuteTimeout = null;
            liferay.beacons.tempMute = false;
        });
    });


    liferay.beacons.lastGlobalTrigger = new Date().getTime();
    if (recordFlag) {
        liferay.beacons.recordTrigger(event.uuid);
    }

    liferay.beacons.tempMute = true;

    if (!liferay.beacons.inBackground && !liferay.beacons.inactive && (event.on && (event.on == "entry" || event.on == "exit"))) {
        try {
            if (liferay.model.iOS) {
                var userInfo = {
                    event: event.region_name,
                    action: (event.on == "entry") ? "entered" : "exited"
                };

                notifications.push(Ti.App.iOS.scheduleLocalNotification({
                    alertBody: liferay.controller.selectedEvent.menutitle + ": " + message,
                    userInfo: userInfo,
                    badge: (Ti.UI.iPhone.appBadge + 1),
                    sound: 'chime',
                    date: new Date(new Date().getTime() + 1000)
                }));
            } else if (liferay.model.android) {
                // android notification only in background
                if (!androidPlatformTools.isInForeground()) {
                    var intent = Ti.Android.createIntent({
                        action : Ti.Android.ACTION_MAIN,
                        className : 'com.liferay.events.global.mobile.LiferayEventsActivity',
                        flags : Ti.Android.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED | Ti.Android.FLAG_ACTIVITY_SINGLE_TOP
                    });
                    intent.addCategory(Titanium.Android.CATEGORY_LAUNCHER);

                    var pending = Ti.Android.createPendingIntent({
                        activity : Ti.Android.currentActivity,
                        intent : intent,
                        type : Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
                        flags : Ti.Android.FLAG_ACTIVITY_NO_HISTORY
                    });

                    var contentText = liferay.controller.selectedEvent.menutitle + ": " + message;
                    var notification = Ti.Android.createNotification({
                        contentIntent : pending,
                        contentTitle : 'Liferay Events',
                        contentText : contentText,
                        tickerText : contentText,
                        // "when" will only put the timestamp on the notification and nothing else.
                        // Setting it does not show the notification in the future
                        when : new Date().getTime(),
                        icon : Ti.App.Android.R.drawable.appicon,
                        flags : Titanium.Android.ACTION_DEFAULT | Titanium.Android.FLAG_AUTO_CANCEL | Titanium.Android.FLAG_SHOW_LIGHTS
                    });

                    var id = androidNotificationIds++;
                    for (var i = 0; i < notifications.length; i++) {
                        if (notifications[i].contentText == contentText) {
                            return;
                        }
                    }
                    notifications.push(id);
                    Ti.Android.NotificationManager.notify(id, notification);

                }
            }
        } catch (ex) {
        }
    }

    alertDialog.show();

};

liferay.beacons.executeAction = function(actionSpec, event_uuid, cb) {
    var actionName = actionSpec.substring(0, actionSpec.indexOf(';;')).toUpperCase().trim();
    var actionParams = actionSpec.substring(actionSpec.indexOf(';;') + 2).split(';;').map(function(el) { return el.trim();});

    if (actionName == 'MUTE') {

        var cancelIdx = -1;
        var buttonNames = null;

        var options = [String.format(L('MUTE_AREA'), actionParams[0]), L('MUTE_ALL')];
        if (liferay.model.iOS) {
            options.push(L('CANCEL'));
            cancelIdx = 2;
        } else {
            buttonNames = [L('CANCEL')];
            cancelIdx = 0;
        }

        var optionDialog;

        if (liferay.model.iOS) {
            optionDialog = Titanium.UI.createOptionDialog({
                title : L('NOTIFICATION_AREAS'),
                options: options,
                selectedIndex: 0,
                persistent: true
            });
        } else {
            optionDialog = Titanium.UI.createOptionDialog({
                title : L('NOTIFICATION_AREAS'),
                options: options,
                buttonNames: buttonNames,
                cancel: 2112,
                selectedIndex: 0,
                persistent: true
            });
        }

        optionDialog.addEventListener('click', function(e) {
            cb();
            if (liferay.model.android && e.button) return;
            if (liferay.model.android && e.index == 2112) return;

            if (liferay.model.iOS && (e.cancel == cancelIdx || e.index < 0)) return;

            if (e.index == 0) {
                // mute area
                if (actionParams[0]) {
                    var reg = liferay.beacons.getRegionByName(actionParams[0]);
                    if (reg) {
                        liferay.beacons.muteRegion(reg);
                        var unmutes = liferay.beacons.getUnmutedRegions();
                        if (!unmutes || unmutes.length <= 0) {
                            if (liferay.screens.front.beaconButtonOff) {
                                liferay.screens.front.beaconButtonOff.visible = true;
                                liferay.screens.front.beaconButton.visible = false;
                            }
                        }
                    }
                }
            } else if (e.index == 1) {
                liferay.beacons.muteAllRegions();
                alert(L('MUTE_ALL_WARNING'));
                if (liferay.screens.front.beaconButtonOff) {
                    liferay.screens.front.beaconButtonOff.visible = true;
                    liferay.screens.front.beaconButton.visible = false;
                }
            }
        });

        optionDialog.show();

    } else if (actionName == 'WINDOW') {
        var windowName = actionParams[0];
        var windowParams = actionParams.slice(1);

        var currentView = liferay.controller.getCurrentView();
        if (currentView === liferay.screens[windowName]) {
            currentView.loadAction(windowParams, event_uuid, cb);
        } else {
            var view = liferay.screens[windowName];
            if (view) {
                liferay.controller.open(view.render(), view);
                view.loadAction(windowParams, event_uuid, cb);
            } else {
                cb();
            }
        }
    } else if (actionName == "NOOP") {
        cb();
    } else if (actionName == "WEB") {
        Titanium.Platform.openURL(actionParams[0]);
        cb();
    }
};

liferay.beacons.getUnmutedRegions = function() {
    var unmutes = [];
    var pref = liferay.beacons.getPreference("mutedRegions");
    if (!pref) return liferay.beacons.getAllRegions();
    liferay.beacons.getAllRegions().forEach(function(el) {
        if (pref.indexOf(el.uuid) < 0) {
            unmutes.push(el);
        }
    });
    return unmutes;
};

liferay.beacons.getMutedRegions = function() {

    var pref = liferay.beacons.getPreference("mutedRegions");
    if (!pref) return [];
    return pref.map(function(el) {
        return liferay.beacons.getRegionByUuid(el);
    });
};

liferay.beacons.isRegionMuted = function(region) {

    var pref = liferay.beacons.getPreference("mutedRegions");
    if (!pref) return false;
    return (pref.indexOf(region.uuid) >= 0);
};


liferay.beacons.muteRegion = function(region) {

    var pref = liferay.beacons.getPreference("mutedRegions");
    if (!pref) {
        liferay.beacons.setPreference("mutedRegions", [region.uuid]);
    } else {
        if (pref.indexOf(region.uuid) < 0) {
            pref.push(region.uuid);
            liferay.beacons.setPreference("mutedRegions", pref);
        }
    }
};

liferay.beacons.unmuteRegion = function(region) {
    var pref = liferay.beacons.getPreference("mutedRegions");
    if (!pref) return;

    pref = pref.filter(function(el) {
        return el != region.uuid;
    });

    liferay.beacons.setPreference("mutedRegions", pref);

};

liferay.beacons.muteAllRegions = function() {
    liferay.beacons.getAllRegions().forEach(function(region) {
        liferay.beacons.muteRegion(region);
    });
    liferay.beacons.stopRegionMonitoring();
    liferay.beacons.clearAllQueuedTriggers();
};

liferay.beacons.getAllRegions = function() {
    return liferay.beacons.currentEventData.beacon_regions;
};

liferay.beacons.testAction = function(msgTemplate, actionSpec, event_uuid) {
    var actionName = actionSpec.substring(0, actionSpec.indexOf(';;')).toUpperCase().trim();
    var actionParams = actionSpec.substring(actionSpec.indexOf(';;') + 2).split(';;').map(function(el) { return el.trim();});

    if (actionName == 'WINDOW') {
        var windowName = actionParams[0];
        var windowParams = actionParams.slice(1);
        var view = liferay.screens[windowName];
        if (view) {
            return view.testAction(msgTemplate, windowParams, event_uuid);
        } else {
            return null;
        }
    }

    return msgTemplate;
};

liferay.beacons.getRegionEventByUuid = function(uuid) {
    for (var i = 0; i < liferay.beacons.currentEventData.beacon_region_events.length; i++) {
        if (liferay.beacons.currentEventData.beacon_region_events[i].uuid == uuid) {
            return liferay.beacons.currentEventData.beacon_region_events[i];
        }
    }
    return null;

};

liferay.beacons.getRegionByName = function(name) {
    for (var i = 0; i < liferay.beacons.currentEventData.beacon_regions.length; i++) {
        if (liferay.beacons.currentEventData.beacon_regions[i].name == name) {
            return liferay.beacons.currentEventData.beacon_regions[i];
        }
    }
    return null;
};
liferay.beacons.getRegionByUuid = function(uuid) {
    for (var i = 0; i < liferay.beacons.currentEventData.beacon_regions.length; i++) {
        if (liferay.beacons.currentEventData.beacon_regions[i].uuid == uuid) {
            return liferay.beacons.currentEventData.beacon_regions[i];
        }
    }
    return null;
};
liferay.beacons.getLastTrigger = function(evt) {
    if (!liferay.beacons.currentEventData.history) {
        return 0;
    }

    for (var i = 0; i < liferay.beacons.currentEventData.history.length; i++) {
        if (liferay.beacons.currentEventData.history[i].beaconEventId == evt.uuid) {
            return liferay.beacons.currentEventData.history[i].lastTrigger;
        }
    }
    return 0;
};
liferay.beacons.getCount = function(evt) {
    if (!liferay.beacons.currentEventData.history) {
        return 0;
    }
    for (var i = 0; i < liferay.beacons.currentEventData.history.length; i++) {
        if (liferay.beacons.currentEventData.history[i].beaconEventId == evt.uuid) {
            return liferay.beacons.currentEventData.history[i].count;
        }
    }
    return 0;
};


liferay.beacons.stopRegionMonitoring = function() {

    if (!TiBeacons) {
        return;
    }

    if (!liferay.beacons.hasBeaconSupport()) {
        return;
    }


    liferay.beacons.currentBeacons = [];
    liferay.beacons.currentRegions = [];

    TiBeacons.stopRangingForAllBeacons();
    TiBeacons.stopMonitoringAllRegions();

};

// [ { eventId: id, history: [{beaconId, count, lastTrigger}], prefs: []]

liferay.beacons.setPreference = function(prefName, prefVal) {
    if (!liferay.beacons.currentEventData.preferences) {
        liferay.beacons.currentEventData.preferences = [];
    }
    for (var i = 0; i < liferay.beacons.currentEventData.preferences.length; i++) {
        if (liferay.beacons.currentEventData.preferences[i].prefName == prefName) {
            liferay.beacons.currentEventData.preferences[i].prefValue = prefVal;
            liferay.beacons.saveDataToFile();
            return;
        }
    }

    // not found so make new
    liferay.beacons.currentEventData.preferences.push({
        prefName: prefName,
        prefValue: prefVal
    });
    liferay.beacons.saveDataToFile();

};
liferay.beacons.clearPreferenceRegex = function(regex) {
    if (!liferay.beacons.currentEventData.preferences) {
        liferay.beacons.currentEventData.preferences = [];
    }

    liferay.beacons.currentEventData.preferences = liferay.beacons.currentEventData.preferences.filter(function(el) {
        return (el.prefName.match(regex) == null)
    });

    liferay.beacons.saveDataToFile();

};

liferay.beacons.clearPreference = function(prefName) {
    if (!liferay.beacons.currentEventData.preferences) {
        liferay.beacons.currentEventData.preferences = [];
    }

    liferay.beacons.currentEventData.preferences = liferay.beacons.currentEventData.preferences.filter(function(el) {
        return el.prefName != prefName;
    });

    liferay.beacons.saveDataToFile();
};

liferay.beacons.getPreference = function(prefName) {
    if (!liferay.beacons.currentEventData.preferences) {
        liferay.beacons.currentEventData.preferences = [];
    }
    for (var i = 0; i < liferay.beacons.currentEventData.preferences.length; i++) {
        if (liferay.beacons.currentEventData.preferences[i].prefName == prefName) {
            return liferay.beacons.currentEventData.preferences[i].prefValue;
        }
    }
    return null;
};

liferay.beacons.recordTrigger = function (beaconEventId) {

    if (!liferay.beacons.currentEventData.history) {
        liferay.beacons.currentEventData.history = [];
    }

    for (var i = 0; i < liferay.beacons.currentEventData.history.length; i++) {
        var currentHistory = liferay.beacons.currentEventData.history[i];
        if (currentHistory.beaconEventId == beaconEventId) {
            currentHistory.count++;
            currentHistory.lastTrigger = new Date().getTime();
            liferay.beacons.saveDataToFile();
            return;
        }
    }

    // if here then no record for this beaconEvent
    liferay.beacons.currentEventData.history.push({
        beaconEventId: beaconEventId,
        count: 1,
        lastTrigger: new Date().getTime()
    });
    liferay.beacons.saveDataToFile();
};

liferay.beacons.clearAllHistoryAndPrefs = function() {
    liferay.beacons.currentEventData.history = [];
    liferay.beacons.currentEventData.preferences = [];
    liferay.beacons.saveDataToFile();


};

liferay.beacons.loadDataFromFile = function () {

    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.beaconDataFile);

    if (file.exists()) {
        try {
            var newBeaconData = JSON.parse(file.read());
            if (newBeaconData) {
                liferay.beacons.allEventData = newBeaconData;
            } else {
            }
        } catch (ex) {
            // beacon file unreadable, abort!
            console.log("################################ BEACON FILE COULD NOT BE READ, ABORTING");
            return;
        }
    } else {
        if (liferay.beacons.allEventData) {
            if (liferay.beacons.allEventData.length <= 0) {
                liferay.beacons.allEventData = [];
            } else {

            }
        } else {
            liferay.beacons.allEventData = [];
        }
    }
};

liferay.beacons.saveDataToFile = function () {

    var foundData = false;
    for (var i = 0; i < liferay.beacons.allEventData.length; i++) {
        var evtData = liferay.beacons.allEventData[i];
        if (evtData.eventId == liferay.beacons.currentEventId) {
            evtData.data = liferay.beacons.currentEventData;
            foundData = true;
            break;
        }
    }

    if (!foundData) {
        liferay.beacons.allEventData.push({
            eventId: liferay.beacons.currentEventId,
            data: liferay.beacons.currentEventData
        });
    }

    var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
    if (!folder.exists()) {
        folder.createDirectory();
        folder.remoteBackup = true;
    }
    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.beaconDataFile);
    file.write(JSON.stringify(liferay.beacons.allEventData));
    file.remoteBackup = true;
};

liferay.beacons.fetchBeaconsPeriodically = function(event, backoff) {
    if (liferay.beacons.beaconTimer) {
        clearTimeout(liferay.beacons.beaconTimer);
        liferay.beacons.beaconTimer = null;
    }

    liferay.beacons.fetchBeaconData(event, function(data) {

        liferay.beacons.stopRegionMonitoring();
        liferay.beacons.saveDataToFile();

        liferay.beacons.currentEventId = event.eventid;
        liferay.beacons.currentEventData.beacon_regions = data['beacon_regions'];
        liferay.beacons.currentEventData.beacon_region_events = data['beacon_region_events'];
        liferay.beacons.currentEventData.beacon_individual_events = data['beacon_individual_events'];
        liferay.beacons.currentEventData.beacon_forms = data['beacon_forms'];

        // reset history and preferences for new event
        for (var i = 0; i < liferay.beacons.allEventData.length; i++) {
            if (liferay.beacons.allEventData[i].eventId == liferay.beacons.currentEventId) {
                if (liferay.beacons.allEventData[i].data && liferay.beacons.allEventData[i].data.history) {
                    liferay.beacons.currentEventData.history = liferay.beacons.allEventData[i].data.history;
                } else {
                    liferay.beacons.currentEventData.history = [];
                }

                if (liferay.beacons.allEventData[i].data && liferay.beacons.allEventData[i].data.preferences) {
                    liferay.beacons.currentEventData.preferences = liferay.beacons.allEventData[i].data.preferences;
                } else {
                    liferay.beacons.currentEventData.preferences = [];
                }
                break;
            }
        }

        liferay.beacons.saveDataToFile();

        if (liferay.beacons.currentEventData.beacon_regions || liferay.beacons.currentEventData.beacon_individual_events) {
            liferay.beacons.startRegionMonitoring();

            liferay.beacons.beaconTimer = setTimeout(function() {
                liferay.beacons.fetchBeaconsPeriodically(event, liferay.settings.server.initialBackoffSecs);
            }, liferay.settings.server.beaconFetchFrequencyMins * 60 * 1000);
        }
    }, function(err) {
        liferay.beacons.beaconTimer = setTimeout(function() {
            liferay.beacons.fetchBeaconsPeriodically(event, backoff * liferay.settings.server.backoffMultiplier);
        }, Math.random() * backoff * 1000);
    });
};

liferay.beacons.fetchBeaconData = function(event, onSuccess, onFail) {

    // parse metadata
    var types = {};
    var resultData = {};
    var metadata = event.metadata_types.split(',').map(function(el) { return el.trim();});
    for (var i = 0; i < metadata.length; i++) {
        var parts = metadata[i].split(":");
        if (parts.length != 2) {
            continue;
        }
        types[parts[0].trim()] = parts[1].trim();
    }

    if (!types.beacon_regions || !types.beacon_region_events ||  !types.beacon_individual_events || !types.beacon_forms) {
        onFail(L('Invalid beacon data'));
        return;
    }


    async.eachSeries([
        'beacon_regions',
        'beacon_region_events',
        'beacon_individual_events',
        'beacon_forms'
    ], function(item, cb) {
        liferay.controller.loadSingleType(item, types[item], resultData, {
            onSuccess: function () {
                cb(null);
            }, onFail: function (err) {
                cb(err);
            }
        });
    }, function(result) {
        if (!result) {
            onSuccess(resultData);
        } else {
            onFail(result);
        }
    });


};

liferay.beacons.getFormForId = function(formId) {

    if (!liferay.beacons.currentEventData.beacon_forms) {
        return null;
    }

    for (var i = 0; i < liferay.beacons.currentEventData.beacon_forms.length; i++) {
        var form = liferay.beacons.currentEventData.beacon_forms[i];
        if (form.form_id == formId) {
            return form;
        }
    }
    return null;
}

