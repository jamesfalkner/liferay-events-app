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

liferay.screens.galleryDetail = new liferay.classes.window();
liferay.screens.galleryDetail.className = 'liferay.screens.galleryDetail';

liferay.screens.galleryDetail.render = function() {
	//Ti.API.info(this.className + ".render()");
	var self = this;

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.prevBtn = Titanium.UI.createView(liferay.settings.screens.galleryDetail.buttons.prev);
    this.prevBtn.width = liferay.tools.getDp(liferay.settings.screens.galleryDetail.buttons.prev.psize * Titanium.Platform.displayCaps.platformWidth);
    this.prevBtn.height = this.prevBtn.width;

    this.prevBtn.addEventListener('click', function() {
        if (self.currentIndex > 0) {
            liferay.tools.flashButton({
                control : self.prevBtn,
                onRestore : function() {
                    if (self.currentIndex > 0) {
                        self.loadDetails(--self.currentIndex);
                    }
                }
            });
        }
    });

    this.nextBtn = Titanium.UI.createView(liferay.settings.screens.galleryDetail.buttons.next);
    this.nextBtn.width = liferay.tools.getDp(liferay.settings.screens.galleryDetail.buttons.next.psize * Titanium.Platform.displayCaps.platformWidth);
    this.nextBtn.height = this.nextBtn.width;
    this.nextBtn.addEventListener('click', function() {
        if (self.currentIndex < liferay.screens.gallery.data.photo.length - 1) {
            liferay.tools.flashButton({
                control : self.nextBtn,
                onRestore : function() {
                    if (self.currentIndex < liferay.screens.gallery.data.photo.length - 1) {
                        self.loadDetails(++self.currentIndex);
                    }
                }
            });
        }
    });

    this.infoBtn = Titanium.UI.createView(liferay.settings.screens.galleryDetail.buttons.info);
    this.infoBtn.width = liferay.tools.getDp(liferay.settings.screens.galleryDetail.buttons.info.psize * Titanium.Platform.displayCaps.platformWidth);
    this.infoBtn.height = this.infoBtn.width;
    this.infoBtn.addEventListener('click', function(e) {
        liferay.screens.galleryDetail.infoBtn.setTouchEnabled(false);
        liferay.tools.flashButton({
            control : e.source,
            onRestore : function() {
                var info = liferay.screens.gallery.data.photo[self.currentIndex];
                if (info && info.id) {
                    if (!info.canRate) {
                        liferay.tools.alert(L('NOTE'), L('RATINGS_DISABLED_FOR_PHOTO'));
                        liferay.screens.galleryDetail.infoBtn.setTouchEnabled(true);
                        return;
                    }

                    var photoRatingId = "PHOTO:" + info.id;
                    liferay.tools.createFloatingMessage({
                        container: liferay.screens.galleryDetail.window,
                        text     : L('SAVING_RATING')
                    });
                    liferay.screens.galleryDetail.postRating({
                        id: photoRatingId,
                        rating: "like",
                        alreadyRatedText: L('ALREADY_RATED_PHOTO'),
                        onSuccess: function() {
                            liferay.tools.hideFloatingMessage();
                            liferay.screens.galleryDetail.recordRating(liferay.controller.selectedEvent, photoRatingId);
                            liferay.screens.galleryDetail.saveRatedPhotos();
                            var oldCount = parseInt(liferay.screens.galleryDetail.infoTxt.text);
                            if (oldCount >= 0) {
                                liferay.screens.galleryDetail.infoTxt.text = oldCount + 1;
                            }
                            liferay.tools.toastNotification(e.source, L('THANKS_PHOTO_RATING'));
                            liferay.screens.galleryDetail.infoBtn.setTouchEnabled(true);
                        },
                        onFail: function(msg) {
                            liferay.tools.hideFloatingMessage();
                            liferay.tools.alert(L('ALERT'), String.format(L('PHOTO_RATING_FAIL'), msg));
                            liferay.screens.galleryDetail.infoBtn.setTouchEnabled(true);
                        }
                    });
                }
                liferay.screens.galleryDetail.infoBtn.setTouchEnabled(true);
            }
        });
    });
    this.infoBtn.setTouchEnabled(true);

    var infoView = Ti.UI.createView({
        left: '8%',
        width: Ti.UI.SIZE,
        height: '90%',
        bottom: 0,
        layout: 'horizontal'
    });

    this.infoTxt = Ti.UI.createLabel({
        text: '-',
        font: liferay.fonts.h4,
        color: 'white',
        height: '95%',
        top: '5dp',
        textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
        verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER
    });

    this.infoTxt.addEventListener('click', function(e) {
        liferay.tools.flashLabel({
            control: e.source,
            onRestore: function() {
                var info = liferay.screens.gallery.data.photo[self.currentIndex];
                liferay.tools.toastNotification(e.source, info.title);
            }
        });
    });

    this.infoBtn.left = '10dp';

    infoView.add(this.infoTxt);
    infoView.add(this.infoBtn);


    this.saveBtn = Titanium.UI.createView(liferay.settings.screens.galleryDetail.buttons.save);
    this.saveBtn.width = liferay.tools.getDp(liferay.settings.screens.galleryDetail.buttons.save.psize * Titanium.Platform.displayCaps.platformWidth);
    this.saveBtn.height = this.saveBtn.width;
    this.saveBtn.addEventListener('click', function() {
        liferay.tools.flashButton({
            control: self.saveBtn,
            onRestore: function() {
                var alertDialog = Titanium.UI.createAlertDialog({
                    title : L('GALLERY_SAVE_TITLE'),
                    message : L('GALLERY_SAVE_PROMPT'),
                    buttonNames : [L('YES'), L('NO')]
                });
                alertDialog.addEventListener('click', function(e) {
                    if (e.index == 0) {

                        var imgFile = Ti.Filesystem.getFile(liferay.screens.galleryDetail.imgView.image);

                        Ti.Media.saveToPhotoGallery(imgFile, {
                            success: function() {
                                liferay.tools.toastNotification(null, L('GALLERY_SAVE_SAVED'));
                            },
                            error: function(err) {
                                liferay.tools.alert(L('ALERT'), String.format(L('GALLERY_SAVE_ERROR'), JSON.stringify(err)));
                            }
                        });
                    }
                });
                alertDialog.show();
            }
        });
    });

    this.window = liferay.ui.makeWindow({
        backEnabled: true,
        swipe: false,
        footerButtons: [this.prevBtn, this.nextBtn, infoView, this.saveBtn],
        panelBg: this.panelBg
    });


	// gallery detail specifics

	this.scrollView = Titanium.UI.createScrollView({
        width: "95%",
        height: "95%",
        backgroundColor:"transparent",
        contentWidth: "auto",
        contentHeight: "auto",
        top: "2.5%",
        left: "2.5%",
        maxZoomScale: 5,
        minZoomScale: 0.5,
        zoomScale: 1,
        touchEnabled: true,
        showVerticalScrollIndicator: true,
        showHorizontalScrollIndicator: true
    });

	var imageContainer = Ti.UI.createView({
		height: '100%',
		width: '100%',
        backgroundColor: "transparent",
		top: 0,
		left: 0
	});

	this.imgView = Ti.UI.createImageView({
		width : '100%',
        height: 'auto',
		backgroundColor : 'transparent',
		touchEnabled : true,
		preventDefaultImage : true,
		autoRotate: true,
		enableZoomControls: false
	});

	this.imgView.addEventListener('swipe', function(e) {
		if (e.direction == 'left') {
			if (self.currentIndex < liferay.screens.gallery.data.photo.length - 1) {
				self.loadDetails(++self.currentIndex);
			}
		} else if (e.direction == 'right') {
			if (self.currentIndex > 0) {
				self.loadDetails(--self.currentIndex);

			}
		}
	});

	if (liferay.model.android) {
		this.imgView.addEventListener('pinch', function(e) {
			var t = Ti.UI.create2DMatrix().scale(e.scale);
			liferay.screens.galleryDetail.imgView.transform = t;
		});
	}

	imageContainer.add(this.imgView);
	this.scrollView.add(imageContainer);
	this.panelBg.add(this.scrollView);

	return this.window;
};

