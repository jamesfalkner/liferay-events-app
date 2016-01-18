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


liferay.screens.pollsDetail = new liferay.classes.window();
liferay.screens.pollsDetail.className = 'liferay.screens.pollsDetail';

liferay.screens.pollsDetail.render = function () {

  var self = this;

  liferay.screens.pollsDetail.questionsAnswered = [];

  this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);
  this.window = liferay.ui.makeWindow({
    swipe: false,
    backEnabled: true,
    panelBg: this.panelBg

  });

  return this.window;
};

liferay.screens.pollsDetail.loadDetails = function (info) {

  var self = this;

  liferay.screens.pollsDetail.loadQuestionsAnswered();

  var questionArea = Ti.UI.createView({
    top: 0,
    left: 0,
    height: '18%',
    width: Ti.UI.FILL,
    backgroundColor: '#f2f2f2'
  });
  var answerArea = Ti.UI.createView({
    left: 0,
    height: '64%',
    width: Ti.UI.FILL,
    backgroundColor: 'white'
  });
  var sendButtonArea = Ti.UI.createView({
    top: '82%',
    left: 0,
    height: '18%',
    width: Ti.UI.FILL,
    backgroundColor: 'white'
  });

  var ql = Ti.UI.createLabel({
    width: '80%',
    left: '10%',
    height: Ti.UI.SIZE,
    color: 'black',
    font: liferay.fonts.h2b,
    text: info.question
  });

  questionArea.add(ql);
  questionArea.add(Ti.UI.createView({
    width: '100%',
    height: '1dp',
    bottom: 0,
    backgroundColor: '#CCCCCC'
  }));


  var alreadyAnswered = this.hasAnswered(info);

  var sendButton = Ti.UI.createButton({
    title: !alreadyAnswered ? L('SURVEY_SEND') : L('ANSWERED'),
    font: liferay.fonts.h4,
    color: '#222222',// white when enabled
    backgroundColor: '#888888',// '#f09018' when enabled
    width: '60%',
    height: Ti.UI.SIZE,
    borderColor: '#888888', // '#f09018' when enabled
    borderSize: '2dp',
    borderRadius: '2dp',
    enabled: false
  });

  sendButtonArea.add(sendButton);

  this.panelBg.add(questionArea);
  this.panelBg.add(answerArea);
  this.panelBg.add(sendButtonArea);

  var qController = null;

  function onAnswerChange(newans) {
    if (alreadyAnswered || !newans) {
      sendButton.backgroundColor = '#888888';
      sendButton.borderColor = '#888888';
      sendButton.color = '#222222';
      sendButton.touchEnabled = false;
      sendButton.enabled = false;

    } else {
      sendButton.backgroundColor = '#f09018';
      sendButton.borderColor = '#f09018';
      sendButton.color = 'white';
      sendButton.touchEnabled = true;
      sendButton.enabled = true;

    }
  }

  switch (info.questionType) {
    case 'single':
    case 'multiple':
      qController = this.loadChoiceQuestion(info, answerArea, onAnswerChange);
      break;
    case 'ranking':
      qController = this.loadRankingQuestion(info, answerArea, onAnswerChange);
      break;
    case 'rating':
      qController = this.loadRatingQuestion(info, answerArea, onAnswerChange);
      break;
    case 'text':
      qController = this.loadTextQuestion(info, answerArea, onAnswerChange);
      break;
    default:
      liferay.tools.alert(L('ERROR'), 'invalid question ' + JSON.stringify(info));
      return;
  }

  if (!alreadyAnswered) {
    sendButton.addEventListener('click', function(e) {
      sendButton.touchEnabled = false;
      sendButton.enabled = false;

      var submitfn = info.askForId ? self.collectIDAndSubmit : self.confirmAndSubmit;

      submitfn(info, qController.formAnswer(), function () {
        sendButton.title = L('ANSWERED');
        sendButton.backgroundColor = '#888888';
        sendButton.borderColor = '#888888';
        sendButton.color = '#222222';
        sendButton.touchEnabled = false;
        sendButton.enabled = false;
        alreadyAnswered = true;
      }, function (err) {
        sendButton.title = L('SEND');
        sendButton.backgroundColor = '#f09018';
        sendButton.borderColor = '#f09018';
        sendButton.color = 'white';
        sendButton.touchEnabled = true;
        sendButton.enabled = true;
      });

    });
  }

};

