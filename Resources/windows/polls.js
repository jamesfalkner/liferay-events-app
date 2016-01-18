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


liferay.screens.polls = new liferay.classes.window();
liferay.screens.polls.className = 'liferay.screens.polls';

liferay.screens.polls.helpData = [
    {
        top: '30%',
        left: '20%',
        width: '65%',
        font: liferay.fonts.h4b,
        text: L('SCREEN_POLLS_HELP_1')
    }
];


liferay.screens.polls.render = function () {

    var self = this;

    this.listView = null;
    this.pollData = [];

    this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.window = liferay.ui.makeWindow({
        swipe: true,
        onClose: function () {
            clearInterval(self.pollInterval);
        },
        backEnabled: true,
        panelBg: this.panelBg
    });

    this.lastSuccess = new Date().getTime();

    self.fetchAndUpdate();
    this.pollInterval = setInterval(function () {
        self.fetchAndUpdate();
    }, 5000 + (Math.random() * 5000));

    var vert = Ti.UI.createView({
        layout: 'vertical',
        top: '20%'
    });

    this.introLabel = Ti.UI.createLabel({
        width: '80%',
        color: '#444444',
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h3,
        textid: 'POLLS_INTRO'
    });

    vert.add(this.introLabel);

    var megaWidth = liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight *.06);

    var horn = Ti.UI.createImageView({
        top: '30dp',
        image: '/images/MobApp-Agenda-Icon-MegaGrn-@2x.png',
        width: megaWidth,
        height: megaWidth
    });

    vert.add(horn);
    horn.animate({
        opacity: 0.1,
        transform: Ti.UI.create2DMatrix().rotate(liferay.model.android ? 359 : 179),
        duration: 10000,
        repeat: 30,
        autoreverse: true
    });

    this.panelBg.add(vert);

    return this.window;
};

liferay.screens.polls.fetchAndUpdate = function () {
    var self = this;
    Request({
        method: 'POST',
        hashAlg: 'sha',
        sigName: 'signature',
        url: liferay.settings.server.pollsHost.host + liferay.settings.server.pollsHost.getQuestionsEndpoint,
        params: {
            eventId: liferay.controller.selectedEvent.eventid,
            enabled: true
        },
        onSuccess: function (questionData) {

            if (questionData && questionData.exception) {
                if (self.lastSuccess < (new Date().getTime() - 15000)) {
                    liferay.tools.toastNotification(liferay.controller.getCurrentWindow(), L('POLL_FETCH_ERROR'));
                    self.lastSuccess = new Date().getTime();
                    return;
                }

            }
            if (!Array.isArray(questionData)) {
                return;
            }
            if (!self.pollData) {
                self.pollData = [];
            }


            self.lastSuccess = new Date().getTime();
            self.pollData = questionData;
            if (self.pollData.length > 0) {
                if (self.introLabel) {
                    self.introLabel.animate({
                        opacity: 0,
                        duration: 200
                    }, function() {
                        self.introLabel.text = L('POLLS_BEGIN');
                        self.introLabel.animate({
                            opacity: 1,
                            duration: 200
                        }, function() {
                            setTimeout(function() {
                                self.updatePolls();
                            }, 2000);
                        })
                    });
                } else {
                    self.updatePolls();
                }
            }
        },
        onFailure: function (err) {
            if (self.lastSuccess < (new Date().getTime() - 15000)) {
                liferay.tools.toastNotification(liferay.controller.getCurrentWindow(), L('POLL_FETCH_ERROR'));
                self.lastSuccess = new Date().getTime();
            }
        }
    });


};

liferay.screens.polls.findData = function(id) {
    for (var i = 0; i < this.pollData.length; i++) {
        if (this.pollData[i].questionId == id) {
            return this.pollData[i];
        }
    }
    return null;
};

liferay.screens.polls.updatePolls = function () {

    var self = this;


    if (!this.listView) {
        this.listView = Ti.UI.createListView({
            templates: liferay.list_templates.list,
            defaultItemTemplate: 'base'
        });
        //  this.listView.setSections([this.listViewSection]);
        this.listView.addEventListener('itemclick', function (e) {
            var data = self.findData(e.itemId);
            if (!data) {
                liferay.tools.toastNotification(liferay.controller.getCurrentWindow(), L('POLL_DISABLED'));
                return;
            }
            liferay.controller.open(liferay.screens.pollsDetail.render(), liferay.screens.pollsDetail);
            liferay.screens.pollsDetail.loadDetails(data);
        });
        this.panelBg.removeAllChildren();
        this.introLabel = null;
        this.panelBg.add(this.listView);
    }

    var sections = this.listView.getSections();
    var rowHeight = liferay.tools.getDp(Titanium.Platform.displayCaps.platformHeight * .115);
    liferay.screens.pollsDetail.loadQuestionsAnswered();

    // add missing sections and questions, update existing
    this.pollData.forEach(function (q) {

        var txt = q.shortTitle ? q.shortTitle : q.question;
        if (liferay.screens.pollsDetail.hasAnswered(q)) {
            txt = txt + ' [' + L('ANSWERED') + ']';
        }


        var questionItem = {
            image: {
                image: q.picUrl ? q.picUrl : liferay.settings.screens.contacts.defaultPicture
            },
            title: {
                text: txt
            },
            properties: {
                itemId: q.questionId,
                height: rowHeight
            }

        };

        var currentSectionNames = self.listView.sections.map(function (section) {
            return section.headerTitle;
        });
        var sectionHeadTitle = String.format(L('POLLS_FROM'), q.sponsorName);

        var existingSectionIdx = currentSectionNames.indexOf(sectionHeadTitle);
        var theSection = null;

        if (existingSectionIdx < 0) {
            theSection = Ti.UI.createListSection({'headerTitle': sectionHeadTitle});
            theSection.insertItemsAt(0, [questionItem], {animated: true});
            self.listView.insertSectionAt(0, theSection, {animated: true});
        } else {
            theSection = self.listView.sections[existingSectionIdx];
        }

        var currentIds = theSection.items.map(function(item) { return item.properties.itemId;});

        var existingItemIdx = currentIds.indexOf(q.questionId);

        if (existingItemIdx < 0) {
            theSection.insertItemsAt(0, [questionItem], {animated: true});
        } else {
            var item = theSection.items[existingItemIdx];
            if (item.image.image != q.picUrl || item.title.text != txt) {
                theSection.updateItemAt(existingItemIdx, questionItem, {animated: true});
            }
        }
    });


};
