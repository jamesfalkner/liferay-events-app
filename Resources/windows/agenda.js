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


liferay.screens.agenda = new liferay.classes.window();
liferay.screens.agenda.className = 'liferay.screens.agenda';
liferay.screens.agenda.filtersEnabled = false;
liferay.screens.agenda.filtersCategories = [];
liferay.screens.agenda.selectedFilters = [];
liferay.screens.agenda.filterInitFlag = true;


liferay.screens.agenda.render = function() {
	var self = this;

	liferay.screens.agenda.agendaLoaded = false;
	this.daySelected = -1;

	this.processedAgenda = [];
	this.eventTypeDict = null;

	liferay.screens.agendaDetail.loadFavorites();
	this.processAgenda();

    this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        // no swipe on android so scroll inertia preserved
        swipe: liferay.model.iOS ? true : false,
        onClose: function() {
            self.stopTimer();
        },
        panelBg: this.panelBg
    });

	this.panelBg.layout = 'vertical';

	if (this.processedAgenda.length <= 0) {
		this.panelBg.add(Ti.UI.createLabel({
			top: '20%',
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			font: liferay.fonts.h3,
			textid: 'LOADING'
		}));
	} else {
		this.buildAndShowAgenda();
	}
	return this.window;
};

liferay.screens.agenda.loadAction = function(actionSpec, event_uuid, cb) {

    cb();

    if (!actionSpec[0]) {
        return;
    }
    var dateSpec = null;
    var filters = null;

    actionSpec.forEach(function(el) {
        if (el.indexOf('date:') == 0) {
            dateSpec = el.substring('date:'.length);
        } else if (liferay.screens.agenda.filtersEnabled && (el.indexOf('filter:') == 0)) {
            var filterSpec = el.substring('filter:'.length);
            filterSpec.split(',').map(function(e) { return e.trim();}).forEach(function(filterName) {
                if (liferay.screens.agenda.filterCategories.indexOf(filterName) >= 0 || filterName == 'my-agenda') {
                    if (!filters) filters = [];
                    filters.push(filterName);
                }
            });
        }
    });

    if (filters && (filters.indexOf('my-agenda') != -1)) {
        filters = ['my-agenda'];
    }

    var selectedDayIdx = -1;
    if (dateSpec) {
        // 2014-06-20
        var dateTarget = new liferay.classes.date().setFromISO8601(dateSpec + "T00:00:00").date;
        for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
            var item = liferay.screens.agenda.processedAgenda[i].items[0];
            var date = liferay.screens.agenda.getDateForAgendaItem(item, true).date;
            if ((date.getFullYear() == dateTarget.getFullYear()) && (date.getMonth() == dateTarget.getMonth()) && (date.getDate() == dateTarget.getDate())) {
                selectedDayIdx = i;
                break;
            }
        }
    }

    if (filters != null) {
        liferay.screens.agenda.selectedFilters = filters;

        if (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length) {
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
        } else if (!liferay.screens.agenda.selectedFilters || liferay.screens.agenda.selectedFilters.length <= 0) {
            // no filters were picked, so pick them all
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
            liferay.screens.agenda.selectedFilters = liferay.screens.agenda.filterCategories.slice(0);

        } else {
            liferay.screens.agenda.filterLbl.text = L('FILTERS') + ' (' + liferay.screens.agenda.selectedFilters.length + ')';
        }
    }

    if (selectedDayIdx != -1) {
        // re draw neew day with filters
        liferay.screens.agenda.selectDay(i);
    } else if (filters != null) {
        // just re-draw current already-picked day based on filters
        liferay.screens.agenda.selectDay(liferay.screens.agenda.daySelected);
    } else {
        // no filters spec'd, no date spec'd, so we're done here, nothing to redraw
    }
};