liferay.screens.galleryDetail.loadDetails = function(index) {
	//Ti.API.info(this.className + ".loadDetails(): " + index);
	liferay.screens.galleryDetail.infoTxt.text = '-';

	var photo = liferay.screens.gallery.data.photo[index];
	var canRate = photo.canRate;
	liferay.screens.galleryDetail.loadRatedPhotos();

	this.currentIndex = index;

	this.prevBtn.opacity = (index <= 0) ? 0.5 : 1;
	this.nextBtn.opacity = (index >= liferay.screens.gallery.data.photo.length - 1) ? 0.5 : 1;

	liferay.tools.createFloatingMessage({
		container : liferay.screens.gallery.window
	});

	var url = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_z.jpg';

	if (this.timerId) {
		//Ti.API.info("clearing timer: " + this.timerId);
		clearTimeout(this.timerId);
	}
	this.timerId = setTimeout(function() {
		liferay.tools.hideFloatingMessage();
		liferay.tools.alert(L('ALERT'), L('GALLERY_SLOW'));
	}, 10000);

	this.loadImage({
		imageView : this.imgView,
		url : url,
		setImage : true,
		onLoad : function() {
			clearTimeout(liferay.screens.galleryDetail.timerId);
			liferay.tools.hideFloatingMessage();
			liferay.screens.gallery.fetchCount(photo);

			var borderSize = liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.1);
			var imgSize = borderSize * .75;

			var iconContainer = Ti.UI.createView({
				bottom: '5%',
				right: '5%',
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				layout: 'horizontal',
				horizontalWrap: false
			});
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
			iconContainer.add(border);

			border.addEventListener('click', function(e) {
				var tweetUrl = "http://flickr.com/photos/liferay/sets/" + photo.photosetid;
				var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');

				liferay.screens.front.tweet(photo.title + ' ' + tweetHash + ' ' + tweetUrl, liferay.screens.galleryDetail.imgView.toBlob());
			});

			border = Ti.UI.createView({
				left: '10px',
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
				var ln = Ti.App.Properties.getString('liferay.flickr.sets_baseurl') + '/sets/' + photo.photosetid;
				var data = {
					link : Ti.App.Properties.getString('liferay.flickr.sets_baseurl') + '/' + photo.id,
					name : liferay.controller.selectedEvent.menutitle + ' ' + liferay.controller.selectedEvent.location_label,
					message : "Wish you were here!",
					caption : photo.title,
					picture : url,
					actions: '{"name": "' + L('ALL_PHOTOS') + '", "link" : "' + ln + '"}'
				};

				liferay.screens.front.fbFeed(data);

			});
			border.add(fbButton);
			iconContainer.add(border);
			liferay.screens.galleryDetail.panelBg.add(iconContainer);

			// zoom pic to fill either width or height of container
			if (liferay.model.android) {
				setTimeout(function() {
					var ifi = liferay.screens.galleryDetail.imgView.toBlob();
					var imgW = ifi.width;
					var imgH = ifi.height;

					var viewW = liferay.tools.getPx(liferay.screens.galleryDetail.scrollView.rect.width);
					var viewH = liferay.tools.getPx(liferay.screens.galleryDetail.scrollView.rect.height);

                    if (viewW == 0 || viewH == 0) return;

					var xF = (viewW - imgW) / imgW;
					var yF = (viewH - imgH) / imgH;

					var minF = Math.min(xF, yF);

                    liferay.screens.galleryDetail.imgView.width = liferay.tools.getDp(imgW + (imgW * minF));
                    liferay.screens.galleryDetail.imgView.height = liferay.tools.getDp(imgH + (imgH * minF));

//					liferay.screens.galleryDetail.imgView.animate({
//						width: liferay.tools.getDp(imgW + (imgW * minF)),
//						height: liferay.tools.getDp(imgH + (imgH * minF)),
//						duration: 100
//					});

				}, 200);
			}
		}
	});
};

