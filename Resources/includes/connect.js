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

liferay.connect = {
    allEventData: [
//        {
//            eventId: "",
//            data: {
//                profile: {},
//                recommendations: [],
        //        queuedInterests: [],
        //        queuedMessages: [{message: {content: "", toId: 23423, tempMessageId: 2342, date: date}, listener: l}]
//                uninterestingIds: [],
//                connections: [],
//                messageBeginDate: 0,
//                messages: [
//                {
//                      messageId: 123,
//                      createDate: date,
//                      fromId: id,
//                      toId: id,
//                      read: true/false,
//                      content: ""
//                }
//                ]
//            }
//        }
    ],
    currentEventData: {},
    currentEventId: "",
    syncTimer: null,
    someSetting: false,
    chatListeners: [],
    notifications : [],
    androidNotificationIds : 0,
    androidPlatformTools : ((Ti.Platform.osname == 'android') ? require('bencoding.android.tools').createPlatform() : null)
};

liferay.connect.addChatListener = function(f) {
    liferay.connect.chatListeners.push(f);
}
liferay.connect.removeChatListeners = function(f) {
    liferay.connect.chatListeners = [];
}

liferay.connect.getUninterestedIds = function () {
    if (!liferay.connect.currentEventData || !liferay.connect.currentEventData.uninterestedIds) {
        return [];
    }

    return liferay.connect.currentEventData.uninterestedIds;
};

liferay.connect.getInterestedIds = function () {
    if (!liferay.connect.currentEventData.profile || !liferay.connect.currentEventData.profile.interestedIds) {
        return [];
    }

    return liferay.connect.currentEventData.profile.interestedIds;
};

liferay.connect.addUninterested = function (id) {
    if (!liferay.connect.currentEventData.uninterestedIds) {
        liferay.connect.currentEventData.uninterestedIds = [id];
    } else {
        liferay.connect.currentEventData.uninterestedIds.push(id);
    }
    liferay.connect.saveDataToFile();
};


liferay.connect.isConnected = function(connection) {

    var connections = liferay.connect.getConnections();
    for (var i = 0; i < connections.length; i++) {
        if (connections[i].eventContactId == connection.eventContactId) {
            return true;
        }
    }
    return false;
};

liferay.connect.deleteConnection = function(connection) {

    liferay.connect.currentEventData.connections = liferay.connect.currentEventData.connections.filter(function(el) {
        return (el.eventContactId != connection.eventContactId);
    });
};

liferay.connect.getConnections = function () {
    if (!liferay.connect.currentEventData.connections) {
        return [];
    }

    return liferay.connect.currentEventData.connections;

};

liferay.connect.getConnectionById= function (id) {
    if (!liferay.connect.currentEventData.connections) {
        return null;
    }

    for (var i = 0; i < liferay.connect.currentEventData.connections.length; i++) {
        if (liferay.connect.currentEventData.connections[i].eventContactId == id) {
            return liferay.connect.currentEventData.connections[i];
        }
    }

    return null;
};

liferay.connect.getAllRecommendations = function () {
    if (!liferay.connect.currentEventData.recommendations) {
        return [];
    }

    return liferay.connect.currentEventData.recommendations;

};

liferay.connect.getQueuedInterests = function () {
    if (!liferay.connect.currentEventData.queuedInterests) {
        return [];
    }

    return liferay.connect.currentEventData.queuedInterests;

};
liferay.connect.setQueuedInterests = function (q) {
    liferay.connect.currentEventData.queuedInterests = q;
};

liferay.connect.setQueuedMessages = function (q) {
    liferay.connect.currentEventData.queuedMessages = q;
};