liferay.screens.agenda.buildAndShowAgenda = function() {
	var self = this;

	this.panelBg.removeAllChildren();

    this.listView = null;
    this.listViewSection = null;

	var dayLabelContainer = Titanium.UI.createView({
		layout: "vertical",
		height: "15%"
	});

	var todayLabel = Ti.UI.createLabel({
		textid: 'TODAY',
		color: '#89A9C9',
		top: '10%',
		font        : liferay.fonts.h3
	});

	this.dayLabel = Titanium.UI.createLabel({
		color: '#444444',
		top: 0
	});
	this.dayLabel.font = liferay.fonts.h3;
	this.dayLabel.text = String.format(L('DATE_FMT'),
		liferay.screens.agenda.getMonthName(new Date().getMonth() + 1, true),
		new Date().getDate()) + ", " + String.formatTime(new Date(), "short");

	dayLabelContainer.add(todayLabel);
	dayLabelContainer.add(this.dayLabel);

	this.panelBg.add(dayLabelContainer);

    var tabAndFilterContainer = Ti.UI.createView({
        height: '8%'
    });

	var tabContainer = Ti.UI.createView({
		layout: 'horizontal',
        width: '75%',
        left: 0
	});

    var filterContainer = Ti.UI.createView({
        left: '75%',
        width: '25%'
    });

    tabAndFilterContainer.add(tabContainer);
    tabAndFilterContainer.add(filterContainer);

	this.dayBtns = [];

	var tabWidth = liferay.tools.getDp(.25 * Titanium.Platform.displayCaps.platformWidth);
	for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
		item = liferay.screens.agenda.processedAgenda[i].items[0];
		var monthName = liferay.screens.agenda.getMonthNameForEvent(item, false);
		var day = parseInt(liferay.screens.agenda.getDayForEvent(item), 10);
		var dayBtn = Titanium.UI.createView(liferay.settings.screens.agenda.layout.dayBtn);
		dayBtn.width= tabWidth;
		dayBtn.height= '100%';
		dayBtn.btnIndex= i;
		dayBtn.monthName = monthName;
		dayBtn.dayName = day;

		var dayTabLbl  = Titanium.UI.createLabel({
			text: String.format(L('DATE_FMT'), monthName, day),
			font : liferay.fonts.h2,
			color: '#444444',
			backgroundColor: 'transparent',
			top: '30%',
			touchEnabled: false
		});

		dayBtn.add(dayTabLbl);
		tabContainer.add(dayBtn);
		this.dayBtns.push(dayBtn);
		dayBtn.addEventListener('click', function(e) {
			if (liferay.screens.agenda.daySelected != e.source.btnIndex) {
				self.selectDay(e.source.btnIndex);
			}
		});
	}

    if (liferay.screens.agenda.filtersEnabled) {

        var filterBtnContainer = Ti.UI.createView({
            left: '8dp',
            right: '8dp',
            top: '4dp',
            bottom: '4dp',
            backgroundColor: 'transparent'
        });

        liferay.screens.agenda.filterLbl = Titanium.UI.createLabel({
            text: L('FILTERS'),
            font: liferay.fonts.h2,
            color: '#00B6B7',
            backgroundColor: 'transparent'
        });

        if (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length) {
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
        } else {
            liferay.screens.agenda.filterLbl.text = L('FILTERS') + ' (' + liferay.screens.agenda.selectedFilters.length + ')';
        }

        filterContainer.addEventListener('click', function(e) {
            liferay.screens.agenda.openFilterSelector();
        });

        filterBtnContainer.add(liferay.screens.agenda.filterLbl);
        filterContainer.add(filterBtnContainer);

    }


    this.panelBg.add(tabAndFilterContainer);

	var tabBase = Titanium.UI.createView(liferay.settings.screens.agenda.layout.tabBase);

	this.panelBg.add(tabBase);

	this.trackColors = liferay.settings.screens.agenda.roomColors;
	if (liferay.controller.selectedEvent.track_colors) {
		this.trackColors = liferay.controller.selectedEvent.track_colors.split(',').map(function(el) {
            return el.trim();
        });
	}

	// update time
	this.updateTime();

	if (this.daySelected >= 0) {
		this.selectDay(this.daySelected);
	} else {

		// select current day
		var foundDay = false;
		for (var i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
			item = liferay.screens.agenda.processedAgenda[i].items[0];
			var date = liferay.screens.agenda.getDateForAgendaItem(item, true).date;
			var now = new Date();
			if ((date.getFullYear() == now.getFullYear()) && (date.getMonth() == now.getMonth()) && (date.getDate() == now.getDate())) {
				this.selectDay(i);
				foundDay = true;
			}
		}
		if (!foundDay) {
			this.selectDay(0);
		}
	}
};

liferay.screens.agenda.updateTime = function() {
	//Ti.API.info(this.className + ".updateTime()");
	var self = this;

	this.dayLabel.text = String.format(L('DATE_FMT'),
		liferay.screens.agenda.getMonthName(new Date().getMonth() + 1, true),
		new Date().getDate()) + ", " + String.formatTime(new Date(), "short");

	this.timer = setTimeout(function() {
		self.updateTime();
	}, 15000);
};


liferay.screens.agenda.stopTimer = function() {
	//Ti.API.info(this.className + ".stopTimer()");
	if (this.timer) {
		clearTimeout(this.timer);
		this.timer = null;
	}
};

liferay.screens.agenda.refresh = function(options) {
	this.processAgenda();
    liferay.screens.agenda.selectDay(liferay.screens.agenda.daySelected);
//	this.buildAndShowAgenda();
};

liferay.screens.agenda.selectDay = function(day) {
    if (day < 0) day = 0;
	for (var i = 0; i < liferay.screens.agenda.dayBtns.length; i++) {
		var btn = liferay.screens.agenda.dayBtns[i];
		if (i == day) {
			btn.backgroundImage = liferay.settings.screens.agenda.layout.dayBtn.backgroundImageAlt;
			btn.getChildren()[0].color = 'white';
		} else {
			btn.backgroundImage = liferay.settings.screens.agenda.layout.dayBtn.backgroundImage;
			btn.getChildren()[0].color = '#444444';
		}
	}

	this.loadSchedule(day);
	this.daySelected = day;
};

