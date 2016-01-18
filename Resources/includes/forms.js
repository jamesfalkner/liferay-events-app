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
liferay.forms = {};


liferay.forms.showSimpleForm = function(options) {

    var formShader = Ti.UI.createView({
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity:0.85
    });

    var formRound = Ti.UI.createView({
        left: '5%',
        top: '5%',
        width: '90%',
        height: '90%',
        backgroundColor: 'white',
        borderRadius: '10dp',
        borderWidth: '5dp',
        borderColor: 'white',
        layout: 'vertical'
    });

    var formScroll = Ti.UI.createScrollView({

        left: '5%',
        top: '2.5%',
        width: '90%',
        height: '80%',
        scrollType: 'vertical',
        showHorizontalScrollIndicator:false,
        showVerticalScrollIndicator: true,
        contentWidth: 'auto',
        backgroundColor: 'transparent',
        contentHeight: 'auto'
    });

    var formContainer = Ti.UI.createView({
        left: 0,
        top: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        backgroundColor: 'transparent',
        layout: 'vertical'
    });

    formContainer.add(Ti.UI.createLabel({
        top: 0,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.title.toUpperCase(),
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h4,
        color: '#84A8C8'
    }));

    formContainer.add(Ti.UI.createLabel({
        top: '2dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.subTitle,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h3,
        color: '#84A8C8'
    }));

    formContainer.add(Ti.UI.createLabel({
        top: '2dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.subHeading,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h1,
        color: '#84A8C8'
    }));

    formContainer.add(Ti.UI.createLabel({
        top: '5dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.instructions,
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        font: liferay.fonts.h2,
        color: 'black'
    }));

    options.questions.forEach(function(el) {
        formContainer.add(el.question);
    });

    // a little space at the bottom
    formContainer.add(Ti.UI.createView({
        left: 0,
        top: 0,
        width: Ti.UI.FILL,
        height: '25dp',
        backgroundColor: 'transparent'
    }));

    var btnContainer = Ti.UI.createView({
        bottom: 0,
        left: 0,
        width: Ti.UI.FILL,
        backgroundColor: 'transparent',
        height: '20%'
    });

    var btnCenterer = Ti.UI.createView({
        layout: 'vertical',
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE
    });

    var submitBtn = Ti.UI.createButton({
        title: '  ' + options.sendButtonText + '  ',
        font:  liferay.fonts.h4
    });
    var closebtn = Ti.UI.createButton({
        title: '  ' + options.dismissText + '  ',
        font: liferay.fonts.h4,
        top: options.readOnly? 0 : '10dp'
    });

    closebtn.addEventListener('click', function(e) {
        liferay.controller.getCurrentWindow().remove(formShader);
        liferay.controller.getCurrentWindow().remove(formRound);
        options.onClose && options.onClose();
    });

    function processSubmit(e) {
        if (options.confirm) {
            var alertDialog = Titanium.UI.createAlertDialog({
                title: options.title,
                message: options.submitConfirm,
                buttonNames: [L('YES'), L('NO')]
            });
            alertDialog.addEventListener('click', function (e) {
                if (e.index == 0) {
                    options.onSubmit(function () {
                        liferay.controller.getCurrentWindow().remove(formShader);
                        liferay.controller.getCurrentWindow().remove(formRound);
                    }, function(err) {
                        e.source.setTouchEnabled(true);
                    });
                }
            });

            alertDialog.show();
        } else {
            options.onSubmit(function () {
                liferay.controller.getCurrentWindow().remove(formShader);
                liferay.controller.getCurrentWindow().remove(formRound);
            }, function(err) {
                e.source.setTouchEnabled(true);
            });
        }
    }

    function submit(e) {
        e.source.setTouchEnabled(false);
        if (options.validate) {
            options.validate(function (success, err) {
                if (!success) {
                    e.source.setTouchEnabled(true);
                    liferay.tools.alert(L('ALERT'), err);
                } else {
                    processSubmit(e);
                }
            });
        } else {
            processSubmit(e);
        }
    }

    submitBtn.addEventListener('click', submit);

    options.questions.forEach(function(el) {
        if (el.validateEvent) {
            el.question.addEventListener(el.validateEvent, submit);
        }
    });

    btnCenterer.add(submitBtn);
    btnCenterer.add(closebtn);

    btnContainer.add(Ti.UI.createView({
        left: 0,
        top: 0,
        width: Ti.UI.FILL,
        height: '3dp',
        backgroundColor: '#CCCCCC'
    }));
    btnContainer.add(btnCenterer);

    formScroll.add(formContainer);
    formRound.add(formScroll);
    formRound.add(btnContainer);

    liferay.controller.getCurrentWindow().add(formShader);
    liferay.controller.getCurrentWindow().add(formRound);
};

