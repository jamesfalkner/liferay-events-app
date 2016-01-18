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

liferay.screens.connectProfile = new liferay.classes.window();
liferay.screens.connectProfile.className = 'liferay.screens.connectProfile';

liferay.screens.connectProfile.render = function () {

    var self = this;

    this.connections = [];

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.profileBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.profile);

    this.profileBtn.backgroundImage = '/images/silhouette.png';
    this.profileBtn.borderRadius = 5;
    this.profileBtn.borderSize = 20;
    this.profileBtn.borderColor = '#CCCCCC';

    this.profileBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    this.profileBtn.height = this.profileBtn.width;
    this.profileBtn.opacity = 0.3;
    this.profileBtn.touchEnabled = false;

    var hasConfirmedProfile = liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent);

    if (hasConfirmedProfile) {
        this.loadImage({
            setImage: false,
            imageView: this.profileBtn,
            url: liferay.connect.currentEventData.profile.picUrl
        });
    }

    this.connectionsBtn = Titanium.UI.createView(liferay.settings.screens.connectConnections.buttons.connections);

    this.connectionsBtn.width = liferay.tools.getDp(liferay.settings.screens.connectConnections.buttons.psize * Titanium.Platform.displayCaps.platformWidth);
    this.connectionsBtn.height = this.connectionsBtn.width;
    this.connectionsBtn.addEventListener('click', function (e) {
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
        this.recoBtn.opacity = this.connectionsBtn.opacity = 0.3;
        this.recoBtn.touchEnabled = this.connectionsBtn.touchEnabled = false;
    }

    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        swipe: false,
        panelBg: this.panelBg,
        footerButtons: [this.profileBtn, this.recoBtn, this.connectionsBtn],
        headerListeners: [{
            event: 'longpress', listener: function (e) {
                alert("Reset profile");
                liferay.connect.currentEventData.profile = null;
                liferay.connect.currentEventData.recommendations = [];
                liferay.connect.currentEventData.queuedInterests = [];
                liferay.connect.currentEventData.uninterestedIds = [];
                liferay.connect.currentEventData.connections = [];
                liferay.connect.currentEventData.messages = [];
                liferay.connect.saveDataToFile();
                self.loadProfile(null);
            }
        }]
    });

    var overallSpacer = Ti.UI.createView({
        top: '5dp',
        left: '10dp',
        right: '10dp',
        bottom: '5dp'
    });

    var topContainer = Ti.UI.createView({
        top: 0,
        width: Ti.UI.FILL,
        height: '40%'
    });

    var bottomContainer = Ti.UI.createView({
        top: '40%',
        height: '60%',
        width: Ti.UI.FILL
    });

    overallSpacer.add(topContainer);
    overallSpacer.add(bottomContainer);

    this.panelBg.add(overallSpacer);

    this.imageContainer = Ti.UI.createView({
        height: Ti.UI.FILL,
        width: Ti.UI.FILL
    });


    this.badgeImage = Titanium.UI.createImageView({
        preventDefaultImage: true,
        width: '20%',
        left: '5dp',
        bottom: '10dp',
        height: 'auto',
        image: liferay.settings.screens.contacts.defaultPicture,
        opacity: 0
    });

    this.image = Titanium.UI.createImageView({
        //     backgroundColor: 'orange',
        preventDefaultImage: false,
        touchEnabled: false,
        width: '100%',
        height: 'auto',
        image: liferay.settings.screens.contacts.defaultPicture
    });

    this.imageContainer.add(this.image);
    this.imageContainer.add(this.badgeImage);

    this.editPhotoBtn = Ti.UI.createImageView({
        width: '50dp',
        height: '40dp',
        left: '50dp',
        top: '20dp',
        image: '/images/camera.png',
        opacity: hasConfirmedProfile ? 0.7 : 0,
        touchEnabled: hasConfirmedProfile
    });


    this.editPhotoBtn.addEventListener('click', function(e) {
        e.source.animate({
            opacity: 1.0,
            duration: 100,
            autoreverse: true
        }, function () {
            e.source.opacity = 0.7;
            self.editPhoto();
        });
    });

    this.imageContainer.add(this.editPhotoBtn);

    topContainer.add(this.imageContainer);


    var titleContainerShader = Ti.UI.createView({
        width: '70%',
        height: '40%',
        bottom: '10dp',
        right: 0,
        backgroundColor: 'black',
        opacity: 0.6
    });

    var titleContainer = Ti.UI.createView({
        width: '70%',
        height: '40%',
        bottom: '10dp',
        right: 0,
        backgroundColor: 'transparent'
    });

    var titleSpacer = Ti.UI.createView({
        bottom: '5dp',
        left: '5dp',
        right: '5dp',
        top: '5dp'
    });

    var titleLabelContainer = Ti.UI.createView({
        layout: 'vertical',
        height: Ti.UI.SIZE,
        width: Ti.UI.FILL,
        bottom: 0
    });

    titleSpacer.add(titleLabelContainer);
    titleContainer.add(titleSpacer);
    topContainer.add(titleContainerShader);
    topContainer.add(titleContainer);

    this.nameLabel = Ti.UI.createLabel({
        text: "Joe Bloggs",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h4,
        color: 'white'
    });

    titleLabelContainer.add(this.nameLabel);

    this.jobTitleLabel = Ti.UI.createLabel({
        text: "Liferay Developer",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h0,
        color: 'white'
    });

    titleLabelContainer.add(this.jobTitleLabel);

    this.companyLabel = Ti.UI.createLabel({
        text: "7COGS, INC.",
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        font: liferay.fonts.h0,
        color: 'white'
    });

    titleLabelContainer.add(this.companyLabel);


    var fields = [];

    fields.push(
        {
            name: L('FMT_LOCATION'),
            value: "Diamond Bar, United States",
            varName: 'locationLabel'
        });

    fields.push(
        {
            name: L('FMT_INDUSTRY'),
            value: 'Computer Software',
            varName: 'industryLabel'
        });

    fields.push(
        {
            name: L('FMT_TOP_INTERESTS'),
            value: 'Liferay',
            varName: 'topInterestsLabel'
        });
    fields.push(
        {
            name: L('FMT_TOP_DESIRES'),
            value: 'Content Management',
            varName: 'topDesiresLabel'
        });
    fields.push(
        {
            name: L('FMT_TOP_EXPERTISE'),
            value: 'Digital Marketing',
            varName: 'topExpertiseLabel'
        });


    var fieldContainer = Titanium.UI.createView({
        layout: 'vertical',
        height: Ti.UI.SIZE
    });

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

        var label = Titanium.UI.createLabel({
            top: 0,
            right: '10%',
            width: Ti.UI.SIZE,
            height: Ti.UI.SIZE,
            textAlign: 'right',
            color: '#89A9C9'

        });
        label.text = item.name;
        label.font = liferay.fonts.h3;
        labelContainer.add(label);
        fieldRow.add(labelContainer);

