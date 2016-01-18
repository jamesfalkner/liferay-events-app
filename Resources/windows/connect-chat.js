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



liferay.screens.connectChat = new liferay.classes.window();
liferay.screens.connectChat.className = 'liferay.screens.connectChat';

liferay.screens.connectChat.render = function () {

    var self = this;
    var panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);
    var header = Ti.UI.createView(liferay.settings.screens.all.layout.header);

    this.displayedMsgs = [];
    this.lbl = Ti.UI.createLabel(liferay.settings.screens.all.layout.headerLabel);
    this.lbl.font = liferay.fonts.h3b;
    header.add(this.lbl);

    this.chatMsgContainer = Ti.UI.createView({
        bottom: 0,
        left: '5dp',
        right: '5dp',
        //backgroundColor: 'red',
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });
    var inputContainer = Ti.UI.createView({
        // backgroundColor: 'blue',
        top: '90%',
        left: '5dp',
        right: '5dp',
        height: '10%'
    });

    var panelBgScroll = Ti.UI.createScrollView({
        showVerticalScrollIndicator: false,
        showHorizontalScrollIndicator: false,
        height: Ti.UI.FILL,
        width: Ti.UI.FILL,
        canCancelEvents: false
    });

    this.chatScroll = Ti.UI.createScrollView({
        top: '2%',
        contentWidth: 'auto',
        contentHeight: 'auto',
        //   backgroundColor: 'magenta',
        showVerticalScrollIndicator: true,
        showHorizontalScrollIndicator: false,
        height: '86%',
        width: Ti.UI.FILL
    });

    this.chatScroll.add(this.chatMsgContainer);


    panelBgScroll.add(this.chatScroll);
    panelBgScroll.add(inputContainer);

    panelBg.add(panelBgScroll);

    var bottomLeft = Ti.UI.createView({
        //  backgroundColor: 'red',
        left: 0,
        top: 0,
        width: '70%',
        height: Ti.UI.FILL
    });

    var bottomRight = Ti.UI.createView({
        // backgroundColor: 'green',
        left: '70%',
        top: 0,
        width: '30%',
        height: Ti.UI.FILL
    });

    inputContainer.add(bottomLeft);
    inputContainer.add(bottomRight);

    var msgFieldContainer = Ti.UI.createView({
        //   backgroundColor: 'yellow',
        left: '3dp',
        top: '3dp',
        right: '3dp',
        bottom: '3dp'
    });

    var sendBtnContainer = Ti.UI.createView({
        //   backgroundColor: 'cyan',
        left: '3dp',
        top: '3dp',
        right: '3dp',
        bottom: '3dp'
    });

    this.msgField = Ti.UI.createTextField({
        width: '97%',
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        font: liferay.fonts.h2,
        height: '97%',
        hintText: L('MESSAGE'),
        hintTextColor: '#333333'
    });

    if (liferay.model.android) {
        this.msgField.backgroundColor = 'transparent';
        this.msgField.backgroundImage = '/images/notes.png';
        this.msgField.color = 'black';
    }


    this.sendBtn = Ti.UI.createButton({
        font: liferay.fonts.h3,
        title: L('SEND')
    });

    if (liferay.model.android) {
      //  this.sendBtn.color = 'black';
    }

    sendBtnContainer.add(this.sendBtn);
    msgFieldContainer.add(this.msgField);
    bottomLeft.add(msgFieldContainer);
    bottomRight.add(sendBtnContainer);

    var deleteBtn = Titanium.UI.createView(liferay.settings.screens.connectChat.buttons.delete);

    deleteBtn.width = liferay.tools.getDp(liferay.settings.screens.connectChat.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    deleteBtn.height = deleteBtn.width;

    deleteBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                self.unlink();
            }
        });
    });

    var clearBtn = Titanium.UI.createView(liferay.settings.screens.connectChat.buttons.clear);

    clearBtn.width = liferay.tools.getDp(liferay.settings.screens.connectChat.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    clearBtn.height = clearBtn.width;

    clearBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                self.clearMsgs();
            }
        });
    });

    this.window = liferay.ui.makeWindow({
        windowSoftInputMode: (liferay.model.android ? Ti.UI.Android.SOFT_INPUT_ADJUST_PAN : null),
        backEnabled: true,
        swipe: true,
        panelBg: panelBg,
        header: header,
        footerButtons: [clearBtn, deleteBtn],
        onClose: function() {
            liferay.connect.removeChatListeners();
            clearInterval(self.syncTimer);
            self.currentConnection = null;
        }
    });

    this.chatMsgContainer.addEventListener('click', function (e) {
        if (liferay.model.android) {
            Ti.UI.Android.hideSoftKeyboard();
        } else if (liferay.model.iOS) {
            self.msgField.blur();
        }
    });

    return this.window;

};