liferay.forms.showForm = function(options) {

    var surveyShader = Ti.UI.createView({
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity:0.85
    });

    var surveyRound = Ti.UI.createView({
        left: '5%',
        top: '5%',
        width: '90%',
        height: '90%',
        backgroundColor: 'white',
        borderRadius: '10dp',
        borderWidth: '5dp',
        borderColor: 'white'
    });

    var surveyScroll = Ti.UI.createScrollView({

        left: '5%',
        top: '2.5%',
        width: '90%',
        height: '77.5%',
        scrollType: 'vertical',
        showHorizontalScrollIndicator:false,
        showVerticalScrollIndicator: true,
        contentWidth: 'auto',
        backgroundColor: 'transparent',
        contentHeight: 'auto'
    });

    var surveyContainer = Ti.UI.createView({
        left: '2%',
        top: 0,
        width: '96%',
        height: Ti.UI.SIZE,
        backgroundColor: 'transparent',
        layout: 'vertical'
    });

    surveyContainer.add(Ti.UI.createLabel({
        top: 0,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.title,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h4,
        color: '#84A8C8'
    }));

    surveyContainer.add(Ti.UI.createLabel({
        top: '2dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.subTitle,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h3,
        color: '#84A8C8'
    }));

    surveyContainer.add(Ti.UI.createLabel({
        top: '2dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.subSubTitle,
        textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
        font: liferay.fonts.h1,
        color: '#84A8C8'
    }));

    surveyContainer.add(Ti.UI.createLabel({
        top: '5dp',
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        text: options.intro,
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        font: liferay.fonts.h2,
        color: 'black'
    }));

    if (options.webView) {
        var webview = Ti.UI.createWebView({
            top: '5dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            url: options.webView,
            touchEnabled: false,
            ignoreSslError: true
        });
        if (liferay.model.iOS) {
            webview.willHandleTouches = false;
        }

        surveyContainer.add(webview);
    }
    options.headerFields.forEach(function(el) {
        surveyContainer.add(el);
    });

    // separator
    surveyContainer.add(Ti.UI.createView({
        left: 0,
        top: '25dp',
        width: Ti.UI.FILL,
        height: '1dp',
        backgroundColor: '#CCCCCC'
    }));
//
    // questions:
    // [
    //   {
    //     type: type,
    //     question: question,
    //     extras: ['yes', 'no']
    //   }, ...
    // ]
    var questions = liferay.forms.buildQuestions(options.questionSpec);
    for (var i = 0; i < questions.length; i++) {
        var question = questions[i];

        var currentAnswer = liferay.forms.getSurveyAnswer(options.event, [options.surveyId], question.question);

        var lbl = Ti.UI.createLabel({
            top: '25dp',
            left: 0,
            width: '100%',
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            color: '#84A8C8',
            text: question.question,
            font: liferay.fonts.h3
        });
        surveyContainer.add(lbl);

        if (question.type.toLowerCase() == "text") {
            surveyContainer.add(liferay.forms.makeTextQuestion(question.question, options.surveyId, currentAnswer, '5dp', options.controlWindow));
        } else if (question.type.toLowerCase() == "textarea") {
            surveyContainer.add(liferay.forms.makeTextAreaQuestion(question.question, options.surveyId, currentAnswer, '5dp', options.controlWindow));
        } else if (question.type.toLowerCase() == "rating") {
            surveyContainer.add(liferay.forms.makeSlider(question.question, options.surveyId, currentAnswer, '5dp', 10));
        } else if (question.type.toLowerCase() == "option") {
            var qoptions = question.extras;
            if (liferay.model.android) {
                surveyContainer.add(liferay.forms.makeOptionAndroid(question.question, options.surveyId, qoptions, currentAnswer, '5dp'));
            } else {
                surveyContainer.add(liferay.forms.makeOption(question.question, options.surveyId, qoptions, currentAnswer, '5dp'));
            }
        } else if (question.type.toLowerCase() == "option-multiple") {
            var mOptions = question.extras;
            var curAns = currentAnswer ? JSON.parse(currentAnswer) : [];
            if (liferay.model.android) {
                surveyContainer.add(liferay.forms.makeOptionMultipleAndroid(question.question, options.surveyId, mOptions, curAns, '5dp'));
            } else {
                surveyContainer.add(liferay.forms.makeOptionMultiple(question.question, options.surveyId, mOptions, curAns, '5dp'));
            }
        }
    }
    if (options.readOnly) {
        liferay.forms.recursiveDisable(surveyContainer);
    }
    /*
     submit button colors on survey
     whitespace at bottom of survey
     */
    // a little space at the bottom
    surveyContainer.add(Ti.UI.createView({
        left: 0,
        top: 0,
        width: Ti.UI.FILL,
        height: '75dp',
        backgroundColor: 'transparent'
    }));

    var btnContainer = Ti.UI.createView({
        bottom: 0,
        left: 0,
        width: Ti.UI.FILL,
        backgroundColor: 'transparent',
        height: '20%'
    });

    var btnCenterer = Ti.UI.createView({
        layout: 'vertical',
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE
    });

    var submitBtn = Ti.UI.createButton({
        title: '  ' + options.sendButtonText + '  ',
        font:  liferay.fonts.h4
    });
    var closebtn = Ti.UI.createButton({
        title: '  ' + options.dismissText + '  ',
        font: liferay.fonts.h4,
        top: options.readOnly? 0 : '10dp'
    });
    closebtn.addEventListener('click', function(e) {
        liferay.forms.saveSurveyAnswers();
        liferay.controller.getCurrentWindow().remove(surveyShader);
        liferay.controller.getCurrentWindow().remove(surveyRound);
        if (options.onClose()) options.onClose();
    });
    submitBtn.addEventListener('click', function(e) {

        var alertDialog = Titanium.UI.createAlertDialog({
            title : options.submitDialogTitle,
            message : options.submitDialogText,
            buttonNames : [L('YES'), L('NO')]
        });
        alertDialog.addEventListener('click', function(e) {
            if (e.index == 0) {
                liferay.forms.saveSurveyAnswers();
                liferay.forms.submitAnswers(options.event, options.surveyId, function(response) {
                    liferay.tools.surveyAnswers.forEach(function(el) {
                        if (el.eventId == options.event.eventid && el.surveyId == options.surveyId) {
                            el.submitted = true;
                        }
                    });
                    liferay.forms.saveSurveyAnswers();
                    if (!options.closeTest || options.closeTest(response)) {
                        liferay.controller.getCurrentWindow().remove(surveyShader);
                        liferay.controller.getCurrentWindow().remove(surveyRound);
                    }
                    options.onSuccess(response);
                }, function(err) {
                    options.onFail(err);
                });
            } else {

            }
        });

        alertDialog.show();
    });

    if (options.readOnly) {
        closebtn.title = '  ' + L('CLOSE') + ' ';
        btnCenterer.add(closebtn);
    } else {
        btnCenterer.add(submitBtn);
        btnCenterer.add(closebtn);
    }
    btnContainer.add(Ti.UI.createView({
        left: 0,
        top: 0,
        width: Ti.UI.FILL,
        height: '3dp',
        backgroundColor: '#CCCCCC'
    }));
    btnContainer.add(btnCenterer);
//	surveyContainer.add(btnContainer);

    surveyScroll.add(surveyContainer);
    surveyRound.add(surveyScroll);
    surveyRound.add(btnContainer);

    liferay.controller.getCurrentWindow().add(surveyShader);
    liferay.controller.getCurrentWindow().add(surveyRound);
    if (options.readOnly) {
        liferay.tools.alert(L('NOTE'), L('SURVEY_READONLY'));
    }
};

