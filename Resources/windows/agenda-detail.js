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

liferay.screens.agendaDetail = new liferay.classes.window();
liferay.screens.agendaDetail.className = 'liferay.screens.agendaDetail';

liferay.screens.agendaDetail.render = function () {

	var self = this;

	this.likeBtn = Titanium.UI.createView(liferay.settings.screens.agendaDetail.buttons.like);
	this.likeBtn.width = liferay.tools.getDp(liferay.settings.screens.agendaDetail.buttons.like.psize * Titanium.Platform.displayCaps.platformWidth);
	this.likeBtn.height = this.likeBtn.width;
	this.unlikeBtn = Titanium.UI.createView(liferay.settings.screens.agendaDetail.buttons.unlike);
	this.unlikeBtn.width = liferay.tools.getDp(liferay.settings.screens.agendaDetail.buttons.unlike.psize * Titanium.Platform.displayCaps.platformWidth);
	this.unlikeBtn.height = this.unlikeBtn.width;
	this.ratingLabel = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.rate);
	this.ratingLabel.font = liferay.fonts.h0;

	this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);

	this.window = liferay.ui.makeWindow({
        backEnabled: true,
		swipe: false,
		onClose: function() {
			self.stopRotate();
			self.cancelRatingTimer();
		},
		panelBg: this.panelBg,
		footerButtons: [this.ratingLabel, this.likeBtn, this.unlikeBtn]
	});

	return this.window;
};