liferay.screens.agenda.openFilterSelector = function() {

    var filterRowClassName = 'filter-row';
    var shader = Ti.UI.createView({
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity:0.70
    });

    var rounder = Ti.UI.createView({
        left: '15%',
        top: '15%',
        width: '70%',
        height: Ti.UI.SIZE,
        layout: 'vertical',
        backgroundColor: 'white',
        borderRadius: '10dp',
        borderWidth: '5dp',
        borderColor: 'white'
    });

    var capsHeight = Titanium.Platform.displayCaps.platformHeight;
    var phys = capsHeight / Titanium.Platform.displayCaps.dpi;

    if (phys < 3.2) {
        rounder.top = '3%';
    }

    var tableView = Ti.UI.createTableView({
        left: '10dp',
        right: '10dp',
        top: '10dp',
        rowHeight: '40dp',
        minRowHeight: '40dp',
        height: Ti.UI.SIZE
    });

    if (liferay.model.iPad) {
        tableView.rowHeight = '70dp';
    }

    if (phys < 3.2) {
        tableView.height = "90%";
    }

    // add rows
    var i = 0;
    var rows = [];
    var allIndex = 0;
    var myAgendaIndex = allIndex + 1;

    var allSelected = (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length);

    var allRow = Ti.UI.createTableViewRow({
        hasCheck: allSelected,
        title: L('ALL'),
        font: liferay.fonts.h4b,
        color: 'black',
        catvalue: 'all',
        className: filterRowClassName
    });

    if (liferay.model.android && allSelected) {
        allRow.backgroundColor = '#00B6B7';
        allRow.color = 'white';
    }

    rows.push(allRow);

    var mySelected = liferay.screens.agenda.selectedFilters.indexOf('my-agenda') != -1;

    var myAgendaRow = Ti.UI.createTableViewRow({
        hasCheck: mySelected,
        title: L('MY_AGENDA'),
        font: liferay.fonts.h4b,
        color: 'black',
        catvalue: 'my-agenda',
        className: filterRowClassName
    });

    if (liferay.model.android && mySelected) {
        myAgendaRow.backgroundColor = '#00B6B7';
        myAgendaRow.color = 'white';

    }
    rows.push(myAgendaRow);

    liferay.screens.agenda.filterCategories.forEach(function(option) {
        var isSelected = (allSelected || mySelected) ? false : liferay.screens.agenda.selectedFilters.indexOf(option) != -1;

        var row = Ti.UI.createTableViewRow({
            hasCheck: isSelected,
            title: liferay.screens.agenda.getCategoryDisplayName(option),
            font: liferay.fonts.h3,
            color: 'black',
            catvalue: option,
            className: filterRowClassName
        });

        if (liferay.model.android && isSelected) {
            row.backgroundColor = '#00B6B7';
            row.color = 'white';
        }
        rows.push(row);
    });
    tableView.setData(rows);

    tableView.addEventListener('click', function(e) {

        var oldrow;
        var row;
        if (e.index == allIndex) {
            if (!e.rowData.hasCheck) {
                row = Ti.UI.createTableViewRow({
                    hasCheck: true,
                    title: e.rowData.title,
                    font: liferay.fonts.h4b,
                    color: 'black',
                    catvalue: e.rowData.catvalue,
                    className: filterRowClassName
                });
                if (liferay.model.android) {
                    row.backgroundColor = '#00B6B7';
                    row.color = 'white';
                }
                tableView.updateRow(e.index, row, {animated: true});

                // and remove the checks from the others
                for (i = 0; i < tableView.data[0].rows.length; i++) {
                    oldrow = tableView.data[0].rows[i];

                    if (i == allIndex) {
                        continue;
                    }

                    row = Ti.UI.createTableViewRow({
                        hasCheck: false,
                        title: oldrow.title,
                        font: ((i == myAgendaIndex) || (i == allIndex)) ? liferay.fonts.h4b : liferay.fonts.h3,
                        color: 'black',
                        catvalue: oldrow.catvalue,
                        className: filterRowClassName
                    });

                    if (liferay.model.android) {
                        row.backgroundColor = 'transparent';
                        row.color = 'black';
                    }
                    tableView.updateRow(i, row, {animated: true});
                }

                // and select everything
                liferay.screens.agenda.selectedFilters = liferay.screens.agenda.filterCategories.slice(0);
            }
        } else if (e.index == myAgendaIndex) {
            if (!e.rowData.hasCheck) {
                row = Ti.UI.createTableViewRow({
                    hasCheck: true,
                    title: e.rowData.title,
                    font: ((e.index == myAgendaIndex) || (e.index == allIndex)) ? liferay.fonts.h4b : liferay.fonts.h3,
                    color: 'black',
                    catvalue: e.rowData.catvalue,
                    className: filterRowClassName
                });
                if (liferay.model.android) {
                    row.backgroundColor = '#00B6B7';
                    row.color = 'white';
                }
                tableView.updateRow(e.index, row, {animated: true});

                // and remove the checks from the others
                for (i = 0; i < tableView.data[0].rows.length; i++) {
                    oldrow = tableView.data[0].rows[i];

                    if (i == myAgendaIndex) {
                        continue;
                    }

                    row = Ti.UI.createTableViewRow({
                        hasCheck: false,
                        title: oldrow.title,
                        font: ((i == myAgendaIndex) || (i == allIndex)) ? liferay.fonts.h4b : liferay.fonts.h3,
                        color: 'black',
                        catvalue: oldrow.catvalue,
                        className: filterRowClassName
                    });
                    if (liferay.model.android) {
                        row.backgroundColor = 'transparent';
                        row.color = 'black';
                    }
                    tableView.updateRow(i, row, {animated: true});
                }

                // and select my-agenda
                liferay.screens.agenda.selectedFilters = ['my-agenda'];
            }

        } else {

            // if all was picked or my agenda was picked, unpick it
            var allRow = tableView.data[0].rows[allIndex];
            if (allRow.hasCheck) {
                row = Ti.UI.createTableViewRow({
                    hasCheck: false,
                    title: allRow.title,
                    font: liferay.fonts.h4b,
                    color: 'black',
                    catvalue: allRow.catvalue,
                    className: filterRowClassName
                });
                if (liferay.model.android) {
                    row.backgroundColor = 'transparent';
                    row.color = 'black';
                }
                tableView.updateRow(allIndex, row, {animated: true});
                liferay.screens.agenda.selectedFilters = [];

            }

            var myAgendaRow = tableView.data[0].rows[myAgendaIndex];
            if (myAgendaRow.hasCheck) {
                row = Ti.UI.createTableViewRow({
                    hasCheck: false,
                    title: myAgendaRow.title,
                    font: liferay.fonts.h4b,
                    color: 'black',
                    catvalue: myAgendaRow.catvalue,
                    className: filterRowClassName
                });
                if (liferay.model.android) {
                    row.backgroundColor = 'transparent';
                    row.color = 'black';
                }
                tableView.updateRow(myAgendaIndex, row, {animated: true});
                liferay.screens.agenda.selectedFilters = [];

            }

            // toggle state of selected filter category
            var state = e.rowData.hasCheck;

            row = Ti.UI.createTableViewRow({
                hasCheck: !e.rowData.hasCheck,
                title: e.rowData.title,
                font: ((e.index == myAgendaIndex) || (e.index == allIndex)) ? liferay.fonts.h4b : liferay.fonts.h3,
                color: 'black',
                catvalue: e.rowData.catvalue,
                className: filterRowClassName
            });
            if (liferay.model.android) {
                if (!e.rowData.hasCheck) {
                    row.backgroundColor = '#00B6B7';
                    row.color = 'white';
                    // select
                } else {
                    // unselect
                    row.backgroundColor = 'transparent';
                    row.color = 'black';
                }
            }

            tableView.updateRow(e.index, row, {animated: true});

            if (!state) {
                liferay.screens.agenda.selectedFilters.push(e.rowData.catvalue);
            } else {
                liferay.screens.agenda.selectedFilters.splice(liferay.screens.agenda.selectedFilters.indexOf(e.rowData.catvalue), 1);
            }
        }
    });

    var closebtn = Ti.UI.createButton({
        title: '  ' + L('APPLY') + '  ',
        font: liferay.fonts.h4,
        backgroundColor: '#00B6B7',
        color: 'white',
        top: '20dp'
    });

    if (phys < 3.2) {
        closebtn.top = '3dp';
    }

    if (liferay.model.iOS) {
        closebtn.style = Titanium.UI.iPhone.SystemButtonStyle.PLAIN;
    }
    closebtn.addEventListener('click', function(e) {
        liferay.screens.agenda.window.remove(shader);
        liferay.screens.agenda.window.remove(rounder);

        if (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length) {
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
        } else if (!liferay.screens.agenda.selectedFilters.length || liferay.screens.agenda.selectedFilters.length <= 0) {
            // no filters were picked, so pick them all
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
            liferay.screens.agenda.selectedFilters = liferay.screens.agenda.filterCategories.slice(0);

        } else {
            liferay.screens.agenda.filterLbl.text = L('FILTERS') + ' (' + liferay.screens.agenda.selectedFilters.length + ')';
        }

        liferay.screens.agenda.selectDay(liferay.screens.agenda.daySelected);

       // liferay.screens.agenda.buildAndShowAgenda();

    });

    rounder.add(tableView);
    rounder.add(closebtn);
    rounder.add(Ti.UI.createView({
        height: '30dp',
        backgroundColor: 'transparent'
    }));

    liferay.screens.agenda.window.add(shader);
    liferay.screens.agenda.window.add(rounder);
};


