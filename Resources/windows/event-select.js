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

liferay.screens.eventSelect = new liferay.classes.window();
liferay.screens.eventSelect.className = 'liferay.screens.eventSelect';
liferay.screens.eventSelect.loadInactive = false;

liferay.screens.eventSelect.render = function () {

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    var locateBtn = Titanium.UI.createView(liferay.settings.screens.eventSelect.buttons.locate);

    locateBtn.width = liferay.tools.getDp(liferay.settings.screens.eventSelect.buttons.locate.psize * Titanium.Platform.displayCaps.platformWidth);
    locateBtn.height = locateBtn.width;

    locateBtn.addEventListener('click', function() {
        liferay.tools.flashButton({
            control : locateBtn,
            onRestore : function() {
                liferay.screens.eventSelect.locateAndStart();
            }
        });
    });

    var directions = Titanium.UI.createLabel(liferay.settings.screens.eventSelect.labels.directions);
    directions.font = liferay.fonts.h0;

    directions.addEventListener('longpress', function(e) {
        liferay.tools.toastNotification(e.source, Ti.App.Properties.getString('liferay.version.string', 'unknown'));
    });

    this.window = liferay.ui.makeWindow({
        backEnabled: false,
        swipe: true,
        panelBg: this.panelBg,
        footerButtons: [locateBtn, directions],
        headerText: L('EVENT_SELECT_HEADER'),
        headerListeners: [{event: 'longpress', listener: function(e) {
            liferay.screens.eventSelect.panelBg.borderWidth = '5dp';
            liferay.screens.eventSelect.panelBg.borderColor = 'red';
            liferay.screens.eventSelect.selectInactive = !liferay.screens.eventSelect.selectInactive;
            liferay.screens.eventSelect.loadEvents();
        }}]
    });

	this.loadEvents();

	return this.window;
};