//		// separator ---------------------------------------

        labelContainer = Titanium.UI.createView({
            width: '65%',
            height: Ti.UI.SIZE,
            left: 0,
            top: 2
        });

        this[item.varName] = Titanium.UI.createLabel({
            top: 0,
            left: '10%',
            width: Ti.UI.SIZE,
            height: Ti.UI.SIZE,
            textAlign: 'left',
            color: '#444444'

        });
        this[item.varName].text = item.value;
        this[item.varName].font = liferay.fonts.h2;
        labelContainer.add(this[item.varName]);
        fieldRow.add(labelContainer);

        fieldContainer.add(fieldRow);
    }

    bottomContainer.add(fieldContainer);

    // separator
    bottomContainer.add(Ti.UI.createView({
        left: '33%',
        top: '20dp',
        width: 2,
        bottom: '20dp',
        backgroundColor: '#EEEEEE',
        touchEnabled: false
    }));

    this.importBtn = Ti.UI.createImageView(liferay.settings.screens.connectProfile.buttons.importSocial);
    this.importBtn.visible = false;
    this.importBtn.height = liferay.tools.getDp(liferay.settings.screens.connectProfile.buttons.importSocial.psize * Titanium.Platform.displayCaps.platformWidth);
    this.importBtn.width = this.importBtn.height;

    this.importBtn.addEventListener('click', function (e) {
        e.source.animate({
            opacity: 0.3,
            duration: 100,
            autoreverse: true
        }, function() {
            e.source.opacity = 1.0;
            var alertDialog = Titanium.UI.createAlertDialog({
                title: L('IMPORT_PROFILE'),
                message: L('IMPORT_PROFILE_PROMPT'),
                buttonNames: ["LinkedIn", "Twitter", "XING", L('CANCEL')],
                cancel: 3
            });
            alertDialog.addEventListener('click', function (e) {
                // TODO: other social networks
                switch (e.index) {
                    case 0:
                        self.importLinkedIn();
                        break;
                    case 1:
                        self.importTwitter();
                        break;
                    case 2:
                        self.importXING();
                        break;
                    default:
                }
            });

            alertDialog.show();
        });
    });

    bottomContainer.add(this.importBtn);

    return this.window;
};

liferay.screens.connectProfile.refresh = function () {
    //this.loadEvents();
};

liferay.screens.connectProfile.currentEmail = null;
liferay.screens.connectProfile.currentLast4 = null;
liferay.screens.connectProfile.currentDesires = [];
liferay.screens.connectProfile.currentExpertise = [];
liferay.screens.connectProfile.currentOtherInterests = "";