liferay.screens.connectChat.refresh = function () {
    //this.loadEvents();
};

liferay.screens.connectChat.getCurrentChatConnection = function() {
   return this.currentConnection;
};

liferay.screens.connectChat.showChat = function (connection) {
    var self = this;

    this.currentConnection = connection;

    this.lbl.text = connection.fullName;

    var msgs = liferay.connect.getAllMessages();
    var queuedMsgs = liferay.connect.getQueuedMessages();

    // clear msgs first
    self.displayedMsgs = [];
    self.chatMsgContainer.removeAllChildren();

    this.addMessages(msgs.concat(queuedMsgs).sort(function(a, b) {
        var aDate = ((a.message && a.message.date) ? a.message.date : a.createDate);
        var bDate = ((b.message && b.message.date) ? b.message.date : b.createDate);
        return (aDate - bDate);
    }).filter(function(msg) {
        return (msg.fromId == self.currentConnection.eventContactId || msg.toId == self.currentConnection.eventContactId);
    }));

    liferay.connect.removeChatListeners();

    liferay.connect.addChatListener(function (msgs) {
        self.addMessages(msgs.filter(function (el) {
            return (el.fromId != liferay.connect.currentEventData.profile.eventConnectId);
        }));
        self.chatScroll.scrollToBottom();

    });

    this.sendBtn.removeEventListener('click', liferay.screens.connectChat.sendMsg);
    this.sendBtn.addEventListener('click', liferay.screens.connectChat.sendMsg);

    this.chatScroll.scrollToBottom();

    // start an interval to look for msgs
    self.syncTimer = setInterval(function() {
        liferay.connect.forceSync();
    }, 5000);

};

liferay.screens.connectChat.sendMsg = function(e) {
    var msg = liferay.screens.connectChat.msgField.value.trim();
    if (msg) {
        liferay.screens.connectChat.processNewSent(liferay.connect.currentEventData.profile.eventContactId, liferay.screens.connectChat.currentConnection.eventContactId, msg, new Date().getTime(), false);
        liferay.screens.connectChat.msgField.value = '';
    }
};

liferay.screens.connectChat.testAction = function(msgTemplate, actionSpec, event_uuid) {
    var contactId = actionSpec[0];
    var currentlyChatting = this.getCurrentChatConnection();
    if (!currentlyChatting) {
        return msgTemplate;
    }

    if (contactId && (currentlyChatting.eventContactId == contactId)) {
        return null;
    }
    return msgTemplate;
};

liferay.screens.connectChat.loadAction = function(actionSpec, event_uuid, cb) {
    var contactId = actionSpec[0];
    if (contactId) {
        var connection = liferay.connect.getConnectionById(contactId);
        if (connection) {
            this.showChat(connection);
        } else {
            liferay.tools.alert(L('ALERT'), L('FAILED_UPDATE_NETWORK'));
        }
    } else {
        liferay.tools.alert(L('ALERT'), L('FAILED_UPDATE_NETWORK'));
    }
};