liferay.forms.recursiveDisable = function(view) {
    view.getChildren().forEach(function(el) {
        liferay.forms.recursiveDisable(el);
    });
    view.setEnabled(false);
    view.setTouchEnabled(false);
};

liferay.forms.buildQuestions = function(qStr) {
    // questions:
    // [
    //   {
    //     type: type,
    //     question: question,
    //   }, ...
    // ]

    var questions = [];
    var parts = qStr.trim().split('~~');
    parts.forEach(function(el) {
        var elTrim = el.trim();
        if (!elTrim) {
            return;
        }
        var typeSpec = elTrim.split('^^');
        if (!typeSpec || typeSpec.length < 2) {
            return;
        }

        var type = typeSpec[0].trim();
        var question = typeSpec[1].trim();
        var extras = [];
        if (typeSpec.length > 2) {
            typeSpec.slice(2).forEach(function(el2) {
                if (el2.trim() != "") {
                    extras.push(el2.trim());
                }
            });
        }
        questions.push({
            type: type,
            question: question,
            extras: extras
        });
    });

    return questions;
};

liferay.forms.submitAnswers = function(event, surveyId, onSuccess, onError) {

    var eventid = event.eventid;
    if (!eventid) {
        onError("No event ID");
        return;
    }

    var currentAnswers = null;
    liferay.tools.surveyAnswers.forEach(function(el) {
        if (el.eventId == eventid && el.surveyId == surveyId) {
            currentAnswers = el.answers;
        }
    });

    if (!currentAnswers) {
        onError(L('SURVEY_NO_ANSWERS'));
        return;
    }

    liferay.tools.createFloatingMessage({
        container: liferay.controller.getCurrentWindow(),
        text     : L('SAVING_SURVEY')
    });
    Request({
        method	: 'POST',
        url      : liferay.settings.server.servicesHost.host + liferay.settings.server.servicesHost.surveyServiceEndpoint,
        params   : {
            event: eventid,
            surveyId: surveyId,
            name : Ti.Platform.id,
            answers: JSON.stringify(currentAnswers)
        },
        onSuccess: function (response) {
            liferay.tools.hideFloatingMessage();
            var stat = response.stat;
            if (stat == 'ok') {
                onSuccess(response.response);
            } else {
                onError(stat);
            }
        },
        onFailure: function (msg, resp) {
            liferay.tools.hideFloatingMessage();
            onError(msg);
        }
    });
};

