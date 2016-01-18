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

var securely = require('bencoding.securely');

var liferay_connector = require('liferay-connector');
var sec = Ti.App.Properties.getString("liferay.json_shared_secret", "");
var secureProperties = null;

if (sec) {
    secureProperties = securely.createProperties({
        secret: sec,
        encryptFieldNames: true
    });
}

liferay.drawer = {
    loggedIn: false,
    session: null,
    enabled: true
};

liferay.drawer.setEnabled = function(enabled) {
    this.enabled = enabled;
};

liferay.drawer.setNotificationValue = function (title, value) {
    if (!liferay.drawer.menuListView) return;
    var sections = liferay.drawer.menuListView.sections;

    for (var i = 0; i < sections.length; i++) {
        var items = sections[i].items;
        for (var j = 0; j < items.length; j++) {

            if (items[j].title.text == title) {
                if (!items[j].notification_label) {
                    items[j].notification_label = {};
                }
                items[j].notification_label.text = (value < 0) ? 0 : value;
                items[j].template = (value <= 0) ? 'no_notification' : 'base';

                sections[i].updateItemAt(j, items[j], {animated: true});
                return;
            }
        }
    }
};

liferay.drawer.getNotificationValue = function(title) {
    if (!liferay.drawer.menuListView) return -1;
    var sections = liferay.drawer.menuListView.sections;

    for (var i = 0; i < sections.length; i++) {
        var items = sections[i].items;
        for (var j = 0; j < items.length; j++) {
            if (items[j].title.text == title) {
                if (!items[j].notification_label) {
                    return 0;
                } else {
                    return (items[j].notification_label.text);
                }
            }
        }
    }

    return -1;
};

liferay.drawer.incrementNotificationValue = function(title, inc) {

    var cur = liferay.drawer.getNotificationValue(title);
    if (cur >= 0) {
        liferay.drawer.setNotificationValue(title, cur + inc);
    }
};


