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

liferay.screens.sponsors = new liferay.classes.window();
liferay.screens.sponsors.className = 'liferay.screens.sponsors';
liferay.screens.sponsors.sponsorFormType = "sponsor-beacon";

liferay.screens.sponsors.getMapIndex = function(name) {

    for (var j = 0; j < liferay.data.currentEventData.maps.length; j++) {
        if (liferay.data.currentEventData.maps[j].name == name) {
            return j;
        }
    }
    return -1;
};

liferay.screens.sponsors.getLevelSizeMap = function(raw) {

    return ((raw.split(',').map(function(el) { return el.trim();})).map(function(el) {
		var parts = el.split(":").map(function(el2) { return el2.trim();});
		return {
			name: parts[0],
			rowcount: (parts[1]) ? parseInt(parts[1]) : 1,
			large: (parts[2]) ? (parts[2].toUpperCase().indexOf('L') == 0) : true
		};
	}));
};

liferay.screens.sponsors.getLevelDisplayName = function(name) {

    // now parse event type dictionary, if any
    if (liferay.controller.selectedEvent.event_type_dict) {
        var allTrans = liferay.controller.selectedEvent.event_type_dict.split(',').map(function(el) { return el.trim();});
        for (var i = 0; i < allTrans.length; i++) {
            var parts = allTrans[i].split('=').map(function(el) { return el.trim();});
            if (parts[0] === name) {
                return parts[1];
            }
        }
    }

    return name;

};

liferay.screens.sponsors.getLevelIndex = function(name, map) {
	for (var i = 0; i < map.length; i++) {
		if (map[i].name.toUpperCase() == name.trim().toUpperCase()) {
			return i;
		}
	}
	return -1;
};

liferay.screens.sponsors.getLevelRowCount = function(name, map) {
	for (var i = 0; i < map.length; i++) {
		if (map[i].name.toUpperCase() == name.trim().toUpperCase()) {
			return map[i].rowcount;
		}
	}
	return 1;
};
liferay.screens.sponsors.getIsLarge = function(name, map) {
	for (var i = 0; i < map.length; i++) {
		if (map[i].name.toUpperCase() == name.trim().toUpperCase()) {
			return map[i].large;
		}
	}
	return 1;
};

liferay.screens.sponsors.shuffleArray = function(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
};

liferay.screens.sponsors.render = function() {
	var self = this;

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    var mapIndex = this.getMapIndex(liferay.controller.selectedEvent.booth_map_name);

    var mapButton = Titanium.UI.createView(liferay.settings.screens.sponsors.buttons.map);
    mapButton.width = liferay.tools.getDp(liferay.settings.screens.sponsors.buttons.map.psize * Titanium.Platform.displayCaps.platformWidth);
    mapButton.height = mapButton.width;
    mapButton.addEventListener('click', function() {
        liferay.tools.flashButton({
            control : mapButton,
            onRestore : function() {
                liferay.controller.open(liferay.screens.mapsDetail.render(), liferay.screens.mapsDetail);
                liferay.screens.mapsDetail.loadDetails(liferay.data.currentEventData.maps[mapIndex]);
            }
        });
    });

    this.resetBtn = Titanium.UI.createView(liferay.settings.screens.sponsors.buttons.reset);
    this.resetBtn.width = liferay.tools.getDp(liferay.settings.screens.sponsors.buttons.reset.psize * Titanium.Platform.displayCaps.platformWidth);
    this.resetBtn.height = this.resetBtn.width;
    this.resetBtn.center = {
        x: '15%'
    };
    this.resetBtn.addEventListener('click', function (e) {
        liferay.tools.flashButton({
            control: e.source,
            onRestore: function () {
                liferay.screens.sponsors.resetStars();
            }
        });
    });
    this.resetBtn.visible = (liferay.controller.selectedEvent.metadata_types.indexOf('beaconSponsors') >= 0);

    var footerButtons = [this.resetBtn];
    if (mapIndex > 0) footerButtons.push(mapButton);
    this.window = liferay.ui.makeWindow({
        swipe: true,
        backEnabled: true,
        footerButtons: footerButtons,
        panelBg: this.panelBg
    });

    this.loadSponsorScroll();

    return this.window;
}