liferay.screens.pollsDetail.loadChoiceQuestion = function (q, view, onAnswerChange) {

  var self = this;

  var answerContainer = Ti.UI.createView({
    layout: 'vertical',
    height: Ti.UI.FILL,
    width: Ti.UI.FILL
  });

  var choices = [];
  try {
    choices = JSON.parse(q.choices);
  } catch (ex) {
    liferay.tools.alert(L('ERROR'), 'invalid choices json');
    return;
  }

  var rowContainers = [];
  var choiceLabels = [];
  var choiceImgs = [];

  var currentAnswer = [];

  choices.forEach(function (choice, idx, arr) {

    var rowContainer = Ti.UI.createView({
      width: '100%',
      height: '20%',
      layout: 'horizontal',
      backgroundColor: 'transparent',
      horizontalWrap: false,
      touchEnabled: true
    });


    var choiceLabel = Ti.UI.createLabel({
      font: liferay.fonts.h2,
      color: '#222222',
      width: '70%',
      text: choice,
      textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
      left: '20dp',
      touchEnabled: false
    });

    var choiceImgContainer = Ti.UI.createView({
      width: '15dp',
      height: '15dp',
      left: '10%',
      touchEnabled: false
    });
    var choiceImg = Ti.UI.createImageView({
      width: '10dp',
      height: '10dp',
      image: q.questionType == 'single' ? '/images/polls/Radio-Unselected.png' : '/images/polls/Check-Unselected.png',
      touchEnabled: false
    });

    //rowContainer.labelLink = choiceLabel;
    //rowContainer.imgLink = choiceImg;

    choiceLabels.push(choiceLabel);
    choiceImgs.push(choiceImg);
    rowContainers.push(rowContainer);

    rowContainer.addEventListener('click', function (e) {

      var currentlyChecked = currentAnswer.indexOf(choiceLabel.text) >= 0;
      if (q.questionType === 'single') {
        choiceImg.image = q.questionType == 'single' ? '/images/polls/Radio-Selected.png' : '/images/polls/Check-Selected.png';
        currentAnswer = [choiceLabel.text];
        rowContainer.backgroundColor = '#ccf1f1';
        // uncheck the others
        choiceLabels.forEach(function (lbl, idx) {
          if (lbl != choiceLabel) {
            choiceImgs[idx].image = q.questionType == 'single' ? '/images/polls/Radio-Unselected.png' : '/images/polls/Check-Unselected.png';
            rowContainers[idx].backgroundColor = 'transparent';
          }
        });
      } else {
        // toggle it for multiple choice on/off
        if (currentlyChecked) {
          choiceImg.image = '/images/polls/Check-Unselected.png';
          rowContainer.backgroundColor = 'transparent';
          var idx = currentAnswer.indexOf(choiceLabel.text);
          currentAnswer.splice(idx, 1);
        } else {
          choiceImg.image = '/images/polls/Check-Selected.png';
          rowContainer.backgroundColor = '#ccf1f1';
          currentAnswer.push(choiceLabel.text);
        }
      }

      onAnswerChange(currentAnswer.length <= 0 ? null : currentAnswer);
    });

    choiceImgContainer.add(choiceImg);
    rowContainer.add(choiceImgContainer);
    rowContainer.add(choiceLabel);

    answerContainer.add(rowContainer);
    answerContainer.add(Ti.UI.createView({
      left: '10%',
      width: '80%',
      height: '1dp',
      backgroundColor: '#CCCCCC'
    }));


  });

  view.add(answerContainer);

  return {
    formAnswer: function () {
      return JSON.stringify(currentAnswer);
    }
  };
};