liferay.drawer.createDrawer = function(window, items, control) {

    var self = this;

    var shader = Ti.UI.createView({
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 99,
        backgroundColor: 'black',
        opacity: 0,
        touchEnabled: false,
        purpose: 'drawer'
    });
    window.add(shader);

    // sliding menu
    var menuView = Ti.UI.createView({
        top:0,
        right: '100%',
        width:'60%',
        zIndex: 100,
        purpose: 'drawer'
    });

    [menuView, shader].forEach(function(control) {
        control.addEventListener('swipe', function(e) {
            if (e.direction == 'left') {
                shader.fireEvent('click', {
                    source: shader
                });
            }
        });
    });

    window.add(menuView);

    window.addEventListener('swipe', function(e) {
        if (!self.enabled) {
            return;
        }
       if (e.direction == 'right') {
           if (!control.touchEnabled) return;
          control.fireEvent('click', {source: control});
       }
    });

    var headerView = Ti.UI.createView({
        height: Ti.UI.SIZE,
        backgroundColor: '#333333'
    });

    var headerSpacer = Ti.UI.createView({
        top: '10dp',
        left: '10dp',
        right: '10dp',
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var headerImg = Ti.UI.createImageView({
      //  image: 'https://pbs.twimg.com/profile_images/603193876627591168/i6vuNnPT_400x400.png',
        image: '/images/silhouette.png',
        height: '70dp',
        width: '70dp',
        borderRadius: '35dp'
    });

    var avatarText = Ti.UI.createLabel({
        top: '5dp',
        text: L('LOGIN'),
        color: liferay.settings.screens.drawer.selectColor,
        font: liferay.fonts.h1
    });

    function updateUI(session) {
        if (session) {
            var name = session.user.firstName + ' ' + session.user.lastName;
            var email = session.user.emailAddress;

            // update form stuff
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, liferay.settings.server.eventSurveyId, 'NAME', name);
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, liferay.settings.server.eventSurveyId, 'EMAIL', email);
            liferay.forms.saveSurveyAnswers();

        var portraitId = session.user.portraitId;
            headerImg.image = 'https://www.liferay.com/image/user_portrait?img_id=' + portraitId;
            avatarText.text = name;

            if (section.items[section.items.length - 1].properties.itemId != 'logout') {
                var logoutItems = [{
                    image: {
                        image: '/images/drawer/Sign-Out-Icon.png'
                    },
                    title: {
                        text: L('LOGOUT')
                    },
                    properties: {
                        itemId: 'logout',
                        selectedBackgroundColor: liferay.settings.screens.drawer.selectColor
                    },
                    onSelect: function () {
                        // prompt for logout
                         var alertDialog = Titanium.UI.createAlertDialog({
                            title: L('LOGOUT'),
                            message: L('LOGOUT_CONFIRM'),
                            buttonNames: [L('YES'), L('NO')],
                            cancel: 1
                        });
                        alertDialog.addEventListener('click', function (e) {
                            if (e.index == 0) {
                                liferay.drawer.performLogout(true);
                                updateUI(null);
                            }
                        });
                        alertDialog.show();

                    }
                }];
                if (liferay.model.android) {
                    logoutItems[0].properties.height = '50dp';
                }
                section.appendItems(logoutItems, {animated: true});
            }
        } else {
            headerImg.image = '/images/silhouette.png';
            avatarText.text = L('LOGIN');

            // remove last logout item
            section.deleteItemsAt(section.items.length - 1, 1, {animated: true});
        }
    }

    headerView.addEventListener('click', function (e) {
        if (liferay.drawer.loggedIn) {
            updateUI(liferay.drawer.session);
        }
        liferay.drawer.performLogin(true, function (session) {
            updateUI(session);
            liferay.controller.registerForEventPush();

        }, function (err) {
            liferay.tools.toastNotification(null, L('LOGIN_FAILED'), window);
        });
    });

    headerSpacer.add(headerImg);
    headerSpacer.add(avatarText);
    headerSpacer.add(Ti.UI.createView({
        backgroundColor: 'transparent',
        width: Ti.UI.FILL,
        height: '10dp'
    }));

    headerView.add(headerSpacer);

    // drawer menu
    liferay.drawer.menuListView = Ti.UI.createListView({
        height: Ti.UI.FILL,
        width: Ti.UI.FILL,
        templates: liferay.list_templates.drawer_menu,
        defaultItemTemplate: 'no_notification',
        backgroundColor: '#1f1f1f',
        separatorColor: '#333333',
        headerView: headerView
    });


    liferay.drawer.menuListView.addEventListener('itemclick', function(e) {

        if (liferay.model.iOS) {
            liferay.drawer.menuListView.deselectItem(e.sectionIndex, e.itemIndex);
        }

        var item = section.getItemAt(e.itemIndex);

        if (e.itemId == 'logout' && item && item.onSelect) {
            item.onSelect();
            return;
        }

        shader.fireEvent('click', {
            source: shader
        });

        if (item && item.onSelect) {
            item.onSelect(item);
        } else {
            var view = liferay.screens[e.itemId];
            if (view) {
                liferay.controller.open(view.render(), view);
            }
        }
    });

    var section = Ti.UI.createListSection();

    items = items.filter(function(item) {
        if (item.enabled) {
            return item.enabled();
        } else {
            return true;
        }
    });

    items.forEach(function(item) {
        item.properties.selectedBackgroundColor = liferay.settings.screens.drawer.selectColor;
        if (liferay.model.android) {
            item.properties.height = '50dp';
        }
    });

    section.setItems(items);
    liferay.drawer.menuListView.setSections([section]);
    menuView.add(liferay.drawer.menuListView);

    control.toggle = false;
    control.addEventListener('click', function(e) {
        if (!control.touchEnabled) return;
        if (!e.source.toggle) {
            shader.touchEnabled = true;
            liferay.model.iOS && shader.animate({
                opacity: 0.4,
                duration: 250
            });
            menuView.animate({
                left: 0,
                duration: 200,
                curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
            });
            window.getChildren().forEach(function(child) {
                if (child != menuView)
                child.animate({
                    left: '60%',
                    duration: 400,
                    curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
                });
            });
        } else {
            shader.touchEnabled = false;
            liferay.model.iOS && shader.animate({
                opacity: 0,
                duration: 250
            });
            menuView.animate({
                left: 0 - liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth *.6),
                duration: 400,
                curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
            });
            window.getChildren().forEach(function(child) {
                if (child != menuView)
                    child.animate({
                        left: 0,
                        duration: 200,
                        curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
                    });
            });

        }

        e.source.toggle = !e.source.toggle;
    });

    shader.addEventListener('click', function(e) {
        shader.touchEnabled = false;
        liferay.model.iOS && shader.animate({
            opacity: 0,
            duration: 250
        });
        menuView.animate({
            left: 0 - liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth *.6),
            duration: 400,
            curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
        });
        window.getChildren().forEach(function(child) {
            if (child != menuView)
                child.animate({
                    left: 0,
                    duration: 200,
                    curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
                });
        });

        control.toggle = false;
    });

    function doAutoLogin() {
        var actind = Ti.UI.createActivityIndicator({
            color: 'white'
        });

        if (!liferay.drawer.loggedIn) {
            headerView.add(actind);
            actind.show();
            liferay.drawer.performLogin(false, function (session){
                actind.hide();
                headerView.remove(actind);
                if (session) {
                    liferay.drawer.loggedIn = true;
                    liferay.drawer.session = session;
                    updateUI(session);
                    liferay.controller.registerForEventPush();
                }
            }, function (err) {
                actind.hide();
                headerView.remove(actind);
                console.log("FAILED to autologin: " + err);
            });
        } else {
            updateUI(liferay.drawer.session);
        }

    }

    doAutoLogin();
    // start a timer to attempt autologin every so often
    setInterval(doAutoLogin, 30000);
};