liferay.screens.connectProfile.showProfileInit = function () {

    console.log("SHOWING PROFILE INIT FORM");
    var self = this;

    var interestedInLabel = Ti.UI.createLabel({
        top: '25dp',
        left: 0,
        width: '100%',
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        color: '#84A8C8',
        text: L('WHAT_INTERESTED_IN'),
        font: liferay.fonts.h3
    });

    var expertiseInLabel = Ti.UI.createLabel({
        top: '25dp',
        left: 0,
        width: '100%',
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        color: '#84A8C8',
        text: L('WHAT_EXPERTISE'),
        font: liferay.fonts.h3
    });

    var otherLabel = Ti.UI.createLabel({
        top: '25dp',
        left: 0,
        width: '100%',
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        color: '#84A8C8',
        text: liferay.model.android ? L('OTHER_INTERESTS') : (L('OTHER_INTERESTS') + '(' + L('OTHER_INTERESTS_HINT') + ')'),
        font: liferay.fonts.h3
    });

    var profileView = Ti.UI.createView({
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        top: '10dp'
    });

    var profilePicContainer = Ti.UI.createView({
        width: '15%',
        left: 0,
        height: Ti.UI.SIZE
    });

    var portraitId = liferay.drawer.session.user.portraitId;

    var profilePic = Ti.UI.createImageView({
        image: 'https://www.liferay.com/image/user_portrait?img_id=' + portraitId,
        width: '100%'
    });

    var profileDataContainer = Ti.UI.createView({
        left: '18%',
        width: '82%',
        height: Ti.UI.SIZE,
        top: '10dp'
    });

    var profileData = Ti.UI.createLabel({
        font: liferay.fonts.h1,
        text: liferay.drawer.session.user.firstName + ' ' + liferay.drawer.session.user.lastName + '\n' +
        liferay.drawer.session.user.emailAddress,
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        height: Ti.UI.SIZE,
        color: '#333333'
    });

    var sponsorType = liferay.screens.connectProfile.getSponsorType(liferay.drawer.session.user.emailAddress);

    if (sponsorType) {
        profileData.text = profileData.text + ('\n' + sponsorType.toUpperCase() + ' Sponsor');
    }

    profilePicContainer.add(profilePic);
    profileDataContainer.add(profileData);

    profileView.add(profilePicContainer);
    profileView.add(profileDataContainer);

    var jobTitleQuestion = liferay.forms.makeSimpleHeaderField('JOBTITLE', L('FMT_TITLE'), liferay.drawer.session.user.jobTitle, '10dp');
    var companyQuestion = liferay.forms.makeSimpleHeaderField('COMPANY', L('FMT_COMPANY'), null, '10dp');
    var industryQuestion = liferay.forms.makeSimpleHeaderField('COMPANY', L('FMT_INDUSTRY'), null, '10dp');
    var cityQuestion = liferay.forms.makeSimpleHeaderField('CITY', L('FMT_CITY'), null, '10dp');


    var countryContainer = Ti.UI.createView({
        top: '20dp',
        layout: 'horizontal',
        height: Ti.UI.SIZE
    });

    if (liferay.model.iOS) {
        var countryLabel = Ti.UI.createLabel({
            font: liferay.fonts.h2b,
            text: L('FMT_COUNTRY') + '...',
            color: '#89ABCB'
        });

        var selectedCountry = Ti.UI.createLabel({
            font: liferay.fonts.h2b,
            text: '',
            code: '',
            left: '20dp'
        });

        countryContainer.add(countryLabel);
        countryContainer.add(selectedCountry);

        countryLabel.addEventListener('click', function (e) {
            liferay.ui.showCountryPicker(function (res) {
                selectedCountry.code = res;
                selectedCountry.text = L('COUNTRY_NAME_' + res);
            });
        });
    } else {
        var picker = liferay.ui.getCountryPicker(liferay.ui.getCountryMap());
        picker.width = '95%';
        picker.height = '30dp';
        picker.color = 'black';
        picker.backgroundColor = '#444444';
        countryContainer.add(picker);
    }

    var questions = [
        {
            question: profileView
        },
        {
            question: jobTitleQuestion
        },
        {
            question: companyQuestion
        },
        {
            question: industryQuestion
        },
        {
            question: cityQuestion
        },
        {
            question: countryContainer
        },

        ];

    if (liferay.controller.selectedEvent.expertise_list) {
        var lang = Ti.Platform.locale;
        var idx;
        if ((idx = lang.indexOf('-')) != -1) {
            lang = lang.substr(0, idx);
        }
        if (!lang) lang = 'en';

        var expertiseList = liferay.controller.selectedEvent.expertise_list.split(',').map(function (el) {
            var spec = el.trim();
            if (spec.indexOf('|') == -1) {
                return spec;
            }

            var parts = spec.split('|').map(function(el) { return el.trim();});
            var currentVal;

            for (var i = 0; i < parts.length; i++) {
                if (parts[i].indexOf('=') == -1) {
                    currentVal = parts[i];
                } else {
                    var langParts = parts[i].split('=', 2).map(function (el) {return el.trim();});
                    if (langParts.length == 2) {
                        if (!currentVal) currentVal = langParts[1];
                        if (langParts[0] === lang) {
                            currentVal = langParts[1];
                            break;
                        }
                    }
                }
            }
            return currentVal;
        });

        var desiresCb = function (desires) {
            liferay.screens.connectProfile.currentDesires = desires;
        };
        var expertiseCb = function (expertise) {
            liferay.screens.connectProfile.currentExpertise = expertise;
        };

        questions = questions.concat([
            {
                question: interestedInLabel
            },
            {
                question: liferay.model.android ?
                    liferay.forms.makeSimpleOptionMultipleAndroid("DESIRES", expertiseList, liferay.screens.connectProfile.currentDesires, '15dp', desiresCb) :
                    liferay.forms.makeSimpleOptionMultiple("DESIRES", expertiseList, liferay.screens.connectProfile.currentDesires, '15dp', desiresCb)
            },
            {
                question: expertiseInLabel
            },
            {
                question: liferay.model.android ? liferay.forms.makeSimpleOptionMultipleAndroid("EXPERTISE", expertiseList, liferay.screens.connectProfile.currentExpertise, '15dp', expertiseCb) :
                    liferay.forms.makeSimpleOptionMultiple("EXPERTISE", expertiseList, liferay.screens.connectProfile.currentExpertise, '15dp', expertiseCb)
            }
        ]);
    }

    questions.push({question: otherLabel});

    questions.push(
        {
            question: liferay.forms.makeSimpleTextAreaQuestion("OTHER_INTEREST", L('OTHER_INTERESTS_HINT'), liferay.screens.connectProfile.currentOtherInterests, '15dp', liferay.controller.getCurrentWindow(), function (e) {
                liferay.screens.connectProfile.currentOtherInterests = e.value;
            })
        });

    liferay.forms.showSimpleForm({
        title: L('SETUP_PROFILE'),
        subTitle: liferay.controller.selectedEvent.menutitle,
        subHeading: liferay.controller.selectedEvent.location_label.toUpperCase(),
        instructions: L('PROFILE_VERIFY_INSTRUCTIONS'),
        questions: questions,
        sendButtonText: L('VERIFY'),
        dismissText: L('CANCEL'),
        confirm: false,
        onSubmit: function (onSuccess, onFail) {

            Request({
                method: 'POST',
                sigName: 'signature',
                url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.profileVerifyEndpoint,
                params: {
                    eventId: liferay.controller.selectedEvent.eventid,
                    givenName: liferay.drawer.session.user.firstName,
                    fullName: liferay.drawer.session.user.firstName + ' ' + liferay.drawer.session.user.lastName,
                    emailAddress: liferay.drawer.session.user.emailAddress,
                    city: cityQuestion.value,
                    countryCode: liferay.model.iOS ? selectedCountry.code : picker.selectedCode,
                    countryName: liferay.model.iOS ? selectedCountry.text : picker.selectedName,
                    picUrl: profilePic.image,
                    company: companyQuestion.value,
                    industry: industryQuestion.value,
                    jobTitle: jobTitleQuestion.value,
                    desires: JSON.stringify(liferay.screens.connectProfile.currentDesires.map(function (el) {
                        return {word: el, weight: 1.0}
                    })),
                    expertise: JSON.stringify(liferay.screens.connectProfile.currentExpertise.map(function (el) {
                        return {word: el, weight: 1.0}
                    })),
                    otherInterests: liferay.screens.connectProfile.currentOtherInterests,
                    attendeeType: sponsorType ? sponsorType + ' sponsor' : 'attendee'
                },
                onSuccess: function (profile) {
                    // store profile
                    if (profile.exception) {
                        liferay.tools.alert(L('ALERT'), String.format(L("PROFILE_VERIFY_FAILED"), profile.message));
                        onFail && onFail();
                    } else if (!profile.eventContactId) {
                        liferay.tools.alert(L('FAILED_UPDATE_NETWORK'));
                        onFail && onFail();
                    } else {
                        liferay.connect.currentEventData = {};
                        liferay.connect.currentEventData.profile = profile;
                        liferay.connect.chatListeners = [];
                        liferay.connect.currentEventData.recommendations = [];
                        liferay.connect.currentEventData.queuedInterests = [];
                        liferay.connect.currentEventData.queuedMessages = [];
                        liferay.connect.currentEventData.uninterestedIds = [];
                        liferay.connect.currentEventData.connections = [];
                        liferay.connect.currentEventData.messages = [];
                        liferay.connect.currentEventData.messageBeginDate = 0;

                        liferay.connect.saveDataToFile();
                        liferay.connect.refreshConnections(liferay.controller.selectedEvent, function(connections) {

                            if (!connections.exception) {
                                liferay.connect.currentEventData.connections = connections;
                                liferay.connect.saveDataToFile();
                                liferay.connect.forceSync();
                            }
                        });
                        self.loadProfile(null);
                        self.recoBtn.opacity = self.connectionsBtn.opacity = 1.0;
                        self.recoBtn.touchEnabled = self.connectionsBtn.touchEnabled = self.editPhotoBtn.touchEnabled = true;
                        self.editPhotoBtn.opacity = 0.6;
                        liferay.screens.connectProfile.offerReco();
                        onSuccess && onSuccess();
                    }
                },
                onFailure: function (err) {
                    liferay.tools.alert(L('ALERT'), err);
                    onFail && onFail(err);
                }
            });
        }
    });
};