liferay.screens.pollsDetail.loadRankingQuestion = function (q, view, onAnswerChange) {

  var self = this;

  var choices = [];
  try {
    choices = JSON.parse(q.choices);
  } catch (ex) {
    liferay.tools.alert(L('ERROR'), 'invalid choices json');
    return;
  }

  var choicesContainer = Ti.UI.createView({
    width: '80%',
    height: Ti.UI.FILL,
    layout: 'vertical'
  });

  if (liferay.model.iOS) {
    var data = choices.map(function (choice) {
      return {
        properties: {
          height: '40dp',
          font: liferay.fonts.h2b,
          title: choice,
          canMove: true,
          canEdit: false
        }
      }
    });
    var listViewSection = Ti.UI.createListSection();
    listViewSection.setItems(data);

    var listView = Ti.UI.createListView({
      sections: [listViewSection],
      showVerticalScrollIndicator: false,
      editing: true,
      height: Ti.UI.SIZE
    });

    choicesContainer.add(listView);
  } else if (liferay.model.android) {

    var dragger = require('com.liferay.dragger');

    var dslv = dragger.createDragger({
      items: choices,
      hoverColor: '#ccf1f1',
      backgroundColor: 'white',
      foregroundColor: 'black'
    });
    choicesContainer.add(dslv);
  }

  view.add(choicesContainer);

  // tell parent that we always have an answer
  onAnswerChange(true);

  return {
    formAnswer: function () {
      var newAns;

      if (liferay.model.iOS) {
        newAns = listView.sections[0].items.map(function (item) {
          return item.properties.title;
        });
      } else if (liferay.model.android) {
        newAns = dslv.getItems();
      }
      return JSON.stringify(newAns);
    }
  };
};

liferay.screens.pollsDetail.loadRatingQuestion = function (q, view, onAnswerChange) {

  var self = this;

  var choices = [];
  try {
    choices = JSON.parse(q.choices);
  } catch (ex) {
    liferay.tools.alert(L('ERROR'), 'invalid choices json');
    return;
  }

  var sliderContainer = Ti.UI.createView({
    top: '30dp',
    left: 0,
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    layout: 'vertical'
  });

  var slider = Titanium.UI.createSlider({
    left: '10%',
    min: choices[0],
    max: choices[1],
    width: '80%',
    height: Ti.UI.SIZE,
    value: Math.round((choices[1] - choices[0]) / 2)
  });

  sliderContainer.add(slider);

  var sliderLabel = Ti.UI.createLabel({
    text: slider.value,
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    top: '40dp',
    font: liferay.fonts.h5b,
    color: '#f09018',
    textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
  });

  //sliderLabel.font.fontSize = '40dp';

  sliderContainer.add(sliderLabel);
  view.add(sliderContainer);

  onAnswerChange(true);

  slider.addEventListener('change', function (e) {
    sliderLabel.text = Math.round(e.value);
  });


  return {
    formAnswer: function() {
      return ("" + Math.round(slider.value));
    }
  };
};



liferay.screens.pollsDetail.loadTextQuestion = function (q, view, onAnswerChange) {

  var self = this;
  var textArea = Ti.UI.createTextArea({
    enableReturnKey: true,
    autoCorrect: true,
    backgroundColor: 'transparent',
    color: 'black',
    hintText: L('POLL_TEXT_HINT'),
    hintTextColor: '#AAAAAA',
    hintColorText: '#AAAAAA',
    font: liferay.fonts.h2,
    bottom: '5%',
    top: '5%',
    left: '10%',
    width: '80%',
    borderColor: '#CCCCCC',
    borderRadius: '2dp',
    borderWidth: '1dp'
  });
  textArea.addEventListener('change', function(e) {
    onAnswerChange(e.source.value ? e.source.value.trim() : null);
  });

  var sv = Ti.UI.createScrollView({

  });
  sv.add(textArea);
  view.add(sv);

  return {
    formAnswer: function() {
      return textArea.value.trim();
    }
  };

};