liferay.forms.makeHeaderField = function(questionId, ratingIds, hintText, currentVal, top) {
    var tf = Ti.UI.createTextField({
        top: top,
        left: 0,
        width: '95%',
        height: liferay.model.iPad ? (liferay.fonts.H2Size * 1.5) : Ti.UI.SIZE,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        font: liferay.fonts.h2,
        color: 'black',
        hintText: hintText,
        hintTextColor: '#444444',
        hintColorText: '#444444',
        value: currentVal ? currentVal : ""
    });

    if (liferay.model.android) {
        tf.backgroundColor = 'transparent';
        tf.backgroundImage = '/images/notes.png';
    }

    if (questionId.toLowerCase().indexOf("email") != -1) {

        tf.keyboardType = Ti.UI.KEYBOARD_EMAIL;
    }

    tf.addEventListener('change', function(e) {
        ratingIds.forEach(function(ratingId) {
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, e.value);
        });
        liferay.forms.saveSurveyAnswers();
    });

    if (currentVal) {
        ratingIds.forEach(function(ratingId) {
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, currentVal);
        });
        liferay.forms.saveSurveyAnswers();
    }

    return tf;

};

liferay.forms.makeTextQuestion = function(questionId, ratingId, currentAnswer, top, win) {
    var tf = Ti.UI.createTextField({
        top: top,
        left: 0,
        width: '95%',
        height: liferay.model.iPad ? (liferay.fonts.H2Size * 1.5) : Ti.UI.SIZE,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        font: liferay.fonts.h2,
        color: 'black',
        value: currentAnswer?currentAnswer:""
    });

    if (liferay.model.android) {
        tf.backgroundColor = 'transparent';
        tf.backgroundImage = '/images/notes.png';
    }

    tf.addEventListener('change', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, e.value);
        liferay.forms.saveSurveyAnswers();
    });

    if (currentAnswer) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, currentAnswer);
        liferay.forms.saveSurveyAnswers();
    }

    if (win) {
        win.addEventListener('click', function (e) {
            if (!/(TextField|TextArea)/.test(e.source.toString())) {
                tf.blur();
            }
        });
    }
    return tf;
};