liferay.connect.getQueuedMessages = function () {
    if (!liferay.connect.currentEventData.queuedMessages) {
        return [];
    }

    return liferay.connect.currentEventData.queuedMessages;

};
liferay.connect.clearQueuedMessages = function (q) {
    liferay.connect.currentEventData.queuedMessages = [];

};
liferay.connect.addQueuedMessage = function (m, listener) {
    if (!liferay.connect.currentEventData.queuedMessages) {
        liferay.connect.currentEventData.queuedMessages = [{message: m, listener: listener}];
        return;
    }

    for (var i = 0; i < liferay.connect.currentEventData.queuedMessages.length; i++) {
        if (liferay.connect.currentEventData.queuedMessages[i].message.tempMessageId == m.tempMessageId) {
            liferay.connect.currentEventData.queuedMessages[i].listener = listener;
            return;
        }
    }

    liferay.connect.currentEventData.queuedMessages.push({startTime: new Date().getTime(), message: m, listener: listener});
    liferay.connect.saveDataToFile();

};

liferay.connect.isRecommended = function (eventContactId) {
    if (!liferay.connect.currentEventData.recommendations) {
        return false;
    }

    for (var i = 0; i < liferay.connect.currentEventData.recommendations.length; i++) {
        if (liferay.connect.currentEventData.recommendations[i].eventContactId == eventContactId) {
            return true;
        }
    }
    return false;
};

liferay.connect.updateRecommendation = function (reco) {
    if (!liferay.connect.currentEventData.recommendations) {
        liferay.connect.currentEventData.recommendations = [reco];
        return;
    }

    for (var i = 0; i < liferay.connect.currentEventData.recommendations.length; i++) {
        if (liferay.connect.currentEventData.recommendations[i].eventContactId == reco.eventContactId) {
            liferay.connect.currentEventData.recommendations[i] = reco;
            liferay.connect.currentEventData.recommendations.sortBy('-likeness');
            return;
        }
    }

    // didn't find existing, so push
    liferay.connect.currentEventData.recommendations.push(reco);
    liferay.connect.currentEventData.recommendations.sortBy('-likeness');
};


liferay.connect.hasMessage = function (messageId) {
    if (!liferay.connect.currentEventData.messages) {
        return false;
    }

    for (var i = 0; i < liferay.connect.currentEventData.messages.length; i++) {
        if (liferay.connect.currentEventData.messages[i].messageId == messageId) {
            return true;
        }
    }
    return false;
};

liferay.connect.getAllMessages = function () {
    if (!liferay.connect.currentEventData.messages) {
        return [];
    }

    return liferay.connect.currentEventData.messages;
};

liferay.connect.hasConfirmedProfile = function (event) {

    if (!liferay.connect.currentEventData.profile) return false;

    return liferay.connect.currentEventData.profile.eventContactId;

};

liferay.connect.getNextRecommendation = function () {

    var unints = liferay.connect.getUninterestedIds();

    var ints = liferay.connect.getInterestedIds();

    var allRecommendations = liferay.connect.getAllRecommendations();

    var queuedInterests = liferay.connect.getQueuedInterests();

    for (var i = 0; i < allRecommendations.length; i++) {
        if ((unints.indexOf(allRecommendations[i].eventContactId) == -1) &&
            (ints.indexOf(allRecommendations[i].eventContactId) == -1) &&
            (queuedInterests.indexOf(allRecommendations[i].eventContactId) == -1)) {
            return allRecommendations[i];
        }
    }
    return null;
};

