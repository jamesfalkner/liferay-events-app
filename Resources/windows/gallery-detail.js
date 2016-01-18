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

liferay.screens.galleryDetail.render = function () {
  //Ti.API.info(this.className + ".render()");
  var self = this;

  this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

  this.scrollableView = null;
  this.allImageViews = [];

  this.saveBtn = Titanium.UI.createView(liferay.settings.screens.galleryDetail.buttons.save);
  this.saveBtn.width = liferay.tools.getDp(liferay.settings.screens.galleryDetail.buttons.save.psize * Titanium.Platform.displayCaps.platformWidth);
  this.saveBtn.height = this.saveBtn.width;
  this.saveBtn.addEventListener('click', function () {
    var currentImage = liferay.screens.galleryDetail.allImageViews[self.scrollableView.currentPage];
    if (!currentImage) {
      liferay.tools.toastNotification(null, String.format(L('GALLERY_SAVE_ERROR'), 'no image at ' + self.scrollableView.currentPage));
      return;
    }
    liferay.tools.flashButton({
      control: self.saveBtn,
      onRestore: function () {
        var alertDialog = Titanium.UI.createAlertDialog({
          title: L('GALLERY_SAVE_TITLE'),
          message: L('GALLERY_SAVE_PROMPT'),
          buttonNames: [L('YES'), L('NO')]
        });
        alertDialog.addEventListener('click', function (e) {
          if (e.index == 0) {

            var imgFile = Ti.Filesystem.getFile(currentImage);

            Ti.Media.saveToPhotoGallery(imgFile, {
              success: function () {
                liferay.tools.toastNotification(null, L('GALLERY_SAVE_SAVED'));
              },
              error: function (err) {
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
    footerButtons: [this.saveBtn],
    panelBg: this.panelBg
  });

  return this.window;
};

liferay.screens.galleryDetail.loadDetails = function (photo, index, allPhotos) {
  //Ti.API.info(this.className + ".loadDetails(): " + index);

  var self = this;

  var canRate = photo.canRate;
  liferay.screens.galleryDetail.loadRatedPhotos();

  liferay.tools.createFloatingMessage({
    container: liferay.screens.gallery.window
  });


  if (this.timerId) {
    //Ti.API.info("clearing timer: " + this.timerId);
    clearTimeout(this.timerId);
  }
  this.timerId = setTimeout(function () {
    liferay.tools.hideFloatingMessage();
    liferay.tools.alert(L('ALERT'), L('GALLERY_SLOW'));
  }, 10000);

  var views = [];

  this.scrollableView = Ti.UI.createScrollableView({
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    backgroundColor: '#888888',
    showPagingControl: true
  });

  var imgSize = liferay.tools.getDp(Titanium.Platform.displayCaps.platformWidth * 0.15);

  allPhotos.forEach(function (photo, idx) {
    var url = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_z.jpg';
    var imageView = Ti.UI.createImageView({image: url});

    imageView.addEventListener('postlayout', function (e) {
      self.loadImage({
        imageView: e.source,
        url: url,
        setImage: true,
        onLoad: function () {
          liferay.tools.hideFloatingMessage();
          liferay.screens.galleryDetail.fetchCount(photo, likeLabel);
          liferay.screens.galleryDetail.allImageViews[idx] = e.source.image;
          var ifi = e.source.toBlob();
          var imgW = ifi.width;
          var imgH = ifi.height;

          var viewW = liferay.tools.getPx(self.scrollableView.rect.width);
          var viewH = liferay.tools.getPx(self.scrollableView.rect.height);

          if (viewW == 0 || viewH == 0) return;

          var xF = (viewW - imgW) / imgW;
          var yF = (viewH - imgH) / imgH;

          var minF = Math.min(xF, yF);

          imageView.width = liferay.tools.getDp(imgW + (imgW * minF));
          imageView.height = liferay.tools.getDp(imgH + (imgH * minF));


        }
      });
    });

    var likeContainer = Ti.UI.createView({
      width: Ti.UI.SIZE,
      height: Ti.UI.SIZE,
      left: '10dp',
      bottom: '10dp',
      layout: 'horizontal',
      backgroundColor: 'transparent',
      horizontalWrap: false,
      opacity: 0.8
    });


    var likeLabel = Ti.UI.createLabel({
      text: '?',
      font: liferay.fonts.h4b,
      color: '#dddddd',
      left: '5dp'
    });

    likeLabel.font.fontSize = imgSize;
    var thumbsImg = Ti.UI.createImageView({
      width: imgSize,
      height: 'auto',
      image: '/images/MobApp-AgendaDet-Icon-ThumbUp-@2x.png',
      left: '5dp',
      bottom: '8dp'
    });

    var ratingIndicator = Ti.UI.createActivityIndicator({
      color: 'white',
      height: Ti.UI.SIZE,
      width: Ti.UI.SIZE,
      left: '5dp'
    });

    likeContainer.add(likeLabel);
    likeContainer.add(thumbsImg);
    likeContainer.add(ratingIndicator);

    likeContainer.addEventListener('click', function (e) {

      var photoRatingId = "PHOTO:" + photo.id;

      e.source.setTouchEnabled(false);
      if (photo && photo.id) {
        if (!photo.canRate) {
          liferay.tools.toastNotification(e.source, L('RATINGS_DISABLED_FOR_PHOTO'));
          return;
        }

        if (!this.ratingDebug && liferay.screens.galleryDetail.hasRated(photoRatingId)) {
          liferay.tools.toastNotification(e.source, L('ALREADY_RATED_PHOTO'));
          return;

        }

        ratingIndicator.show();
        liferay.screens.galleryDetail.postRating({
          id: photoRatingId,
          rating: "like",
          onSuccess: function () {
            ratingIndicator.hide();
            e.source.setTouchEnabled(true);
            liferay.screens.galleryDetail.recordRating(liferay.controller.selectedEvent, photoRatingId);
            liferay.screens.galleryDetail.saveRatedPhotos();
            var oldCount = parseInt(likeLabel.text);
            if (oldCount >= 0) {
              likeLabel.text = oldCount + 1;
            }
            liferay.tools.toastNotification(e.source, L('THANKS_PHOTO_RATING'));
          },
          onFail: function (msg) {
            ratingIndicator.hide();
            e.source.setTouchEnabled(true);
            liferay.tools.toastNotification(e.source, String.format(L('PHOTO_RATING_FAIL'), msg));
          }
        });
      }
    });

    var overlayContainer = Ti.UI.createView({
      width: Ti.UI.FILL,
      height: Ti.UI.FILL,
      touchEnabled: true
    });

    var scrollView = Ti.UI.createScrollView({
      maxZoomScale: 3,
      contentWidth: "auto",
      contentHeight: "auto",
      minZoomScale: 0.5,
      //     zoomScale: 0.6,
      touchEnabled: true,
      showVerticalScrollIndicator: true,
      showHorizontalScrollIndicator: true
    });


    var shareButton = Ti.UI.createImageView({
      width: imgSize,
      height: 'auto',
      image: '/images/Add-Social-Icon-@2x.png',
      right: '10dp',
      bottom: '10dp',
      opacity: '0.8'
    });

    shareButton.addEventListener('click', function (e) {
      var allLink = Ti.App.Properties.getString('liferay.flickr.sets_baseurl') + '/sets/' + photo.photosetid;

      liferay.screens.galleryDetail.shareImageMenu(url, allLink, imageView.toBlob(), photo.title, photo.id);
    });

    scrollView.add(imageView);
    overlayContainer.add(scrollView);
    overlayContainer.add(shareButton);
    overlayContainer.add(likeContainer);

    views.push(overlayContainer);
  });

  clearTimeout(liferay.screens.galleryDetail.timerId);

  self.scrollableView.views = views;
  self.scrollableView.currentPage = index;
  self.panelBg.add(self.scrollableView);

};

liferay.screens.galleryDetail.shareFacebookImage = function (url, allLink, title) {

  var data = {
    link: url,
    name: liferay.controller.selectedEvent.menutitle + ' ' + liferay.controller.selectedEvent.location_label,
    //description : title,
    caption: liferay.controller.selectedEvent.menutitle,
    picture: url,
    actions: '{"name": "' + L('ALL_PHOTOS') + '", "link" : "' + allLink + '"}'
  };
  liferay.screens.front.fbFeed(data);
};

liferay.screens.galleryDetail.shareTwitterImage = function (url, blob) {

  var tweetHash = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');
  liferay.screens.front.tweet(tweetHash, blob);
};

liferay.screens.galleryDetail.shareInstagramImage = function (url, blob, title, id) {


  if (liferay.model.iOS) {

    var tmpFileName = id + ".ig";

    var tmpFile = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, tmpFileName);
    if (!tmpFile.write(blob)) {
      alert(String.format(L('ERROR_1'), String.format(L('GALLERY_SAVE_IMAGE'), tmpFile.nativePath)));
      return;
    }

    var docViewer = Ti.UI.iOS.createDocumentViewer({"url": tmpFile.nativePath});
    docViewer.UTI = "com.instagram.exclusivegram";
    docViewer.annotation = [{
      InstagramCaption: title + " " +
      (liferay.controller.selectedEvent.event_hashtag ?
          liferay.controller.selectedEvent.event_hashtag :
          Ti.App.Properties.getString('liferay.default_event_hashtag'))
    }];

    docViewer.show({"view": liferay.controller.getCurrentWindow(), "animated": true});
  } else if (liferay.model.android) {
    if (Ti.Filesystem.isExternalStoragePresent()) {
      var tmpDir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory);
      if (!tmpDir.exists()) {
        tmpDir.createDirectory();
      }
      var tmpFile = Ti.Filesystem.getFile(tmpDir.nativePath, id + ".jpg");

      if (!tmpFile.write(blob)) {
        alert(String.format(L('ERROR_1'), String.format(L('GALLERY_SAVE_ERROR'), tmpFile.nativePath)));
        return;
      }

      var intent = Ti.Android.createIntent({
        action: Ti.Android.ACTION_SEND,
        type: 'image/jpeg',
        data: tmpFile.nativePath
      });

      var hashtag = liferay.controller.selectedEvent.event_hashtag ? liferay.controller.selectedEvent.event_hashtag : Ti.App.Properties.getString('liferay.default_event_hashtag');

      intent.putExtra(Ti.Android.EXTRA_TITLE, hashtag);
      intent.putExtra(Ti.Android.EXTRA_TEXT, hashtag);
      intent.putExtraUri(Ti.Android.EXTRA_STREAM, tmpFile.nativePath);

      try {
        Ti.Android.currentActivity.startActivity(Ti.Android.createIntentChooser(intent, L('SHARE_IMAGE')));
      } catch (e) {
        tmpFile.deleteFile();
        alert(L('ERROR') + ": " + e);
      }

      liferay.controller.getCurrentWindow().addEventListener('close', function (e) {
        tmpFile.deleteFile();
      });
    } else {
      // should not happen, so no localization
      Ti.API.error('No external storage present');
    }

  }


};


liferay.screens.galleryDetail.shareImageMenu = function (url, allLink, blob, title, id) {

  var optionDialog = Titanium.UI.createOptionDialog({
    title: L('SHARE_IMAGE'),
    options: ["Facebook", "Twitter", "Instagram", L('CANCEL')],
    cancel: 3,
    selectedIndex: 3,
    persistent: true
  });

  optionDialog.addEventListener('click', function (e) {
    // TODO: other social networks
    switch (e.index) {
      case 0:
        liferay.screens.galleryDetail.shareFacebookImage(url, allLink, title);
        break;
      case 1:
        liferay.screens.galleryDetail.shareTwitterImage(url, blob);
        break;
      case 2:
        liferay.screens.galleryDetail.shareInstagramImage(url, blob, title, id);
        break;
      default:
    }
  });
  optionDialog.show();
};


liferay.screens.galleryDetail.fetchCount = function (photo, label) {
  if (!photo.id) {
    return;
  }

  var id = "PHOTO:" + photo.id;

  Request({
    method: 'POST',
    url: liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.ratingServiceEndpoint,
    params: {
      event: liferay.controller.selectedEvent.eventid,
      id: id,
      name: Ti.Platform.id,
      rate: "DUMMY",
      cmd: "get"
    },
    onSuccess: function (response) {

      var stat = response.stat;
      if (stat == 'ok') {
        label.text = response.count;
      }
    }
  });

};


liferay.screens.galleryDetail.postRating = function (options) {

  Request({
    url: liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.ratingServiceEndpoint,
    method: 'POST',
    params: {
      event: liferay.controller.selectedEvent.eventid,
      id: options.id,
      name: Ti.Platform.id,
      rate: options.rating
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
};

//Ti.API.info("galleryDetail.js loaded");