liferay.screens.agenda.roomColorFor = function(event) {
//Ti.API.info("event: " + event.title + " highlight: " + event.highlight);

//    if (!liferay.screens.agenda.isTrackEvent(event)) {
//        return liferay.settings.screens.agenda.defaultColor;
//    }
    var track = parseInt(liferay.screens.agendaDetail.getRoomNumber(event));

    if (!isNaN(track) && track >= 0 && track <= liferay.screens.agenda.trackColors.length) {
        return liferay.screens.agenda.trackColors[track - 1];
    }

	return liferay.settings.screens.agenda.defaultColor;

};

//             sponsorIcon = event.company_logo;

liferay.screens.agenda.sponsorIconFor = function(event) {

    if (event.company_logo) {
        return event.company_logo;
    }

    if (event.sponsors_uuid) {
        // find the image from the list of sponsors
        for (var i = 0; i < liferay.data.currentEventData.sponsors.length; i++) {
            var sponsor = liferay.data.currentEventData.sponsors[i];
            if (sponsor.uuid == event.sponsors_uuid) {
                return sponsor.docmedia;
            }
        }
    }

    return null;
};

/** @namespace event.session_type */

liferay.screens.agenda.agendaIconFor = function(event) {
	if ((!event.session_type) || (event.session_type == 'blank')) return null;

    var typeName = event.session_type;

	if (liferay.screens.agenda.eventTypeDict) {
		// see if we can find a translation
		liferay.screens.agenda.eventTypeDict.forEach(function(el) {
			if (el.key == event.session_type) {
				typeName = el.val;
			}
		})
	}

	for (var i = 0; i < liferay.settings.screens.agenda.typeIcons.length; i++) {
		var iconObj = liferay.settings.screens.agenda.typeIcons[i];
		if (typeName == iconObj.name) {
			return iconObj;
		}
	}
	return null;
};

