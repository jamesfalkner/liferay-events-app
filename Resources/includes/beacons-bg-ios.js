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
var TiBeacons = require('org.beuckman.tibeacons');
TiBeacons.disableAutoRanging();

var notifications = [];

var eventName = Ti.App.Properties.getString("com.liferay.beacons.eventName");
var badgeVal = Ti.App.Properties.getString("com.liferay.badge");
if (!badgeVal) badgeVal = 0;

var eventAgendaStr = Ti.App.Properties.getString("com.liferay.beacons.eventAgenda");
var eventSpeakerStr = Ti.App.Properties.getString("com.liferay.beacons.eventSpeakers");
var eventRoomStr = Ti.App.Properties.getString("com.liferay.beacons.eventRooms");
var prefStr = Ti.App.Properties.getString("com.liferay.beacons.prefs");
var regionStr = Ti.App.Properties.getString("com.liferay.beacons.regs");
var regionEventsStr = Ti.App.Properties.getString("com.liferay.beacons.region_events");
var historyStr = Ti.App.Properties.getString("com.liferay.beacons.history");
var regions = [];
var prefs = [];

var regionEvents = [];
var history = [];
var eventAgenda = [];
var eventSpeakers = [];
var eventRooms = [];

if (eventAgendaStr) {
    try {
        eventAgenda = JSON.parse(eventAgendaStr);
    } catch (ex) {
        eventAgenda = [];
    }
}
if (eventSpeakerStr) {
    try {
        eventSpeakers = JSON.parse(eventSpeakerStr);
    } catch (ex) {
        eventSpeakers = [];
    }
}
if (eventRoomStr) {
    try {
        eventRooms = JSON.parse(eventRoomStr);
    } catch (ex) {
        eventRooms = [];
    }
}

if (regionStr) {
    try {
        regions = JSON.parse(regionStr);
    } catch (ex) {
        regions = [];
    }
}
if (prefStr) {
    try {
        prefs = JSON.parse(prefStr);
    } catch (ex) {
        prefs = [];
    }
}
if (regionEventsStr) {
    try {
        regionEvents = JSON.parse(regionEventsStr);
    } catch (ex) {
        regionEvents = [];
    }
}
if (historyStr) {
    try {
        history = JSON.parse(historyStr);
    } catch (ex) {
        history = [];
    }
}


var getPreference = function(prefName) {
    for (var i = 0; i < prefs.length; i++) {
        if (prefs[i].prefName == prefName) {
            return prefs[i].prefValue;
        }
    }
    return null;
};

var getRegionForIdentifier = function(identifier) {
    if (!regions) return null;


    for (var i = 0; i < regions.length; i++) {
        if (regions[i].name == identifier) {
            return regions[i];
        }
    }
    return null;
};

var getDate = function(isostr) {
    var parts = isostr.match(/\d+/g);
    return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
};