liferay.screens.connectProfile.getSponsorType = function(emailAddress) {
    if (liferay.data.currentEventData.sponsors && liferay.data.currentEventData.sponsors.length) {
        for (var i = 0, l = liferay.data.currentEventData.sponsors.length; i < l; i++) {
            var sponsor = liferay.data.currentEventData.sponsors[i];
            if (emailAddress.toLowerCase().indexOf(sponsor.name.toLowerCase()) >= 0) {
                return (sponsor.rank);
            }
        }

    }

    return null;

};


liferay.screens.connectProfile.offerReco = function () {
    var self = this;
    var alertDialog = Titanium.UI.createAlertDialog({
        title: L('MSG_REGISTER_SUCCESS'),
        message: L('PROFILE_COMPLETE'),
        buttonNames: [L('IMPORT_SOCIAL'), L('SEE_RECOMMENDATIONS'), L('SEE_PROFILE')]
    });
    alertDialog.addEventListener('click', function (e) {
        if (e.index == 0) {
            self.importBtn.fireEvent('click');
        } else if (e.index == 1) {
            liferay.controller.closeLast(true, true);
            var reco = liferay.screens.connectReco;
            liferay.controller.open(reco.render(), reco, true);
            reco.displayNextRecommendation();
        }
    });

    alertDialog.show();

};