liferay.screens.agendaDetail.loadAction = function(actionSpec, event_uuid, cb) {

//    window:agenda-detail:session:2014-06-20:Opening Keynote
//    window:agenda-detail:roomId:entering
//    window:agenda-detail:roomId:leaving

    if (!liferay.screens.agenda.processedAgenda || liferay.screens.agenda.processedAgenda.length <= 0) {
        liferay.screens.agenda.processAgenda();
    }

    if (actionSpec[0].toUpperCase() == "SESSION") {
        cb();
        var date = actionSpec[1];
        var title = actionSpec[2].toUpperCase();


        for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
            if (liferay.screens.agenda.processedAgenda[i].date == date) {
                for (var j = 0; j < liferay.screens.agenda.processedAgenda[i].items.length; j++) {
                    if (liferay.screens.agenda.processedAgenda[i].items[j].title.toUpperCase() == title) {
                        liferay.screens.agendaDetail.loadDetails(liferay.screens.agenda.processedAgenda[i].items[j]);
                        return;
                    }
                }
            }
        }
    } else {
        var roomName = actionSpec[0];
        var action = actionSpec[1].toUpperCase();
        var now = new Date();

        if (action.toUpperCase() != "LEAVING") {
            cb();
        }
        for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
            for (var j = 0; j < liferay.screens.agenda.processedAgenda[i].items.length; j++) {
                var sess = liferay.screens.agenda.processedAgenda[i].items[j];
                var alreadySeen = liferay.beacons.getPreference(action + sess.uuid);
                if (alreadySeen) continue;
                var speakers = liferay.screens.agendaDetail.getSpeakers(sess);
                if (!speakers || speakers.length <= 0) continue;
                var sessRoomName = liferay.screens.agendaDetail.getRoomName(sess);
                if (!sessRoomName) continue;
                if (sessRoomName.toUpperCase() == roomName.toUpperCase()) {
                    if (action.toUpperCase() == "ENTERING") {
                        var sessStart = liferay.screens.agenda.getDateForAgendaItem(sess, true).date;
                        var secsDiff = Math.abs(sessStart.getTime() - now.getTime());
                        if (secsDiff < 10 * 60 * 1000) {
                            liferay.screens.agendaDetail.loadDetails(sess);
                            liferay.beacons.setPreference(action + sess.uuid, true);
                            return;
                        }
                    } else if (action.toUpperCase() == "LEAVING") {
                        var sessEnd = liferay.screens.agenda.getDateForAgendaItem(sess, false).date;
                        var secsDiff = Math.abs(sessEnd.getTime() - now.getTime());
                        var alreadyRated = liferay.forms.hasSubmittedSurvey(liferay.controller.selectedEvent, liferay.screens.agendaDetail.getSurveySessionName(sess));
                        if (!alreadyRated && secsDiff < 10 * 60 * 1000) {
                            liferay.screens.agendaDetail.loadDetails(sess);
                            if (sess.enable_ratings) {
                                liferay.screens.agendaDetail.showRatingForm(sess, false, cb);
                                liferay.beacons.setPreference(action + sess.uuid, true);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
};

liferay.screens.agendaDetail.testAction = function(msgTemplate, actionSpec, event_uuid) {

//    window:agenda-detail:session:2014-06-20:Opening Keynote
//    window:agenda-detail:roomId:entering
//    window:agenda-detail:roomId:leaving

    if (actionSpec[0].toUpperCase() == "SESSION") {
        return msgTemplate;
    } else {

        if (!liferay.screens.agenda.processedAgenda || liferay.screens.agenda.processedAgenda.length <= 0) {
            liferay.screens.agenda.processAgenda();
        }

        var roomName = actionSpec[0];
        var action = actionSpec[1].toUpperCase();
        var now = new Date();

        for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
            for (var j = 0; j < liferay.screens.agenda.processedAgenda[i].items.length; j++) {
                var sess = liferay.screens.agenda.processedAgenda[i].items[j];
                var alreadySeen = liferay.beacons.getPreference(action + sess.uuid);
                if (alreadySeen) {
                    continue;
                }
                var speakers = liferay.screens.agendaDetail.getSpeakers(sess);
                if (!speakers || speakers.length <= 0) {
                    continue;
                }
                var speakerNames = liferay.screens.agendaDetail.getSpeakerNames(sess, ' / ');
                var sessRoomName = liferay.screens.agendaDetail.getRoomName(sess);
                if (!sessRoomName) {
                    continue;
                }
                if (sessRoomName.toUpperCase() == roomName.toUpperCase()) {
                    var sessTime = liferay.screens.agenda.getDateForAgendaItem(sess, (action == "ENTERING")).date;
                    var secsDiff = Math.abs(sessTime.getTime() - now.getTime());
                    var alreadyRated = liferay.forms.hasSubmittedSurvey(liferay.controller.selectedEvent, liferay.screens.agendaDetail.getSurveySessionName(sess));
                    if (speakerNames && sess.title && secsDiff < 10 * 60 * 1000) {
                        var willWork =  (action == "LEAVING") ? (sess.enable_ratings && !alreadyRated) : "true";
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

liferay.screens.agendaDetail.loadDetails = function (info) {
	//Ti.API.info(this.className + ".loadDetails()");
	var self = this;

	liferay.screens.agendaDetail.loadNotes();
	liferay.screens.agendaDetail.loadFavorites();

	var session = {
		start   : liferay.screens.agenda.getDateForAgendaItem(info, true),
		end     : liferay.screens.agenda.getDateForAgendaItem(info, false),
		eventEnd : new liferay.classes.date().setFromISO8601(liferay.controller.selectedEvent.end_date + "T" + liferay.controller.selectedEvent.end_time + ":00")
	};

	// in minutes behind GMT (currently)
	var localOff = new Date().getTimezoneOffset();
	//Ti.API.info("local offset: " + localOff);
	// in minutes of how far ahead local is from event (negative if local is say, hawaii, and event is in California)
	var diff = (liferay.controller.selectedEvent.event_tz * 60) - localOff;
	//Ti.API.info("tzdiff: " + diff);

	var sessionStartLocal = session.start.getTime() + (diff * 60 * 1000);
	var eventEndLocal = session.eventEnd.getTime() + (diff * 60 * 1000);

	//Ti.API.info("Start: " + session.start + '(' + info.startTime + ')');
	//Ti.API.info("End: " + session.end + '(' + info.endTime + ')');

	var overallSpacer = Ti.UI.createView({
		top: '5dp',
		left: '10dp',
		right: '10dp',
		bottom: '5dp',
		layout: 'vertical'
	});

	var topContainer = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE
	});

	var bottomContainer = Ti.UI.createView({
		top: '8dp',
		width: Ti.UI.FILL,
		height: Ti.UI.FILL
	});

	overallSpacer.add(topContainer);
	overallSpacer.add(Ti.UI.createView({
		top: '8dp',
		width: Ti.UI.FILL,
		height: '2dp',
		backgroundColor: '#dddddd'
	}));
	overallSpacer.add(Ti.UI.createView({
		width: Ti.UI.FILL,
		height: '1dp',
		backgroundColor: '#eeeeee'
	}));

	overallSpacer.add(bottomContainer);
	this.panelBg.add(overallSpacer);

	this.imageContainer = Ti.UI.createView({
		left: 0,
		height: Ti.UI.SIZE,
		width: '40%'
	});

	this.image = Titanium.UI.createImageView({
		backgroundColor    : 'transparent',
		preventDefaultImage: true,
		touchEnabled       : false,
		width: '100%',
		height: 'auto'
	});

    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
	this.imageContainer.add(this.image);

    if (speakers && speakers.length > 0) {
        var speakerUrl = liferay.screens.agendaDetail.getSpeakerURL(info, 0);

        this.loadImage({
            setImage: true,
            imageView: this.image,
            url: speakerUrl,
            onLoad: function () {
                if (liferay.model.android && speakerUrl) {
                    setTimeout(function () {
                        var ifi = liferay.screens.agendaDetail.image.toBlob();
                        ifi = ifi.imageAsResized(ifi.width * 2, ifi.height * 2);
                        liferay.screens.agendaDetail.image.setImage(ifi);
                    }, 100);
                }
            }
        });

        if (speakers.length > 1) {
            this.currentImageInfo = info;
            this.currentImageIndex = 0;
            this.rotateTimer = setTimeout(function () {
                self.rotate();
            }, liferay.settings.screens.agendaDetail.rotatePeriod)
        } else {
            this.rotateTimer = null;
        }
    } else {
        // no speakers
        this.image.image ='/images/Default-Headshot.png';
        if (liferay.model.android) {
            setTimeout(function () {
                var ifi = liferay.screens.agendaDetail.image.toBlob();
                ifi = ifi.imageAsResized(ifi.width * 2, ifi.height * 2);
                liferay.screens.agendaDetail.image.setImage(ifi);
            }, 100);
        }
    }

	topContainer.add(this.imageContainer);

	var titleContainer = Ti.UI.createView({
		left: '40%',
		width: '60%',
		height: Ti.UI.SIZE
	});

	var titleSpacer = Ti.UI.createView({
		top: '5dp',
		left: '5%',
		right: '5dp',
		height: Ti.UI.SIZE
	});

	var titleLabelContainer = Ti.UI.createView({
		layout: 'vertical',
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE
	});

	titleSpacer.add(titleLabelContainer);
	titleContainer.add(titleSpacer);
	topContainer.add(titleContainer);

	var favContainer = Titanium.UI.createView({
		width : Ti.UI.SIZE,
		height: Ti.UI.SIZE,
		left  : 0,
		top   : 0
	});
	var starSize = liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * 0.08);

	var starView = Titanium.UI.createView({
		left: 0,
		width          : starSize,
		height         : starSize,
		backgroundImage: liferay.screens.agendaDetail.isFavorite(info) ? liferay.settings.screens.agendaDetail.buttons.favorite.favoritedBackground : liferay.settings.screens.agendaDetail.buttons.favorite.unfavoritedBackground
	});

	var favLabel = Ti.UI.createLabel({
		width    : Ti.UI.SIZE,
		height   : Ti.UI.SIZE,
		left     : (starSize + 10) + 'dp',
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
		color    : "#444444",
		text     : liferay.screens.agendaDetail.isFavorite(info) ? L('ADDED_TO_MY_AGENDA') : L('ADD_TO_MY_AGENDA'),
		font     : liferay.fonts.h2
	});

	favContainer.add(starView);
	favContainer.add(favLabel);

	favContainer.addEventListener('click', function (e) {
		var isCurrentFav = liferay.screens.agendaDetail.isFavorite(info);
		starView.setBackgroundImage(isCurrentFav ?
			liferay.settings.screens.agendaDetail.buttons.favorite.unfavoritedBackground :
			liferay.settings.screens.agendaDetail.buttons.favorite.favoritedBackground);
		favLabel.setText(isCurrentFav ? L('ADD_TO_MY_AGENDA') : L('ADDED_TO_MY_AGENDA'));

		liferay.screens.agendaDetail.recordFavorite(info, !isCurrentFav);
		liferay.screens.agendaDetail.saveCurrentFavorites();
	});

	titleLabelContainer.add(favContainer);

	var label;
	label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.date);
	label.text = String.formatDate(session.start.date, "medium").toUpperCase();
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h2;
	label.top = '10dp;';
	titleLabelContainer.add(label);
	label.touchEnabled = true;

	label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.time);
	label.text = String.format(L('TIME_RANGE'), String.formatTime(session.start.date, "short"), String.formatTime(session.end.date, "short"));
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h2;
	titleLabelContainer.add(label);

    var mapIndex = this.getMapIndex(info);
	if (mapIndex != -1) {
		var mapContainer = Titanium.UI.createView({
			width : Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			left  : 0,
			top   : 0
		});
		var arrowSize = liferay.tools.getDp(liferay.settings.screens.agendaDetail.layout.imageView.arrowSize * Titanium.Platform.displayCaps.platformWidth);

		var mapLabelContainer = Ti.UI.createView({
			left: 0,
			width: '80%',
			height: Ti.UI.SIZE
		});

		var bugContainer = Ti.UI.createView({
			width: '20%',
			left: '80%',
			height: Ti.UI.SIZE
		});

		var bugView = Titanium.UI.createView({
			left: '5dp',
			width          : arrowSize,
			height         : arrowSize,
			backgroundImage: liferay.settings.screens.agendaDetail.layout.arrowImage
		});

		var mapInfo = liferay.data.currentEventData.maps[mapIndex];
		var mapLabel = Ti.UI.createLabel({
			width    : Ti.UI.SIZE,
			height   : Ti.UI.SIZE,
			left     : 0,
			textAlign: "left",
			color    : "#444444",
			text     : mapInfo.name,
			font     : liferay.fonts.h1
		});

		mapLabelContainer.add(mapLabel);
		bugContainer.add(bugView);

		mapContainer.add(mapLabelContainer);
		mapContainer.add(bugContainer);

		mapContainer.addEventListener('click', function (e) {
			liferay.tools.flashControl(e.source, liferay.settings.screens.agenda.selectColor, function() {
				liferay.controller.open(liferay.screens.mapsDetail.render(), liferay.screens.mapsDetail);
				liferay.screens.mapsDetail.loadDetails(liferay.data.currentEventData.maps[mapIndex]);
			});
		});

		titleLabelContainer.add(mapContainer);
	}

	var scrollSpacer = Ti.UI.createView({
		top: '8dp',
		left: '0dp',
		right: '0dp',
		bottom: '0dp'
	});

	var scrollView = Titanium.UI.createScrollView({
		scrollType: "vertical",
		contentWidth: Ti.UI.SIZE,
		contentHeight: Ti.UI.SIZE,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false
	});

	var scrollContainer = Ti.UI.createView({
		top: 0,
		left: 0,
		height: Ti.UI.SIZE,
		width: '100%',
		layout: "vertical"
	});

	scrollView.add(scrollContainer);

	if (liferay.model.android) {
		scrollContainer.add(Ti.UI.createTextArea({
			height: 0,
			width: 0,
			softKeyboardOnFocus: Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS
		}));
	}

	var agendaIcon = liferay.screens.agenda.agendaIconFor(info);
    var sponsorIcon = liferay.screens.agenda.sponsorIconFor(info); // may be null

	if (agendaIcon) {
		var iconSize = liferay.tools.getDp(liferay.settings.screens.agenda.layout.typeIcon.psize * Titanium.Platform.displayCaps.platformWidth);
		var iconView = Titanium.UI.createView({
			width          : iconSize,
			height         : iconSize,
			backgroundImage: agendaIcon.background,
			left           : 0,
			top            : 0
		});
		scrollContainer.add(iconView);
	} else if (sponsorIcon) {

		var iconSize = liferay.tools.getDp(.25 * Titanium.Platform.displayCaps.platformWidth);

		var iconContainer = Ti.UI.createView({
			width: iconSize * 2,
			height: Ti.UI.SIZE,
			left: 0,
			top: 0,
			touchEnabled: true
		});
		var iconView = Titanium.UI.createImageView({
			left: 0,
			width : 'auto',
			height : 'auto',
			touchEnabled: false
		});
		this.loadImage({
			setImage: true,
			imageView: iconView,
			url      : sponsorIcon,
            onLoad: function(imgView) {
                if (liferay.model.android && speakerUrl) {
                    setTimeout(function () {
                        var ifi = imgView.toBlob();
                        ifi = ifi.imageAsResized(ifi.width * 2.5, ifi.height * 2.5);
                        imgView.setImage(ifi);
                    }, 100);
                }

            }
		});


        iconContainer.add(iconView);
		scrollContainer.add(iconContainer);

	}

    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
    var speakerNames = (speakers.length > 0) ? liferay.screens.agendaDetail.getSpeakerNames(info, ' / ') : null;

    var titleContainer = Ti.UI.createView({
		height: Ti.UI.SIZE,
		top: '5dp',
		width: '100%'
	});

	var capsHeight = Titanium.Platform.displayCaps.platformHeight;
	var phys = capsHeight / Titanium.Platform.displayCaps.dpi;
	var useVert = true;
	if (phys > 3.7) {
		useVert = false;
	}

	var allowedWidth = useVert ? 82 : 60;

	var introsContainer = Ti.UI.createView({
		left: 0,
		top: 0,
		width: (speakers.length > 0) ? allowedWidth + '%' : '100%',
		height: Ti.UI.SIZE,
		layout: 'vertical'
	});

	var socialContainer = Ti.UI.createView({
		right: '5%',
		bottom: '5dp',
		width: (speakers.length > 0) ? (100 - allowedWidth) + '%' : 0,
		height: Ti.UI.SIZE
	});
	var socialIconContainer = Ti.UI.createView({
		right: 0,
		layout: useVert ? 'vertical' : 'horizontal',
		horizontalWrap: false,
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE
	});

	socialContainer.add(socialIconContainer);
	titleContainer.add(introsContainer);

	label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.abstractTitle);
	label.text = liferay.tools.stripTags(info.title);
	label.font =  liferay.fonts.h2;
	label.height = Ti.UI.SIZE;

	if (agendaIcon) {
		label.top = liferay.tools.getPx(4);
		label.text = L(agendaIcon.textId) + ": " + label.text;
	}

	introsContainer.add(label);

	if (speakers.length > 0) {
		label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.abstractTitle);
		label.height = Ti.UI.SIZE;
		label.text = liferay.tools.stripTags(speakerNames);
		label.font =  liferay.fonts.h0;
		introsContainer.add(label);

	}

	if (speakers.length > 0) {

		var borderSize = liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.1);
		var imgSize = borderSize * .75;

		var border = Ti.UI.createView({
			backgroundColor: '#777777',
			width: borderSize,
			height: borderSize,
			borderWidth: '2px',
			borderRadius: '2px',
			borderColor: '#DDDDDD'
		});
		var tweetButton = Ti.UI.createImageView({
			width: imgSize,
			height: 'auto',
			image: liferay.settings.screens.all.buttons.tweet.backgroundImage
		});
		border.add(tweetButton);
		socialIconContainer.add(border);

		border.addEventListener('click', function(e) {
            var tweetUrl = liferay.controller.selectedEvent.event_url ? liferay.controller.selectedEvent.event_url : Ti.App.Properties.getString("liferay.default_event_url", "");
            var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');

            var tweetTxt = liferay.tools.stripTags(info.title) + ' - ' + speakerNames + ' ' + tweetHash + ' ' + tweetUrl;
            liferay.screens.front.tweet(tweetTxt, null);
		});

		border = Ti.UI.createView({
			top: useVert ? '8px' : 0,
			left: useVert ? 0 : '8px',
			backgroundColor: '#777777',
			width: borderSize,
			height: borderSize,
			borderWidth: '2px',
			borderRadius: '2px',
			borderColor: '#DDDDDD'
		});
		var fbButton = Ti.UI.createImageView({
			width: imgSize,
			height: 'auto',
			image: liferay.settings.screens.all.buttons.fb.backgroundImage
		});

		border.addEventListener('click', function(e) {
            var placeUrl = liferay.controller.selectedEvent.event_url ? liferay.controller.selectedEvent.event_url : Ti.App.Properties.getString("liferay.default_event_url", "");
            var placePic = liferay.controller.selectedEvent.event_pic_url ? liferay.controller.selectedEvent.event_pic_url : Ti.App.Properties.getString("liferay.default_event_logo_url", "");
			var placeDesc = liferay.controller.selectedEvent.menutitle + ' ' + liferay.controller.selectedEvent.location_label;
			if (info.session_summary) {
				var desc = liferay.tools.stripTags(info.session_summary);
				if (desc.length > 400) {
					desc = desc.substr(0, 400) + "...";
				}
				placeDesc += ' - ' + desc;
			}
			var fbName = liferay.tools.stripTags(info.title);
			var agendaIcon = liferay.screens.agenda.agendaIconFor(info);
			if (agendaIcon) {
				fbName = L(agendaIcon.textId) + ": " + fbName;
			}

			var data = {
				link : placeUrl,
				name : fbName,
				message : "Wish you were here!",
				caption : speakerNames,
				picture : placePic,
				description : placeDesc,
				actions: '{"name": "' + L('FMT_WEBSITE') + '", "link" : "' + placeUrl + '"}'
			};

			liferay.screens.front.fbFeed(data);

		});
		border.add(fbButton);
		socialIconContainer.add(border);

        if (info.download_url && (!liferay.model.android || Ti.Filesystem.isExternalStoragePresent())) {

            // slides button
            border = Ti.UI.createView({
                top: useVert ? '8px' : 0,
                left: useVert ? 0 : '8px',
                backgroundColor: '#777777',
                width: borderSize,
                height: borderSize,
                borderWidth: '2px',
                borderRadius: '2px',
                borderColor: '#DDDDDD'
            });
            var slidesButton = Ti.UI.createImageView({
                width: imgSize,
                height: 'auto',
                image: liferay.settings.screens.all.buttons.slides.backgroundImage
            });

            border.addEventListener('click', function (e) {
                var dUrl = info.download_url;
                if (dUrl.indexOf('/') == 0) {
                    dUrl = liferay.settings.server.dataHost.host + dUrl;
                }
                liferay.screens.agendaDetail.downloadAndViewSlides(info, dUrl);
            });
            border.add(slidesButton);
            socialIconContainer.add(border);
        }

        titleContainer.add(socialContainer);
	}
	scrollContainer.add(titleContainer);

	if (speakers.length > 0) {
		if (info.session_summary) {
			label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels["abstract"]);
			label.height = Ti.UI.SIZE;
			label.verticalAlign = Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
			label.top = '5dp';
			label.text = liferay.tools.stripTags(info.session_summary);
			label.font = liferay.fonts.h2;
			if (liferay.model.android) {
				label.autoLink = Titanium.UI.Android.LINKIFY_ALL;
			}
			label.ellipsize = false;
			scrollContainer.add(label);
		}

        speakers.forEach(function(speaker, idx) {

            label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.bioTitle);
            label.text = liferay.tools.stripTags(speaker.speaker_name);
            label.font = liferay.fonts.h2;
            scrollContainer.add(label);

            label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.abstractTitle);
            label.height = Ti.UI.SIZE;
            label.text = liferay.tools.stripTags(speaker.speaker_title);
            label.font =  liferay.fonts.h0;
            scrollContainer.add(label);

            label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.abstractTitle);
            label.height = Ti.UI.SIZE;
            label.text = liferay.tools.stripTags(speaker.speaker_company);
            label.font =  liferay.fonts.h0;
            scrollContainer.add(label);


            label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.bio);
            label.text = liferay.tools.stripTags(liferay.screens.agendaDetail.getSpeakerBio(info, idx));
            label.font = liferay.fonts.h2;
            if (liferay.model.android) {
                label.autoLink = Titanium.UI.Android.LINKIFY_ALL;
            }
            label.ellipsize = false;
            scrollContainer.add(label);

            var socialIcons = Titanium.UI.createView({
                width : Ti.UI.FILL,
                height: Ti.UI.SIZE,
                layout: 'horizontal',
                left  : 0,
                top   : "8dp"
            });

            var iconAdded = false;
            ['speaker_social_twitter', 'speaker_social_facebook', 'speaker_social_linkedin', 'speaker_social_youtube', 'speaker_social_blog'].forEach(function(el) {
                var imgWidth = liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.12);
                if (speaker[el]) {
                    var icon = Titanium.UI.createImageView({
                        image: liferay.settings.screens.all[el].image,
                        width: imgWidth,
                        left: iconAdded ? '5%' : 0,
                        height: imgWidth,
                        socialLink: speaker[el],
                        socialLinkType: el
                    });
                    icon.addEventListener('click', function (e) {
                        if (liferay.model.android) {
                            if (e.source.socialLink.indexOf('http') == 0) {
                                Titanium.Platform.openURL(e.source.socialLink);
                            } else {
                                Titanium.Platform.openURL(liferay.settings.screens.all[e.source.socialLinkType].prefix + e.source.socialLink);
                            }
                        } else {
                            liferay.tools.expandButton({
                                control  : e.source,
                                onRestore: function () {
                                    if (e.source.socialLink.indexOf('http') == 0) {
                                        Titanium.Platform.openURL(e.source.socialLink);
                                    } else {
                                        Titanium.Platform.openURL(liferay.settings.screens.all[e.source.socialLinkType].prefix + e.source.socialLink);
                                    }
                                }
                            });
                        }
                    });
                    socialIcons.add(icon);
                    iconAdded = true;
                }
            });
            if (iconAdded) {
                label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.follow);
                label.text = String.format(L('FOLLOW_1'), speaker.speaker_name);
                label.font = liferay.fonts.h2;
                label.height = Ti.UI.SIZE;
                scrollContainer.add(label);
                scrollContainer.add(socialIcons);
            }
        });
	} else {
		// just show the abstract
		label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels["abstract"]);
		label.height = Ti.UI.SIZE;
		label.verticalAlign = Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		label.text = liferay.tools.stripTags(info.session_summary);
		label.font = liferay.fonts.h1;
		if (liferay.model.android) {
			label.autoLink = Titanium.UI.Android.LINKIFY_ALL;
		}
		label.ellipsize = false;
		scrollContainer.add(label);
	}

	if (info.enable_ratings) {

		this.updateRatingTimer = null;

		this.ratingDebug = false;

        this.likeBtn.addEventListener('click', function (e) {
            liferay.tools.flashButton({
                control  : e.source,
                onRestore: function () {
                    liferay.screens.agendaDetail.showRatingForm(info, false);
                }
            });
        });
        this.unlikeBtn.addEventListener('click', function (e) {
            liferay.tools.flashButton({
                control  : e.source,
                onRestore: function () {
                    liferay.screens.agendaDetail.showRatingForm(info, false);
                }
            });
        });

		this.updateRatingFooter(info);
	}

	/* Notes */
	if (info.enable_notes) {
		label = Titanium.UI.createLabel(liferay.settings.screens.agendaDetail.labels.notes);
		label.font = liferay.fonts.h2;
		var notesHeight = liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight * .3);

		this.textArea = Ti.UI.createTextArea(liferay.settings.screens.agendaDetail.layout.notesTextArea);
		this.textArea.height = notesHeight;
		this.textArea.width = Ti.UI.FILL;
		this.textArea.hintText = L('HINT_TEXT');
		this.textArea.font = liferay.fonts.h2;

		var notes = this.getNote(info);
		if (!notes || notes == "") {
			if (!liferay.model.android) {
				this.textArea.value = this.textArea.hintText;
			}
		} else {
			this.textArea.value = notes;
		}

		if (!liferay.model.android) {
			this.textArea.addEventListener('focus', function (e) {
				//Ti.API.info("TXT FOCUS 1");
				if (e.source.value == e.source.hintText) {
					e.source.value = "";
				}
			});
			this.textArea.addEventListener('blur', function (e) {
				//Ti.API.info("TXT BLUR 1");
				liferay.screens.agendaDetail.recordNote(info, liferay.screens.agendaDetail.textArea.value);
				liferay.screens.agendaDetail.saveCurrentNotes();
				if (e.source.value == "") {
					e.source.value = e.source.hintText;
				}
			});
			this.window.addEventListener('click', function (e) {
				if (!/(TextField|TextArea)/.test(e.source.toString())) {
					liferay.screens.agendaDetail.textArea.blur();
				}
			});

		} else {
			this.textArea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
			// workaround weird android random focus events - see TIMOB-6745
			this.textArea.setEnabled(false);
			this.textArea.addEventListener('click', function (e) {
				liferay.screens.agendaDetail.textArea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
				liferay.screens.agendaDetail.textArea.focus();
			});
			this.textArea.addEventListener('blur', function (e) {
				liferay.screens.agendaDetail.textArea.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
				liferay.screens.agendaDetail.recordNote(info, liferay.screens.agendaDetail.textArea.value);
				liferay.screens.agendaDetail.saveCurrentNotes();
			});
			this.textArea.addEventListener('focus', function (e) {
			});
			this.window.addEventListener('open', function (e) {
				// workaround weird android random focus events - see TIMOB-6745
				setTimeout(function () {
					liferay.screens.agendaDetail.textArea.setEnabled(true);
				}, 5000);
			});
			this.window.addEventListener('click', function (e) {
				if (!/(TextField|TextArea)/.test(e.source.toString())) {
					liferay.screens.agendaDetail.recordNote(info, liferay.screens.agendaDetail.textArea.value);
					liferay.screens.agendaDetail.saveCurrentNotes();
					Ti.UI.Android.hideSoftKeyboard();
				}
			});
			this.window.addEventListener('close', function (e) {
				liferay.screens.agendaDetail.recordNote(info, liferay.screens.agendaDetail.textArea.value);
				liferay.screens.agendaDetail.saveCurrentNotes();
			});
		}

		scrollContainer.add(label);
		scrollContainer.add(this.textArea);
	}
	// spacer to make the vertical layout have a defined height and layout properly
	scrollContainer.add(Ti.UI.createView({
		width          : 20,
		left           : 0,
		top            : 0,
		height         : liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.13) * 4,
		backgroundColor: 'transparent'
	}));

	scrollSpacer.add(scrollView);
	bottomContainer.add(scrollSpacer);


};

