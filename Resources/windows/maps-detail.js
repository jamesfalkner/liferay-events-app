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

liferay.screens.mapsDetail = new liferay.classes.window();
liferay.screens.mapsDetail.className = 'liferay.screens.mapsDetail';

liferay.screens.mapsDetail.mapModule = require('ti.map');

liferay.screens.mapsDetail.render = function() {
	//Ti.API.info(this.className + ".render()");
	var self = this;

    this.panelBg = Titanium.UI.createView(liferay.settings.screens.all.layout.panelBg);

    this.directions = Titanium.UI.createLabel(liferay.settings.screens.mapsDetail.labels.directions);
    this.directions.font = liferay.fonts.h0;

    this.googleMapsBtn = Titanium.UI.createView(liferay.settings.screens.mapsDetail.buttons.googlemaps);
    this.googleMapsBtn.width = liferay.tools.getDp(liferay.settings.screens.mapsDetail.buttons.googlemaps.psize * Titanium.Platform.displayCaps.platformWidth);
    this.googleMapsBtn.height = this.googleMapsBtn.width;

    this.window = liferay.ui.makeWindow({
        swipe: true,
        backEnabled: true,
        footerButtons: [this.googleMapsBtn, this.directions],
        panelBg: this.panelBg
    });

	return this.window;
};

liferay.screens.mapsDetail.loadAction = function(action, event_uuid, cb) {
    liferay.data.currentEventData.maps.forEach(function(map) {
        if (map.name == action[0]) {
            liferay.screens.mapsDetail.loadDetails(map);
        }
    });
    cb();
};