liferay.screens.agenda.checkFilter = function(event, allFavorites) {

    if (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length) {
        // all filters selected
        return true;
    }

    if (liferay.screens.agenda.selectedFilters.indexOf('my-agenda') != -1) {
        // my agenda selected
        return (allFavorites.indexOf(event.uuid) != -1);
    }

    if (!event.select_category ||
        event.select_category.indexOf('_') != -1 ||
        event.select_category.indexOf('blank') != -1) {
        return false;
    }

    for (var i = 0; i < event.select_category.length; i++) {
        if (liferay.screens.agenda.selectedFilters.indexOf(event.select_category[i]) != -1) {
            return true;
        }
    }
    return false;
};


liferay.screens.agenda.loadSchedule = function(day) {
	var self = this;

	if (this.listViewSection) {
		this.listViewSection.setItems([], { animation: true });
	}

    if (this.filterMsgContainer) {
        this.window.remove(this.filterMsgContainer);
        this.filterMsgContainer = null;
    }

	if (liferay.screens.agenda.processedAgenda.length <= 0) {
		return;
	}

	if (!liferay.screens.agenda.processedAgenda[day].items) {
		return;
	}
	this.currentSchedule = liferay.screens.agenda.processedAgenda[day].items.slice(0);
	var allFavorites = liferay.screens.agendaDetail.getAllFavorites(liferay.controller.selectedEvent);

    // remove filtered out sessions in reverse order
    if (liferay.screens.agenda.filtersEnabled) {

        if (liferay.screens.agenda.selectedFilters.length == liferay.screens.agenda.filterCategories.length) {
            liferay.screens.agenda.filterLbl.text = L('FILTERS');
        } else {
            liferay.screens.agenda.filterLbl.text = L('FILTERS') + ' (' + liferay.screens.agenda.selectedFilters.length + ')';
        }

        for (i = this.currentSchedule.length - 1;  i >= 0; i--) {
            if (!liferay.screens.agenda.checkFilter(this.currentSchedule[i], allFavorites)) {
                this.currentSchedule.splice(i, 1);
            }
        }
    }

    if (this.currentSchedule.length <= 0) {

        this.filterMsgContainer = Ti.UI.createView({
            top: '40%',
            width: '90%',
            layout: 'vertical',
            opacity: 0
        });

        this.filterMsgContainer.add(Ti.UI.createLabel({ // NO_FILTER_MATCH
            textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
            font: liferay.fonts.h4,
            color: '#555555',
            textid: (liferay.screens.agenda.selectedFilters.indexOf('my-agenda') != -1) ? 'NO_FILTER_MATCH_MY_AGENDA' : 'NO_FILTER_MATCH'
        }));

        var showAllBtn = Ti.UI.createButton({
            title:'  ' + L('FILTERS_SHOW_ALL') + '  ',
            font: liferay.fonts.h4,
            color: 'white',
            backgroundColor: '#00B6B7',
            top: '30dp'
        });

        this.filterMsgContainer.add(showAllBtn);

        setTimeout(function() {
            liferay.screens.agenda.window.add(liferay.screens.agenda.filterMsgContainer);
            liferay.screens.agenda.filterMsgContainer.animate({
                opacity: 1,
                duration: 300
            });
        }, 400);

        showAllBtn.addEventListener('click', function(e) {
            liferay.screens.agenda.selectedFilters = liferay.screens.agenda.filterCategories.slice(0);
            liferay.screens.agenda.refresh();
        });

        return;
    }

    var sponsorImgSize = liferay.tools.getDp(Ti.Platform.displayCaps.platformHeight *.06);
    var data = [];

    for (var i = 0, l = this.currentSchedule.length; i < l; i++) {

        var event = this.currentSchedule[i];

        var thickBottomBorder = false;
        var extendedBorder = true;

        // need thick bottom border if:
        //  we are transitioning from non-track (current) to track event (next)
        //   OR
        // we are transtioning from a track event (currrent) to non-track event (next)
        //  OR
        // we are transitioning to a new track time block and we have multiple sessions in the current block
        if ((!event.isTrackEvent &&
            ((this.currentSchedule[i + 1]) && this.currentSchedule[i + 1].isTrackEvent)) ||
            (event.isTrackEvent &&
                ((this.currentSchedule[i + 1]) && !this.currentSchedule[i + 1].isTrackEvent)) ||
            (this.isLastTrackEvent(this.currentSchedule, event, i) && !this.isFirstTrackEvent(this.currentSchedule, event, i))) {
            thickBottomBorder = true;
        }

        // does not need extended border IF:
        //   we are the first track event (and not the last) OR
        //   we are a track event, but not the last
        if (((this.isFirstTrackEvent(this.currentSchedule, event, i)) && !this.isLastTrackEvent(this.currentSchedule, event, i)) ||
            (event.isTrackEvent && !this.isLastTrackEvent(this.currentSchedule, event, i))) {
            extendedBorder = false;
        }

        var eventTitle = liferay.tools.stripTags(event.title);
        var iOSLabelHeight, iOSRowHeight;
        var sponsorIcon = this.sponsorIconFor(event); // may be null

        // calc dynamic row for iOS
        if (liferay.model.iOS) {

            var w = Ti.Platform.displayCaps.platformWidth * .6;

            var tmpLabel = Ti.UI.createLabel({
                font: liferay.fonts.h2,
                color: '#444444',
                width: w,
                height: Ti.UI.FILL,
                ellipsize: false,
                wordWrap: true,
                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
                verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
                text: eventTitle
            });

            var tmpView = Ti.UI.createView({
                width: w,
                height: 'auto'
            });
            tmpView.add(tmpLabel);
            iOSLabelHeight = tmpView.toImage().height  * 1.1 + (thickBottomBorder ? 6 : 4);
            iOSRowHeight = Math.max((iOSLabelHeight + (sponsorIcon ? sponsorImgSize : 0)) * 1.1, liferay.model.iPad ? 60 : 40);
        }

        var agendaIcon = this.agendaIconFor(event); // may be null
        var startDate = liferay.screens.agenda.getDateForAgendaItem(event, true);
        var isHighlight = liferay.screens.agenda.isHighlight(event);
        var isFavorite = allFavorites.indexOf(event.uuid) >= 0;

        var backgroundColor = 'transparent';

        if (isHighlight && isFavorite) {
            backgroundColor = liferay.settings.screens.agenda.favoriteHighlightColor;
        } else if (isHighlight) {
            backgroundColor = liferay.settings.screens.agenda.highlightColor;
        } else if (isFavorite) {
            backgroundColor = liferay.settings.screens.agenda.favoriteColor;
        }

        var flashColor = isFavorite ? liferay.settings.screens.agenda.selectFavoriteColor :
            liferay.settings.screens.agenda.selectColor;

        if (sponsorIcon && sponsorIcon.substring(0, 1) == '/')
            sponsorIcon = liferay.settings.server.dataHost.host + sponsorIcon;

        data.push({
            sessionBackgroundView: {
                backgroundColor: backgroundColor
            },
            separatorView: {
               left: extendedBorder ? 0 : '20%',
                height: thickBottomBorder ? '4dp' : '2dp',
                zIndex: 1
            },
            timeLabel: {
                text: (!this.isTrackEvent(event) || this.isFirstTrackEvent(this.currentSchedule, event, i)) ?
                    String.formatTime(startDate.date, "short") :
                    ''
            },
            trackBar: {
                backgroundColor: liferay.screens.agenda.roomColorFor(event),
                width: liferay.model.android ? '8dp' : '2%'
            },
            typeImage: {
                image: (agendaIcon) ? (agendaIcon.background) : ""
            },
            sponsorLogo: {
                top: sponsorIcon ? '8dp' : 0,
                image: sponsorIcon ? sponsorIcon : '',
                width: sponsorIcon ?  Ti.UI.SIZE : 0,
                height: sponsorIcon ? sponsorImgSize : 0
            },
            titleLabelPadTop: {
                height: liferay.model.android ? '10dp' : 0
            },
            titleLabel: {
                text: eventTitle,
                height: liferay.model.iOS ? iOSLabelHeight : Ti.UI.SIZE
            },
            titleLabelPadBottom: {
                height: liferay.model.android ? '10dp' : 0
            },
            properties: {
                height: liferay.model.iOS ? iOSRowHeight : Ti.UI.SIZE,
                itemId: event.uuid,
                selectedBackgroundColor:  flashColor
            }
        });
    }

    if (!this.listViewSection) {
        this.listViewSection = Ti.UI.createListSection();
    }

    this.listViewSection.setItems(data);

    if (!this.listView) {
        this.listView = Ti.UI.createListView({
            templates: liferay.list_templates.agenda,
            defaultItemTemplate: 'base',
            separatorStyle: liferay.model.iOS ? Titanium.UI.iPhone.ListViewSeparatorStyle.NONE: ''
        });
        this.listView.setSections([this.listViewSection]);
        this.listView.addEventListener('itemclick', function(e) {
                liferay.controller.open(liferay.screens.agendaDetail.render(), liferay.screens.agendaDetail);
                liferay.screens.agendaDetail.loadDetails(liferay.screens.agenda.currentSchedule[e.itemIndex]);
        });
        this.panelBg.add(this.listView);
    }

	liferay.screens.agenda.agendaLoaded = true;

};

