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


liferay.screens.activitiesDetail = new liferay.classes.window();
liferay.screens.activitiesDetail.className = 'liferay.screens.activitiesDetail';

liferay.screens.activitiesDetail.render = function() {

	var self = this;

	this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);

	this.directions = Titanium.UI.createLabel(liferay.settings.screens.mapsDetail.labels.directions);
	this.directions.font = liferay.fonts.h0;
	this.directions.visible = false;

	this.googleMapsBtn = Titanium.UI.createView(liferay.settings.screens.mapsDetail.buttons.googlemaps);
	this.googleMapsBtn.width = liferay.tools.getDp(liferay.settings.screens.mapsDetail.buttons.googlemaps.psize * Titanium.Platform.displayCaps.platformWidth);
	this.googleMapsBtn.height = this.googleMapsBtn.width;
	this.googleMapsBtn.visible = false;

	this.window = liferay.ui.makeWindow({
		swipe: true,
        backEnabled: true,
		footerButtons: [this.directions, this.googleMapsBtn],
		panelBg: this.panelBg

	});

	return this.window;
};

liferay.screens.activitiesDetail.loadAction = function(action, event_uuid, cb) {
    liferay.data.currentEventData.activities.forEach(function(activity) {
        if (activity.title == action[0]) {
            liferay.screens.activitiesDetail.loadDetails(activity);
        }
    });
    cb();
};