liferay.screens.mapsDetail.loadDetails = function(info) {

	var self = this;

	var overallContainer = Ti.UI.createView({
		left: '7dp',
		right: '7dp',
		top: '7dp',
		bottom: '7dp'
	});
	var topContainer = Ti.UI.createView({
		left: 0,
		top: 0,
		width: '100%',
		height: '20%'
	});

	this.mapContainer = Ti.UI.createView({
		left: 0,
		top: '20%',
		width: '100%',
		height: '80%'
	});

	overallContainer.add(topContainer);
	overallContainer.add(this.mapContainer);

	this.panelBg.add(overallContainer);

	var imgContainer = Ti.UI.createView({
		left: 0,
		top: 0,
		width: '35%',
		height: '100%'

	});

	var labelContainer = Ti.UI.createView({
		left: '35%',
		top: 0,
		width: '65%',
		height: Ti.UI.FILL
	});

	var imgPadContainer = Ti.UI.createView({
		left: '5dp',
		right: '5dp',
		top: '5dp',
		bottom: '5dp'
	});

	var labelPadContainer = Ti.UI.createView({
		left: '5dp',
		right: '5dp',
		top : '5dp',
		height: Ti.UI.SIZE,
		layout: 'vertical'
	});

	var image = Titanium.UI.createImageView({
		backgroundColor    : 'transparent',
		preventDefaultImage: true,
		touchEnabled       : false,
		top: 0,
		width: '100%',
		height: 'auto'
	});

	imgPadContainer.add(image);
	this.loadImage({
		setImage: true,
		imageView: image,
		url      : info.icon
	});

	imgContainer.add(imgPadContainer);

	var label;

	label = Titanium.UI.createLabel(liferay.settings.screens.mapsDetail.labels.name);
	label.top = 0;
	label.text = info.name;
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.FILL;
	label.font = liferay.fonts.h2;
	labelPadContainer.add(label);

    if (info.address) {
        label = Titanium.UI.createLabel(liferay.settings.screens.mapsDetail.labels.address);
        label.top = 0;
        label.height = Ti.UI.SIZE;
        label.width = Ti.UI.FILL;
        label.font = liferay.fonts.h2;
        label.text = info.address.toUpperCase();
        //Ti.API.info("texT: " + label.text);
        if (info.show_map) {
            label.addEventListener('click', function (e) {
                if (liferay.model.android) {
                    Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(info.name + "," + info.address));
                } else {
                    liferay.tools.flashButton({
                        control: e.source,
                        onRestore: function () {
                            Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(info.name + "," + info.address));
                        }
                    });
                }
            });
        }

        labelPadContainer.add(label);
    }

	labelContainer.add(labelPadContainer);
	topContainer.add(imgContainer);
	topContainer.add(labelContainer);

	var latitude = -1;
	var longitude = -1;

	if (info.show_map && info.address) {
		if (!info.latLong) {
			//Ti.API.info("checking network for forward geocode");
			if (Titanium.Network.online) {
				if (!liferay.model.android) {
					liferay.tools.createFloatingMessage({
						container : liferay.screens.mapsDetail.window,
						text : L('MAPS_LOADING')
					});
				}
				var xhr = Titanium.Network.createHTTPClient();
				var query = info.address;
				xhr.open('GET', 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&address=' + encodeURIComponent(query));
				xhr.onload = function() {
					try {
						var json = JSON.parse(this.responseText);
						if (json.status == 'OK') {
							if (json.results[0]) {
								var addr = json.results[0];
								latitude = addr.geometry.location.lat;
								longitude = addr.geometry.location.lng;
								info.latLong = latitude + ":" + longitude;
								setTimeout(function() {
                                    self.loadMap(info);
								}, 1000);
							}
						}
					} catch (ex) {
						Ti.API.info("caught exception : " + ex);
						liferay.tools.hideFloatingMessage();
					}
				};
				xhr.onerror = function() {
					//Ti.API.info("failed to retrieve lat/long: " + xhr.location);
					liferay.tools.hideFloatingMessage();
				}
				xhr.timeout = liferay.settings.server.requestTimeout;
				xhr.send();
			}
		} else {
			var parts = info.latLong.split(':');
			latitude = parseFloat(parts[0]);
			longitude = parseFloat(parts[1]);
		}
	}
	//Ti.API.info("resulting lat: " + latitude + " result long: " + longitude);
	if (latitude != -1 && longitude != -1) {
		setTimeout(function() {
            self.loadMap(info);
		}, 1000);

	} else {

		if (!liferay.model.android) {
			liferay.tools.createFloatingMessage({
				container : liferay.screens.mapsDetail.window,
				text : L('MAPS_LOADING')
			});
		}

		// load a Zoomable image
		this.scrollView = Ti.UI.createScrollView({
			top: '5dp',
			bottom: '5dp',
			left: '5dp',
			right: '5dp',
			"contentWidth": "auto",
			"contentHeight": "auto",
			"maxZoomScale": 100,
			"minZoomScale": 0.1,
			"zoomScale": 1,
			"touchEnabled": true,
			"showVerticalScrollIndicator": true,
			"showHorizontalScrollIndicator": true
		});

		var imageContainer = Ti.UI.createView({
			height: Ti.UI.SIZE,
			width: Ti.UI.SIZE,
			top: 0,
			left: 0
		});

		var imgView = Ti.UI.createImageView({
			width : '100%',
			height : 'auto',
			left : 0,
			top : 0,
			touchEnabled : true,
			preventDefaultImage : true,
			autoRotate: true,
			enableZoomControls: true
		});

		if (liferay.model.android) {
			imgView.addEventListener('pinch', function(e) {
				var t = Ti.UI.create2DMatrix().scale(e.scale);
				imgView.transform = t;
			});
		}

		this.loadImage({
			imageView : imgView,
			url : info.image,
			setImage : true,
			onLoad : function() {
				liferay.tools.hideFloatingMessage();
                if (liferay.model.android) {
                    setTimeout(function() {
                        if (!liferay.screens.mapsDetail.scrollView) return;
                        var ifi = imgView.toBlob();
                        var imgW = ifi.width;
                        var imgH = ifi.height;

                        var viewW = liferay.tools.getPx(liferay.screens.mapsDetail.scrollView.rect.width);
                        var viewH = liferay.tools.getPx(liferay.screens.mapsDetail.scrollView.rect.height);
                        var xF = (viewW - imgW) / imgW;
                        var yF = (viewH - imgH) / imgH;

                        var minF = Math.min(xF, yF);

                        imgView.animate({
                            width: liferay.tools.getDp(imgW + (imgW * minF)),
                            height: liferay.tools.getDp(imgH + (imgH * minF)),
                            duration: 100
                        });

                    }, 150);
                }
			}
		});

		//Ti.API.info("image: " + info.map);

		if (liferay.model.iOS) {
			imgView.addEventListener('doubletap', function(e) {
				//Ti.API.info(self.className + ".zoomingIn()");
				self.scrollView.setZoomScale(self.scrollView.zoomScale * 1.2);
			});
			imgView.addEventListener('twofingertap', function(e) {
				//Ti.API.info(self.className + ".zoomingOut()");
				self.scrollView.zoomScale /= 1.2;
			});
		}

		imageContainer.add(imgView);
		this.scrollView.add(imageContainer);
		this.mapContainer.add(this.scrollView);
	}
	if (info.address && info.show_map) {
        liferay.screens.mapsDetail.directions.visible =
            liferay.screens.mapsDetail.googleMapsBtn.visible = true;

		liferay.screens.mapsDetail.googleMapsBtn.addEventListener('click', function() {
			liferay.tools.flashButton({
				control : liferay.screens.mapsDetail.googleMapsBtn,
				onRestore : function() {
					// Open link in browser - application will close:
					Titanium.Platform.openURL('http://maps.google.com/maps?q=' + escape(info.address));
				}
			});
		});

	} else {
        liferay.screens.mapsDetail.directions.visible =
            liferay.screens.mapsDetail.googleMapsBtn.visible = false;
    }

};
liferay.screens.mapsDetail.getMapModErrorString = function(rc) {
    switch (rc) {
        case liferay.screens.mapsDetail.mapModule.SERVICE_MISSING:
            return('Google Play services is missing. Please install Google Play services from the Google Play store.');
            break;
        case liferay.screens.mapsDetail.mapModule.SERVICE_VERSION_UPDATE_REQUIRED:
            return('Google Play services is out of date. Please update Google Play services.');
            break;
        case liferay.screens.mapsDetail.mapModule.SERVICE_DISABLED:
            return('Google Play services is disabled. Please enable Google Play services.');
            break;
        case liferay.screens.mapsDetail.mapModule.SERVICE_INVALID:
            return('Google Play services cannot be authenticated. Reinstall Google Play services.');
            break;
        default:
            return('Maps not available on this device.');
            break;
    }
};