var fireRegionEvents = function(identifier, type) {
    if (!regionEvents) return;
    var reg = getRegionForIdentifier(identifier);
    if (!reg) return;
    var now = new Date();

    var msgs = [];

    manageDeathRow(reg, type, type == 'entry' ? 'exit' : 'entry');

    regionEvents.forEach(function(evt) {
        if (evt.region_name == reg.name && evt.on == type) {

            var count = getCount(evt);
            var last = getLastTrigger(evt);
            var timeSinceLast = now.getTime() - last;
            if (evt.start_date && evt.start_time) {
                var startDate = getDate(evt.start_date + 'T' + evt.start_time + ':00');
                if (startDate.getTime() > now.getTime()) {
                    return;
                }
            }
            if (evt.end_date && evt.end_time) {
                var endDate = getDate(evt.end_date + 'T' + evt.end_time + ':00');
                if (endDate.getTime() < now.getTime()) {
                    return;
                }
            }

            if (timeSinceLast < (evt.min_repeat_period * 1000)) {
                return;
            }

            if (count >= evt.repeat) {
                return;
            }

            if (evt.preferences_gate) {
                var prefsRequired = evt.preferences_gate.split(',').map(function(el) { return el.trim();});
                for (var i = 0 ; i < prefsRequired.length; i++) {
                    var prefRequired = prefsRequired[i];
                    if (prefRequired.indexOf('!') == 0) {
                        var negPref = prefRequired.substring(1);
                        if (getPreference(negPref)) {
                            return;
                        }
                    } else {
                        if (getPreference(prefRequired)) {
                            return;
                        }
                    }
                }
            }

            // if the exact same region event is in the queue to be fired in the future, don't add a new one
            for (i = 0; i < queuedTriggers.length; i++) {
                trigger = queuedTriggers[i];
                if (trigger.target_event == evt) {
                    return;
                }
            }

            var finalMsg = evt.message.trim();
            if (finalMsg.indexOf('[') == 0) {
                var msgArr = JSON.parse(finalMsg);
                var newMsgArr = msgArr.filter((function(m) {
                    return (m.indexOf('BG:') == 0)
                }));
                if (!newMsgArr || newMsgArr.length == 0 ) {
                    newMsgArr = msgArr;
                }

                newMsgArr = newMsgArr.map(function(m) {
                    if (m.indexOf('BG:') == 0) {
                        return m.substring(3);
                    } else {
                        return m;
                    }
                });

                var rnd = Math.floor(Math.random() * newMsgArr.length);
                finalMsg = newMsgArr[rnd];
            }

            //      handle session breakout room enter/leave
            //    See Something;;window;;agendaDetail;;session;;2014-06-20;;Opening Keynote&&...
            //    Do Something;;window;;agendaDetail;;roomId;;entering&&...
            //    Love It;;window;;agendaDetail;;roomId;;leaving&&...
            var shouldTrigger = false;

            if (!evt.actions || evt.actions.trim() == "") {
                shouldTrigger = true;
            } else {
                var actionSpecs = evt.actions.split('&&').map(function (el) {return el.trim();});
                actionSpecs.forEach(function (spec) {
                    var parts = spec.split(';;').map(function (el) {return el.trim();});
                    parts.splice(0, 1);
                    //    [window,agendaDetail,roomId,entering]
                    if (parts[0] && parts[0].toUpperCase() == "WINDOW" &&
                        parts[1] && parts[1] == "agendaDetail") {
                        parts.splice(0, 2);
                        var newFinalMsg = handleAgendaDetailBg(parts, finalMsg);
                        if (newFinalMsg) {
                            finalMsg = newFinalMsg;
                            shouldTrigger = true;
                        }
                    } else {
                        shouldTrigger = true;
                    }

                });
            }

            if (!shouldTrigger) {
                return;
            }


            if (evt.initial_delay <= 0) {
                incrementCountAndLastTriggerTime(evt);
                postNotification(finalMsg, {
                    event: identifier,
                    action: (type == 'entry') ? 'entered' : 'exited',
                    event_override_uuid: evt.uuid
                });
            } else {

                var trigger = {
                    region_name: evt.region_name,
                    eta: (new Date().getTime() + (evt.initial_delay * 1000)),
                    action: type,
                    target_event: evt
                };

                trigger.timer = setTimeout(function () {
                    // remove from queue
                    queuedTriggers = queuedTriggers.filter(function (el) {
                        return el != trigger;
                    });

                    incrementCountAndLastTriggerTime(evt);
                    postNotification(finalMsg, {
                        event: identifier,
                        action: (type == 'entry') ? 'entered' : 'exited',
                        event_override_uuid: evt.uuid
                    });

                }, evt.initial_delay * 1000);

                if (evt.cancelable) {
                    queuedTriggers.push(trigger);
                }
            }

        }
    });
};


