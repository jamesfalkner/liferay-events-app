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


Titanium.include('includes/async.js');
Titanium.include('includes/mobile.js');
Titanium.include('includes/tools.js');
Titanium.include('includes/ui.js');
Titanium.include('includes/fonts.js');
Titanium.include('includes/flickr.js');
Titanium.include('includes/forms.js');
Titanium.include('includes/cache.js');
Titanium.include('includes/array-sortby.js');
Titanium.include('includes/request.js');
Titanium.include('includes/beacons.js');
Titanium.include('windows/main.js');
Titanium.include('windows/front.js');
Titanium.include('windows/agenda.js');
Titanium.include('windows/list-templates.js');
Titanium.include('windows/agenda-detail.js');
Titanium.include('windows/contacts.js');
Titanium.include('windows/contacts-detail.js');
Titanium.include('windows/event-select.js');
Titanium.include('windows/gallery.js');
Titanium.include('windows/gallery-detail.js');
Titanium.include('windows/maps.js');
Titanium.include('windows/maps-detail.js');
Titanium.include('windows/activities.js');
Titanium.include('windows/activities-detail.js');
Titanium.include('windows/sponsors.js');

// Set the main background color for the application
Titanium.UI.setBackgroundColor('#000');

if (liferay.model.android) {
	Ti.Gesture.addEventListener('orientationchange', function(e) {
		if ((e.orientation == Titanium.UI.PORTRAIT) ||
			(e.orientation == Titanium.UI.UPSIDE_PORTRAIT)) {

			liferay.fonts.calcFonts();
		}
	});
}

liferay.controller.init();