liferay.screens.gallery.fetchCount = function(photo) {
	if (!photo.id) {
		return;
	}

	var id = "PHOTO:" + photo.id;

	Request({
		method	: 'POST',
		url      : liferay.settings.server.servicesHost.host + liferay.settings.servicesHost.ratingServiceEndpoint,
		params   : {
			event: liferay.controller.selectedEvent.eventid,
			id   : id,
			name : Ti.Platform.id,
			rate : "DUMMY",
			cmd  : "get"
		},
		onSuccess: function (response) {

			var stat = response.stat;
			if (stat == 'ok') {
				var cnt = response.count;
				liferay.screens.galleryDetail.infoTxt.text = cnt;
			}
		}
	});

};


liferay.screens.galleryDetail.postRating = function (options) {

    // options: info, rating, alreadyRatedText, savingText, timeoutText

    if (!this.ratingDebug && liferay.screens.galleryDetail.hasRated(options.id)) {
        liferay.tools.hideFloatingMessage();
        liferay.tools.alert(L('NOTE'), options.alreadyRatedText);
        return;
    }


    Request({
        url      : liferay.settings.server.servicesHost.host + liferay.settings.servicesHost.ratingServiceEndpoint,
        method	: 'POST',
        params   : {
            event: liferay.controller.selectedEvent.eventid,
            id   : options.id,
            name : Ti.Platform.id,
            rate : options.rating
        },
        onSuccess: function (response) {

            var stat = response.stat;
            if (stat == 'ok') {
                if (options.onSuccess) options.onSuccess();
            } else {
                if (options.onFail) options.onFail(stat);
            }
        },
        onFailure: function (msg, response) {
            if (options.onFail) options.onFail(msg);
        }
    });
};