liferay.screens.agendaDetail.getSurveySessionName = function(info) {
    return info.date+' : '+info.title+' : '+liferay.screens.agendaDetail.getSpeakerNames(info, '/');

};

liferay.screens.agendaDetail.getMapIndex = function(info) {

    if (!info.room_uuid) return -1;
    for (var i = 0; i < liferay.data.currentEventData.rooms.length; i++) {
        if (liferay.data.currentEventData.rooms[i].uuid == info.room_uuid) {
            for (var j = 0; j < liferay.data.currentEventData.maps.length; j++) {
                if (liferay.data.currentEventData.maps[j].name == liferay.data.currentEventData.rooms[i].room_name) {
                    return j;
                }
            }
        }
    }
    return -1;
},

    liferay.screens.agendaDetail.getRoomNumber = function(info) {

        if (!info.room_uuid) return -1;
        for (var i = 0; i < liferay.data.currentEventData.rooms.length; i++) {
            if (liferay.data.currentEventData.rooms[i].uuid == info.room_uuid) {
                return liferay.data.currentEventData.rooms[i].room_number;
            }
        }
        return -1;
    },
    liferay.screens.agendaDetail.getRoomName = function(info) {

        if (!info.room_uuid) return null;
        for (var i = 0; i < liferay.data.currentEventData.rooms.length; i++) {
            if (liferay.data.currentEventData.rooms[i].uuid == info.room_uuid) {
                return liferay.data.currentEventData.rooms[i].room_name;
            }
        }
        return null;
    },