liferay.forms.makeTextAreaQuestion = function(questionId, ratingId, currentAnswer, top, win) {

    var ta = Ti.UI.createTextArea({
        top: top,
        left: 0,
        width: '95%',
        height: '200dp',
        backgroundImage: "/images/notes.png",
        backgroundColor: "transparent",
        borderRadius: '5dp',
        borderWidth: '1dp',
        borderColor: '#DDDDDD',
        color: 'black',
        font: liferay.fonts.h2,
        textAlign: 'left',
        enableReturnKey: true,
        autocorrect : true,
        tintColor : "black",
        suppressReturn: false,
        value: currentAnswer?currentAnswer:""
    });

    if (win) {
        win.addEventListener('click', function (e) {
            if (!/(TextField|TextArea)/.test(e.source.toString())) {
                ta.blur();
            }
        });
    }

    if (liferay.model.android) {
        ta.color = 'black';
    }
    ta.addEventListener('change', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, e.value);
        liferay.forms.saveSurveyAnswers();
    });
    if (currentAnswer) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, currentAnswer);
        liferay.forms.saveSurveyAnswers();
    }
    return ta;
};

liferay.forms.makeSlider = function(questionId, ratingId, currentAnswer, top, maxValue) {

    var questionContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'horizontal'
    });

    var slider = Titanium.UI.createSlider({
        top: 0,
        left: 0,
        min: 1,
        max: maxValue,
        width: '80%',
        height: Ti.UI.SIZE,
        value: currentAnswer?currentAnswer:Math.round(maxValue / 2)
    });

    questionContainer.add(slider);


    var sliderLabel = Ti.UI.createLabel({
        text: slider.value,
        width: '15%',
        left: '3%',
        color: 'black',
        height: Ti.UI.SIZE,
        font: liferay.fonts.h3,
        textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
    });

    slider.addEventListener('change', function(e) {
        sliderLabel.text = Math.round(e.value);
    });

    slider.addEventListener('stop', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, Math.round(e.value));
        liferay.forms.saveSurveyAnswers();
    });

    liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, Math.round(currentAnswer?currentAnswer:Math.round(maxValue / 2)));
    liferay.forms.saveSurveyAnswers();


    questionContainer.add(sliderLabel);
    return questionContainer;
};

liferay.forms.makeOption = function(questionId, ratingId, options, currentAnswer, top) {


    var btnSize = liferay.tools.getDp(liferay.settings.screens.survey.buttons.psize *
    Titanium.Platform.displayCaps.platformWidth);

    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var icons = [];
    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            rowIndex: idx,
            touchEnabled: true,
            answerValue: el
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            top: 0,
            width: '15%',
            touchEnabled: false,
            height: Ti.UI.SIZE
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            touchEnabled: false,
            width: '85%',
            height: Ti.UI.SIZE
        });

        var icon = Ti.UI.createImageView({
            top: 0,
            width: btnSize,
            height: btnSize,
            image: liferay.settings.screens.survey.buttons.off.image,
            iconIndex: idx,
            touchEnabled: false
        });

        icons.push(icon);

        swContainer.add(icon);

        if (currentAnswer && currentAnswer == el) {
            icon.image = liferay.settings.screens.survey.buttons.on.image;
        }

        var optLbl = Ti.UI.createLabel({
            top: '5dp',
            text: el,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            color: 'black',
            font: liferay.fonts.h3,
            touchEnabled: false
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        rowContainer.addEventListener('click', function(e) {
            var selectedRow = e.source.rowIndex;
            var selectedAnswer = e.source.answerValue;
            icons.forEach(function(ic) {
                if (ic.iconIndex == selectedRow) {
                    ic.image = liferay.settings.screens.survey.buttons.on.image;
                } else {
                    ic.image = liferay.settings.screens.survey.buttons.off.image;
                }
            });
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, selectedAnswer);
            liferay.forms.saveSurveyAnswers();
        });
    });

    return optContainer;
};