liferay.screens.mapsDetail.loadMap = function(info) {
	//Ti.API.info("in loadMap: infoL: " + info.latLong);
    var mod = liferay.screens.mapsDetail.mapModule;

    if (liferay.model.android) {
        try  {
            var gpa = mod.isGooglePlayServicesAvailable();

            if (gpa != mod.SUCCESS) {
                liferay.tools.alert(L('ALERT'), liferay.screens.mapsDetail.getMapModErrorString(gpa));
                liferay.tools.hideFloatingMessage();
                info.latLong = null;
                return;
            }
        } catch (ex) {
            liferay.tools.hideFloatingMessage();
            info.latLong = null;
            return;
        }
    }

	var parts = info.latLong.split(':');
	var locAnnotation = mod.createAnnotation({
		title:info.name,
		pincolor: mod.ANNOTATION_RED,
		latitude: parseFloat(parts[0]),
		longitude: parseFloat(parts[1]),
		image: info.icon
	});

	var mapView = mod.createView({
		top: '5dp',
		bottom: '5dp',
		left: '5dp',
		right: '5dp',
		mapType: mod.NORMAL_TYPE,
		region : {
			latitude : parseFloat(parts[0]),
			longitude : parseFloat(parts[1]),
			latitudeDelta : 0.02,
			longitudeDelta : 0.02
		},
		animate: true,
		userLocation: true,
		annotations: [locAnnotation]
	});

	liferay.tools.hideFloatingMessage();
	this.mapContainer.removeAllChildren();
	if (this.scrollView) {
		this.scrollView = null;
	}
	try {
		this.mapContainer.add(mapView);
		mapView.selectAnnotation(locAnnotation);
	} catch (ex) {
		console.log("caught ex: " + ex);
	}
};