liferay.drawer.getEmailAddress = function() {
    if (liferay.drawer.session) {
        return liferay.drawer.session.user.emailAddress;
    }

    return '';
};

liferay.drawer.performLogin = function(showForm, onSuccess, onFailure) {

    if (!secureProperties) {
        if (showForm) {
            liferay.tools.alert(L('ALERT'), "No credential storage available, login impossible");
        }
        liferay.drawer.performLogout(true);
        onFailure("no credential storage");
        return;
    }

    var username = secureProperties.getString("liferay.events.username", "");
    var password = secureProperties.getString("liferay.events.password", "");
    if (!showForm && (!username || !password)) {
        onFailure && onFailure("no username or password");
        return;
    }

    function showOrSkip() {
        liferay.drawer.showLoginScreen(username, function(validUsername, validPassword, validSession) {
            if (validUsername && validPassword && validSession) {
                secureProperties.setString("liferay.events.username", validUsername);
                secureProperties.setString("liferay.events.password", validPassword);
                liferay.drawer.loggedIn = true;
                liferay.drawer.session = validSession;
                onSuccess && onSuccess(validSession);
            } else {
                /* user decided to skip login */
                liferay.drawer.performLogout(true);
            }
        });
    }

    if ((!username || !password) && showForm) {
        showOrSkip();
    } else {
        // autologin
        liferay.drawer.getSession(username, password, onSuccess, function() {
            if (showForm) {
                // autologin failed after click, so show form if user requested login
                showOrSkip();
            } else {
                onFailure && onFailure();
            }

        });
    }

};