var handleAgendaDetailBg = function(actionSpec, msgTemplate) {

//    session:2014-06-20:Opening Keynote
//    roomId:entering
//    roomId:leaving
    if (actionSpec[0].toUpperCase() == "SESSION") {
        return msgTemplate;
    } else {

        if (!eventAgenda) return null;

        var roomName = actionSpec[0];
        var action = actionSpec[1].toUpperCase();
        var now = new Date();

//        // TODO: TST
//        if (action == "ENTERING") {
//            var jun = new getDate("2014-06-12T16:32:00");
//            now = jun;
//        } else if (action == "LEAVING") {
//            var jun = new getDate("2014-06-12T17:06:00");
//            now = jun;
//        }

        for (var i = 0; i < eventAgenda.length; i++) {
            for (var j = 0; j < eventAgenda[i].items.length; j++) {
                var sess = eventAgenda[i].items[j];
                var alreadySeen = getPreference(action + sess.uuid);
                if (alreadySeen) {
                    continue;
                }
                var speakers = getSpeakers(sess);
                if (!speakers || speakers.length <= 0) {
                    continue;
                }
                var speakerNames = getSpeakerNames(sess, ' / ');
                var sessRoomName = getRoomName(sess);
                if (!sessRoomName) {
                    continue;
                }
                if (sessRoomName.toUpperCase() == roomName.toUpperCase()) {
                    var sessTime = getDateForAgendaItem(sess, (action == "ENTERING"));
                    var secsDiff = Math.abs(sessTime.getTime() - now.getTime());
                    if (speakerNames && sess.title && secsDiff < 10 * 60 * 1000) {
                        var willWork =  (action == "LEAVING") ? (sess.enable_ratings) : true;
                        if (willWork) {
                            var newMsg = msgTemplate;
                            newMsg = newMsg.replace('$SESSION_TITLE', sess.title);
                            newMsg = newMsg.replace('$SESSION_TIME', String.formatTime(sessTime, "short"));
                            newMsg = newMsg.replace('$ROOM_NAME', roomName);
                            newMsg = newMsg.replace('$SPEAKER_NAMES', speakerNames);
                            return newMsg;
                        }
                    }
                }
            }
        }
    }
    return null;
};

getDateForAgendaItem = function(item, start) {
    if (start) {
        return getDate(item.date + "T" + (item.start_time_hour?item.start_time_hour:"00") + ":" + (item.start_time_minutes?item.start_time_minutes:"00") + ":00");
    } else {
        return getDate(item.date + "T" + (item.end_time_hour?item.end_time_hour:"00") + ":" + (item.end_time_minutes?item.end_time_minutes:"00") + ":00");

    }

};

var getRoomName = function(info) {

    if (!info.room_uuid) return null;
    for (var i = 0; i < eventRooms.length; i++) {
        if (eventRooms[i].uuid == info.room_uuid) {
            return eventRooms[i].room_name;
        }
    }
    return null;
};


var getSpeakers = function(info) {

    if (!eventSpeakers) return [];

    if (!info.speakers_uuid) return [];
    var uuids = info.speakers_uuid.split(',').map(function(el) { return el.trim(); });
    return uuids.map(function(uuid) {
        for (var i = 0; i < eventSpeakers.length; i++) {
            if (eventSpeakers[i].uuid == uuid) {
                return eventSpeakers[i];
            }
        }
        return "";
    });
};

var stripTags = function(str) {
    if (!str) {
        return "";
    }
    return (str.replace(/(<br>|<br\s*\/>|<p>|<\/p>|<p\s*\/>)/g, '\n').replace( /<[^>]+>/g, '').replace( /&[^;]+;/g, '').replace( /&nbsp;/g, ' ').replace( /\n */g, '\n').trim());
};

var getSpeakerNames = function(info, sep) {

    return stripTags(getSpeakers(info).map(function(el) {
        return el.speaker_name?el.speaker_name:"";
    }).join(sep).replace( /\s\s+/g, ' ' ));
};

var bgRegionEnter = function(e) {

    fireRegionEvents(e.identifier, "entry");
//    if (msgs && msgs.length > 0) {
//        msgs.forEach(function(msg) {
//            postNotification(msg, {
//                event: e.identifier,
//                action: 'entered'
//            });
//        });
//    }
};