liferay.forms.makeOptionMultiple = function(questionId, ratingId, options, currentAnswer, top) {

    var btnSize = liferay.tools.getDp(liferay.settings.screens.survey.buttons.psize *
    Titanium.Platform.displayCaps.platformWidth);

    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var icons = [];
    var answers = [];
    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            rowIndex: idx,
            touchEnabled: true,
            answerValue: el
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            top: 0,
            width: '15%',
            height: Ti.UI.SIZE,
            touchEnabled: false
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            width: '85%',
            height: Ti.UI.SIZE,
            touchEnabled: false
        });

        var icon = Ti.UI.createImageView({
            top: 0,
            width: btnSize,
            height: btnSize,
            image: liferay.settings.screens.survey.buttons.off.image,
            iconIndex: idx,
            touchEnabled: false
        });

        icons.push(icon);

        swContainer.add(icon);
        answers.push(el);
        currentAnswer.forEach(function(ans) {
            if (ans == el) {
                icon.image = liferay.settings.screens.survey.buttons.on.image;
            }
        });


        var optLbl = Ti.UI.createLabel({
            top: '4dp',
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            text: el,
            color: 'black',
            font: liferay.fonts.h3,
            touchEnabled: false
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        rowContainer.addEventListener('click', function(e) {
            var selectedRow = e.source.rowIndex;
            if (icons[selectedRow].image == liferay.settings.screens.survey.buttons.on.image) {
                icons[selectedRow].image = liferay.settings.screens.survey.buttons.off.image;
            } else {
                icons[selectedRow].image = liferay.settings.screens.survey.buttons.on.image;
            }

            var newAnswerSet = [];
            answers.forEach(function(ansEl, ansIdx) {
                if (icons[ansIdx].image == liferay.settings.screens.survey.buttons.on.image) {
                    newAnswerSet.push(ansEl);
                }
            });
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, JSON.stringify(newAnswerSet));
            liferay.forms.saveSurveyAnswers();
        });
    });

    return optContainer;
};

liferay.forms.makeOptionAndroid = function(questionId, ratingId, options, currentAnswer, top) {


    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var switches = [];
    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            top: '2dp',
            width: '15%',
            height: Ti.UI.SIZE
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            width: '85%',
            height: Ti.UI.SIZE
        });

        var sw = Ti.UI.createSwitch({
            top: 0,
            titleOn: '',
            titleOff: '',
            style: Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
            answerValue: el,
            borderColor: 'black',
            borderWidth: '1dp'
        });

        switches.push(sw);

        swContainer.add(sw);

        if (currentAnswer && currentAnswer == el) {
            sw.setValue(true);
        }

        var optLbl = Ti.UI.createLabel({
            text: el,
            width: Ti.UI.FILL,
            height: Ti.UI.FILL,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            color: 'black',
            font: liferay.fonts.h3,
            lrsw: sw
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        optLbl.addEventListener('click', function(e) {
            if (e.source.lrsw) {
                e.source.lrsw.value = !e.source.lrsw.value;
            }
        });


        sw.addEventListener('change', function(e) {
            // if we are being turned off, then ignore
            if (!e.source.getValue()) {
                return;
            }

            var selectedAnswer = e.source.answerValue;

            switches.forEach(function(ic) {
                if (ic != e.source) {
                    ic.setValue(false);
                }
            });
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, selectedAnswer);
            liferay.forms.saveSurveyAnswers();
        });
    });
    return optContainer;
};

liferay.forms.makeOptionMultipleAndroid = function(questionId, ratingId, options, currentAnswer, top) {

    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var switches = [];

    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            top: '2dp',
            width: '15%'
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            width: '85%',
            height: Ti.UI.SIZE
        });

        var sw = Ti.UI.createSwitch({
            titleOn: '',
            titleOff: '',
            style: Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
            top: 0,
            borderColor: 'black',
            borderWidth: '1dp',
            answerValue: el
        });

        switches.push(sw);

        swContainer.add(sw);

        currentAnswer.forEach(function(ans) {
            if (ans == el) {
                sw.setValue(true);
            }
        });


        var optLbl = Ti.UI.createLabel({
            text: el,
            width: Ti.UI.FILL,
            height: Ti.UI.FILL,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            color: 'black',
            font: liferay.fonts.h3,
            lrsw: sw
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        optLbl.addEventListener('click', function(e) {
            if (e.source.lrsw) {
                e.source.lrsw.value = !e.source.lrsw.value;
            }
        });

        sw.addEventListener('change', function(e) {

            var newAnswerSet = [];
            switches.forEach(function(swEl) {
                if (swEl.getValue()) {
                    newAnswerSet.push(swEl.answerValue);
                }
            });
            liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, ratingId, questionId, JSON.stringify(newAnswerSet));
            liferay.forms.saveSurveyAnswers();
        });
    });

    return optContainer;
};

// survey:
// [
//   "eventid": name,
//   "answers": [
//      {
//        "questionId": question,
//        "answer" : answer
//      }
// ]
//