liferay.connect.syncConnectData = function (event, backoff) {
    if (liferay.connect.syncTimer) {
        clearTimeout(liferay.connect.syncTimer);
        liferay.connect.syncTimer = null;
    }

    if (liferay.connect.hasConfirmedProfile(event)) {
        var recommendations = liferay.connect.getAllRecommendations(event);
        if (recommendations.length < liferay.settings.server.connectMinRecommendationThreshhold) {
            liferay.connect.fetchRecommendations(event, liferay.settings.server.connectMinRecommendationThreshhold, function (data) {
                liferay.connect.currentEventId = event.eventid;
                if (!liferay.connect.currentEventData.recommendations) {
                    liferay.connect.currentEventData.recommendations = [];
                }
                if (!Array.isArray(data)) {
                    return;
                }
                data.forEach(function (reco) {
                    if (reco.eventContactId) {
                        liferay.connect.updateRecommendation(reco);
                    }
                });
                liferay.connect.saveDataToFile();
            }, function (err) {
                clearTimeout(liferay.connect.syncTimer);
                liferay.connect.syncTimer = setTimeout(function () {
                    liferay.connect.syncConnectData(event, backoff * liferay.settings.server.backoffMultiplier);
                }, Math.random() * backoff * 1000);
            });
        }

        liferay.connect.refreshConnections(event, function(data) {
            if (!liferay.connect.currentEventData.connections) {
                liferay.connect.currentEventData.connections = [];
            }

            if (!Array.isArray(data)) {
                return;
            }

            var newConnections = [];

            data.forEach(function (connection) {
                if (connection.eventContactId && !liferay.connect.isConnected(connection)) {
                    liferay.connect.currentEventData.connections.push(connection);
                    newConnections.push(connection);
                }
            });
            liferay.connect.saveDataToFile();


        });

        liferay.connect.fetchMessages(event, function (data) {
            if (!liferay.connect.currentEventData.messages) {
                liferay.connect.currentEventData.messages = [];
            }

            if (!Array.isArray(data)) {
                return;
            }

            var newMsgs = [];

            data.forEach(function (msg) {
                if (msg.messageId && !liferay.connect.hasMessage(msg.messageId)) {
                    liferay.connect.currentEventData.messages.push(msg);
                    newMsgs.push(msg);
                }
            });
            liferay.connect.currentEventData.messageBeginDate = new Date().getTime();
            liferay.connect.saveDataToFile();

            if (newMsgs.length > 0) {
                liferay.connect.chatListeners.forEach(function (listener) {
                    listener(newMsgs);
                });
            }


        }, function (err) {
            clearTimeout(liferay.connect.syncTimer);
            liferay.connect.syncTimer = setTimeout(function () {
                liferay.connect.syncConnectData(event, backoff * liferay.settings.server.backoffMultiplier);
            }, Math.random() * backoff * 1000);
        });

        liferay.connect.getQueuedInterests().forEach(function (id) {
            Request({
                method: 'POST',
                sigName: 'signature',
                url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.recordInterestEndpoint,
                params: {
                    eventId: event.eventid,
                    contactId: liferay.connect.currentEventData.profile.eventContactId,
                    targetContactId: id
                },
                onSuccess: function (data) {
                    if (!data.exception) {
                        liferay.connect.setQueuedInterests(liferay.connect.getQueuedInterests().filter(function (el) {
                            return (el != id);
                        }));
                        liferay.connect.saveDataToFile();
                    }

                    if (data.eventContactId) {
                        liferay.connect.recordMatch(event, data);
                    }
                },
                onFailure: function(err) {
                    clearTimeout(liferay.connect.syncTimer);
                    liferay.connect.syncTimer = setTimeout(function () {
                        liferay.connect.syncConnectData(event, backoff * liferay.settings.server.backoffMultiplier);
                    }, Math.random() * backoff * 1000);
                }
            });

        });


        liferay.connect.getQueuedMessages().forEach(function (msgObj) {

            if (!msgObj.startTime) {
                msgObj.startTime = new Date().getTime();
            }

            if (msgObj.startTime && (msgObj.startTime < (new Date().getTime() - (30 * 60 * 1000)))) {
                // couldn't send for 30 mins, so forget it
                msgObj.failed = true;
                return;
            }
            liferay.connect.sendMessage(event, msgObj.message.toId, msgObj.message.content, function(newmsg) {
                if (!newmsg.exception) {
                    liferay.connect.setQueuedMessages(liferay.connect.getQueuedMessages().filter(function (el) {
                        return (el.message.tempMessageId !== msgObj.message.tempMessageId);
                    }));
                    liferay.connect.saveDataToFile();
                    if (msgObj.listener) {
                        msgObj.listener(newmsg);
                    }
                }
            }, function(err) {
                clearTimeout(liferay.connect.syncTimer);
                liferay.connect.syncTimer = setTimeout(function () {
                    liferay.connect.syncConnectData(event, backoff * liferay.settings.server.backoffMultiplier);
                }, Math.random() * backoff * 1000);
            });
        });

        liferay.connect.setQueuedMessages(liferay.connect.getQueuedMessages().filter(function (el) {
            return (!el.failed);
        }));

    }

    liferay.connect.syncTimer = setTimeout(function () {
        liferay.connect.syncConnectData(event, liferay.settings.server.initialBackoffSecs);
    }, liferay.settings.server.connectFetchFrequencySecs * 1000);

};