liferay.screens.agenda.isHighlight = function(event) {

    var speakers = liferay.screens.agendaDetail.getSpeakers(event);
    if (!speakers || speakers.length <= 0) return false;

    for (var i = 0; i < speakers.length; i++) {
        if (speakers[i].speaker_keynote) {
            return true;
        }
    }
    return false;
};

liferay.screens.agenda.isTrackEvent = function(event) {
	return event.isTrackEvent;

};

liferay.screens.agenda.isFirstTrackEvent = function(events, event, eventOffset) {

	// if this isn't a track event, then it cant be the first
	if (!event.isTrackEvent) return false;

	// if there's no previous event, or the previous event isn't a track event, then we are the first
	if (!events[eventOffset - 1] || !events[eventOffset - 1].isTrackEvent) {
		return true;
	}

	// if the previous event is a track event, but the start times are different, then we are the first in this group
	if ((events[eventOffset-1] && events[eventOffset-1].isTrackEvent) &&
		(!liferay.screens.agenda.sameTime(events[eventOffset-1], event))) {
	   	return true;
	}

	return false;


};

liferay.screens.agenda.getCategoryDisplayName = function(name) {

    if (liferay.screens.agenda.eventTypeDict) {
        // see if we can find a translation
        for (var i = 0 ; i < liferay.screens.agenda.eventTypeDict.length; i++) {
            if (liferay.screens.agenda.eventTypeDict[i].key == name) {
                return liferay.screens.agenda.eventTypeDict[i].val;
            }
        }
    }

    return name;

};

