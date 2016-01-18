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


liferay.screens.activityStream = new liferay.classes.window();
liferay.screens.activityStream.className = 'liferay.screens.activityStream';

liferay.screens.activityStream.render = function () {

    var self = this;
    var panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);
    panelBg.height = '90%';


    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        swipe: true,
        panelBg: panelBg
    });

    panelBg.backgroundImage =  liferay.settings.screens.activityStream.backgroundImage;
    panelBg.backgroundColor = 'transparent';

    var scroll = Ti.UI.createScrollView({
        top: '5dp',
        bottom: '2dp',
        left: '10dp',
        right: '10dp',
        contentWidth: 'auto',
        contentHeight: 'auto',
        showHorizontalScrollIndicator: false,
        showVerticalScrollIndicator: true
    });

    this.overallContainer = Ti.UI.createView({
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical',
        top: 0,
        left: 0
    });

    scroll.add(this.overallContainer);
    panelBg.add(scroll);

    return this.window;

};

liferay.screens.activityStream.loadAction = function(actionSpec, event_uuid, cb) {
    liferay.screens.activityStream.displayActivityStream();
}

liferay.screens.activityStream.refresh = function () {
};

liferay.screens.activityStream.displayActivityStream = function () {


    var self = this;

    var allNews = liferay.controller.getAllNewsItems(liferay.controller.selectedEvent.eventid);

    if (!allNews || allNews.length <= 0) {

        this.overallContainer.removeAllChildren();
        setTimeout(function() {
            var label = Ti.UI.createLabel({
                text: L('NO_NEWS'),
                font: liferay.fonts.h4b,
                color: 'white',
                top: '100dp',
                opacity: 0
            });
            self.overallContainer.add(label);
            label.animate({
                opacity: 1,
                duration : 400
            });
        }, 400);
        return;
    }

//			news: [
//				{
//					time: 23423342234,
    //              read: true/false
//					item: newsItem {uuid: "123-123", date: "2014-12-12", time: "12:10", content:"blah", picture:"/images/foo.png", url: "http://liferay.com"}
//				}
//			]
//		}
//		],
//
    var lastLatestDate = liferay.controller.getLastReadTime(liferay.controller.selectedEvent);
    allNews.forEach(function(newsItem) {

        newsItem.read = true;

        if (newsItem.time > lastLatestDate) {
            //evtNews.lastReadTime = item.time;
            lastLatestDate = newsItem.time;
        }

        var itemContainer = Ti.UI.createView({
            top: '5dp',
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            opacity: 0
        });

        var shader = Ti.UI.createView({
            top: 0, left: 0, bottom: 0, right: 0,
            backgroundColor: 'black',
            opacity: 0.4
        });


        var spacer = Ti.UI.createView({
            top: '5dp',
            left: '5dp',
            right: '5dp',
            height: Ti.UI.SIZE,
            layout: 'vertical'
        });

        var line = Ti.UI.createView({
            left: '15dp',
            top: '30dp',
            bottom: '10dp',
            backgroundColor: 'white',
            width: '1dp'
        });

        spacer.addEventListener('postlayout', function(e) {
            shader.height = spacer.rect.height * 1.05;
            line.height = spacer.rect.height;
        });

        var dateRow = Ti.UI.createView({
            top: '5dp',
            height: Ti.UI.SIZE,
            width: Ti.UI.FILL,
            layout: 'horizontal'
        });

        dateRow.add(Ti.UI.createImageView({
            left: '5dp',
            width: '20dp',
            height: 'auto',
            image: '/images/MobApp-Agenda-Icon-Mega-@2x.png'
        }));


        dateRow.add(Ti.UI.createLabel({
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            text: liferay.tools.makeRelativeDateString(new Date(newsItem.time)),
            font: liferay.fonts.h3,
            left: '7dp',
            color: 'white'
        }));

        var pic = Ti.UI.createImageView({
            top: '8dp',
            width: '70%',
            height: 'auto',
            defaultImage: liferay.settings.screens.contacts.defaultPicture
        });

        self.loadImage({
            setImage: true,
            imageView: pic,
            url: newsItem.item.picture
        });

        var descLabel = Ti.UI.createLabel({
            top: '9dp',
            width: '90%',
            right: '8dp',
            height: Ti.UI.SIZE,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: liferay.fonts.h4,
      //      backgroundColor: 'orange',
            text: newsItem.item.content,
            color: 'white'
        });

        if (newsItem.item.url) {
            itemContainer.addEventListener('click', function(e) {
                Ti.Platform.openURL(newsItem.item.url);
            });
        }

        spacer.add(dateRow);
        spacer.add(pic);
        spacer.add(descLabel);

        itemContainer.add(shader);
        itemContainer.add(spacer);

        itemContainer.add(line);

        self.overallContainer.add(itemContainer);

    });

    this.overallContainer.getChildren().forEach(function(kid, idx) {
        setTimeout(function() {
            kid.animate({
                opacity: 1,
                duration: 400
            });
        }, idx * 100);
    });

    liferay.controller.setLastReadTime(liferay.controller.selectedEvent, lastLatestDate);
    liferay.drawer.setNotificationValue(L('NEWS'), 0);


};