liferay.screens.connectChat.unlink = function() {

    var self = this;

    var alertDialog = Titanium.UI.createAlertDialog({
        title : L('ALERT'),
        message : String.format(L('UNLINK_CONFIRM'), self.currentConnection.fullName),
        buttonNames : [L('YES'), L('NO')]
    });
    alertDialog.addEventListener('click', function(e) {
        if (e.index == 0) {

            Request({
                method: 'POST',
                sigName: 'signature',
                url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.unlinkEndpoint,
                params: {
                    eventId: liferay.connect.currentEventId,
                    contactId: liferay.connect.currentEventData.profile.eventContactId,
                    targetContactId: self.currentConnection.eventContactId
                },
                onSuccess: function (data) {
                    if (data && !data.exception) {
                        liferay.connect.deleteConnection(self.currentConnection);
                        var view = liferay.controller.closeLast(true, true);
                        liferay.controller.getCurrentView().displayConnections &&
                            liferay.controller.getCurrentView().displayConnections();
                        liferay.tools.toastNotification(null, String.format(L('UNLINKED'), self.currentConnection.fullName));
                        self.currentConnection = null;
                    } else {
                        liferay.tools.alert(L('ALERT'), L('UNLINK_FAILED'));
                    }
                },
                onFailure: function(err) {
                    liferay.tools.alert(L('ALERT'), L('UNLINK_FAILED'));
                }
            });

        }
    });
    alertDialog.show();


};

liferay.screens.connectChat.clearMsgs = function() {

    var self = this;

    var alertDialog = Titanium.UI.createAlertDialog({
        title : L('ALERT'),
        message : L('CLEAR_CONFIRM'),
        buttonNames : [L('YES'), L('NO')]
    });
    alertDialog.addEventListener('click', function(e) {
        if (e.index == 0) {
            self.displayedMsgs = [];
            liferay.connect.currentEventData.messageBeginDate = new Date().getTime();
            liferay.connect.currentEventData.messages = [];
            liferay.connect.currentEventData.queuedMessages = [];
            liferay.connect.saveDataToFile();
            self.chatMsgContainer.removeAllChildren();
        }
    });
    alertDialog.show();


};

liferay.screens.connectChat.addMessages = function (messages) {

    var self = this;
    messages.forEach(function (msg) {

        if (msg.messageId) {
            if (!this.displayedMsgs || (this.displayedMsgs.indexOf(msg.messageId) < 0)) {
                var myId = liferay.connect.currentEventData.profile.eventContactId;
                var fromId = msg.fromId;
                var isTheirMsg = (fromId != myId);
                var msgImg = liferay.connect.getProfile(fromId).picUrl;

                self.addSingleMsg(msg.content, isTheirMsg ? '#f7f7f7' : '#007aff', isTheirMsg ? 'black' : 'white', msg.createDate, isTheirMsg);

                if (!self.displayedMsgs) {
                    self.displayedMsgs = [];
                }
                self.displayedMsgs.push(msg.messageId);
            }
        } else {
            // temp message
            self.processNewSent(liferay.connect.currentEventData.profile.eventContactId, msg.message.toId, msg.message.content, msg.message.date, true);
        }
    });

    this.chatScroll.scrollToBottom();

};