liferay.screens.agenda.isLastTrackEvent = function(events, event, eventOffset) {

	// if this isn't a track event, then it cant be the last
	if (!event.isTrackEvent) return false;

	// if there's no next event, or the next event isn't a track event, then we are the last
	if (!events[eventOffset + 1] || !events[eventOffset + 1].isTrackEvent) {
		return true;
	}

	// if the next event is a track event, but the times are different, then we are the last in this group
	if (events[eventOffset+1] && events[eventOffset+1].isTrackEvent &&
		(!liferay.screens.agenda.sameTime(events[eventOffset+1], event))) {
//	   (events[eventOffset+1].time != event.time)) {
	   	return true;
	}
	return false;
};

liferay.screens.agenda.sameTime = function(event1, event2) {
	var dateA = liferay.screens.agenda.getDateForAgendaItem(event1, true);
	var dateB = liferay.screens.agenda.getDateForAgendaItem(event2, true);
	var res = dateB.date.getTime() - dateA.date.getTime();
	return (res == 0);
};

liferay.screens.agenda.getAgendaItem = function(uuid) {

    for (var i = 0 ; i < liferay.data.currentEventData.agenda.length; i++) {
        if (liferay.data.currentEventData.agenda[i].uuid == uuid) {
            return liferay.data.currentEventData.agenda[i];
        }
    }

    return null;
};

liferay.screens.agenda.findAgendaBucket = function(dateStr, agenda) {
	for (var i = 0; i < agenda.length; i++) {
		if (agenda[i].date == dateStr) {
			return i;
		}
	}
	return -1;
};


