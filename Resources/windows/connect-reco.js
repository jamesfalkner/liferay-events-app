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


liferay.screens.connectReco = new liferay.classes.window();
liferay.screens.connectReco.className = 'liferay.screens.connectReco';

liferay.screens.connectReco.render = function () {

    var self = this;
    this.connections = [];

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    var profileBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.profile);

    profileBtn.backgroundImage = '/images/silhouette.png';
    profileBtn.backgroundImageAlt = '/images/silhouette.png';
    profileBtn.borderRadius = 5;
    profileBtn.borderSize = 20;
    profileBtn.borderColor = '#CCCCCC';

    profileBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    profileBtn.height = profileBtn.width;

    if (liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent)) {

        this.loadImage({
            setImage: false,
            imageView: profileBtn,
            url: liferay.connect.currentEventData.profile.picUrl,
            onLoad: function(imgView) {
                imgView.backgroundImageAlt = imgView.backgroundImage;
            }
        });
    }

    profileBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                liferay.controller.closeLast(true, true);
                var win = liferay.screens.connectProfile;
                liferay.controller.open(win.render(), win, true);
                win.loadProfile(null);
            }
        });
    });


    var connectionsBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.connections);

    connectionsBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    connectionsBtn.height = connectionsBtn.width;
    connectionsBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                liferay.controller.closeLast(true, true);
                var win = liferay.screens.connectConnections;
                liferay.controller.open(win.render(), win, true);
               // win.displayConnections();
            }
        });
    });

    this.recoBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.recommendations);

    this.recoBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    this.recoBtn.height = this.recoBtn.width;
    this.recoBtn.touchEnabled = false;
    this.recoBtn.opacity = 0.3;

    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        swipe: false,
        panelBg: this.panelBg,
        footerButtons: [profileBtn, this.recoBtn, connectionsBtn]
    });


    // construct UI
    var overallSpacer = Ti.UI.createView({
        top: '5dp',
        left: '10dp',
        right: '10dp',
        bottom: '5dp'
    });

    this.topContainer = Ti.UI.createView({
        top: 0,
        width: Ti.UI.FILL,
        height: '40%'
    });

    var actionButtonContainer = Ti.UI.createView({
        top: '40%',
        height: '15%',
        width: Ti.UI.FILL
    });

    var actionButtonSpacer = Ti.UI.createView({
        top: '5dp',
        bottom: '5dp',
        left: '5dp',
        right: '5dp'
    });

    actionButtonContainer.add(actionButtonSpacer);

    var bottomScroll = Ti.UI.createScrollView({
        top: '55%',
        height: '44%',
        contentWidth: 'auto',
        contentHeight: 'auto',
        showHorizontalScrollIndicator: false,
        showVerticalScrollIndicator: true,
        width: Ti.UI.FILL
    });

    var bottomContainer = Ti.UI.createView({
        height: Ti.UI.SIZE,
        width: Ti.UI.FILL
    });

    bottomScroll.add(bottomContainer);


    overallSpacer.add(this.topContainer);
    overallSpacer.add(actionButtonContainer);
    overallSpacer.add(bottomScroll);

    this.panelBg.add(overallSpacer);

    var imageContainer = Ti.UI.createView({
        height: Ti.UI.FILL,
        width: Ti.UI.FILL
    });

    this.badgeImage = Titanium.UI.createImageView({
        preventDefaultImage: true,
        width: '20%',
        left: '5dp',
        bottom: '10dp',
        height: 'auto',
        image: "",
        opacity: 0
    });

    this.image = Titanium.UI.createImageView({
        //   backgroundColor: 'orange',
        preventDefaultImage: false,
        touchEnabled: false,
        width: '100%',
        height: 'auto',
        defaultImage: liferay.settings.screens.contacts.defaultPicture
    });

    imageContainer.add(this.image);
    imageContainer.add(this.badgeImage);
    this.topContainer.add(imageContainer);


    var titleContainerShader = Ti.UI.createView({
        touchEnabled: false,
        width: '70%',
        height: '40%',
        bottom: '10dp',
        right: 0,
        backgroundColor: 'black',
        opacity: 0.6
    });

    var titleContainer = Ti.UI.createView({
        touchEnabled: false,
        width: '70%',
        height: '40%',
        bottom: '10dp',
        right: 0,
        backgroundColor: 'transparent'
    });

    var titleSpacer = Ti.UI.createView({
        touchEnabled: false,
        bottom: '5dp',
        left: '5dp',
        right: '5dp',
        top: '5dp'
    });

    var titleLabelContainer = Ti.UI.createView({
        touchEnabled: false,
        layout: 'vertical',
        height: Ti.UI.SIZE,
        width: Ti.UI.FILL,
        bottom: 0
    });

    titleSpacer.add(titleLabelContainer);
    titleContainer.add(titleSpacer);
    this.topContainer.add(titleContainerShader);
    this.topContainer.add(titleContainer);

    this.nameLabel = Ti.UI.createLabel({
        touchEnabled: false,
        text: "----",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h4,
        color: 'white'
    });

    titleLabelContainer.add(this.nameLabel);

    this.jobTitleLabel = Ti.UI.createLabel({
        touchEnabled: false,
        text: "------",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h1,
        color: 'white'
    });

    titleLabelContainer.add(this.jobTitleLabel);

    this.industryLabel = Ti.UI.createLabel({
        touchEnabled: false,
        text: "-----",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h1,
        color: 'white'
    });

    titleLabelContainer.add(this.industryLabel);

    this.skipBtn = Ti.UI.createImageView(liferay.settings.screens.connectReco.actionButtons.skip);
    this.addBtn = Ti.UI.createImageView(liferay.settings.screens.connectReco.actionButtons.add);

    actionButtonSpacer.add(this.skipBtn);
    actionButtonSpacer.add(this.addBtn);

    this.skipBtn.addEventListener('click', function (e) {
        if (self.topContainer.currentRecommendation) {
            liferay.connect.addUninterested(self.topContainer.currentRecommendation.eventContactId);
        }

        self.topContainer.animate({
            opacity: 0,
            duration: 200
        }, function() {
            self.displayNextRecommendation();
        });
    });

    this.addBtn.addEventListener('click', function (e) {

        liferay.connect.recordInterest(liferay.controller.selectedEvent,
            self.topContainer.currentRecommendation.eventContactId);

        var curTargetId = self.topContainer.currentRecommendation.eventContactId;

        Request({
            method: 'POST',
            sigName: 'signature',
            url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.recordInterestEndpoint,
            params: {
                eventId: liferay.controller.selectedEvent.eventid,
                contactId: liferay.connect.currentEventData.profile.eventContactId,
                targetContactId: curTargetId
            },
            onSuccess: function (data) {
                if (!data.exception) {
                    liferay.connect.setQueuedInterests(
                        liferay.connect.getQueuedInterests().filter(function (el) {
                            return (el != curTargetId)
                        }));
                    liferay.connect.saveDataToFile();
                }
                if (data.eventContactId) {
                    liferay.connect.recordMatch(liferay.controller.selectedEvent, data);
                    var alertDialog = Titanium.UI.createAlertDialog({
                        title: String.format(L('ITS_A_MATCH'), data.givenName),
                        message: String.format(L('MSG_ITS_A_MATCH'), data.givenName),
                        buttonNames: [L('MSG_SEND_A_MSG'), L('SEE_MORE_RECOMMENDATIONS')]
                    });
                    alertDialog.addEventListener('click', function (e) {
                        if (e.index == 0) {
                            liferay.controller.open(liferay.screens.connectChat.render(), liferay.screens.connectChat);
                            liferay.screens.connectChat.showChat(data);
                        }
                    });

                    alertDialog.show();

                }
            }
        });

        self.topContainer.animate({
            opacity: 0,
            duration: 200
        }, function () {
            self.displayNextRecommendation();
        });
    });

    var fields = [];

    fields.push(
        {
            name: L('FMT_LOCATION'),
            value: '--------'
        });

    fields.push(
        {
            name: L('FMT_SCORE'),
            value: '--------'
        });
    fields.push(
        {
            name: L('FMT_WHY'),
            value: '--------',
            font: liferay.fonts.h0
        });


    var fieldContainer = Titanium.UI.createView({
        layout: 'vertical',
        height: Ti.UI.SIZE
    });

    this.fieldLabels = [];

    for (var i = 0; i < fields.length; i++) {
        var item = fields[i];

        if ((!item.value) || item.value == '') {
            continue;
        }

        var fieldRow = Titanium.UI.createView({
            layout: 'horizontal',
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            top: '3%'
        });

        var labelContainer = Titanium.UI.createView({
            width: '30%',
            height: Ti.UI.SIZE,
            left: 0,
            top: 0
        });

        var labelLabel = Titanium.UI.createLabel({
            top: 0,
            right: '10%',
            width: Ti.UI.SIZE,
            height: Ti.UI.SIZE,
            textAlign: 'right',
            color: '#89A9C9'

        });
        labelLabel.text = item.name;
        labelLabel.font = liferay.fonts.h3;
        labelContainer.add(labelLabel);
        fieldRow.add(labelContainer);

//		// separator ---------------------------------------

        labelContainer = Titanium.UI.createView({
            width: '65%',
            height: Ti.UI.SIZE,
            left: 0,
            top: 2
        });

        var label = Titanium.UI.createLabel({
            top: 0,
            left: '10%',
            width: Ti.UI.SIZE,
            height: Ti.UI.SIZE,
            textAlign: 'left',
            color: '#444444'

        });
        label.text = item.value;
        label.font = item.font ? item.font : liferay.fonts.h2;
        this.fieldLabels.push({label: label, labelLabel: labelLabel, name: item.name});
        labelContainer.add(label);
        fieldRow.add(labelContainer);
        fieldContainer.add(fieldRow);
    }

    bottomContainer.add(fieldContainer);

    // separator
    bottomContainer.add(Ti.UI.createView({
        left: '33%',
        top: '10dp',
        width: 2,
        bottom: '10dp',
        backgroundColor: '#EEEEEE',
        touchEnabled: false
    }));


    return this.window;
};