liferay.screens.sponsors.loadSponsorScroll = function() {

    if (this.scrollView) {
        this.panelBg.remove(this.scrollView);
    }
	// sponsors scroll view
	this.scrollView = Titanium.UI.createScrollView({
        width: "95%",
        backgroundColor: "white",
        height: "100%",
        scrollType: "vertical",
        contentWidth: "auto",
        contentHeight: "auto",
        top: 0,
        left: "5%",
        showVerticalScrollIndicator: true,
        showHorizontalScrollIndicator: false
    });

    this.spacingContainers = [];

	// build sponsorship levels maps
	var sponsorMap = [];
	if (liferay.data.currentEventData.sponsors && liferay.data.currentEventData.sponsors.length) {
		for (var i = 0, l = liferay.data.currentEventData.sponsors.length; i < l; i++) {
			var sponsor = liferay.data.currentEventData.sponsors[i];
			if (sponsor.type && !(sponsor.type == 'event')) {
				continue;
			}
			var pushed = false;
			for ( j = 0 ; j < sponsorMap.length; j++) {
				if (sponsorMap[j].levelName.trim().toUpperCase() == sponsor.rank.trim().toUpperCase()) {
					sponsorMap[j].sponsors.push(sponsor);
					pushed = true;
				}
			}
			if (!pushed) {
				sponsorMap.push({
					levelName: sponsor.rank,
					sponsors: [sponsor]
				});
			}
		}

		// sort the levels
		var levelSizeMap = [];
		if (liferay.controller.selectedEvent.ordered_sponsor_levels) {
			levelSizeMap = liferay.screens.sponsors.getLevelSizeMap(liferay.controller.selectedEvent.ordered_sponsor_levels);
			sponsorMap = sponsorMap.sort(function(a, b) {
				var al = a.levelName;
				var bl = b.levelName;
				return (liferay.screens.sponsors.getLevelIndex(al, levelSizeMap) - liferay.screens.sponsors.getLevelIndex(bl, levelSizeMap));
			});
		}

		// sort each level based on rank, or randomize
		if (liferay.controller.selectedEvent.randomize_sponsors) {
			sponsorMap.forEach(function(sponsorObj) {
				sponsorObj.sponsors = liferay.screens.sponsors.shuffleArray(sponsorObj.sponsors);
			});
		} else {
			sponsorMap.forEach(function(sponsorObj) {
				sponsorObj.sponsors = sponsorObj.sponsors.sort(function(a, b) {
                    if ((!a.level_rank) || (!b.level_rank)) {
                        return 0;
                    }
					return (a.level_rank.localeCompare(b.level_rank));
				})
			});
		}
		var capsHeight = Titanium.Platform.displayCaps.platformHeight;

		var levelContainer = Ti.UI.createView({
			layout: 'vertical',
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			left: 0,
			top: 0
		});

        var allBadges = true;

		sponsorMap.forEach(function(level) {
			var sponsorList = level.sponsors;
			var levelName = level.levelName;
			var sponsorCount = sponsorList.length;
			var rowHeight, logoHeight;
			var logosPerRow = liferay.screens.sponsors.getLevelRowCount(levelName, levelSizeMap);
			var isLarge = liferay.screens.sponsors.getIsLarge(levelName, levelSizeMap);

			logoHeight = isLarge ? liferay.tools.getDp(capsHeight * .22) : liferay.tools.getDp(capsHeight * .11);
			rowHeight = Math.ceil(sponsorCount / logosPerRow) * logoHeight;

			var levelRow = Ti.UI.createView({
				left: 0,
				top: 0,
				width: Ti.UI.FILL,
				height: rowHeight,
				layout: 'horizontal'
			});

			var labelContainer = Ti.UI.createView({
				left: 0,
				top: 0,
				width: '30%',
				height: rowHeight
			});

			var label = Ti.UI.createLabel({
				top: liferay.tools.getDp(10),
				left: '10%',
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				textAlign: 'left',
				color: '#89A9C9',
				text: liferay.screens.sponsors.getLevelDisplayName(levelName),
				font:  liferay.fonts.h3
			});

			labelContainer.add(label);
			levelRow.add(labelContainer);
			levelRow.add(Ti.UI.createView({
				left: 0,
				top: 0,
				width: 2,
				height: Ti.UI.FILL,
				backgroundColor: '#EEEEEE'
			}));

			var logoContainer = Ti.UI.createView({
				top: 0,
				left: 0,
				width: '68%',
				height: rowHeight,
				layout: 'vertical'
			});

			for (var i = 0; i < sponsorList.length; i+= logosPerRow) {
				var logoCenteringContainer = Ti.UI.createView({
					top: 0,
					left: 0,
					width: Ti.UI.FILL,
					backgroundColor: 'transparent',
					height: logoHeight
				});

				var logoRowContainer = Ti.UI.createView({
					width: Ti.UI.FILL,
					height: logoHeight,
					backgroundColor: 'transparent',
					layout: 'horizontal',
					horizontalWrap: false
				});
				for (var j = 0; (j < logosPerRow) && ((i + j) < sponsorList.length); j++) {
					var sponsor = sponsorList[i+j];
					var singleLogoContainer = Ti.UI.createView({
						top: 0,
						left: 0,
						backgroundColor: 'transparent',
						width: Math.floor(100 / logosPerRow) + "%",
						height: logoHeight
					});
					var spacingContainer = Ti.UI.createView({
						top: '2dp',
						left: '2dp',
						bottom: '2dp',
						backgroundColor: 'transparent',
						right: '2dp'
					});

					var image = Titanium.UI.createImageView({
						backgroundColor: 'transparent',
						preventDefaultImage: true,
						touchEnabled       : true,
						width: Ti.UI.FILL,
//						height: '100%',
//						left: '2.5%',
//						top: '2.5%',
						link: sponsor.link
					});

					var bounds = null;
					if (liferay.controller.selectedEvent.custom_config &&
						liferay.controller.selectedEvent.custom_config.sponsors &&
						liferay.controller.selectedEvent.custom_config.sponsors.bounds) {
						bounds = liferay.controller.selectedEvent.custom_config.sponsors.bounds[sponsor.name];
						if (!bounds) {
							bounds = liferay.controller.selectedEvent.custom_config.sponsors.bounds.all;
						}
					}

					liferay.screens.sponsors.loadImage({
						imageView : image,
						setImage: true,
						url : sponsor.docmedia,
						bounds: bounds

					});

					image.addEventListener('click', function (e) {
						liferay.tools.flashControl(e.source, liferay.settings.screens.agenda.selectColor, function() {
							Titanium.Platform.openURL(e.source.link);
						});
					});

					spacingContainer.add(image);

                    var badgeDisabled = liferay.beacons.getPreference("liferay.sponsors.star." + sponsor.name + ".disabled");

                    if (!badgeDisabled && (liferay.controller.selectedEvent.metadata_types.indexOf('beacon') >= 0) &&
                        (liferay.beacons.getPreference('liferay.sponsors.star.mysteryguest'))) {
                        liferay.screens.sponsors.resetBtn.visible = true;
                        var starImg = liferay.settings.screens.sponsors.layout.badge.unachieved;
                        var opacity = 0.8;
                        if (liferay.beacons.getPreference("liferay.sponsors.star." + sponsor.name)) {
                            starImg = liferay.settings.screens.sponsors.layout.badge.achieved;
                            opacity = 1.0;
                        } else {
                            allBadges = false;
                        }

                        var achImage = Titanium.UI.createImageView({
                            backgroundColor: 'transparent',
                            preventDefaultImage: true,
                            touchEnabled       : true,
                            right: 0,
                            top: 0,
                            width: '50dp',
                            height: '50dp',
                            opacity: 0,
                            image: starImg
                        });
                        spacingContainer.add(achImage);
                        liferay.screens.sponsors.spacingContainers.push({
                            sponsor_name: sponsor.name,
                            container: spacingContainer,
                            image: achImage,
                            targetOpacity: opacity
                        });

                    }

					singleLogoContainer.add(spacingContainer);
					logoRowContainer.add(singleLogoContainer);
				}
				logoCenteringContainer.add(logoRowContainer);

				logoContainer.add(logoCenteringContainer);
			}
			levelRow.add(logoContainer);
			levelContainer.add(levelRow);
			levelContainer.add(Ti.UI.createView({
				top: 0,
				left: 0,
				width: Ti.UI.FILL,
				height: 2,
				backgroundColor: '#EEEEEE'
			}));
		});
		this.scrollView.add(levelContainer);
		this.panelBg.add(this.scrollView);

        if (liferay.screens.sponsors.spacingContainers && liferay.screens.sponsors.spacingContainers.length > 0) {
            liferay.screens.sponsors.spacingContainers.forEach(function(cont) {
                if (allBadges) {
                    cont.image.opacity = 1.0;
                    setTimeout(function () {
                        var m = Ti.UI.create2DMatrix();
                        m = m.rotate((120 + Math.random(59)) * (Math.random() > 0.5 ? -1 : 1));
                        m.scale(1.2,1.2);
                        cont.image.animate({
                            transform: m,
                            duration: 900+Math.random(200),
                            autoreverse: true,
                            repeat: 20
                        });
                    }, Math.random() * 1500);
                } else {
                    liferay.screens.sponsors.fadeIn(cont.image, cont.targetOpacity, 1000);
                }
            });
        }

    } else {
        this.scrollView = null;
		this.panelBg.add(Ti.UI.createLabel({
			textid: 'SPONSORS_NONE',
			font: liferay.fonts.h4
		}));

//		liferay.tools.alert(L('ALERT'), L('SPONSORS_NONE'));
	}
};