liferay.screens.connectProfile.loadProfile = function (eventContactId) {

    console.log("LOADING PROFILE: "+ eventContactId);
    var showInit = function() {

        console.log("SHOWING INIT: " + liferay.drawer.loggedIn);
        if (!liferay.drawer.loggedIn) {

            // prompt for login
            var alertDialog = Titanium.UI.createAlertDialog({
                title : L('LOGIN'),
                message: L('PROFILE_INTRO'),
                buttonNames : [L('LOGIN'), L('CANCEL')],
                cancel: 1
            });
            alertDialog.addEventListener('click', function(e) {
                if (e.index == 0) {
                    // open login screen
                    liferay.drawer.performLogin(true, function(session) {
                        liferay.controller.registerForEventPush();
                        // session.user.firstName etc
                        liferay.screens.connectProfile.showProfileInit();
                    }, function(err) {
                        liferay.tools.toastNotification(null, L('LOGIN_FAILED'));
                    });
                }
            });
            alertDialog.show();

        } else {
            liferay.screens.connectProfile.showProfileInit();
        }
    };
    var self = this;

    var profile = liferay.connect.getProfile(eventContactId);
    if (!profile) {
        showInit();
        this.nameLabel.text = L('SETUP_PROFILE') + ' > ';

        this.nameLabel.touchEnabled = true;
        this.nameLabel.addEventListener('click', showInit);

        this.jobTitleLabel.text = '';
        this.companyLabel.text = '';
        this.locationLabel.text = '';
        this.industryLabel.text = '';
        this.topInterestsLabel.text = '';
        this.topDesiresLabel.text = '';
        this.topExpertiseLabel.text = '';
        this.importBtn.visible = false;

        return;
    }

    if (profile.picUrl) {

        this.loadImage({
            setImage: true,
            imageView: this.image,
            url: profile.picUrl,
            onLoad: function () {
                if (liferay.model.android && profile.picUrl) {
                    setTimeout(function () {
                        var ifi = liferay.screens.connectProfile.image.toBlob();
                        ifi = ifi.imageAsResized(ifi.width * 2, ifi.height * 2);
                        liferay.screens.connectProfile.image.setImage(ifi);
                    }, 200);
                }
            }
        });

        this.loadImage({
            setImage: false,
            imageView: this.profileBtn,
            url: profile.picUrl
        });

    }

    this.nameLabel.text = profile.fullName;
    this.nameLabel.color = 'white';
    this.nameLabel.removeEventListener('click', showInit);
    this.nameLabel.touchEnabled = false;

    this.jobTitleLabel.text = profile.jobTitle;
    this.companyLabel.text = profile.company.toLocaleUpperCase();
    this.locationLabel.text = (profile.city ? (profile.city + ', ') : '') + L('COUNTRY_NAME_' + profile.country.toUpperCase());
    this.industryLabel.text = profile.industry;

    if (profile.interests) {
        this.topInterestsLabel.text = liferay.screens.connectProfile.getTopInterests(profile.interests);
    }

    if (profile.desires) {
        this.topDesiresLabel.text = liferay.screens.connectProfile.getTopExpertise(profile.desires);
    }
    if (profile.expertise) {
        this.topExpertiseLabel.text = liferay.screens.connectProfile.getTopExpertise(profile.expertise);
    }

    if (liferay.connect.hasConfirmedProfile(liferay.controller.selectedEvent)) {
        this.importBtn.visible = true;
    }
    this.setBadge(this.badgeImage, profile.attendeeType);
};

liferay.screens.connectProfile.setBadge = function(img, attendeeType) {

    var badgeImg;

    if (attendeeType) {

        for (var key in liferay.settings.screens.connectProfile.badgeTypes) {
            if (!liferay.settings.screens.connectProfile.badgeTypes.hasOwnProperty(key)) continue;
            if (attendeeType.toLowerCase().indexOf(key) != -1) {
                badgeImg = liferay.settings.screens.connectProfile.badgeTypes[key];
                break;
            }
        }
    }

    img.image = badgeImg;

    setTimeout(function() {
        img.animate({
            opacity: badgeImg ? 1.0 : 0,
            duration: 500
        });

    }, 1000);
};

liferay.screens.connectProfile.getTopInterests = function (interests) {
    var intArr = JSON.parse(interests);

    intArr.sort(function (a, b) {
        return ((b.weight * b.count) - (a.weight * a.count))
    });

    return ((intArr.slice(0, 5)).map(function (el) {
        return el.word;
    }).join(' / '));
};

liferay.screens.connectProfile.getTopExpertise = function (expertise) {
    var intArr = JSON.parse(expertise);

    intArr.sort(function (a, b) {
        return (b.weight - a.weight);
    });

    return ((intArr.slice(0, 5)).map(function (el) {
        return el.word;
    }).join(' / '));
};

