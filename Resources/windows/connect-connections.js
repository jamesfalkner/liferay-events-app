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


liferay.screens.connectConnections = new liferay.classes.window();
liferay.screens.connectConnections.className = 'liferay.screens.connectConnections';

liferay.screens.connectConnections.render = function () {

    var self = this;

    this.eventConnections = [];

    var panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    var profileBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.profile);

    profileBtn.backgroundImage = '/images/silhouette.png';
    profileBtn.borderRadius = 5;
    profileBtn.borderSize = 20;
    profileBtn.borderColor = '#CCCCCC';

    profileBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    profileBtn.height = profileBtn.width;

    var hasConfirmedProfile = liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent);

    if (hasConfirmedProfile) {

        this.loadImage({
            setImage: false,
            imageView: profileBtn,
            url: liferay.connect.currentEventData.profile.picUrl
        });
    }

    profileBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                liferay.controller.closeLast(true, true);
                var view = liferay.screens.connectProfile;
                liferay.controller.open(view.render(), view, true);
                view.loadProfile(null);
            }
        });
    });

    var connectionsBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.connections);

    connectionsBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    connectionsBtn.height = connectionsBtn.width;
    connectionsBtn.opacity = 0.3;
    connectionsBtn.touchEnabled = false;

    this.recoBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.recommendations);

    this.recoBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    this.recoBtn.height = this.recoBtn.width;

    this.recoBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                liferay.controller.closeLast(true, true);

                var reco = liferay.screens.connectReco;
                liferay.controller.open(reco.render(), reco, true);
                reco.displayNextRecommendation();
            }
        });
    });

    if (!hasConfirmedProfile) {
        this.recoBtn.touchEnabled = connectionsBtn.touchEnabled = false;
        this.recoBtn.opacity = connectionsBtn.opacity = 0.3;
    }

    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        swipe: false,
        panelBg: panelBg,
        footerButtons: [profileBtn, this.recoBtn, connectionsBtn]
    });

    this.listViewSection = Ti.UI.createListSection({
        headerTitle: L('CONNECTIONS')
    });

    this.listView = Ti.UI.createListView({
        templates: liferay.list_templates.list,
        defaultItemTemplate: 'base'
    });

    this.listView.addEventListener('itemclick', function (e) {

        if (e.itemId === 'NONE') {
            var hasProfile = liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent);

            var alertDialog = Titanium.UI.createAlertDialog({
                title: "Liferay EventConnect",
                persistent: true,
                message: L(hasProfile ? 'NO_CONNECTIONS' : 'WELCOME_NO_PROFILE'),
                buttonNames: [L(hasProfile ? 'SEE_RECOMMENDATIONS' : 'SETUP_PROFILE'), L('CLOSE')]
            });
            alertDialog.addEventListener('click', function (e) {
                if (e.index == 0) {
                    liferay.controller.closeLast(true, true);
                    if (hasProfile) {
                        var reco = liferay.screens.connectReco;
                        liferay.controller.open(reco.render(), reco, true);
                        reco.displayNextRecommendation();
                    } else {
                        var profile = liferay.screens.connectProfile;
                        liferay.controller.open(profile.render(), profile, true);
                        profile.loadProfile(null);
                    }
                }
            });

            alertDialog.show();

            return;
        }
        if (!liferay.connect.isConnected(liferay.screens.connectConnections.eventConnections[e.itemIndex])) {
            liferay.tools.toastNotification(null, L('NOT_CONNECTED'));
            return;
        }

        liferay.controller.open(liferay.screens.connectChat.render(), liferay.screens.connectChat);
        liferay.screens.connectChat.showChat(liferay.screens.connectConnections.eventConnections[e.itemIndex]);
    });

    this.listView.setSections([this.listViewSection]);

    panelBg.add(this.listView);

    this.displayConnections();
    return this.window;
};

liferay.screens.connectConnections.refresh = function () {
   // this.displayConnections();
}

liferay.screens.connectConnections.testAction = function(msgTemplate, actionSpec, event_uuid) {

    // force re-sync
    liferay.connect.forceSync();
    return msgTemplate;
}