liferay.forms.getSurveyAnswer = function(event, surveyIds, questionId) {

    var eventid = event.eventid;
    if (!eventid) return null;

    for (var s = 0; s < surveyIds.length; s++) {
        var surveyId = surveyIds[s];
        for (var i = 0; i < liferay.tools.surveyAnswers.length; i++) {
            if (liferay.tools.surveyAnswers[i].eventId == eventid && liferay.tools.surveyAnswers[i].surveyId == surveyId) {
                var answers = liferay.tools.surveyAnswers[i].answers;
                for (var j = 0; j < answers.length; j++) {
                    if (answers[j].questionId == questionId) {
                        return answers[j].answer;
                    }
                }
            }
        }
    }
    return null;
};

liferay.forms.recordSurveyAnswer = function (event, surveyId, questionId, answer) {
    var eventid = event.eventid;
    if (!eventid) return;

    for (var i = 0; i < liferay.tools.surveyAnswers.length; i++) {
        if (liferay.tools.surveyAnswers[i].eventId == eventid && liferay.tools.surveyAnswers[i].surveyId == surveyId) {
            var currentAnswers = liferay.tools.surveyAnswers[i].answers;
            for (var j = 0; j < currentAnswers.length; j++) {
                if (currentAnswers[j].questionId == questionId) {
                    currentAnswers[j].answer = answer;
                    return;
                }
            }
            // if here, then no answer was found, so record it.
            currentAnswers.push({
                "questionId": questionId,
                "answer": answer
            });
            return;
        }
    }
    // if here, then no entry for the event+session
    liferay.tools.surveyAnswers.push({
        eventId: eventid,
        surveyId: surveyId,
        submitted: false,
        answers: [{
            questionId: questionId,
            answer: answer
        }]
    });
};

liferay.forms.hasSubmittedSurvey = function(event, surveyId) {
    var eventid = event.eventid;

    for (var i = 0; i < liferay.tools.surveyAnswers.length; i++) {
        if (liferay.tools.surveyAnswers[i].eventId == eventid && liferay.tools.surveyAnswers[i].surveyId == surveyId) {
            return liferay.tools.surveyAnswers[i].submitted;
        }
    }

    return false;
};

liferay.forms.loadSurveyAnswers = function () {

    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.surveyFile);

    if (file.exists()) {
        try {
            var newAns = JSON.parse(file.read());
            if (newAns) {
                liferay.tools.surveyAnswers = newAns;
            } else {
            }
        } catch (ex) {
            // contacts file unreadable, abort!
            console.log("################################ SURVEY FILE COULD NOT BE READ, ABORTING");
            return;
        }
    } else {
        if (liferay.tools.surveyAnswers) {
            if (liferay.tools.surveyAnswers.length <= 0) {
                liferay.tools.surveyAnswers = [];
            } else {

            }
        } else {
            liferay.tools.surveyAnswers = [];
        }
    }
};

liferay.forms.saveSurveyAnswers = function () {
    var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
    if (!folder.exists()) {
        folder.createDirectory();
        folder.remoteBackup = true;
    }
    var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.surveyFile);

    file.write(JSON.stringify(liferay.tools.surveyAnswers));
    file.remoteBackup = true;
};

liferay.forms.makeSimpleHeaderField = function(questionId, hintText, currentVal, top, onChange) {
    var tf = Ti.UI.createTextField({
        top: top,
        left: 0,
        width: '95%',
        height: liferay.model.iPad ? (liferay.fonts.H2Size * 1.5) : Ti.UI.SIZE,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        font: liferay.fonts.h2,
        color: 'black',
        hintText: hintText,
        hintTextColor: '#444444',
        hintColorText: '#444444',
        value: currentVal ? currentVal : ""
    });

    if (liferay.model.android) {
        tf.backgroundColor = 'transparent';
        tf.backgroundImage = '/images/notes.png';
    }

    if (questionId.toLowerCase().indexOf("email") != -1) {

        tf.keyboardType = Ti.UI.KEYBOARD_EMAIL;
    }
    if (onChange) {
        tf.addEventListener('change', onChange);
    }

    return tf;

};

liferay.forms.makeSimpleTextAreaQuestion = function(questionId, hintText, currentVal, top, win, onChange) {

    var ta = Ti.UI.createTextArea({
        top: top,
        left: 0,
        width: '95%',
        height: '200dp',
        backgroundImage: "/images/notes.png",
        backgroundColor: "transparent",
        borderRadius: '5dp',
        borderWidth: '1dp',
        borderColor: '#DDDDDD',
        color: 'black',
        enableReturnKey: true,
        autocorrect : true,
        tintColor : "black",
        font: liferay.fonts.h2,
        textAlign: 'left',
        suppressReturn: false,
        hintText: hintText,
        hintTextColor: '#444444',
        hintColorText: '#444444',
        value: currentVal?currentVal:""
    });

    if (win) {
        win.addEventListener('click', function (e) {
            if (!/(TextField|TextArea)/.test(e.source.toString())) {
                ta.blur();
            }
        });
    }

    if (liferay.model.android) {
        ta.color = 'black';
    }
    ta.addEventListener('change', onChange);

    return ta;
};