liferay.screens.connectProfile.importLinkedIn = function () {

    var self = this;
    var social = require('includes/social');

    // create a new OAuthAdapter instance by passing by your consumer data and signature method
    var li = social.create({
        site: 'linkedin',
        consumerKey: Ti.App.Properties.getString('liferay.linkedin.consumerKey', ''),
        consumerSecret: Ti.App.Properties.getString('liferay.linkedin.consumerSecret', '')
    });

    li.authorize(function () {
        liferay.tools.createFloatingMessage({
            text: L('IMPORTING_PROFILE'),
            container: liferay.controller.getCurrentWindow(),
            progress: false
        });

        li.getProfileLinkedin({
            timeout: liferay.settings.server.requestTimeout,
            success: function (msg) {
                liferay.tools.hideFloatingMessage();
                try {
                    var profileData = JSON.parse(msg);
                    var normalizedData = self.convertLinkedIn(profileData);
                    normalizedData.source = "linkedin";
                    normalizedData.eventId = liferay.connect.currentEventId;
                    normalizedData.contactId = liferay.connect.currentEventData.profile.eventContactId;
                    liferay.connect.updateProfile(normalizedData, function (data) {
                        if (data.exception) {
                            liferay.tools.hideFloatingMessage();
                            liferay.tools.alert(L('ALERT'), data.message);
                        } else {
                            liferay.connect.currentEventData.profile = data;
                            self.loadProfile(null);
                            // wipe existing recos and force-load more
                            liferay.connect.currentEventData.recommendations = [];
                            liferay.connect.forceSync();

                            var alertDialog = Titanium.UI.createAlertDialog({
                                title: L('IMPORT_SOCIAL_SUCCESS'),
                                message: L('MSG_IMPORT_SOCIAL_SUCCESS'),
                                buttonNames: [L('SEE_RECOMMENDATIONS'), L('SEE_PROFILE')]
                            });
                            alertDialog.addEventListener('click', function (e) {
                                if (e.index == 0) {
                                    liferay.controller.closeLast(true, true);
                                    var reco = liferay.screens.connectReco;
                                    liferay.controller.open(reco.render(), reco, true);
                                    reco.displayNextRecommendation();
                                }
                            });

                            alertDialog.show();

                        }
                    }, function (err) {
                        liferay.tools.hideFloatingMessage();
                        liferay.tools.alert(L('ALERT'), err);
                    });
                } catch (ex) {
                    liferay.tools.hideFloatingMessage();
                    liferay.tools.alert(L('ALERT'), JSON.stringify(ex));
                }
            },
            error: function (msg) {
                liferay.tools.hideFloatingMessage();
                liferay.tools.alert(L('ALERT'), msg);
            }
        });
    });

};

liferay.screens.connectProfile.importXING = function () {

    var self = this;
    var social = require('includes/social');

    // create a new OAuthAdapter instance by passing by your consumer data and signature method
    var xing = social.create({
        site: 'xing',
        consumerKey: Ti.App.Properties.getString('liferay.xing.consumerKey', ''),
        consumerSecret: Ti.App.Properties.getString('liferay.xing.consumerSecret', '')
    });

    xing.authorize(function () {
        liferay.tools.createFloatingMessage({
            text: L('IMPORTING_PROFILE'),
            container: liferay.controller.getCurrentWindow(),
            progress: false
        });

        xing.getProfileXING({
            timeout: liferay.settings.server.requestTimeout,
            success: function (msg) {
                liferay.tools.hideFloatingMessage();
                try {
                    var userData = JSON.parse(msg);
                    if (!userData.users || !userData.users[0]) {
                        liferay.tools.hideFloatingMessage();
                        liferay.tools.alert(L('ALERT'), 'NO_PROFILE_DATA');
                        return;
                    }
                    var profileData = userData.users[0];
                    var normalizedData = self.convertXING(profileData);
                    normalizedData.source = "xing";
                    normalizedData.eventId = liferay.connect.currentEventId;
                    normalizedData.contactId = liferay.connect.currentEventData.profile.eventContactId;
                    liferay.connect.updateProfile(normalizedData, function (data) {
                        if (data.exception) {
                            liferay.tools.hideFloatingMessage();
                            liferay.tools.alert(L('ALERT'), data.message);
                        } else {
                            liferay.connect.currentEventData.profile = data;
                            self.loadProfile(null);
                            // wipe existing recos and force-load more
                            liferay.connect.currentEventData.recommendations = [];
                            liferay.connect.forceSync();

                            var alertDialog = Titanium.UI.createAlertDialog({
                                title: L('IMPORT_SOCIAL_SUCCESS'),
                                message: L('MSG_IMPORT_SOCIAL_SUCCESS'),
                                buttonNames: [L('SEE_RECOMMENDATIONS'), L('SEE_PROFILE')]
                            });
                            alertDialog.addEventListener('click', function (e) {
                                if (e.index == 0) {
                                    liferay.controller.closeLast(true, true);
                                    var reco = liferay.screens.connectReco;
                                    liferay.controller.open(reco.render(), reco, true);
                                    reco.displayNextRecommendation();
                                }
                            });

                            alertDialog.show();

                        }
                    }, function (err) {
                        liferay.tools.hideFloatingMessage();
                        liferay.tools.alert(L('ALERT'), err);
                    });
                } catch (ex) {
                    liferay.tools.hideFloatingMessage();
                    liferay.tools.alert(L('ALERT'), JSON.stringify(ex));
                }
            },
            error: function (msg) {
                liferay.tools.hideFloatingMessage();
                liferay.tools.alert(L('ALERT'), msg);
            }
        });
    });

};