liferay.screens.galleryDetail.recordRating = function (event, id) {

    for (var i = 0; i < liferay.screens.galleryDetail.ratings.length; i++) {
        if (liferay.screens.galleryDetail.ratings[i].eventId == liferay.controller.selectedEvent.eventid) {
            liferay.screens.galleryDetail.ratings[i].ratings.push(id);
            return;
        }
    }
    // no rating found
    liferay.screens.galleryDetail.ratings.push({
        eventId: event.eventid,
        ratings: [id]
    });
};

liferay.screens.galleryDetail.hasRated = function (id) {

    for (var i = 0; i < liferay.screens.galleryDetail.ratings.length; i++) {
        if (liferay.screens.galleryDetail.ratings[i].eventId == liferay.controller.selectedEvent.eventid) {
            var ratings = liferay.screens.galleryDetail.ratings[i].ratings;
            for (var j = 0; j < ratings.length; j++) {
                if (ratings[j] == id) {
                    return true;
                }
            }
        }
    }
    return false;
};

liferay.screens.galleryDetail.loadRatedPhotos = function () {

    liferay.screens.galleryDetail.ratings = [];

    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.ratingsFile);
    if (file.exists()) {
        try {
            liferay.screens.galleryDetail.ratings = JSON.parse(file.read());
        } catch (ex) {
            liferay.screens.galleryDetail.ratings = [];
        }
    }
    return false;
};

liferay.screens.galleryDetail.saveRatedPhotos = function () {

        var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
        if (!folder.exists()) {
            folder.createDirectory();
            folder.remoteBackup = false;
        }
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.ratingsFile);
        file.write(JSON.stringify(liferay.screens.galleryDetail.ratings));
        file.remoteBackup = false;
        //Ti.API.info("Saved ratings data to " + file.getNativePath())
        // alert("ratings saved: " + JSON.stringify(liferay.screens.agendaDetail.ratings));
};

//Ti.API.info("galleryDetail.js loaded");