liferay.forms.makeSimpleOptionMultiple = function(questionId, options, currentVal, top, onChange) {

    var btnSize = liferay.tools.getDp(liferay.settings.screens.survey.buttons.psize *
    Titanium.Platform.displayCaps.platformWidth);

    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var icons = [];
    var answers = [];
    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            rowIndex: idx,
            touchEnabled: true,
            answerValue: el
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            width: '15%',
            height: Ti.UI.SIZE,
            touchEnabled: false
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            width: '85%',
            height: Ti.UI.SIZE,
            touchEnabled: false
        });

        var icon = Ti.UI.createImageView({
            top: 0,
            width: btnSize,
            height: btnSize,
            image: liferay.settings.screens.survey.buttons.off.image,
            iconIndex: idx,
            touchEnabled: false
        });

        icons.push(icon);

        swContainer.add(icon);
        answers.push(el);
        currentVal.forEach(function(ans) {
            if (ans == el) {
                icon.image = liferay.settings.screens.survey.buttons.on.image;
            }
        });


        var optLbl = Ti.UI.createLabel({
            top: '4dp',
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            text: el,
            color: 'black',
            font: liferay.fonts.h3,
            touchEnabled: false
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        rowContainer.addEventListener('click', function(e) {
            var selectedRow = e.source.rowIndex;
            if (icons[selectedRow].image == liferay.settings.screens.survey.buttons.on.image) {
                icons[selectedRow].image = liferay.settings.screens.survey.buttons.off.image;
            } else {
                icons[selectedRow].image = liferay.settings.screens.survey.buttons.on.image;
            }

            var newAnswerSet = [];
            answers.forEach(function(ansEl, ansIdx) {
                if (icons[ansIdx].image == liferay.settings.screens.survey.buttons.on.image) {
                    newAnswerSet.push(ansEl);
                }
            });
            if (onChange) {
                onChange(newAnswerSet);
            }
        });
    });

    return optContainer;
};

liferay.forms.makeSimpleOptionMultipleAndroid = function(questionId, options, currentVal, top, onChange) {

    var optContainer = Ti.UI.createView({
        top: top,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE,
        layout: 'vertical'
    });

    var switches = [];

    options.forEach(function(el, idx) {

        var rowContainer = Ti.UI.createView({
            top: '4dp',
            left: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE
        });

        var swContainer = Ti.UI.createView({
            left: 0,
            top: '2dp',
            width: '15%',
            height: Ti.UI.SIZE
        });

        var lblContainer = Ti.UI.createView({
            left: '15%',
            top: 0,
            width: '85%',
            height: Ti.UI.SIZE
        });

        var sw = Ti.UI.createSwitch({
            titleOn: '',
            titleOff: '',
            style: Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
            borderColor: 'black',
            borderWidth: '1dp',
            top: 0,
            color: 'black',
            answerValue: el
        });

        switches.push(sw);

        swContainer.add(sw);

        currentVal.forEach(function(ans) {
            if (ans == el) {
                sw.setValue(true);
            }
        });


        var optLbl = Ti.UI.createLabel({
            text: el,
            width: Ti.UI.FILL,
            height: Ti.UI.FILL,
            verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            color: 'black',
            font: liferay.fonts.h3,
            touchEnabled: true,
            lrsw: sw
        });

        optLbl.addEventListener('click', function(e) {
            if (e.source.lrsw) {
                e.source.lrsw.value = !e.source.lrsw.value;
            }
        });

        lblContainer.add(optLbl);

        rowContainer.add(swContainer);
        rowContainer.add(lblContainer);
        optContainer.add(rowContainer);

        sw.addEventListener('change', function(e) {

            var newAnswerSet = [];
            switches.forEach(function(swEl) {
                if (swEl.getValue()) {
                    newAnswerSet.push(swEl.answerValue);
                }
            });
            if (onChange) {
                onChange(newAnswerSet);
            }
        });
    });

    return optContainer;
};