liferay.screens.pollsDetail.collectIDAndSubmit = function(question, answer, onSuccess, onFailure) {

  var self = this;

  var currentName = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.settings.server.eventSureyId, liferay.screens.sponsors.sponsorFormType], "NAME");
  var currentEmail = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.settings.server.eventSureyId, liferay.screens.sponsors.sponsorFormType], "EMAIL");
  var currentCompany = liferay.forms.getSurveyAnswer(liferay.controller.selectedEvent, [liferay.settings.server.eventSureyId, liferay.screens.sponsors.sponsorFormType], "COMPANY");

  if (!currentName) {
    currentName = liferay.drawer.session ? (liferay.drawer.session.user.firstName + ' ' + liferay.drawer.session.user.lastName):"";
  }
  if (!currentEmail) {
    currentEmail = liferay.drawer.session ? liferay.drawer.session.emailAddress:"";
  }

  var name = liferay.forms.makeSimpleHeaderField("NAME", L('FMT_NAME').toUpperCase(),
      currentName, '10dp', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, liferay.settings.server.eventSureyId, "NAME", e.value);
        liferay.forms.saveSurveyAnswers();
      });

  var email = liferay.forms.makeSimpleHeaderField("EMAIL", L('FMT_EMAIL').toUpperCase(),
      currentEmail, '10dp', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, liferay.settings.server.eventSureyId, "EMAIL", e.value);
        liferay.forms.saveSurveyAnswers();
      });

  var company = liferay.forms.makeSimpleHeaderField("COMPANY", L('FMT_COMPANY').toUpperCase(),
      currentCompany, '10dp', function(e) {
        liferay.forms.recordSurveyAnswer(liferay.controller.selectedEvent, liferay.settings.server.eventSureyId, "COMPANY", e.value);
        liferay.forms.saveSurveyAnswers();
      });

  liferay.forms.showSimpleForm({
    title : L('LIVE_POLLS'),
    subTitle: liferay.controller.selectedEvent.menutitle,
    subHeading: liferay.controller.selectedEvent.location_label.toUpperCase(),
    instructions: liferay.tools.stripTags(question.idIntro),
    questions: [name, email, company].map(function(q) { return {question: q}}),
    sendButtonText: L('OK'),
    submitConfirm: L('SURVEY_SUBMIT_PROMPT'),
    dismissText: L('CANCEL'),
    confirm: false,
    onSubmit: function(callOnSubmit, callOnFail) {
      var payload = {};
      if (name.value.trim()) {
        payload.name = name.value.trim();
      }
      if (email.value.trim()) {
        payload.email = email.value.trim();
      }
      if (company.value.trim()) {
        payload.company = company.value.trim();
      }

      liferay.screens.pollsDetail.submitAnswer(question, answer, payload, function() {
        callOnSubmit();
        onSuccess && onSuccess();
      }, function(err) {
        callOnFail(err);
        onFailure && onFailure(err);
      });
    },
    onClose: function() {
      onFailure && onFailure("");
    }
  });


};

liferay.screens.pollsDetail.confirmAndSubmit = function (question, answer, onSuccess, onFailure) {

  var self = this;

  var alertDialog = Titanium.UI.createAlertDialog({
    title: L('LIVE_POLLS'),
    message: L('SURVEY_SUBMIT_PROMPT'),
    buttonNames: [L('YES'), L('NO')]
  });
  alertDialog.addEventListener('click', function (e) {
    if (e.index == 0) {
      liferay.screens.pollsDetail.submitAnswer(question, answer, {}, onSuccess, onFailure);
    } else {
      onFailure && onFailure();
    }
  });
  alertDialog.show();

};