liferay.screens.agendaDetail.getSpeakers = function(info) {

    if (!info.speakers_uuid) return [];
    var uuids = info.speakers_uuid.split(',').map(function(el) { return el.trim(); });
    return uuids.map(function(uuid) {
        for (var i = 0; i < liferay.data.currentEventData.speakers.length; i++) {
            if (liferay.data.currentEventData.speakers[i].uuid == uuid) {
                return liferay.data.currentEventData.speakers[i];
            }
        }
        return [];
    });
},

liferay.screens.agendaDetail.getSpeakerByUuid = function(info, uuid) {
    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
    for (var i = 0; i < speakers.length; i++) {
        if (speakers[i].uuid == uuid) {
            return speakers[i];
        }
    }
    return null;
},


liferay.screens.agendaDetail.getSpeakerURL = function(info, idx) {

    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
    if (!speakers || idx >= speakers.length) return null;

    return (speakers[idx]).speaker_image;
},


liferay.screens.agendaDetail.getSpeakerNames = function(info, sep) {

    return liferay.tools.stripTags(liferay.screens.agendaDetail.getSpeakers(info).map(function(el) {
        return el.speaker_name?el.speaker_name.toUpperCase():"";
    }).join(sep).replace( /\s\s+/g, ' ' ));
},
liferay.screens.agendaDetail.getSpeakerName = function(info, idx) {

    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
    if (!speakers || idx >= speakers.length) return null;

    return liferay.tools.stripTags((speakers[idx].speaker_name.toUpperCase()).replace( /\s\s+/g, ' ' ));
},