liferay.connect.sendNativeNotification = function(message) {

    liferay.drawer.incrementNotificationValue("EventConnect", 1);

    if (liferay.model.iOS) {
        liferay.connect.notifications.push(Ti.App.iOS.scheduleLocalNotification({
            alertBody: message,
            badge: (Ti.UI.iPhone.appBadge + 1),
            sound: 'chime',
            date: new Date(new Date().getTime() + 1000)
        }));
    } else if (liferay.model.android) {

        var intent = Ti.Android.createIntent({
            action: Ti.Android.ACTION_MAIN,
            className: 'com.liferay.events.global.mobile.LiferayEventsActivity',
            flags: Ti.Android.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED | Ti.Android.FLAG_ACTIVITY_SINGLE_TOP
        });
        intent.addCategory(Titanium.Android.CATEGORY_LAUNCHER);

        var pending = Ti.Android.createPendingIntent({
            activity: Ti.Android.currentActivity,
            intent: intent,
            type: Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
            flags: Ti.Android.FLAG_ACTIVITY_NO_HISTORY
        });

        var notification = Ti.Android.createNotification({
            contentIntent: pending,
            contentTitle: 'Liferay Events',
            contentText: message,
            tickerText: message,
            // "when" will only put the timestamp on the notification and nothing else.
            // Setting it does not show the notification in the future
            when: new Date().getTime(),
            icon: Ti.App.Android.R.drawable.appicon,
            flags: Titanium.Android.ACTION_DEFAULT | Titanium.Android.FLAG_AUTO_CANCEL | Titanium.Android.FLAG_SHOW_LIGHTS
        });

        var id = liferay.connect.androidNotificationIds++;
        for (var i = 0; i < liferay.connect.notifications.length; i++) {
            if (liferay.connect.notifications[i].contentText == message) {
                return;
            }
        }
        liferay.connect.notifications.push(id);
        Ti.Android.NotificationManager.notify(id, notification);
        if (liferay.connect.androidPlatformTools.isInForeground()) {
            // do alert

        }
    }

}
liferay.connect.forceSync = function() {
    liferay.connect.syncConnectData(liferay.controller.selectedEvent, liferay.settings.server.initialBackoffSecs);
};

liferay.connect.loadDataFromFile = function () {

    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.connectDataFile);

    if (file.exists()) {
        try {
            var newConnectData = JSON.parse(file.read());
            if (newConnectData) {
                liferay.connect.allEventData = newConnectData;
            } else {
            }
        } catch (ex) {
            // connect file unreadable, abort!
            console.log("################################ CONNECT FILE COULD NOT BE READ, ABORTING");
            return;
        }
    } else {
        if (liferay.connect.allEventData) {
            if (liferay.connect.allEventData.length <= 0) {
                liferay.connect.allEventData = [];
            } else {

            }
        } else {
            liferay.connect.allEventData = [];
        }
    }
};

liferay.connect.saveDataToFile = function () {

    var foundData = false;
    for (var i = 0; i < liferay.connect.allEventData.length; i++) {
        var evtData = liferay.connect.allEventData[i];
        if (evtData.eventId == liferay.connect.currentEventId) {
            evtData.data = liferay.connect.currentEventData;
            foundData = true;
            break;
        }
    }

    if (!foundData) {
        liferay.connect.allEventData.push({
            eventId: liferay.connect.currentEventId,
            data: liferay.connect.currentEventData
        });
    }

    var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
    if (!folder.exists()) {
        folder.createDirectory();
        folder.remoteBackup = true;
    }
    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.connectDataFile);
    file.write(JSON.stringify(liferay.connect.allEventData));
    file.remoteBackup = true;
};