// processedAgenda = [ { date: date, items: [...] }, ...]
liferay.screens.agenda.processAgenda = function() {

	liferay.screens.agenda.processedAgenda = [];
	liferay.screens.agenda.eventTypeDict = null;
    liferay.screens.agenda.filtersEnabled = false;
    liferay.screens.agenda.filterCategories = [];

	for (var i = 0 ; i < liferay.data.currentEventData.agenda.length; i++) {
		var rawItem = liferay.data.currentEventData.agenda[i];

		if (!rawItem.title || !rawItem.display_in_mobile_app) continue;

        if (rawItem.select_category) {
            rawItem.select_category.forEach(function(el) {
                var cat = el.trim();
                if (cat.toLowerCase() != "blank" && cat.toLowerCase() != "_") {
                    liferay.screens.agenda.filtersEnabled = true;
                    if (liferay.screens.agenda.filterCategories.indexOf(cat) == -1) {
                        liferay.screens.agenda.filterCategories.push(cat);
                    }
                }
            });
        }

		var bucket = liferay.screens.agenda.findAgendaBucket(rawItem.date, liferay.screens.agenda.processedAgenda);
		if (bucket != -1) {
			liferay.screens.agenda.processedAgenda[bucket].items.push(rawItem);
		} else {
			liferay.screens.agenda.processedAgenda.push({
				date: rawItem.date,
				items: [rawItem]
			});
		}

	}

    // sort filter names
    if (liferay.screens.agenda.filtersEnabled) {
        liferay.screens.agenda.filterCategories.sort(function(a, b) {
            return b.localeCompare(a);
        });
    }

    if (liferay.screens.agenda.filterInitFlag) {
        liferay.screens.agenda.filterInitFlag = false;
        liferay.screens.agenda.selectedFilters = liferay.screens.agenda.filterCategories.slice(0);
    }

	// sort buckets first
	liferay.screens.agenda.processedAgenda.sort(function (a, b) {
		return a.date.localeCompare(b.date);
	});

	// now sort each bucket and mark track events
	for (i = 0; i < liferay.screens.agenda.processedAgenda.length; i++) {
		liferay.screens.agenda.processedAgenda[i].items.sort(function(b,a) {
            var dateA = new liferay.classes.date().setFromISO8601(a.date + "T" + a.start_time_hour + ":" + a.start_time_minutes + ":00");
            var dateB = new liferay.classes.date().setFromISO8601(b.date + "T" + b.start_time_hour + ":" + b.start_time_minutes + ":00");
			var res = dateB.date.getTime() - dateA.date.getTime();
			if (res > 0) {
				return 1;
			} else if (res < 0) {
				return -1;
			} else {
				// compare tags to put those tagged 'room1' before 'room2' etc
                var bId = liferay.screens.agendaDetail.getRoomNumber(b);
                var aId = liferay.screens.agendaDetail.getRoomNumber(a);
                if (bId && aId) {
                    return (parseInt(bId) - parseInt(aId));
                } else {
                    return 0;
                }
			}
		});

        // look for track events
        liferay.screens.agenda.processedAgenda[i].items.forEach(function(el, idx, arr) {

            var iAmTrack = false;
            var myTime, herPrevTime, herNextTime;

            if (arr.length <= 1) {
                el.isTrackEvent = false;
                return;
            }

            if (idx == 0) {
                // if next event is at my time, I am a track event
                /** @namespace el.start_time_minutes */
                /** @namespace el.start_time_hour */
                myTime = el.date + el.start_time_hour + el.start_time_minutes;
                herNextTime = arr[idx+1].date + arr[idx+1].start_time_hour + arr[idx+1].start_time_minutes;
                iAmTrack = myTime === herNextTime;
            } else if (idx < (arr.length - 1)) {
                // if previous event or next event is at my time, I am track event
                myTime = el.date + el.start_time_hour + el.start_time_minutes;
                herPrevTime = arr[idx-1].date + arr[idx-1].start_time_hour + arr[idx-1].start_time_minutes;
                herNextTime = arr[idx+1].date + arr[idx+1].start_time_hour + arr[idx+1].start_time_minutes;
                iAmTrack = ((myTime === herPrevTime) || (myTime === herNextTime));
            } else {
                // if previous event is at my time i am track event
                myTime = el.date + el.start_time_hour + el.start_time_minutes;
                herPrevTime = arr[idx-1].date + arr[idx-1].start_time_hour + arr[idx-1].start_time_minutes;
                iAmTrack = myTime === herPrevTime;
            }

            el.isTrackEvent = iAmTrack;
        });

	}


	// now parse event type dictionary, if any
	if (liferay.controller.selectedEvent.event_type_dict) {
		liferay.screens.agenda.eventTypeDict = [];
		var allTrans = liferay.controller.selectedEvent.event_type_dict.split(',');
		allTrans.forEach(function(el) {
			var parts = el.split('=');
			if (parts.length != 2) return;
			liferay.screens.agenda.eventTypeDict.push({
				key: parts[0],
				val: parts[1]
			});
		});
	}


};

liferay.screens.agenda.getDateForAgendaItem = function(item, start) {
    if (start) {
        return (new liferay.classes.date().setFromISO8601(item.date + "T" + (item.start_time_hour?item.start_time_hour:"00") + ":" + (item.start_time_minutes?item.start_time_minutes:"00") + ":00"));
    } else {
        return (new liferay.classes.date().setFromISO8601(item.date + "T" + (item.end_time_hour?item.end_time_hour:"00") + ":" + (item.end_time_minutes?item.end_time_minutes:"00") + ":00"));

    }

};
liferay.screens.agenda.getMonthNameForEvent = function(event, lng) {
	var startStr = event.date;
	var month = startStr.substr(5, 2);
	return liferay.screens.agenda.getMonthName(month, lng);
};

liferay.screens.agenda.getMonthName = function(month, lng) {
	if (month == 1) return L(lng?'JAN_L':'JAN');
	if (month == 2) return L(lng?'FEB_L':'FEB');
	if (month == 3) return L(lng?'MAR_L':'MAR');
	if (month == 4) return L(lng?'APR_L':'APR');
	if (month == 5) return L(lng?'MAY_L':'MAY');
	if (month == 6) return L(lng?'JUN_L':'JUN');
	if (month == 7) return L(lng?'JUL_L':'JUL');
	if (month == 8) return L(lng?'AUG_L':'AUG');
	if (month == 9) return L(lng?'SEP_L':'SEP');
	if (month == 10) return L(lng?'OCT_L':'OCT');
	if (month == 11) return L(lng?'NOV_L':'NOV');
	if (month == 12) return L(lng?'DEC_L':'DEC');
	return ('???');
};

liferay.screens.agenda.getDayForEvent = function(event) {
	var startStr = event.date;
    // 2014-01-02
	return startStr.substr(8, 2);
};

