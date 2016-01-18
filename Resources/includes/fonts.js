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
liferay.fonts = {};

liferay.fonts.REGULAR_FONT_NAME = Ti.App.Properties.getString('liferay.regular.font');
liferay.fonts.LIGHT_FONT_NAME = Ti.App.Properties.getString('liferay.light.font');

liferay.fonts.calcFonts = function() {

    if (liferay.model.iPhone) {
        liferay.fonts.H5Size = 30;
        liferay.fonts.H4Size = 20;
        liferay.fonts.H3Size = 18;
        liferay.fonts.H2Size = 16;
        liferay.fonts.H1Size = 14;
        liferay.fonts.H0Size = 12;
    } else if (liferay.model.iPad) {
        liferay.fonts.H5Size = 52;
        liferay.fonts.H4Size = 42;
        liferay.fonts.H3Size = 40;
        liferay.fonts.H2Size = 34;
        liferay.fonts.H1Size = 26;
        liferay.fonts.H0Size = 22;
    } else {
        var capsHeight = Titanium.Platform.displayCaps.platformHeight;
        var phys = capsHeight / Titanium.Platform.displayCaps.dpi;
        if (phys <= 3) {
            liferay.fonts.H5Size = "24dp";
            liferay.fonts.H4Size = "19dp";
            liferay.fonts.H3Size = "17dp";
            liferay.fonts.H2Size = "15dp";
            liferay.fonts.H1Size = "13dp";
            liferay.fonts.H0Size = "12dp";
        } else if (phys <= 4) {
            liferay.fonts.H5Size = "29dp";
            liferay.fonts.H4Size = "21dp";
            liferay.fonts.H3Size = "19dp";
            liferay.fonts.H2Size = "17dp";
            liferay.fonts.H1Size = "15dp";
            liferay.fonts.H0Size = "13dp";
        } else if (phys <= 6) {
            liferay.fonts.H5Size = "36dp";
            liferay.fonts.H4Size = "29dp";
            liferay.fonts.H3Size = "27dp";
            liferay.fonts.H2Size = "25dp";
            liferay.fonts.H1Size = "23dp";
            liferay.fonts.H0Size = "21dp";
        } else if (phys <= 7) {
            liferay.fonts.H5Size = "48dp";
            liferay.fonts.H4Size = "34dp";
            liferay.fonts.H3Size = "30dp";
            liferay.fonts.H2Size = "28dp";
            liferay.fonts.H1Size = "26dp";
            liferay.fonts.H0Size = "24dp";

        } else {
            liferay.fonts.H5Size = "52dp";
            liferay.fonts.H4Size = "36dp";
            liferay.fonts.H3Size = "34dp";
            liferay.fonts.H2Size = "32dp";
            liferay.fonts.H1Size = "30dp";
            liferay.fonts.H0Size = "28dp";

        }
    }

    liferay.fonts.h0 = {
        fontSize: liferay.fonts.H0Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h1 = {
        fontSize: liferay.fonts.H1Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h1b = {
        fontSize: liferay.fonts.H1Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.REGULAR_FONT_NAME,
            ipad: liferay.fonts.REGULAR_FONT_NAME,
            android:liferay.fonts.REGULAR_FONT_NAME
        })
    };
    liferay.fonts.h2 = {
        fontSize: liferay.fonts.H2Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h2b = {
        fontSize: liferay.fonts.H2Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.REGULAR_FONT_NAME,
            ipad: liferay.fonts.REGULAR_FONT_NAME,
            android:liferay.fonts.REGULAR_FONT_NAME
        })
    };
    liferay.fonts.h3 = {
        fontSize: liferay.fonts.H3Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h3b = {
        fontSize: liferay.fonts.H3Size,
        fontWeight: 'bold',
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.REGULAR_FONT_NAME,
            ipad: liferay.fonts.REGULAR_FONT_NAME,
            android:liferay.fonts.REGULAR_FONT_NAME
        })
    };
    liferay.fonts.h4 = {
        fontSize: liferay.fonts.H4Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h4b = {
        fontSize: liferay.fonts.H4Size,
        fontWeight: 'bold',
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.REGULAR_FONT_NAME,
            ipad: liferay.fonts.REGULAR_FONT_NAME,
            android:liferay.fonts.REGULAR_FONT_NAME
        })
    };
    liferay.fonts.h5 = {
        fontSize: liferay.fonts.H5Size,
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.LIGHT_FONT_NAME,
            ipad: liferay.fonts.LIGHT_FONT_NAME,
            android:liferay.fonts.LIGHT_FONT_NAME
        })
    };
    liferay.fonts.h5b = {
        fontSize: liferay.fonts.H5Size,
        fontWeight: 'bold',
        fontFamily: liferay.tools.os({
            iphone:liferay.fonts.REGULAR_FONT_NAME,
            ipad: liferay.fonts.REGULAR_FONT_NAME,
            android:liferay.fonts.REGULAR_FONT_NAME
        })
    };

};

liferay.fonts.calcFonts();