liferay.screens.agendaDetail.getSpeakerBio = function(info, idx) {
    var speakers = liferay.screens.agendaDetail.getSpeakers(info);
    if (!speakers || idx >= speakers.length) return null;

    return liferay.tools.stripTags(speakers[idx].speaker_bio);
},
liferay.screens.agendaDetail.getSpeakerBios = function(info, sep) {

        return liferay.tools.stripTags(liferay.screens.agendaDetail.getSpeakers(info).map(function(el) {
            return el.speaker_bio?el.speaker_bio:"";
        }).join(sep));
    },

    liferay.screens.agendaDetail.cancelRatingTimer = function() {
		if (liferay.screens.agendaDetail.updateRatingTimer) {
			clearTimeout(liferay.screens.agendaDetail.updateRatingTimer);
			liferay.screens.agendaDetail.updateRatingTimer = null;
		}
};

liferay.screens.agendaDetail.updateRatingFooter = function(info) {
	if (!info.enable_ratings) {
        liferay.screens.agendaDetail.cancelRatingTimer();
		[this.ratingLabel, this.likeBtn, this.unlikeBtn].forEach(function(v) {
			v.visible = false;
			v.enabled = false;
		});
		return;
	}

	var alreadyRated = liferay.forms.hasSubmittedSurvey(liferay.controller.selectedEvent, liferay.screens.agendaDetail.getSurveySessionName(info));

	var session = {
		start   : liferay.screens.agenda.getDateForAgendaItem(info, true),
		end     : liferay.screens.agenda.getDateForAgendaItem(info, false),
		eventEnd : new liferay.classes.date().setFromISO8601(liferay.controller.selectedEvent.end_date + "T" + liferay.controller.selectedEvent.end_time + ":00")
	};

	var now = new Date();
	var localOff = new Date().getTimezoneOffset();
	var diff = (liferay.controller.selectedEvent.event_tz * 60) - localOff;
	var sessionStartLocal = session.start.getTime() + (diff * 60 * 1000);
	var eventEndLocal = session.eventEnd.getTime() + (diff * 60 * 1000);

    liferay.screens.agendaDetail.ratingLabel.addEventListener('longpress', function(e) {
        var msDiff = (sessionStartLocal - 15 * 60 * 1000) - now.getTime();
        var minDiff = Math.floor(msDiff / 1000 / 60);

		liferay.tools.toastNotification(e.source, minDiff + " rated:" + alreadyRated);
    });
    liferay.screens.agendaDetail.ratingLabel.touchEnabled = true;

    if (alreadyRated) {
        liferay.screens.agendaDetail.disableRatingButtons(info);
        return;
    }

    if (liferay.screens.agendaDetail.ratingDebug ||
			((now.getTime() > (sessionStartLocal - 15 * 60 * 1000)) &&
				(now.getTime() < eventEndLocal))) {
		// ready to rate
		liferay.screens.agendaDetail.ratingLabel.text = L('RATINGS_INSTRUCTIONS');
		liferay.screens.agendaDetail.likeBtn.setTouchEnabled(true);
		liferay.screens.agendaDetail.unlikeBtn.setTouchEnabled(true);
		liferay.screens.agendaDetail.likeBtn.backgroundImage = liferay.settings.screens.agendaDetail.buttons.like.backgroundImage;
		liferay.screens.agendaDetail.unlikeBtn.backgroundImage = liferay.settings.screens.agendaDetail.buttons.unlike.backgroundImage;
	} else {
		// not ready to rate yet, but soon
		liferay.screens.agendaDetail.likeBtn.setTouchEnabled(false);
		liferay.screens.agendaDetail.unlikeBtn.setTouchEnabled(false);
		liferay.screens.agendaDetail.likeBtn.backgroundImage = liferay.settings.screens.agendaDetail.buttons.like.backgroundImageAlt;
		liferay.screens.agendaDetail.unlikeBtn.backgroundImage = liferay.settings.screens.agendaDetail.buttons.unlike.backgroundImageAlt;

		var msDiff = (sessionStartLocal - 15 * 60 * 1000) - now.getTime();
		if (msDiff > 0) {
			var minDiff = Math.floor(msDiff / 1000 / 60);
			if (minDiff <= 60) {
				if (minDiff <= 1) {
					liferay.screens.agendaDetail.ratingLabel.text = L('RATINGS_OPEN_SOON');
				} else {
					liferay.screens.agendaDetail.ratingLabel.text = String.format(L('RATINGS_OPEN_MINUTES'), minDiff);
				}
			}
		} else {
			liferay.screens.agendaDetail.ratingLabel.text = L('RATINGS_CLOSED');
			this.likeBtn.visible = this.unlikeBtn.visible = false;
		}
	}

	if (liferay.screens.agendaDetail.ratingDebug) {
		var msDiff = (sessionStartLocal - 15 * 60 * 1000) - now.getTime();
		var minDiff = Math.floor(msDiff / 1000 / 60);
		liferay.screens.agendaDetail.ratingLabel.text = "Opens in " + minDiff + " mins";
	}

	liferay.screens.agendaDetail.updateRatingTimer = setTimeout(function() {
		liferay.screens.agendaDetail.updateRatingFooter(info);
	}, 30000);
};