var bgRegionExit = function(e) {

    fireRegionEvents(e.identifier, "exit");
//    if (msgs && msgs.length > 0) {
//        msgs.forEach(function(msg) {
//            postNotification(msg, {
//                event: e.identifier,
//                action: 'exited'
//            });
//        });
//    }
};

var postNotification = function(msg, userInfo) {
    notifications.push(Ti.App.iOS.scheduleLocalNotification({
        alertBody: msg,
        userInfo: userInfo,
        badge: ++badgeVal,
        sound: 'chime',
        date: new Date(new Date().getTime() + 1000)
    }));

};

var getLastTrigger = function(evt) {
    if (!history) {
        return 0;
    }

    for (var i = 0; i < history.length; i++) {
        if (history[i].beaconEventId == evt.uuid) {
            return history[i].lastTrigger;
        }
    }
    return 0;
};

var getCount = function(evt) {
    if (!history) {
        return 0;
    }
    for (var i = 0; i < history.length; i++) {
        if (history[i].beaconEventId == evt.uuid) {
            return history[i].count;
        }
    }
    return 0;
};

var incrementCountAndLastTriggerTime = function(evt) {
    if (!history) {
        history = [
            {
                beaconEventId: evt.uuid,
                count: 1,
                lastTrigger: new Date().getTime()
            }
        ];
    } else {
        for (var i = 0; i < history.length; i++) {
            if (history[i].beaconEventId == evt.uuid) {
                history[i].count = history[i].count + 1;
                history[i].lastTrigger = new Date().getTime();
                return;
            }
        }
        // if here then no history
        history.push({
            beaconEventId: evt.uuid,
            count: 1,
            lastTrigger: new Date().getTime()
        });
    }

    Ti.App.Properties.setString("com.liferay.beacons.history", JSON.stringify(history));

};

var stopService = function() {

//    TiBeacons.removeEventListener("enteredRegion", bgRegionEnter);
//    TiBeacons.removeEventListener("exitedRegion", bgRegionExit);
//    TiBeacons.stopMonitoringAllRegions();
};

if (regions && regions.length > 0) {
    TiBeacons.addEventListener("enteredRegion", bgRegionEnter);
    TiBeacons.addEventListener("exitedRegion", bgRegionExit);
    regions.forEach(function(region) {
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

    Ti.App.currentService.addEventListener("stop", stopService);

//    // TODO: TEST
//    setInterval(function() {
//        history = [];
//        prefs = [];
//        bgRegionEnter({
//            identifier: 'Venue',
//            uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
//            major: 2,
//            minor: 0
//        })
//    }, 10000);
//    setTimeout(function() {
//        history = [];
//        prefs = [];
//        bgRegionExit({
//            identifier: 'Salon Bonaparte',
//            uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
//            major: 2,
//            minor: 0
//        })
//    }, 10000);
//
} else {
    TiBeacons.stopMonitoringAllRegions();
}


var queueDeathRow = [];
var queuedTriggers = [];

// death row routines
var manageDeathRow = function(region, action, pardoner) {
    // pardon any deathrow inmates
    queueDeathRow = queueDeathRow.filter(function(timer) {
        if (timer.region_name == region.name && timer.pardoner == action) {
            clearTimeout(timer.timer);
            return false;
        } else {
            return true;
        }
    });

    // put new queued events for this region on deathrow
    queuedTriggers.forEach(function(trigger) {
        if (trigger.region_name == region.name && trigger.action != action) {
            var timeLeft = trigger.eta - (new Date().getTime());
            var deathTimer = setTimeout(function () {
                clearTimeout(trigger.timer);
                queuedTriggers = queuedTriggers.filter(function(el) {
                    return el != trigger;
                });

                queueDeathRow = queueDeathRow.filter(function(dr) {
                    return (dr.origTimer != trigger.timer);
                });

            }, timeLeft / 2);
            queueDeathRow.push({
                timer: deathTimer,
                origTimer: trigger.timer,
                eta: new Date().getTime() + (timeLeft / 2),
                region_name: region.name,
                pardoner: pardoner
            });
        }
    });

};