liferay.screens.connectReco.refresh = function () {
    //this.loadEvents();
};

liferay.screens.connectReco.displayNextRecommendation = function () {

    var self = this;

    var recommendation = liferay.connect.getNextRecommendation(liferay.controller.selectedEvent);

        this.addBtn.touchEnabled =
            this.skipBtn.touchEnabled =
                ( recommendation ? true : false);

    if (!recommendation) {

        if (!liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent)) {
            var alertDialog = Titanium.UI.createAlertDialog({
                title: "Liferay EventConnect",
                message: L('WELCOME_NO_PROFILE'),
                buttonNames: [L('SETUP_PROFILE'), L('CLOSE')]
            });
            alertDialog.addEventListener('click', function (e) {
                if (e.index == 0) {
                    liferay.controller.closeLast(true, true);
                    var profile = liferay.screens.connectProfile;
                    liferay.controller.open(profile.render(), profile, true);
                    profile.loadProfile(null);
                }
            });

            alertDialog.show();

        } else {
            var alertDialog = Titanium.UI.createAlertDialog({
                title: L('NO_MORE_RECOMMENDATIONS'),
                message: L('MSG_NO_MORE_RECOMMENDATIONS'),
                buttonNames: [L('SEE_PREVIOUS'), L('SEE_CONNECTIONS'), L('SEE_PROFILE')]
            });
            alertDialog.addEventListener('click', function (e) {
                if (e.index == 0) {
                    liferay.connect.currentEventData.uninterestedIds = [];
                    liferay.connect.saveDataToFile();
                    var newrecs = liferay.connect.getNextRecommendation(liferay.controller.selectedEvent);
                    if (!newrecs) {
                        liferay.tools.blockingAlert(L('NO_MORE_RECOMMENDATIONS'), L('NO_MORE_RECS_WAIT'), function () {
                            liferay.controller.closeLast(true, true);
                        });
                        return;

                    }
                    self.displayNextRecommendation();
                } else if (e.index == 1) {
                    liferay.controller.closeLast(true, true);
                    var win = liferay.screens.connectConnections;
                    liferay.controller.open(win.render(), win, true);
                  //  win.displayConnections();
                } else if (e.index == 2) {
                    liferay.controller.closeLast(true, true);
                    var win = liferay.screens.connectProfile;
                    liferay.controller.open(win.render(), win, true);
                    win.loadProfile(null);

                }
            });

            alertDialog.show();
        }
    } else {
        this.showRecommendation(recommendation);
    }

};