liferay.screens.agendaDetail.rotate = function () {
    var info = liferay.screens.agendaDetail.currentImageInfo;

	if (liferay.screens.agendaDetail.rotateTimer == null) {
		return;
	}

	this.currentImageIndex++;
    var url = liferay.screens.agendaDetail.getSpeakerURL(info, this.currentImageIndex);

	if (!url) {
		this.currentImageIndex = 0;
        url = liferay.screens.agendaDetail.getSpeakerURL(info, 0);
	}

	if (url) {
		this.image.animate({
			opacity: 0,
			duration: 1000
		}, function() {
			if (liferay.screens.agendaDetail.rotateTimer == null) {
				return;
			}
			liferay.screens.agendaDetail.loadImage({
				setImage: true,
				imageView: liferay.screens.agendaDetail.image,
				url      : url,
				onLoad   : function () {
					if (liferay.screens.agendaDetail.rotateTimer == null) {
						return;
					}
					setTimeout(function() {
						if (liferay.model.android) {
							var ifi = liferay.screens.agendaDetail.image.toBlob();
							ifi = ifi.imageAsResized(ifi.width *2, ifi.height * 2);
							liferay.screens.agendaDetail.image.setImage(ifi);
						}
						liferay.screens.agendaDetail.image.animate({
							opacity : 1.0,
							duration: 1000
						}, function() {
							if (liferay.screens.agendaDetail.rotateTimer == null) {
								return;
							}
							liferay.screens.agendaDetail.rotateTimer = setTimeout(function () {
								liferay.screens.agendaDetail.rotate();
							}, 2000 + liferay.settings.screens.agendaDetail.rotatePeriod);
						});
					}, 100);
				}
			});
		});
	}

};

liferay.screens.agendaDetail.stopRotate = function () {
	if (liferay.screens.agendaDetail.rotateTimer) {
		clearTimeout(liferay.screens.agendaDetail.rotateTimer);
		liferay.screens.agendaDetail.rotateTimer = null;
	}
};

liferay.screens.agendaDetail.disableRatingButtons = function (info) {

    liferay.screens.agendaDetail.cancelRatingTimer();

	this.likeBtn.setTouchEnabled(false);
	this.unlikeBtn.setTouchEnabled(false);
	this.likeBtn.visible = false;
	this.unlikeBtn.visible = false;

	this.ratingLabel.text = L('RATING_THANKS');
    this.ratingLabel.touchEnabled = true;
    this.ratingLabel.addEventListener('click', function(e) {
        liferay.screens.agendaDetail.showRatingForm(info, true);
    });

};


// notes:
// [
//   "eventName": name,
//   "notes": [
//      {
//        "noteId": id,
//        "notes" : notes
//      }
// ]
//