liferay.screens.connectChat.addSingleMsg = function(message, bgColor, msgColor, date, leftAlign) {

    var chatRow = Ti.UI.createView({
        top: '10dp',
        height: Ti.UI.SIZE,
        //   backgroundColor: 'red',
        width: '75%'
    });


    var chatBox = Ti.UI.createView({
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        backgroundColor: bgColor,
        borderSize: '2dp',
        borderRadius: '5dp',
        borderColor: bgColor
    });

    if (leftAlign) {
        chatRow.left = chatBox.left = 0;
    } else {
        chatRow.right = chatBox.right = 0;
    }

    var chatSpacer = Ti.UI.createView({
        left: '5dp',
        top: '5dp',
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        //  backgroundColor: 'green',
        layout: 'vertical'
    });


    var chatMsg = Ti.UI.createLabel({
        font: liferay.fonts.h2,
        color: msgColor,
        text: " " + message + " ",
        width: Ti.UI.SIZE,
        //   backgroundColor: 'orange',
        top: '5dp',
        height: Ti.UI.SIZE
    });

    var now = new Date();
    var tmpDate = new Date(date);
    var isToday = (tmpDate.getYear() == now.getYear()) &&  (tmpDate.getMonth() == now.getMonth()) && (tmpDate.getDate() == now.getDate());

    var timeMsg = Ti.UI.createLabel({
        font: {
            fontSize: liferay.fonts.H0Size *.8,
            fontFamily: liferay.fonts.h0.fontFamily
        },
        color: msgColor,
        //  backgroundColor: 'pink',
        text: isToday? String.formatTime(tmpDate, 'short') : (String.formatDate(tmpDate, 'short') + ' ' + String.formatTime(tmpDate, 'short')),
        top: '5dp',
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT
    });

    if (leftAlign) {
        timeMsg.left = '3dp';
    } else {
        timeMsg.right = '3dp';

    }

    chatSpacer.add(chatMsg);
    chatSpacer.add(timeMsg);
    chatBox.add(chatSpacer);
    chatRow.add(chatBox);
    this.chatMsgContainer.add(chatRow);



    return chatBox;

};

liferay.screens.connectChat.generateTempId = function(fromId, toId, content) {
    return Ti.Utils.sha256(fromId + toId + content + new Date().getTime());
};

liferay.screens.connectChat.processNewSent = function (fromId, toId, msg, date, silent) {

    var self = this;

    var chatBox = this.addSingleMsg(msg, '#ffd3a0', 'white', date, false);

    var tmpQueuedMsg = {
        date: date,
        toId: toId,
        fromId: fromId,
        content: msg,
        tempMessageId: liferay.screens.connectChat.generateTempId(fromId , toId, msg)
    };

    if (!silent) {
        setTimeout(function() {
            self.chatScroll.scrollToBottom();
        }, 100);
    }

    liferay.connect.sendMessage(liferay.controller.selectedEvent, toId, msg, function(newMsg) {
        chatBox.animate({
            backgroundColor: '#007AFF',
            duration: 1000
        }, function() {
            chatBox.backgroundColor = '#007AFF'
        });

    }, function(err) {

        liferay.connect.addQueuedMessage(tmpQueuedMsg, function() {
            chatBox.setTouchEnabled(false);
            chatBox.animate({
                backgroundColor: '#007aff',
                duration: 1000
            }, function() {
                chatBox.backgroundColor = '#007aff';
            });
        });

        chatBox.animate({
            backgroundColor: '#FF3B30',
            duration: 1000
        }, function() {
            chatBox.backgroundColor = '#FF3B30';
        });

        if (!silent) {
            liferay.tools.toastNotification(chatBox, L('CANT_SEND_MSG'));
        }

        chatBox.addEventListener('click', function(e) {
            e.source.setTouchEnabled(false);
            liferay.connect.sendMessage(liferay.controller.selectedEvent, toId, msg, function(newMsg) {

                liferay.connect.setQueuedMessages(liferay.connect.getQueuedMessages().filter(function (el) {
                    return (el.message.tempMessageId !== tmpQueuedMsg.tempMessageId);
                }));

                e.source.setTouchEnabled(false);
                chatBox.animate({
                    backgroundColor: '#007aff',
                    duration: 1000
                }, function(el) {
                    chatBox.backgroundColor = '#007aff'
                });
            }, function(err) {
                e.source.setTouchEnabled(true);
                liferay.tools.toastNotification(e.source, L('CANT_SEND_MSG'));

            });
        });
    });
};