liferay.screens.connectReco.showRecommendation = function (recommendation) {

    var isSponsor = false;
    var logo = recommendation.picUrl;

    this.nameLabel.text = recommendation.name;
    this.jobTitleLabel.text = recommendation.jobTitle;
    this.industryLabel.text = recommendation.industry.toLocaleUpperCase();

    var recoDesc = this.getLikenessDescription(recommendation.likenessDescription);
    var locDesc = (recommendation.city ? (recommendation.city + ", ") : "") + L('COUNTRY_NAME_' + recommendation.country.toUpperCase());

    if (recommendation.attendeeType && recommendation.attendeeType.indexOf('sponsor') != -1) {
        isSponsor = true;
        var sponsor = liferay.screens.sponsors.getSponsor(recommendation.name);
        if (sponsor && sponsor.docmedia) {
            logo = sponsor.docmedia;
        }
        if (sponsor && sponsor.description) {
            recoDesc = sponsor.description;
        }

        if (sponsor && sponsor.location) {
            locDesc = sponsor.location;
        }
        this.jobTitleLabel.text = '';
    }

    var self = this;
    self.topContainer.currentRecommendation = recommendation;

    self.image.image = liferay.settings.screens.contacts.defaultPicture;

    if (logo && logo.indexOf('/') == 0) {
        logo = liferay.settings.server.connectHost.host + logo;
    }

    self.loadImage({
        setImage: true,
        imageView: self.image,
        url: logo,
        onLoad: function () {
            if (liferay.model.android && logo) {
                setTimeout(function () {
                    var ifi = self.image.toBlob();
                    ifi = ifi.imageAsResized(ifi.width * 2, ifi.height * 2);
                    self.image.setImage(ifi);
                    self.topContainer.animate({
                        opacity: 1.0,
                        duration: 200
                    }, function() {
                        self.topContainer.opacity = 1.0;
                    });
                }, 200);
            } else if (logo) {
                self.topContainer.animate({
                    opacity: 1.0,
                    duration: 200
                });
            }
        }
    });

    liferay.screens.connectProfile.setBadge(this.badgeImage, recommendation.attendeeType);

    self.fieldLabels.forEach(function (lblo) {
        if (lblo.name === L('FMT_LOCATION')) lblo.label.text = locDesc;
        if (lblo.name === L('FMT_SCORE')) lblo.label.text = String.format('%2.1f%%', (recommendation.likeness * 100) + 0.001);
        if (lblo.name === L('FMT_WHY')) {
            if (recoDesc) {
                lblo.label.text = recoDesc;
                lblo.labelLabel.visible = true;
            } else {
                lblo.label.text = '';
                lblo.labelLabel.visible = false;
            }
        }
    });
}
;

// [ { key: "SOME_L10N_KEY", args: [ "arg1", "arg2" ]}, ...]
liferay.screens.connectReco.getLikenessDescription = function (descSpec) {
    if (!descSpec) return "";

    try {
        var desc = JSON.parse(descSpec);

        var result = "";

        return desc.map(function (obj) {
            var key = obj.key;
            var args = obj.args;
            return String.format.apply(this, [L(key)].concat(args));
        }).join(' ').trim();
    } catch (ex) {
        return descSpec;
    }
};