liferay.screens.agendaDetail.getNote = function(info) {

	for (var i = 0; i < liferay.screens.agendaDetail.notes.length; i++) {
		if (liferay.screens.agendaDetail.notes[i].eventId == liferay.controller.selectedEvent.eventid) {
			var notes = liferay.screens.agendaDetail.notes[i].notes;
			for (var j = 0; j < notes.length; j++) {
				if (notes[j].notesId == info.uuid) {
					return notes[j].notes;
				}
			}
		}
	}
	return null;
};


liferay.screens.agendaDetail.recordNote = function (info, notes) {

	for (var i = 0; i < liferay.screens.agendaDetail.notes.length; i++) {
		if (liferay.screens.agendaDetail.notes[i].eventId == liferay.controller.selectedEvent.eventid) {
			var currentNotes = liferay.screens.agendaDetail.notes[i].notes;
			for (var j = 0; j < currentNotes.length; j++) {
				if (currentNotes[j].notesId == info.uuid) {
					currentNotes[j].notes = notes;
					return;
				}
			}
			// if here, then no note was found, so record it.
			currentNotes.push({
				notesId: info.uuid,
				notes: notes
			});
			return;
		}
	}
	// if here, then no entry for the event
	liferay.screens.agendaDetail.notes.push({
		eventId: liferay.controller.selectedEvent.eventid,
		notes: [{
			notesId: info.uuid,
			notes: notes
		}]
	});
};


liferay.screens.agendaDetail.loadNotes = function () {

    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.notesFile);

    if (file.exists()) {
        try {
            var newNotes = JSON.parse(file.read());
            if (newNotes) {
                liferay.screens.agendaDetail.notes = newNotes;
            } else {
            }
        } catch (ex) {
            // notes file unreadable, abort!
            console.log("################################ NOTES FILE COULD NOT BE READ, ABORTING");
            return;
        }
    } else {
        if (liferay.screens.agendaDetail.notes) {
            if (liferay.screens.agendaDetail.notes.length <= 0) {
                liferay.screens.agendaDetail.notes = [];
            } else {

            }
        } else {
            liferay.screens.agendaDetail.notes = [];
        }
    }
};

liferay.screens.agendaDetail.saveCurrentNotes = function () {
	var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
	if (!folder.exists()) {
		folder.createDirectory();
		folder.remoteBackup = true;
	}
	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.notesFile);

	file.write(JSON.stringify(liferay.screens.agendaDetail.notes));
	file.remoteBackup = true;
};

// favorites:
// [
//   "eventName": name,
//   "favorites": [id, id, ...]
// ]
//

liferay.screens.agendaDetail.getAllFavorites = function(event) {
	var eventid = event.eventid;
	if (!liferay.screens.agendaDetail.favorites) {
		return [];
	}
	for (var i = 0; i < liferay.screens.agendaDetail.favorites.length; i++) {
		if (liferay.screens.agendaDetail.favorites[i].eventId == eventid) {
			var currentFavorites = liferay.screens.agendaDetail.favorites[i].favorites;
			return currentFavorites ? currentFavorites : [];
		}
	}
	return [];

}
liferay.screens.agendaDetail.isFavorite = function(info) {

	var eventid = liferay.controller.selectedEvent.eventid;
	var id = info.uuid;
	for (var i = 0; i < liferay.screens.agendaDetail.favorites.length; i++) {
		if (liferay.screens.agendaDetail.favorites[i].eventId == eventid) {
			var currentFavorites = liferay.screens.agendaDetail.favorites[i].favorites;
			if (currentFavorites && currentFavorites.indexOf(id) >= 0) {
				return true;
			}
		}
	}
	return false;
};

liferay.screens.agendaDetail.recordFavorite = function (info, favorite) {
	var eventid = liferay.controller.selectedEvent.eventid;
	var id = info.uuid;

    // set the agenda favorite
    var items = liferay.screens.agenda.listViewSection.getItems();
    for (var i = 0; i < items.length; i++) {
          if (items[i].properties.itemId == info.uuid) {
              var isHighlight = liferay.screens.agenda.isHighlight(info);
              if (!favorite) {
                  items[i].sessionBackgroundView.backgroundColor = isHighlight ?
                      liferay.settings.screens.agenda.highlightColor :
                      'transparent';
              } else {
                  items[i].sessionBackgroundView.backgroundColor = isHighlight ?
                      liferay.settings.screens.agenda.favoriteHighlightColor :
                      liferay.settings.screens.agenda.favoriteColor;
              }
              liferay.screens.agenda.listViewSection.replaceItemsAt(i, 1, [items[i]], {animated: false});
              break;
          }
    }

	for (var i = 0; i < liferay.screens.agendaDetail.favorites.length; i++) {
		if (liferay.screens.agendaDetail.favorites[i].eventId == eventid) {
			var currentFavorites = liferay.screens.agendaDetail.favorites[i].favorites;
			if (currentFavorites) {
				var idx = currentFavorites.indexOf(id);
				if (idx < 0) {
					if (!favorite) {
						return;
					} else {
						currentFavorites.push(id);
						return;
					}
				} else {
					if (favorite) {
						return;
					} else {
						currentFavorites.splice(idx, 1);
						return;
					}
				}
			} else {
				// no favorites for this event, so make a new one
				liferay.screens.agendaDetail.favorites[i].favorites = [id];
				return;
			}
		}
	}
	// no favorites at all, so start a new one
	liferay.screens.agendaDetail.favorites.push({
		eventId: liferay.controller.selectedEvent.eventid,
		favorites: [id]
	});
};


liferay.screens.agendaDetail.loadFavorites = function () {


    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.favoritesFile);

    if (file.exists()) {
        try {
            var newFaves = JSON.parse(file.read());
            if (newFaves) {
                liferay.screens.agendaDetail.favorites = newFaves;
            } else {
            }
        } catch (ex) {
            // faves file unreadable, abort!
            console.log("################################ FAVORITES FILE COULD NOT BE READ, ABORTING");
            return;
        }
    } else {
        if (liferay.screens.agendaDetail.favorites) {
            if (liferay.screens.agendaDetail.favorites.length <= 0) {
                liferay.screens.agendaDetail.favorites = [];
            } else {

            }
        } else {
            liferay.screens.agendaDetail.favorites = [];
        }
    }
};

liferay.screens.agendaDetail.saveCurrentFavorites = function () {
	var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
	if (!folder.exists()) {
		folder.createDirectory();
		folder.remoteBackup = true;
	}
	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.favoritesFile);

	file.write(JSON.stringify(liferay.screens.agendaDetail.favorites));
	file.remoteBackup = true;
};

