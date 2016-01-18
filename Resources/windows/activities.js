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


liferay.screens.activities = new liferay.classes.window();
liferay.screens.activities.className = 'liferay.screens.activities';


liferay.screens.activities.render = function() {

	var self = this;

    this.listView = null;
    this.listViewSection = null;

    this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.loadActivities();

    this.window = liferay.ui.makeWindow({
		swipe: true,
        backEnabled: true,
        panelBg: this.panelBg
	});

	return this.window;
};

liferay.screens.activities.refresh = function(options) {
	this.loadActivities();
};

liferay.screens.activities.loadActivities = function() {

	var self = this;

	var data = [];

    if (this.listViewSection) {
        this.listViewSection.setItems([], { animation: true });
    }

    if (!liferay.data.currentEventData.activities || !liferay.data.currentEventData.activities.length) {
		return;
	}

    var capsHeight = Titanium.Platform.displayCaps.platformHeight;
    var rowHeight = liferay.tools.getDp(capsHeight * .115);

	liferay.data.currentEventData.activities.sortBy('title');

    liferay.data.currentEventData.activities.forEach(function(activity) {

        data.push({
            image: {
                image: liferay.screens.activities.getImage(activity)
            },
            title: {
                text: activity.short_title ? activity.short_title : activity.title
            },
            properties: {
                itemId: activity.uuid,
                height: rowHeight
            }
        });

	});

    if (!this.listViewSection) {
        this.listViewSection = Ti.UI.createListSection({
            headerTitle: L('ACTIVITIES')
        });
    }

    this.listViewSection.setItems(data);

    if (!this.listView) {
        this.listView = Ti.UI.createListView({
            templates: liferay.list_templates.list,
            defaultItemTemplate: 'base'
        });
        this.listView.setSections([this.listViewSection]);
        this.listView.addEventListener('itemclick', function(e) {
            liferay.controller.open(liferay.screens.activitiesDetail.render(), liferay.screens.activitiesDetail);
            liferay.screens.activitiesDetail.loadDetails(liferay.data.currentEventData.activities[e.itemIndex]);
        });
        this.panelBg.add(this.listView);
    }
};

liferay.screens.activities.getImage = function(activity) {

    var lcl = liferay.screens.activities.getLocalImage({
        url: activity.picture
    });

    if (lcl) {
        return lcl;
    } else {
        var tmpView = Ti.UI.createImageView();

        liferay.screens.activities.loadImage({
            url: activity.picture,
            imageView: tmpView,
            setImage: true,
            onLoad: function (imgView) {
                liferay.screens.activities.setListImage(activity, imgView.image);
            }
        });
        return liferay.settings.screens.contacts.defaultPicture;
    }
};

liferay.screens.activities.setListImage = function(activity, img) {
    if (!liferay.screens.activities.listViewSection) {
        return;
    }
    var items = liferay.screens.activities.listViewSection.getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].properties && items[i].properties.itemId == activity.uuid) {
                items[i].image.image = img;
                liferay.screens.activities.listViewSection.updateItemAt(i, items[i], {animated: true});
                break;
        }
    }

};