liferay.screens.sponsors.getSponsor = function (name) {
	if (liferay.data.currentEventData.sponsors && liferay.data.currentEventData.sponsors.length) {
		for (var i = 0, l = liferay.data.currentEventData.sponsors.length; i < l; i++) {
			var sponsor = liferay.data.currentEventData.sponsors[i];
			if (sponsor.name === name) {
				return sponsor;
			}
		}

	}

	return null;
};

liferay.screens.sponsors.fadeIn = function(view, opacity, time) {
    setTimeout(function() {
        view.animate({
            opacity: opacity,
            duration: 500
        }, function() {
            var m = Ti.UI.create2DMatrix();
            m = m.scale(2,2);
            view.animate({
                transform: m,
                autoreverse: true,
                duration: 300
            });

        })
    }, Math.random() * time);
};

liferay.screens.sponsors.refresh = function() {
    liferay.screens.sponsors.loadSponsorScroll();
};

liferay.screens.sponsors.loadAction = function(action, event_uuid, cb) {
    // action[0] == blank or form
    // action[1] == form-name (e.g. sponsorName or mystery-guest-form)
    if (!action || action.length <= 0) {
        cb();
        return;
    }

    if (action[0] && action[0].toUpperCase() == "FORM") {
        var formId = action[1];
    }
    var count = liferay.beacons.getPreference("liferay.beacons.form." + formId + ".count");
    if (!count) {
        count = 0;
    }


    var form = liferay.beacons.getFormForId(formId);

    var readOnly = false;
    if (count >= form.repeat) {
        readOnly = true;
    }

    var currentName = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.screens.sponsors.sponsorFormType, liferay.settings.server.eventSurveyId, formId], "NAME");
    var currentEmail = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.screens.sponsors.sponsorFormType, liferay.settings.server.eventSurveyId, formId], "EMAIL");
    var currentCompany = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.screens.sponsors.sponsorFormType, liferay.settings.server.eventSurveyId, formId], "COMPANY");
    var headers = [
        liferay.forms.makeHeaderField("NAME", [liferay.settings.server.eventSurveyId, liferay.screens.sponsors.sponsorFormType, formId], L('FMT_NAME').toUpperCase(), currentName, '25dp'),
        liferay.forms.makeHeaderField("EMAIL", [liferay.settings.server.eventSurveyId, liferay.screens.sponsors.sponsorFormType, formId], L('FMT_EMAIL').toUpperCase(), currentEmail, '15dp'),
        liferay.forms.makeHeaderField("COMPANY", [liferay.settings.server.eventSurveyId, liferay.screens.sponsors.sponsorFormType, formId], L('FMT_COMPANY').toUpperCase(), currentCompany, '15dp')
    ];

    liferay.forms.showForm({
        title: form.title,
        subTitle: form.subtitle,
        subSubTitle: form.sub_subtitle,
        webView: form.content_url,
        intro: form.intro,
        headerFields: headers,
        questionSpec: form.form,
        event: liferay.controller.selectedEvent,
        surveyId: formId,
        controlWindow: liferay.controller.getCurrentWindow(),
        readOnly: readOnly,
        sendButtonText: L('SURVEY_SEND'),
        dismissText: L('TRY_LATER'),
        submitDialogTitle : L('FINAL_ANSWER'),
        submitDialogText : L('IF_INCORRECT'),
        closeTest: function(result) {
            return (result.formstat == 'success');
        },
        onSuccess: function(result) {

            cb();
            if (result.formstat == 'success') {
                count++;
                liferay.beacons.setPreference("liferay.beacons.form." + formId + ".count", count);
                if (form.preferences_on_success) {
                    form.preferences_on_success.split(",").map(function(el) { return el.trim();}).forEach(function(spec) {
                        var parts = spec.split("=").map(function(el) { return el.trim();});
                        if (parts[1].toUpperCase() == "TRUE") {
                            liferay.beacons.setPreference(parts[0], true);
                        } else if (parts[1].toUpperCase() == "FALSE") {
                            liferay.beacons.setPreference(parts[0], false);
                        } else {
                            liferay.beacons.setPreference(parts[0], parts[1]);
                        }
                    });
                }
            } else if (result.formstat == 'fail' && form.preferences_on_fail) {
                form.preferences_on_fail.split(",").map(function(el) { return el.trim();}).forEach(function(spec) {
                    var parts = spec.split("=").map(function(el) { return el.trim();});
                    if (parts[1].toUpperCase() == "TRUE") {
                        liferay.beacons.setPreference(parts[0], true);
                    } else if (parts[1].toUpperCase() == "FALSE") {
                        liferay.beacons.setPreference(parts[0], false);
                    } else {
                        liferay.beacons.setPreference(parts[0], parts[1]);
                    }
                });
            }

            liferay.screens.sponsors.resetBtn.visible = true;
            if (result.message) {
                liferay.tools.blockingAlert(L('NOTE'), result.message, function() {
                    if (result.extraData && result.extraData.all_success_msg) {
                        liferay.tools.blockingAlert(L('NOTE'), result.extraData.all_success_msg, function() {
                            if (result.formstat == 'success') {
                                liferay.screens.sponsors.animateStar(form.sponsor_name);
                            }
                        });
                    } else {
                        if (result.formstat == 'success') {
                            liferay.screens.sponsors.animateStar(form.sponsor_name);
                        }
                    }
                });
            } else {
                if (result.formstat == 'success') {
                    liferay.screens.sponsors.animateStar(form.sponsor_name);
                }
            }
        },
        onFail: function(err) {
            cb();
            liferay.tools.alert(L('ALERT'), String.format(L('EVENT_SURVEY_ERROR'), err));
        },
        onClose: function() {
            cb();
        }
    });
};

