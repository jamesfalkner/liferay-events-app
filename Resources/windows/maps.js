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


liferay.screens.maps = new liferay.classes.window();
liferay.screens.maps.className = 'liferay.screens.maps';


liferay.screens.maps.render = function() {
	//Ti.API.info(this.className + ".render()");
	var self = this;

    this.listView = null;

	this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.window = liferay.ui.makeWindow({
        swipe: true,
        backEnabled: true,
        panelBg: this.panelBg
    });

	this.loadMaps();

	return this.window;
};

liferay.screens.maps.getImage = function(map) {

    var lcl = liferay.screens.maps.getLocalImage({
        url: map.icon
    });

    if (lcl) {
        return lcl;
    } else {
        var tmpView = Ti.UI.createImageView();

        liferay.screens.maps.loadImage({
            url: map.icon,
            imageView: tmpView,
            setImage: true,
            onLoad: function (imgView) {
                liferay.screens.maps.setListImage(map, imgView.image);
            }
        });
        return liferay.settings.screens.contacts.defaultPicture;
    }
};

liferay.screens.maps.setListImage = function(map, img) {
    if (!liferay.screens.maps.listViewSection) {
        return;
    }
    var items = liferay.screens.maps.listViewSection.getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].properties && items[i].properties.itemId == map.uuid) {
            items[i].image.image = img;
            liferay.screens.maps.listViewSection.updateItemAt(i, items[i], {animated: true});
            break;
        }
    }

};

liferay.screens.maps.refresh = function(options) {
    liferay.screens.maps.loadMaps();
};

liferay.screens.maps.loadMaps = function() {
	//Ti.API.info(this.className + ".loadMaps()");
	var self = this;

	var data = [];

    if (this.listViewSection) {
        this.listViewSection.setItems([], { animation: true });
    }

    if (!liferay.data.currentEventData.maps || !liferay.data.currentEventData.maps.length) {
		return;
	}

	var capsHeight = Titanium.Platform.displayCaps.platformHeight;
	var rowHeight = liferay.tools.getDp(capsHeight * .115);

    liferay.data.currentEventData.maps.sortBy('show_map', 'name');

    liferay.data.currentEventData.maps.forEach(function(map) {

        data.push({
            image: {
                image: liferay.screens.maps.getImage(map)
            },
            title: {
                text: map.name
            },
            properties: {
                itemId: map.uuid,
                height: rowHeight
            }
        });

    });

    if (!this.listViewSection) {
        this.listViewSection = Ti.UI.createListSection({
            headerTitle: L('MAPS')
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
            liferay.controller.open(liferay.screens.mapsDetail.render(), liferay.screens.mapsDetail);
            liferay.screens.mapsDetail.loadDetails(liferay.data.currentEventData.maps[e.itemIndex]);
        });
        this.panelBg.add(this.listView);
    }

};


//Ti.API.info("maps.js loaded");