liferay.screens.activitiesDetail.loadDetails = function(info) {

	var self = this;

	var session = {
		start   : new liferay.classes.date().setFromISO8601(info.date + 'T' + info.starttime + ':00'),
		end     : new liferay.classes.date().setFromISO8601(info.date + 'T' + info.endtime + ':00')
	};

	// details scroll view
	var scrollView = Titanium.UI.createScrollView(liferay.settings.screens.activitiesDetail.layout.scrollView);
    scrollView.contentHeight = Ti.UI.SIZE;
    scrollView.contentWidth = Ti.UI.SIZE;
	var scrollContainer = Ti.UI.createView({
		top: 0,
		left: 0,
		height: Ti.UI.SIZE,
		width: '100%',
		layout: "vertical"
	});

	var imgViewSize = liferay.tools.getDp(liferay.settings.screens.activitiesDetail.layout.imageView.psize * Titanium.Platform.displayCaps.platformWidth);
	var topContainer = Titanium.UI.createView(liferay.settings.screens.activitiesDetail.layout.topContainer);
	topContainer.height = imgViewSize * 1.1;

	var sideContainer = Titanium.UI.createView(liferay.settings.screens.activitiesDetail.layout.sideContainer);
	sideContainer.width = Ti.UI.SIZE;
	sideContainer.height = topContainer.height;

	var imageContainer = Titanium.UI.createView({
		width: imgViewSize * 1.5,
		height: imgViewSize,
		top: 0,
		left: 0
	});

	var imageMargins = Titanium.UI.createView({
		left: '5%',
		top: '5%',
		width: '90%',
		height: '90%'
	});

	var image = Titanium.UI.createImageView({
		preventDefaultImage: false,
		height             : 'auto',
		width              : 'auto'
	});
	if (!info.picture) {
		image.image = liferay.settings.screens.contacts.defaultPicture;
	} else {
		this.loadImage({
			setImage: true,
			imageView: image,
			url: info.picture
		});
	}
	imageMargins.add(image);
	imageContainer.add(imageMargins);

	var label;
	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.title);
	label.text = info.title;
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h1;
	sideContainer.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.date);
	label.text = String.formatDate(session.start.date, "medium").toUpperCase();
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h1;
	sideContainer.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.time);
	label.text = String.format(L('TIME_RANGE'), String.formatTime(session.start.date, "short"), String.formatTime(session.end.date, "short"));
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h1;
	sideContainer.add(label);

	var mapIndex = liferay.screens.sponsors.getMapIndex(info.map_name);

	if (info.map_name && mapIndex != -1) {
		var mapContainer = Titanium.UI.createView({
			layout: 'horizontal',
			width : Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			left  : 0,
			top   : 0
		});
		var arrowSize = liferay.tools.getDp(liferay.settings.screens.agendaDetail.layout.imageView.arrowSize * Titanium.Platform.displayCaps.platformWidth);

		var bugView = Titanium.UI.createView({
			width          : arrowSize,
			height         : arrowSize,
			backgroundImage: liferay.settings.screens.agendaDetail.layout.arrowImage,
			left           : "4%"
		});

		var mapInfo = liferay.data.currentEventData.maps[mapIndex];
		var mapLabel = Ti.UI.createLabel({
			width    : Ti.UI.SIZE,
			height   : Ti.UI.SIZE,
			left     : 0,
			textAlign: "left",
			color    : "#444444",
			text     : mapInfo.shortName ? mapInfo.shortName : mapInfo.name,
			font     : liferay.fonts.h0
		});

		mapContainer.add(mapLabel);
		mapContainer.add(bugView);

		mapContainer.addEventListener('click', function (e) {
			if (liferay.model.android) {
				liferay.controller.open(liferay.screens.mapsDetail.render(), liferay.screens.mapsDetail);
				liferay.screens.mapsDetail.loadDetails(liferay.data.currentEventData.maps[mapIndex]);
			} else {
				liferay.tools.expandButton({
					control  : mapContainer,
					onRestore: function () {
						liferay.controller.open(liferay.screens.mapsDetail.render(), liferay.screens.mapsDetail);
						liferay.screens.mapsDetail.loadDetails(liferay.data.currentEventData.maps[mapIndex]);
					}
				});
			}
		});

		sideContainer.add(mapContainer);
	}
	topContainer.add(imageContainer);
	topContainer.add(sideContainer);
	scrollContainer.add(topContainer);

	// Flexible vertical layout for Bio and Abstract
	var body = Titanium.UI.createView({
		layout: 'vertical',
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE,
		top: liferay.tools.getDp(10)
	});

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.descriptionTitle);
	label.font = liferay.fonts.h2;
	body.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.description);
	label.text = info.description;
	label.font = liferay.fonts.h2;
	body.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.hostedbyTitle);
	label.font = liferay.fonts.h2;
	body.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.hostedby);
	label.text = info.hostedby;
	label.font = liferay.fonts.h2;
	body.add(label);

	if (mapIndex != -1) {
		mapInfo = liferay.data.currentEventData.maps[mapIndex];

		label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.locationTitle);
		label.font = liferay.fonts.h2;
		body.add(label);

		label = Titanium.UI.createLabel(liferay.settings.screens.activitiesDetail.labels.location);
		label.text = mapInfo.address;
		label.font = liferay.fonts.h2;
		label.color = "#33ACDC";
		label.touchEnabled = true;
		label.addEventListener('click', function(e) {
					if (liferay.model.android) {
						Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(e.source.text));
					} else {
						liferay.tools.expandButton({
							control : e.source,
							onRestore : function() {
								Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(e.source.text));
							}
						});
					}
		});
		body.add(label);
	}
    scrollContainer.add(body);

    // spacer to make the vertical layout have a defined height and layout properly
    scrollContainer.add(Ti.UI.createView({
        width          : 20,
        left           : 0,
        top            : 0,
        height         : liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.13) * 2,
        backgroundColor: 'transparent'
    }));



	scrollView.add(scrollContainer);
	this.panelBg.add(scrollView);

	if (mapIndex != -1) {

		mapInfo = liferay.data.currentEventData.maps[mapIndex];
		this.googleMapsBtn.addEventListener('click', function() {
			liferay.tools.expandButton({
				control : liferay.screens.activitiesDetail.googleMapsBtn,
				onRestore : function() {
					Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(mapInfo.address));
				}
			});
		});
		this.directions.visible = true;
		this.googleMapsBtn.visible = true;
	}
};