liferay.screens.sponsors.animateStar = function(sponsorname) {

    var container = null;

    if (liferay.screens.sponsors.spacingContainers &&liferay.screens.sponsors.spacingContainers.length > 0) {

        for (var i = 0; i < liferay.screens.sponsors.spacingContainers.length; i++) {
            if (liferay.screens.sponsors.spacingContainers[i].sponsor_name == sponsorname) {
                container = liferay.screens.sponsors.spacingContainers[i];
            }
        }
    }

    if (!container) {
        liferay.screens.sponsors.refresh();
        return;
    }

    // sponsor_name, container, image

    var m = Ti.UI.create2DMatrix();
    m = m.rotate(144);
    m = m.scale(2.5,2.5);

    container.image.animate({
        transform: m,
        right: '45%',
        top: '45%',
        duration: 800

    }, function() {
        container.image.image = liferay.settings.screens.sponsors.layout.badge.achieved;
        var mb = Ti.UI.create2DMatrix();
        mb = mb.scale(2.8,2.8);
        container.image.animate({
            transform: mb,
            autoreverse: true,
            duration: 500
        }, function() {
            var m2 = Ti.UI.create2DMatrix();
            m2 = m2.rotate(-144);
            m2 = m2.scale(1, 1);
            container.image.animate({
                transform: m2,
                right: 0,
                top: 0,
                duration: 800
            });
        });
    });
};

