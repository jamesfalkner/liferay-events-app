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

liferay.ui = {};


liferay.ui.makeWindow = function (options) {

    var window = Ti.UI.createWindow({
        navBarHidden: true,
        tabBarHidden: true,
        fullscreen: true,
        backgroundColor: 'white'
    });


    window.orientationModes = [Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT];

    var header = Ti.UI.createView(liferay.settings.screens.all.layout.header);
    var footer = Ti.UI.createView(liferay.settings.screens.all.layout.footer);
    var panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);


    window.add(header);
    window.add(footer);
    window.add(options.panelBg ? options.panelBg : panelBg);

    if (options.footerButtons) {
        options.footerButtons.forEach(function (footerButton) {
            footer.add(footerButton);
        });
    }

    if (options.headerButtons) {
        options.headerButtons.forEach(function (headerButton) {
            header.add(headerButton);
        });
    }

    var lbl = Ti.UI.createLabel(liferay.settings.screens.all.layout.headerLabel);
    lbl.font = liferay.fonts.h1;
    lbl.text = options.headerText ? options.headerText : ( liferay.controller.selectedEvent ? liferay.controller.selectedEvent.menutitle.toUpperCase() : "");
    if (options.backEnabled || options.headerButtons) {
        lbl.right = '5%';
    }

    header.add(lbl);

    if (options.headerListeners) {
        lbl.setTouchEnabled(true);
        options.headerListeners.forEach(function (l) {
            header.addEventListener(l.event, l.listener);
        });
    }

    if (options.backEnabled) {
        if (!liferay.model.android) {
            var backBtnContainer = Ti.UI.createView({
                width: '15%',
                height: Ti.UI.FILL,
                left: 0,
                top: 0,
                touchEnabled: true
            });

            var backBtn = Ti.UI.createView(liferay.settings.screens.all.buttons.back);

            backBtn.width = liferay.tools.getDp(liferay.settings.screens.all.buttons.back.psize * Ti.Platform.displayCaps.platformWidth);
            backBtn.height = backBtn.width * 1.2;

            backBtnContainer.addEventListener('click', function (e) {
                liferay.tools.flashButton({
                    control: backBtn,
                    onRestore: function () {
                        backBtn.animate({
                            left: liferay.settings.screens.all.buttons.back.leftAlt,
                            duration: 100
                        }, function () {
                            backBtn.animate({
                                left: liferay.settings.screens.all.buttons.back.left,
                                duration: 100
                            }, function () {
                                if (options.onClose) {
                                    options.onClose();
                                }
                                liferay.controller.closeLast(true);
                            });
                        });
                    }
                });
            });

            backBtnContainer.add(backBtn);

            header.add(backBtnContainer);

            if (options.swipe) {
                window.addEventListener('swipe', function (e) {
                    if (e.direction == 'right') {
                        backBtnContainer.fireEvent('click');
                    }
                });
            }
        } else {
            window.addEventListener('close', function (e) {
                if (options.onClose) {
                    options.onClose();
                }
                liferay.controller.closeLast(false);
            });
        }
    }
    return window;
};