liferay.screens.connectConnections.displayConnections = function () {
    var self = this;
    var data = [];

    this.listViewSection.setItems([], {animation: true});

    this.eventConnections = liferay.connect.getConnections();
    this.eventConnections.sortBy('lastContact', 'fullName', 'company');

    var capsHeight = Titanium.Platform.displayCaps.platformHeight;
    var rowHeight = liferay.tools.getDp(capsHeight * .115);


    if (!this.eventConnections || this.eventConnections.length <= 0) {

        var hasProfile = liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent);

        var alertDialog = Titanium.UI.createAlertDialog({
            title: "Liferay EventConnect",
            persistent: true,
            message: L(hasProfile ? 'NO_CONNECTIONS' : 'WELCOME_NO_PROFILE'),
            buttonNames: [L(hasProfile ? 'SEE_RECOMMENDATIONS' : 'SETUP_PROFILE'), L('CLOSE')]
        });
        alertDialog.addEventListener('click', function (e) {
            if (e.index == 0) {
                liferay.controller.closeLast(true, true);
                if (hasProfile) {
                    var reco = liferay.screens.connectReco;
                    liferay.controller.open(reco.render(), reco, true);
                    reco.displayNextRecommendation();
                } else {
                    var profile = liferay.screens.connectProfile;
                    liferay.controller.open(profile.render(), profile, true);
                    profile.loadProfile(null);


                }
            }
        });

        this.listViewSection.setItems([{
            image: {
                image: liferay.settings.screens.contacts.defaultPicture
            },
            title: {
                text: L('NO_CONNECTIONS_ROW'),
                font: liferay.fonts.h2
            },
            properties: {
                height: rowHeight,
                itemId: "NONE"
            }

        }], {animation: true});

        setTimeout(function() {
            alertDialog.show();
        }, 250);

        //if (logo && logo.indexOf('/') == 0) {
        //    logo = liferay.settings.server.connectHost.host + logo;
        //}

        return;
    }

    var now = new Date().getTime();
    this.eventConnections.forEach(function (connection) {

        var text = connection.fullName;
        if (connection.matchDate && (connection.matchDate > (now - 24 * 60 * 60 * 1000))) {
            text = '(' + L('NEW') + ') ' + text;
        }
        var dataItem = {
            image: {
                image: liferay.screens.connectConnections.getImage(connection)
            },
            title: {
                text: text
            },
            properties: {
                height: rowHeight,
                itemId: connection.eventContactId
            }
        };

        if (connection.company && connection.jobTitle) {
            dataItem.template = 'with_subtitle';
            dataItem.subtitle = {
                text: connection.jobTitle + " | " + connection.company.toUpperCase()
            }
        }

        data.push(dataItem);
    });

    this.listViewSection.setItems(data, {animation: true});

};

liferay.screens.connectConnections.getImage = function(connection) {

    var lcl = liferay.screens.connectConnections.getLocalImage({
        url: connection.picUrl
    });

    if (lcl) {
        return lcl;
    } else {
        var tmpView = Ti.UI.createImageView();
        if (connection.picUrl && connection.picUrl.indexOf('/') == 0) {
            connection.picUrl = liferay.settings.server.connectHost.host + connection.picUrl;
        }

        liferay.screens.connectConnections.loadImage({
            url: connection.picUrl,
            imageView: tmpView,
            setImage: true,
            onLoad: function (imgView) {
                liferay.screens.connectConnections.setListImage(connection, imgView.image);
            }
        });
        return liferay.settings.screens.contacts.defaultPicture;
    }
};

liferay.screens.connectConnections.setListImage = function(connection, img) {
    if (!liferay.screens.connectConnections.listViewSection) {
        return;
    }
    var items = liferay.screens.connectConnections.listViewSection.getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].properties && items[i].properties.itemId == connection.eventContactId) {
            items[i].image.image = img;
            liferay.screens.connectConnections.listViewSection.updateItemAt(i, items[i], {animated: true});
            break;
        }
    }

};