liferay.screens.sponsors.resetStars = function() {
    var alertDialog = Titanium.UI.createAlertDialog({
        title : L('RESET_BADGES_TITLE'),
        message : L('RESET_BADGES'),
        buttonNames : [L('YES'), L('NO')]
    });
    alertDialog.addEventListener('click', function(e) {
        if (e.index == 0) {
            liferay.tools.createFloatingMessage({
                container: liferay.controller.getCurrentWindow(),
                text     : L('RESET_BADGES_WAIT')
            });

            Request({
                method	: 'POST',
                url      : liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.surveyServiceEndpoint,
                params   : {
                    event: liferay.controller.selectedEvent.eventid,
                    cmd: "reset",
                    name : Ti.Platform.id
                },
                onSuccess: function (response) {
                    liferay.tools.hideFloatingMessage();
                    var stat = response.stat;
                    if (stat == 'ok') {
                        liferay.beacons.clearPreferenceRegex(/liferay\.sponsors\.star\..*/);
                        liferay.beacons.clearPreferenceRegex(/liferay\.beacons\.form\..*/);
                        liferay.screens.sponsors.spacingContainers = [];
                        liferay.screens.sponsors.refresh();
                        liferay.tools.toastNotification(e.source, L('RESET_BADGES_SUCCESS'));
                    } else {
                        liferay.tools.alert(L('ALERT'), String.format(L('RESET_BADGES_FAIL'), stat));
                    }
                },
                onFailure: function (msg) {
                    liferay.tools.hideFloatingMessage();
                    liferay.tools.alert(L('ALERT'), String.format(L('RESET_BADGES_FAIL'), msg));
                }
            });
        }
    });
    alertDialog.show();

}