liferay.screens.connectProfile.importTwitter = function () {

    var self = this;
    var social = require('includes/social');

    // create a new OAuthAdapter instance by passing by your consumer data and signature method
    var tw = social.create({
        site: 'twitter',
        consumerKey: Ti.App.Properties.getString('liferay.twitter.consumerKey', ''),
        consumerSecret: Ti.App.Properties.getString('liferay.twitter.consumerSecret', '')
    });

    tw.authorize(function () {
        liferay.tools.createFloatingMessage({
            text: L('IMPORTING_PROFILE'),
            container: liferay.controller.getCurrentWindow(),
            progress: false
        });

        tw.getProfileTwitter({
            timeout: liferay.settings.server.requestTimeout,
            success: function (msg) {
                liferay.tools.hideFloatingMessage();
                try {
                    var profileData = JSON.parse(msg);
                    var normalizedData = self.convertTwitter(profileData);
                    normalizedData.source = "twitter";
                    normalizedData.eventId = liferay.connect.currentEventId;
                    normalizedData.contactId = liferay.connect.currentEventData.profile.eventContactId;
                    liferay.connect.updateProfile(normalizedData, function (data) {
                        if (data.exception) {
                            liferay.tools.hideFloatingMessage();
                            liferay.tools.alert(L('ALERT'), data.message);
                        } else {
                            liferay.connect.currentEventData.profile = data;
                            self.loadProfile(null);
                            // wipe existing recos and force-load more
                            liferay.connect.currentEventData.recommendations = [];
                            liferay.connect.forceSync();

                            var alertDialog = Titanium.UI.createAlertDialog({
                                title: L('IMPORT_SOCIAL_SUCCESS'),
                                message: L('MSG_IMPORT_SOCIAL_SUCCESS'),
                                buttonNames: [L('SEE_RECOMMENDATIONS'), L('SEE_PROFILE')]
                            });
                            alertDialog.addEventListener('click', function (e) {
                                if (e.index == 0) {
                                    liferay.controller.closeLast(true, true);
                                    var reco = liferay.screens.connectReco;
                                    liferay.controller.open(reco.render(), reco, true);
                                    reco.displayNextRecommendation();
                                }
                            });

                            alertDialog.show();

                        }
                    }, function (err) {
                        liferay.tools.hideFloatingMessage();
                        liferay.tools.alert(L('ALERT'), err);
                    });
                } catch (ex) {
                    liferay.tools.hideFloatingMessage();
                    liferay.tools.alert(L('ALERT'), JSON.stringify(ex));
                }
            },
            error: function (msg) {
                liferay.tools.hideFloatingMessage();
                liferay.tools.alert(L('ALERT'), msg);
            }
        });
    });

};

liferay.screens.connectProfile.convertLinkedIn = function (data) {

    var self = this;
    var result = {};

    var fullName = "";

    if (data.firstName) {
        result.givenName = data.firstName;
    }

    if (data.firstName && data.lastName) {
        result.fullName = (data.firstName + ' ' + data.lastName).trim();
    }

    if (data.formattedName) {
        result.fullName = data.formattedName;
    }

    if (data.pictureUrls && data.pictureUrls.values && data.pictureUrls.values.length >= 1) {
        result.picUrl = data.pictureUrls.values[0];
    } else {
        result.picUrl = "";
    }

    if (data.industry) {
        result.industry = data.industry;
    } else {
        result.industry = "";
    }

    if (data.positions && data.positions.values && data.positions.values.length >= 1 &&
        data.positions.values[0].company) {
        result.company = data.positions.values[0].company.name;

        if (data.positions.values[0].isCurrent && data.positions.values[0].title) {
            result.jobTitle = data.positions.values[0].title;
        }
    } else {
        result.company = "";
    }

    if (!result.jobTitle && data.headline) {
        result.jobTitle = data.headline;
    }

    if (!result.jobTitle) {
        result.jobTitle = "";
    }

    if (data.location && data.location.country) {
        result.country = data.location.country.code;
    } else {
        result.country = "";
    }

    if (data.location && data.location.name) {
        var loc = data.location.name;

        loc = loc.replace(/[Aa]rea/, '');
        loc = loc.replace(/[0-9]/, '');
        var idx = loc.indexOf(',');

        if (idx > 0) {
            loc = loc.substring(0, idx);
        }

        loc = loc.trim();

        result.city = loc;
    } else {
        result.city = "";
    }

    var theWords = (data.headline + ' ' + data.industry + ' ' + data.summary);
    if (data.positions && data.positions.values) {
        data.positions.values.forEach(function (pos) {
            theWords += (' ' + pos.summary + ' ' + pos.title);
        })
    }

    if (data.currentShare && data.currentShare.comment) {
        theWords += (' ' + data.currentShare.comment);
    }

    result.interests = theWords;

    result.desires = "";
    result.expertise = "";
    return result;

};

liferay.screens.connectProfile.convertXING = function (data) {

    var self = this;
    var result = {};

    var fullName = "";

    if (data.first_name) {
        result.givenName = data.first_name.trim();
    }

    if (data.first_name && data.last_name) {
        result.fullName = (data.first_name + ' ' + data.last_name).trim();
    }

    if (data.display_name) {
        result.fullName = data.display_name.trim();
    }

    var pickeys = ["size_256x256", "size_128x128", "large", "maxi_thumb"];

    for (var i = 0; i < pickeys.length; i++) {
        if (data.photo_urls[pickeys[i]]) {
            result.picUrl = data.photo_urls[pickeys[i]];
            break;
        }
    }

    if (!result.picUrl) {
        result.picUrl = '';
    }

    // result.company
    // result.jobTitle
    if (data.professional_experience &&
        data.professional_experience.primary_company) {
        result.company = data.professional_experience.primary_company.name;
        result.jobTitle = data.professional_experience.primary_company.title;
        result.industry = data.professional_experience.primary_company.industry;
        if (data.professional_experience.primary_company.industries &&
            data.professional_experience.primary_company.industries[0] &&
            data.professional_experience.primary_company.industries[0].localized_name) {
            result.industry = data.professional_experience.primary_company.industries[0].localized_name;
        }
    }

    if (!result.company && !result.jobTitle && !result.industry && data.professional_experience.companies) {
        for (var i = 0; i < data.professional_experience.companies.length; i++) {
            var company = data.professional_experience.companies[i];
            if (company.name && company.title) {
                result.company = company.name;
                result.jobTitle = company.title;
                result.industry = company.industry;
                if (company.industries && company.industries[0] && company.industries[0].localized_name) {
                    result.industry = company.industries[0].localized_name;
                }
                break;
            }
        }
    }

    if (data.business_address) {
        result.city = data.business_address.city;
        result.country = data.business_address.country;

        var idx = result.city.indexOf(',');

        if (idx > 0) {
            result.city = result.city(0, idx);
        }

        if (result.city) {
            result.city = result.city.trim();
        }
    }

    var theWords = (data.wants + ' ' + data.haves + ' ' + data.interests);

    if (data.professional_experience) {
        if (data.professional_experience.primary_company) {
            theWords += (' ' + data.professional_experience.primary_company.description);
        }

        if (data.professional_experience.companies) {
            for (var i = 0; i < data.professional_experience.companies.length; i++) {
                var company = data.professional_experience.companies[i];
                theWords += (' ' + company.description);
            }
        }
    }

    result.interests = theWords;

    result.desires = "";
    result.expertise = "";
    return result;

};