// RATING FORM
liferay.screens.agendaDetail.showRatingForm = function(info, readOnly, cb) {

    liferay.forms.showForm({
        title: L('EVENT_SURVEY').toUpperCase(),
        subTitle: liferay.tools.stripTags(info.title),
        subSubTitle: liferay.screens.agendaDetail.getSpeakerNames(info, '/'),
        intro: L('EVENT_SURVEY_INSTRUCTIONS'),
        headerFields: [],
        questionSpec: info.survey_questions ? info.survey_questions : liferay.controller.selectedEvent.session_survey_questions,
        event: liferay.controller.selectedEvent,
        surveyId: liferay.screens.agendaDetail.getSurveySessionName(info),
        controlWindow: liferay.screens.agendaDetail.window,
        readOnly: readOnly,
        sendButtonText: L('SURVEY_SEND'),
        dismissText: L('SURVEY_SAVE_FOR_LATER'),
        submitDialogTitle : L('SURVEY_SUBMIT_TITLE'),
        submitDialogText : L('SURVEY_SUBMIT_PROMPT'),
        onSuccess: function(result) {
            liferay.screens.agendaDetail.disableRatingButtons(info);
            liferay.tools.toastNotification(L('EVENT_SURVEY_THANKS'));
            cb && cb();
        },
        onFail: function(err) {
            liferay.tools.alert(L('ALERT'), String.format(L('EVENT_SURVEY_ERROR'), err));
            cb && cb();
        },
        onClose: function() {
            cb && cb();
        }
    });
};

liferay.screens.agendaDetail.downloadAndViewSlides = function(event, url) {
    var localFile = liferay.cache.getLocalFilePath(url, 'pdf');

//    // TODO: remove
//    if (localFile) {
//        liferay.cache.deleteFile(localFile);
//        localFile = null;
//    }
    if (localFile) {
        liferay.screens.agendaDetail.viewSlides(localFile, event);
    } else {
        liferay.screens.agendaDetail.downloadSlides({
            url: url,
            onDownload: function(downloadedFile) {
                liferay.screens.agendaDetail.viewSlides(downloadedFile, event);
            }
        });
    }
};

liferay.screens.agendaDetail.downloadSlides = function(options) {

    var fakeFlag = true;

    var shader = Ti.UI.createView({
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity:0.70
    });

    var padder = Ti.UI.createView({
        left: '10%',
        top: '10%',
        width: '80%',
        height: '80%',
        backgroundColor: 'transparent'
    });

    var container = Ti.UI.createView({
        width: '100%',
        height: '50%',
        layout: 'vertical'
    });

    var prog = Ti.UI.createProgressBar({
        message: L('LOADING'),
        font: liferay.fonts.h4,
        color: 'white',
        min: 0,
        max: 1,
        value: 0,
        width: '90%',
        height: 'auto'
    });

    var closebtn = Ti.UI.createButton({
        title: '  ' + L('CANCEL') + '  ',
        font: liferay.fonts.h3,
        backgroundColor: '#00B6B7',
        color: 'white',
        top: '40dp'
    });

    var downloader = liferay.cache.downloadAndCache({
        url: options.url,
        ext: 'pdf',
        onLoad: function(localfile) {
            fakeFlag = false;
            prog.hide();
            liferay.controller.getCurrentWindow().remove(shader);
            liferay.controller.getCurrentWindow().remove(padder);
            if (options.onDownload) {
                options.onDownload(localfile)
            }
        },
        onProgress: function(e) {
            if (e.progress <= 0) return;
            prog.value = e.progress;
            fakeFlag = false;
        },
        onError: function(e) {
            fakeFlag = false;
            prog.hide();
            liferay.controller.getCurrentWindow().remove(shader);
            liferay.controller.getCurrentWindow().remove(padder);
            alert(String.format(L('ERROR_1'), JSON.stringify(e)));
        }
    });

    closebtn.addEventListener('click', function(e) {
        fakeFlag = false;
        prog.hide();
        downloader.abort();
        liferay.controller.getCurrentWindow().remove(shader);
        liferay.controller.getCurrentWindow().remove(padder);
    });

    container.add(prog);
    container.add(closebtn);
    padder.add(container);

    liferay.controller.getCurrentWindow().add(shader);
    liferay.controller.getCurrentWindow().add(padder);
    prog.show();

    setTimeout(function(e) {
        if (fakeFlag) {
            var fakeInt = setInterval(function (e2) {
                if (!fakeFlag) {
                    clearInterval(fakeInt);
                } else {
                    var cv = prog.value;
                    if (cv > .99) {
                        fakeFlag = false;
                        return;
                    }
                    var newv = prog.value + Math.random() * .01 * (1-prog.value);
                    prog.value = newv;
                }
            }, 250);
        }
    }, 1000);



}

liferay.screens.agendaDetail.viewSlides = function(localFile, event) {
    var speakers = liferay.screens.agendaDetail.getSpeakers(event);
    var speakerNames = (speakers.length > 0) ? liferay.screens.agendaDetail.getSpeakerNames(event, ' - ') : null;
    if (speakerNames) {
        speakerNames = liferay.tools.stripTags(speakerNames);
    }

    var tmpFileName = liferay.tools.stripTags(event.title).trim();
    if (speakerNames) {
        tmpFileName += (' - ' + speakerNames);
    }

    tmpFileName = tmpFileName.replace(/[^A-Za-z0-9]/g, '-');
    tmpFileName += '.pdf';

    if (liferay.model.iOS) {
        var origFile = Ti.Filesystem.getFile(localFile);

        if (!origFile || !origFile.exists()) {
            alert(String.format(L('ERROR_1'), String.format(L('CANT_READ_PDF'), localFile)));
            return;
        }

        var tmpFile = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, tmpFileName);
        if (!tmpFile.write(origFile.read())) {
            alert(String.format(L('ERROR_1'), String.format(L('CANT_SAVE_PDF'), tmpFile.nativePath)));
            return;
        }

        var docViewer = Ti.UI.iOS.createDocumentViewer({url: tmpFile.nativePath});
        docViewer.addEventListener('unload', function(e) {
            tmpFile.deleteFile();
        });

        docViewer.show({
            animated: true
        });
    } else if (liferay.model.android) {
        if (Ti.Filesystem.isExternalStoragePresent()) {
            var origFile = Ti.Filesystem.getFile(localFile);
            if (!origFile || !origFile.exists()) {
                alert(String.format(L('ERROR_1'), String.format(L('CANT_READ_PDF'), localFile)));
                return;
            }

            var tmpDir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory);
            if (!tmpDir.exists()) {
                tmpDir.createDirectory();
            }
            var tmpFile = Ti.Filesystem.getFile(tmpDir.nativePath, tmpFileName);

            if (!tmpFile.write(origFile.read())) {
                alert(String.format(L('ERROR_1'), String.format(L('CANT_SAVE_PDF'), tmpFile.nativePath)));
                return;
            }

            var intent = Ti.Android.createIntent({
                action: Ti.Android.ACTION_VIEW,
                type: 'application/pdf',
                data: tmpFile.nativePath
            });

            try {
                Ti.Android.currentActivity.startActivity(intent);
            } catch(e) {
                tmpFile.deleteFile();
                alert(L('NO_PDF_APP'));
            }

            liferay.controller.getCurrentWindow().addEventListener('close', function(e) {
                tmpFile.deleteFile();
            });
        } else {
            // should not happen, so no localization
            Ti.API.error('No external storage present');
        }


    } else {

    }
}