liferay.drawer.showLoginScreen = function(username, callback) {

    var win = Ti.UI.createWindow({
        windowSoftInputMode: (liferay.model.android ? Ti.UI.Android.SOFT_INPUT_ADJUST_PAN : null),
        navBarHidden: true,
        tabBarHidden: true,
        fullscreen: true,
        backgroundColor: '#333333',
        backgroundImage: '/images/blur-@2x.png'
    });

    var container = Ti.UI.createView({
        width: '90%',
        height: Ti.UI.SIZE,
        layout: 'vertical',
        top: '20%'
    });

    var usernameContainer = Ti.UI.createView({
        top: '10dp',
        backgroundColor: 'white',
        height: liferay.model.android ? Ti.UI.SIZE : liferay.fonts.H5Size,
        width: '85%',
        borderColor: 'white',
        borderSize: '2dp',
        borderRadius: '5dp'
    });

    var userIconContainer = Ti.UI.createView({
        left: 0,
        width: '25%',
        height: Ti.UI.FILL
    });


    var userIcon = Ti.UI.createImageView({
        image: '/images/silhouette.png',
        width: '20dp',
        height: '20dp',
        left: '4dp'
    });

    var usernameField = Ti.UI.createTextField({
        width: '75%',
        value: username,
        font: liferay.fonts.h4,
        height: Ti.UI.FILL,
        color: '#333333',
        backgroundColor: 'white',
        hintText: L('FMT_EMAIL'),
        hintTextColor: '#aaaaaa'
    });

    userIconContainer.add(userIcon);
    usernameContainer.add(userIconContainer);
    usernameContainer.add(usernameField);

    // password
    var passwordContainer = Ti.UI.createView({
        top: '10dp',
        backgroundColor: 'white',
        height: liferay.model.android ? Ti.UI.SIZE : liferay.fonts.H5Size,
        width: '85%',
        borderColor: 'white',
        hintTextColor: '#aaaaaa',
        borderSize: '2dp',
        borderRadius: '5dp'
    });

    var passwordIconContainer = Ti.UI.createView({
        left: 0,
        width: '25%',
        height: Ti.UI.FILL
    });


    var passwordIcon = Ti.UI.createImageView({
        image: '/images/lock.png',
        width: '20dp',
        height: '20dp',
        left: '4dp'
    });

    var passwordField = Ti.UI.createTextField({
        width: '75%',
        value: '',
        height: Ti.UI.FILL,
        font: liferay.fonts.h4,
        color: '#333333',
        backgroundColor: 'white',
        hintText: L('PASSWORD'),
        passwordMask: true
    });

    [usernameField, passwordField].forEach(function(field) {
        field.addEventListener('change', function(e) {
            if (usernameField.value && passwordField.value) {
                loginButton.backgroundColor = liferay.settings.screens.drawer.selectColor;
                loginButton.borderColor = liferay.settings.screens.drawer.selectColor;
                loginButton.color = 'white';
                loginButton.enabled = true;
            } else {
                loginButton.backgroundColor = '#888888';
                loginButton.borderColor = '#888888';
                loginButton.color = '#222222';
                loginButton.enabled = false;
            }
        });
    });
    passwordIconContainer.add(passwordIcon);
    passwordContainer.add(passwordIconContainer);
    passwordContainer.add(passwordField);

    var loginButtonContainer = Ti.UI.createView({
        height: Ti.UI.SIZE,
        top: '20dp',
        width: '85%'
    });

    var loginButton = Ti.UI.createButton({
        title: L('LOGIN'),
        font: liferay.fonts.h4,
        color: '#222222',
        backgroundColor: '#888888',
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        borderColor: '#888888',
        borderSize: '2dp',
        borderRadius: '5dp',
        enabled: false
    });

    var skipButton = Ti.UI.createButton({
        left: '10dp',
        font: liferay.fonts.h4,
        color: liferay.settings.screens.drawer.selectColor,
        title: L('CANCEL')
    });
    var registerButton = Ti.UI.createButton({
        title: L('REGISTER'),
        font: liferay.fonts.h4,
        color: liferay.settings.screens.drawer.selectColor,
        right: '10dp'
    });

    var labelContainer = Ti.UI.createView({
        width: '80%',
        height: Ti.UI.SIZE,
        top: '20dp'
    });

    labelContainer.add(skipButton);
    labelContainer.add(registerButton);

    var logo = Ti.UI.createImageView({
        image: '/images/lrlogo-rounded.png',
        width: '100dp',
        height: '100dp'
    });

    var comLabel = Ti.UI.createLabel({
        text: 'liferay.com',
        font: liferay.fonts.h4,
        color: 'white',
        top: '10dp'
    });

    loginButtonContainer.add(loginButton);
    container.add(logo);
    container.add(comLabel);
    container.add(usernameContainer);
    container.add(passwordContainer);
    container.add(loginButtonContainer);
    container.add(labelContainer);

    var sv = Ti.UI.createScrollView({
        width: Ti.UI.FILL,
        height: Ti.UI.FILL,
        scrollType: 'vertical',
        showHorizontalScrollIndicator:false,
        showVerticalScrollIndicator: false,
        contentWidth: 'auto',
        backgroundColor: 'transparent',
        contentHeight: 'auto'
    });
    sv.add(container);
    win.add(sv);

    registerButton.addEventListener('click', function(e) {
        var url = 'https://www.liferay.com/home?p_p_id=58&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&saveLastPath=0&_58_struts_action=%2Flogin%2Fcreate_account';
        liferay.ui.openWebPageLight(url, L('REGISTER'), function(resultUrl) {
            var XCallbackURL = require('lib/XCallbackURL');

            var URL = XCallbackURL.parse(resultUrl);

            var newEmail = URL.param('_58_login');

            if (newEmail) {
                usernameField.value = newEmail;
                liferay.tools.toastNotification(null, L('REGISTER_SUCCESS'), win);
                return true;
            }

            return false;

        });
    });


    skipButton.addEventListener('click', function(e) {
        win.close();
        callback(null, null, null);
    });

    loginButton.addEventListener('click', function(e) {
        if (!usernameField.value || !passwordField.value) {
            liferay.tools.toastNotification(null, L('LOGIN_FAILED'), win);
        }
        liferay.tools.showSpinner({
            verticalCentered: true,
            right: '20dp',
            container: loginButtonContainer
        });
        loginButton.backgroundColor = '#888888';
        loginButton.borderColor = '#888888';
        loginButton.color = '#222222';
        loginButton.enabled = false;
        secureProperties.setString("liferay.events.username", usernameField.value);
        secureProperties.setString("liferay.events.password", passwordField.value);

        liferay.drawer.getSession(usernameField.value, passwordField.value, function(sess) {
            liferay.tools.hideSpinner();
            callback(usernameField.value, passwordField.value, sess);
            win.close();
        }, function(err) {
            liferay.tools.hideSpinner();
            liferay.tools.toastNotification(null, L('LOGIN_FAILED'), win);
            loginButton.backgroundColor = liferay.settings.screens.drawer.selectColor;
            loginButton.borderColor = liferay.settings.screens.drawer.selectColor;
            loginButton.color = 'white';
            loginButton.enabled = true;
        });
    });
    win.open({animated: true});

};

liferay.drawer.getSession = function(username, password, onSuccess, onFailure) {
    try {
        liferay_connector.authenticate('https://www.liferay.com', {
            login: username,
            password: password
        }, function (err, session) {
            if (err) {
                console.log(JSON.stringify(err));
                onFailure && onFailure(err.message);
            } else {
                onSuccess && onSuccess(session);
            }

        });
    } catch (ex) {
        onFailure && onFailure(String.format(L('FAILED_UPDATE_NETWORK_1'), ex));
    }
};

liferay.drawer.performLogout = function(wipePassword) {
    if (wipePassword) {
        secureProperties.removeProperty("liferay.events.password");
    }
    liferay.drawer.session = null;
    liferay.drawer.loggedIn = false;
};