liferay.screens.eventSelect.refresh = function() {
	this.loadEvents();
}
liferay.screens.eventSelect.loadEvents = function () {
	var self = this;

	var data = [];
	var pastData = [];
	var now = new Date();
	if (!liferay.data.events || !liferay.data.events.length) {
		return;
	}

	liferay.data.events.sortBy('start_date');

	var capsHeight = Titanium.Platform.displayCaps.platformHeight;
	var rowHeight = liferay.tools.getDp(capsHeight * .15);
	for (var i = 0, l = liferay.data.events.length; i < l; i++) {
		var event = liferay.data.events[i];

		var eventTimes = {
			start: new liferay.classes.date().setFromISO8601(event.start_date + "T" + event.start_time + ":00"),
			end  : new liferay.classes.date().setFromISO8601(event.end_date + "T" + event.end_time + ":00")
		}

		var past = false;
		if (eventTimes.end.date.getTime() < now.getTime()) {
			past = true;
		}
		var row = Titanium.UI.createTableViewRow({
			width: Ti.UI.FILL,
			height                 : rowHeight
		});

		var rowContainer = Ti.UI.createView({
			layout: "horizontal",
			width: Ti.UI.FILL,
			height: rowHeight,
			backgroundColor: 'transparent'
		});

		var imageContainer = Titanium.UI.createView({
			width: '9%',
			height: rowHeight
		});

		var iconSize = liferay.tools.getDp(liferay.settings.screens.agenda.layout.typeIcon.psize * Titanium.Platform.displayCaps.platformWidth);
		var image = Titanium.UI.createImageView({
			preventDefaultImage: false,
			right               : '2%',
			top                : liferay.tools.os({
				iphone:'26%',
				ipad: '26%',
				android:'21%'
			}),
			height             : iconSize,
			width              : iconSize
		});
		if (event.logo) {
			this.loadImage({
				imageView: image,
				url      : event.logo
			});
		} else {
			image.backgroundImage = liferay.settings.screens.eventSelect.defaultPicture;
		}

		imageContainer.add(image);
		rowContainer.add(imageContainer);

		var labelContainer = Titanium.UI.createView({
			width : '75%',
			height: rowHeight,
			layout: 'vertical'
		});

		labelContainer.add(Titanium.UI.createLabel({
			text        : event.title,
			font        : liferay.fonts.h3,
			color       : past ? '#BBBBBB' : '#89A9C9',
			textAlign   : 'left',
			touchEnabled: false,
			left        : '4%',
			top         : liferay.tools.os({
				iphone:'30%',
				ipad: '30%',
				android:'22%'
			}),
			width       : Ti.UI.SIZE
		}));

		labelContainer.add(Titanium.UI.createLabel({
			text        : (event.location_label + " | " + String.formatDate(eventTimes.start.date, "medium")).toUpperCase(),
			font        : liferay.fonts.h1,
			color       : past ? '#BBBBBB' : '#89A9C9',
			textAlign   : 'left',
			left        : '4%',
			touchEnabled: false,
			top         : "1%",
			width       : Ti.UI.SIZE
		}));

		rowContainer.add(labelContainer);

		var arrowImageContainer = Titanium.UI.createView({
			width: '15%',
			height: rowHeight
		});

		image = Titanium.UI.createImageView(liferay.settings.screens.eventSelect.layout.arrowView);
		image.height = rowHeight * .4;
		image.width = image.height;

		arrowImageContainer.add(image);
		rowContainer.add(arrowImageContainer);

		row.add(rowContainer);

		row.className = 'event-listing';
		row.container = rowContainer;
		row.eventLink = event;
		row.hasChild = false;

		row.backgroundSelectedColor = liferay.settings.screens.agenda.highlightColor;
		if (liferay.model.iOS) {
			row.selectionStyle = Titanium.UI.iPhone.TableViewCellSelectionStyle.NONE;
		}

		if (past) {
			pastData.push(row);
		} else {
			data.push(row);
		}
	}

	if (this.tableView) {
		this.panelBg.remove(this.tableView);
	}

	var finalData = [];
	var upcomingEventsSection = Ti.UI.createTableViewSection({ headerTitle: L('UPCOMING_EVENTS') });

	data.forEach(function(el) {
		upcomingEventsSection.add(el);
	});
	finalData.push(upcomingEventsSection);

	if (pastData.length > 0) {
		var pastEventsSection = Ti.UI.createTableViewSection({ headerTitle: L('PAST_EVENTS') });
		pastData.sortBy('-eventLink.start_date').forEach(function(el) {
			pastEventsSection.add(el);
		});
		finalData.push(pastEventsSection);
	}

	this.tableView = Titanium.UI.createTableView({
		data           : finalData,
		left           : 0,
		top            : 0,
		width          : Ti.UI.FILL,
		height         : Ti.UI.FILL,
		separatorColor : '#F2F2F2'
	});

	this.tableView.addEventListener('click', function (e1) {
		var event = e1.row.eventLink;

		liferay.tools.flashControl(e1.row.container ? e1.row.container : null, liferay.settings.screens.agenda.selectColor, function() {

            if (event.eventId != null) {
                // old event from 2013 and prior
                alert(L('UPGRADE_NOTE'));
                return;
            }
			if (!event.active && !liferay.screens.eventSelect.selectInactive) {
				var buttonNames = [];
				var evtIdx = -1;
				var regIdx = -1;
				if (event.event_url) {
					buttonNames.push(L('FMT_WEBSITE'));
					evtIdx = 0;
				}
				if (event.register_url) {
					buttonNames.push(L('REGISTER'));
					regIdx = evtIdx + 1;
				}

				buttonNames.push(L('OK'));

				var alertDialog = Titanium.UI.createAlertDialog({
					title : event.menutitle,
					message : event.inactive_msg,
					buttonNames : buttonNames
				});
				alertDialog.addEventListener('click', function(e) {
					if (e.index == evtIdx) {
						Ti.Platform.openURL(event.event_url);
					} else if (e.index == regIdx) {
						Ti.Platform.openURL(event.register_url);
					}
				});
				alertDialog.show();
			} else {
				liferay.controller.selectedEvent = event;
				liferay.controller.preferredEventId = liferay.controller.selectedEvent.eventid;
				liferay.controller.saveEventPreferences();
				liferay.controller.loadAndStartEvent();
			}

		});
	});


	this.panelBg.add(this.tableView);

};

liferay.screens.eventSelect.locateAndStart = function () {
	if (liferay.model.iOS) {
		Ti.Geolocation.setPurpose(L('GEO_PERMISSION_PURPOSE'));
	}
	Ti.Geolocation.getCurrentPosition(function (result) {
		if (result.success && result.coords) {
			var coords = result.coords;
			var lat = coords.latitude;
			var lng = coords.longitude;
			var closest = -1;
			var closestEvent = null;
			var closestDist = -1;
			for (var i = 0; i < liferay.data.events.length; i++) {
				var event = liferay.data.events[i];

				if (event.latitude && event.longitude) {
					var dist = liferay.screens.eventSelect.getDistanceBetween(lat, lng, event.latitude, event.longitude);
					if ((closest == -1) || (dist < closestDist)) {
						closest = i;
						closestDist = dist;
						closestEvent = event;
					}
				}
			}

			if (closest != -1) {
				liferay.screens.eventSelect.tableView.fireEvent('click', {
					row: {
						eventLink: closestEvent
					}
				});
			}
		} else {
			liferay.tools.alert(L('ALERT'), String.format(L('NO_LOCATION'), result.error + '[' + result.code + ']'));
		}
	});

};

// Uses spherical law of cosines for approx distance
liferay.screens.eventSelect.getDistanceBetween = function (lat1, lng1, lat2, lng2) {

	var radlat1 = Math.PI * lat1 / 180;
	var radlat2 = Math.PI * lat2 / 180;
	var radlon1 = Math.PI * lng1 / 180;
	var radlon2 = Math.PI * lng2 / 180;
	var theta = lng1 - lng2;
	var radtheta = Math.PI * theta / 180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180 / Math.PI;
	dist = dist * 60 * 1.1515 * 1.609344;
	return dist;
};