liferay.screens.connectProfile.convertTwitter = function (data) {

    var self = this;
    var result = {};

    if (data.name) {
        result.fullName = data.name;
        var parts = data.name.split(/\S+/);
        if (parts.length > 1) {
            result.givenName = parts[0];
        } else {
            result.givenName = '';
        }
    } else {
        result.givenName = result.fullName = '';
    }

    if (data.profile_image_url) {
        result.picUrl = data.profile_image_url;
    } else {
        result.picUrl = "";
    }

    result.industry = result.jobTitle = result.company = "";

    if (data.location && data.location.country) {
        result.country = data.location.country.code;
    } else {
        result.country = "";
    }

    if (data.location) {
        var loc = data.location;
        var idx = loc.indexOf(',');

        if (idx > 0) {
            loc = loc.substring(0, idx);
        }

        loc = loc.trim();

        result.city = loc;
    } else {
        result.city = "";
    }

    result.interests = data.description;

    result.desires = "";
    result.expertise = "";
    return result;

};

liferay.screens.connectProfile.editPhoto = function() {
    var alertDialog = Titanium.UI.createAlertDialog({
        title: L('EDIT_PHOTO'),
        message: L('EDIT_PHOTO_MSG'),
        buttonNames: [L('CAMERA'), L('PHOTO_LIBRARY'), L('CANCEL')],
        cancel: 2
    });
    alertDialog.addEventListener('click', function (e) {
        switch (e.index) {
            case 0:
                // camera
                Titanium.Media.showCamera({
                    cancel: function (object) {
                    },
                    error: function (err) {
                        String.format(L('ERROR_1'), JSON.stringify(err));
                    },
                    mediaTypes: [Titanium.Media.MEDIA_TYPE_PHOTO],
                    saveToPhotoGallery: true,
                    success: function (pic) {
                        liferay.screens.connectProfile.updateProfilePic(pic, pic.media.mimeType, function() {
                            liferay.tools.toastNotification(null, L('EDIT_PHOTO_SUCCESS'))
                        }, function(err) {
                            liferay.tools.alert(L('ALERT'), String.format(L('ERROR_1'), JSON.stringify(err)));
                        });
                    }
                });
                break;
            case 1:
                // photo library
                Titanium.Media.openPhotoGallery({
                    allowEditing: true,
                    animated: true,
                    autohide: true,
                    mediaTypes: [Titanium.Media.MEDIA_TYPE_PHOTO],
                    success: function (pic) {
                        liferay.screens.connectProfile.updateProfilePic(pic, pic.media.mimeType, function() {
                            liferay.tools.toastNotification(null, L('EDIT_PHOTO_SUCCESS'))
                        }, function(err) {
                            liferay.tools.alert(L('ALERT'), String.format(L('ERROR_1'), JSON.stringify(err)));
                        });
                    },
                    error: function (err) {
                        liferay.tools.alert(L('ALERT'), String.format(L('ERROR_1'), JSON.stringify(err)));
                    },
                    cancel: function (object) {
                    }
                });
                break;
            default:
        }
    });

    alertDialog.show();


};

liferay.screens.connectProfile.updateProfilePic = function (origPic, mimeType, onSuccess, onFailure) {

    var self = this;

    liferay.tools.downsizePic(origPic, 200, function (finalPic) {

        liferay.tools.showSpinner({
            container: self.imageContainer
        });

        Request({
            method: 'POST',
            sigName: 'signature',
            url: liferay.settings.server.connectHost.host + liferay.settings.server.connectHost.profilePicUpdateEndpoint,
            params: {
                eventId: liferay.controller.selectedEvent.eventid,
                extension: 'png',
                contactId: liferay.connect.currentEventData.profile.eventContactId,
                mimeType: mimeType,
                bytes: Ti.Utils.base64encode(finalPic).toString().replace(/(\r\n|\n|\r)/gm, "")
            },
            onSuccess: function (profile) {
                liferay.tools.hideSpinner();
                // update profile
                if (profile.exception) {
                    onFailure && onFailure(profile.message);
                } else if (!profile.eventContactId) {
                    onFailure && onFailure(L('FAILED_UPDATE_NETWORK'));
                } else {
                    if (profile.picUrl.indexOf('/') == 0) {
                        profile.picUrl = liferay.settings.server.connectHost.host + profile.picUrl;
                    }
                    liferay.connect.currentEventData.profile = profile;
                    liferay.connect.saveDataToFile();
                    self.loadProfile(null);
                    onSuccess && onSuccess(profile);
                }
            },
            onFailure: function (err) {
                liferay.tools.hideSpinner();
                onFailure && onFailure(err);
            }
        });

    });


};