liferay.connect.fetchRecommendations = function (event, count, onSuccess, onFail) {
    Request({
        method: 'POST',
        hashAlg: 'sha',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.recommendationsEndpoint,
        params: {
            eventId: event.eventid,
            contactId: liferay.connect.currentEventData.profile.eventContactId,
            max: count,
            uninterestedIds: liferay.connect.getUninterestedIds().join(',')
        },
        onSuccess: onSuccess,
        onFailure: onFail
    });
};

liferay.connect.sendMessage = function(event, toId, msg, onSuccess, onFail) {
    Request({
        method: 'POST',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.sendMessagesEndpoint,
        params: {
            eventId: event.eventid,
            contactId: liferay.connect.currentEventData.profile.eventContactId,
            targetContactId: toId,
            message: msg
        },
        onSuccess: function(data) {
            if (!data.exception) {
                liferay.connect.currentEventData.messages.push(data);
                liferay.connect.saveDataToFile();
                onSuccess(data);
            } else {
                onFail(data.message);
            }
        },
        onFailure: onFail
    });
};


liferay.connect.fetchMessages = function (event, onSuccess, onFail) {
    Request({
        method: 'POST',
        hashAlg: 'sha',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.messagesEndpoint,
        params: {
            eventId: event.eventid,
            contactId: liferay.connect.currentEventData.profile.eventContactId,
            beginDate: liferay.connect.currentEventData.messageBeginDate ? (liferay.connect.currentEventData.messageBeginDate - (15 * 60 * 1000)) : 0
        },
        onSuccess: onSuccess,
        onFailure: onFail
    });

};

liferay.connect.recordInterest = function (event, targetContactId) {

    if (!liferay.connect.currentEventData.queuedInterests) {
        liferay.connect.currentEventData.queuedInterests = [targetContactId];
    } else {
        liferay.connect.currentEventData.queuedInterests.push(targetContactId);
    }

    if (!liferay.connect.currentEventData.profile.interestedIds) {
        liferay.connect.currentEventData.profile.interestedIds = [targetContactId];
    } else {
        liferay.connect.currentEventData.profile.interestedIds.push(targetContactId);
    }

    liferay.connect.saveDataToFile();
};

liferay.connect.recordMatch = function (event, targetProfile) {

    targetProfile.matchDate = new Date().getTime();

    if (!liferay.connect.currentEventData.connections) {
        liferay.connect.currentEventData.connections = [targetProfile];
    } else {
        liferay.connect.currentEventData.connections.push(targetProfile);
    }
    liferay.connect.saveDataToFile();
};

liferay.connect.getProfile = function (eventContactId) {

    if (!liferay.connect.currentEventData || !liferay.connect.currentEventData.profile) {
        return null;
    }
    if (eventContactId == null) {
        return liferay.connect.currentEventData.profile;
    } else {
        for (var i = 0; i < liferay.connect.currentEventData.connections.length; i++) {
            if (liferay.connect.currentEventData.connections[i].eventContactId == eventContactId) {
                return liferay.connect.currentEventData.connections[i];
            }
        }
    }

    if (liferay.connect.currentEventData.profile.eventContactId == eventContactId) {
        return liferay.connect.currentEventData.profile;

    }
    return null;

};

liferay.connect.fetchProfile = function (event, emailAddr, onSuccess, onFail) {
    Request({
        method: 'POST',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.contactsEndpoint,
        params: {
            eventId: event.eventid,
            emailAddress: emailAddr
        },
        onSuccess: onSuccess,
        onFailure: onFail
    });

};

liferay.connect.updateProfile = function (profileData, onSuccess, onFail) {
    Request({
        method: 'POST',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.profileUpdateEndpoint,
        params: profileData,
        onSuccess: onSuccess,
        onFailure: onFail
    });

};

liferay.connect.refreshConnections = function (event, onSuccess, onFail) {
    Request({
        method: 'POST',
        hashAlg: 'sha',
        sigName: 'signature',
        url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.matchesEndpoint,
        params: {
            eventId: event.eventid,
            contactId: liferay.connect.currentEventData.profile.eventContactId
        },
        onSuccess: onSuccess,
        onFailure: onFail
    });

};