liferay.screens.pollsDetail.submitAnswer = function (question, answer, payloadObj, onSuccess, onFailure) {
  var self = this;

  if (self.hasAnswered(question)) {
    liferay.tools.toastNotification(null, L('POLL_ALREADY_ANSWERED'));
    return;
  }

  liferay.tools.createFloatingMessage({
    text: L('SAVING_SURVEY'),
    container: liferay.controller.getCurrentWindow(),
    progress: false
  });

  Request({
    method: 'POST',
    hashAlg: 'sha',
    sigName: 'signature',
    url: liferay.settings.server.pollsHost.host + liferay.settings.server.pollsHost.submitAnswerEndpoint,
    params: {
      questionId: question.questionId,
      answer: answer,
      clientId: Ti.Platform.id,
      payload: JSON.stringify(payloadObj)
    },
    onSuccess: function (returnedAnswer) {
      liferay.tools.hideFloatingMessage();
      if (!returnedAnswer.exception && returnedAnswer.createDate) {
        liferay.tools.toastNotification(null, L('POLL_SUCCESS'));
        self.recordQuestionAnswered(question);
        onSuccess && onSuccess();
        // record answer so we cant do it again
      } else {
        liferay.tools.alert(L('ERROR'), String.format(L('EVENT_SURVEY_ERROR'), returnedAnswer.message));
        onFailure && onFailure();
      }
    },
    onFailure: function (err) {
      liferay.tools.hideFloatingMessage();
      liferay.tools.alert(L('ERROR'), String.format(L('EVENT_SURVEY_ERROR'), err));
      onFailure && onFailure();
    }
  });

};

// questionsAnswered:
// [
//   "eventName": name,
//   "questionsAnswered": [id, id, ...]
// ]
//

liferay.screens.pollsDetail.hasAnswered = function (question) {

  var eventid = liferay.controller.selectedEvent.eventid;
  var id = question.questionId;
  for (var i = 0; i < liferay.screens.pollsDetail.questionsAnswered.length; i++) {
    if (liferay.screens.pollsDetail.questionsAnswered[i].eventId == eventid) {
      var currentQuestionsAnswered = liferay.screens.pollsDetail.questionsAnswered[i].questionsAnswered;
      if (currentQuestionsAnswered && currentQuestionsAnswered.indexOf(id) >= 0) {
        return true;
      }
    }
  }
  return false;
};

liferay.screens.pollsDetail.recordQuestionAnswered = function (question) {
  var eventid = liferay.controller.selectedEvent.eventid;
  var id = question.questionId;

  for (var i = 0; i < liferay.screens.pollsDetail.questionsAnswered.length; i++) {
    if (liferay.screens.pollsDetail.questionsAnswered[i].eventId == eventid) {
      var currentQuestionsAnswered = liferay.screens.pollsDetail.questionsAnswered[i].questionsAnswered;
      if (currentQuestionsAnswered) {
        var idx = currentQuestionsAnswered.indexOf(id);
        if (idx < 0) {
          currentQuestionsAnswered.push(id);
          this.saveCurrentQuestionsAnswered();
          return;
        }
      } else {
        // no questionsAnswered for this event, so make a new one
        liferay.screens.pollsDetail.questionsAnswered[i].questionsAnswered = [id];
        this.saveCurrentQuestionsAnswered();
        return;
      }
    }
  }
  // no questionsAnswered at all, so start a new one
  liferay.screens.pollsDetail.questionsAnswered.push({
    eventId: liferay.controller.selectedEvent.eventid,
    questionsAnswered: [id]
  });
  this.saveCurrentQuestionsAnswered();

};


liferay.screens.pollsDetail.loadQuestionsAnswered = function () {


  var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.questionsAnsweredFile);

  if (file.exists()) {
    try {
      var newQuestionsAnswered = JSON.parse(file.read());
      if (newQuestionsAnswered) {
        liferay.screens.pollsDetail.questionsAnswered = newQuestionsAnswered;
      } else {
      }
    } catch (ex) {
      // faves file unreadable, abort!
      return;
    }
  } else {
    if (liferay.screens.pollsDetail.questionsAnswered) {
      if (liferay.screens.pollsDetail.questionsAnswered.length <= 0) {
        liferay.screens.pollsDetail.questionsAnswered = [];
      } else {

      }
    } else {
      liferay.screens.pollsDetail.questionsAnswered = [];
    }
  }

};

liferay.screens.pollsDetail.saveCurrentQuestionsAnswered = function () {
  var folder = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory);
  if (!folder.exists()) {
    folder.createDirectory();
    folder.remoteBackup = true;
  }
  var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, liferay.settings.screens.loader.questionsAnsweredFile);

  file.write(JSON.stringify(liferay.screens.pollsDetail.questionsAnswered));
  file.remoteBackup = true;
};
