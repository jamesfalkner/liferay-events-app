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
    windowSoftInputMode: (liferay.model.android ? Ti.UI.Android.SOFT_INPUT_ADJUST_PAN : null),
    navBarHidden: true,
    tabBarHidden: true,
    fullscreen: true,
    backgroundColor: options.backgroundImage ? 'white' : 'transparent',
    backgroundImage: options.backgroundImage
  });


  window.orientationModes = [Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT];

  var header = options.header ? options.header : Ti.UI.createView(liferay.settings.screens.all.layout.header);
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
    lbl.width = '85%';
    lbl.textAlign = Ti.UI.TEXT_ALIGNMENT_RIGHT
  }

  if (!options.header) {
    header.add(lbl);
  }

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
                liferay.controller.closeLast(true, true);
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

        if (liferay.controller.getCurrentWindow() == window) {
          liferay.controller.closeLast(false, true);
        }
      });
    }
  }
  return window;
};

liferay.ui.showHelp = function (helpData) {

  var helpShader = Ti.UI.createView({
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'black'
  });

  var formContainer = Ti.UI.createView({
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent'
  });

  helpData.forEach(function (spec) {
    if (spec.text) {
      var label = Ti.UI.createLabel({
        left: spec.left || 0,
        top: spec.top || 0,
        font: spec.font || liferay.fonts.h3,
        text: spec.text,
        width: spec.width || '90%',
        color: spec.color || 'white',
        textAlign: spec.textAlign || Ti.UI.TEXT_ALIGNMENT_LEFT
      });
      formContainer.add(label);
    } else if (spec.image) {
      var img = Ti.UI.createImage({
        image: spec.image,
        left: spec.left || '50%',
        top: spec.top || '50%',
        width: spec.width || 'auto',
        height: spec.height || 'auto'
      });
      formContainer.add(img);
    } else if (spec.view) {
      var view = Ti.UI.createView(spec.view);
      formContainer.add(view);
    }
  });


  var closebtn = Ti.UI.createButton({
    title: L('GOT_IT'),
    font: liferay.fonts.h4b,
    bottom: '15dp',
    left: '20dp',
    color: '#89A9C9'
  });

  formContainer.add(closebtn);


  function closeit() {
    formContainer.animate({
      opacity: 0,
      duration: 400
    }, function () {
      helpShader.animate({
        opacity: 0,
        duration: 400
      }, function () {
        liferay.controller.getCurrentWindow().remove(helpShader);
        liferay.controller.getCurrentWindow().remove(formContainer);
      });
    });

  }

  closebtn.addEventListener('click', closeit);
  helpShader.addEventListener('click', closeit);
  formContainer.addEventListener('click', closeit);

  helpShader.opacity = 0;
  formContainer.opacity = 0;

  liferay.controller.getCurrentWindow().add(helpShader);
  liferay.controller.getCurrentWindow().add(formContainer);


  helpShader.animate({
    opacity: 0.8,
    duration: 400
  }, function () {
    formContainer.animate({
      opacity: 1,
      duration: 400
    });
  });
};

liferay.ui.openWebPage = function (url, title, closeTest) {

  var firstLoad = true;
  var loading = false;
  var estimates = JSON.parse(Ti.App.Properties.getString("Social-LoadingEstimates", "{}"));
  var estimateID;
  var startTime;
  var intervalID = 0;

  var window = Ti.UI.createWindow({
    backgroundColor: "white",
    zIndex: 1000,
    title: title
  });

  if (!Ti.Android) {
    window.opacity = 0;
    window.transform = Ti.UI.create2DMatrix().scale(0);
  }

  var view = Ti.UI.createView({
    top: '30dp',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#52D3FE",
    borderColor: "#52D3FE",
    borderRadius: 10,
    borderWidth: 2,
    zIndex: -1
  });

  var closeBar = Ti.UI.createView({
    top: 0,
    width: Ti.UI.FILL,
    height: '30dp',
    backgroundColor: 'white'
  });

  var closeLabel = Ti.UI.createLabel({
    font: liferay.fonts.h4b,
    left: '5dp',
    color: "#005bff",
    text: L('CLOSE')
  });
  var titleLabel = Ti.UI.createLabel({
    font: liferay.fonts.h4b,
    right: '5dp',
    color: "black",
    text: title
  });

  closeBar.add(closeLabel);

  closeBar.add(titleLabel);

  closeLabel.addEventListener("click", function (e) {
    if (window == null)
      return;
    try {
      if (webView) {
        webView.removeEventListener("beforeload", onBeforeLoad);
        loadingView.hide();
        window.close({animated: true});
        loading = null;
        webView = null;
        loadingView = null;
        loading = false;
        firstLoad = true;
        view = null;
        window = null;

      }
    } catch (ex) {
      console.log("Cannot destroy the window. Ignoring.");
    }
  });

  window.open();

  var offset = 0;

  if (Ti.Android) {
    offset = "10dp"
  }

  var loadingContainer = Ti.UI.createView({
    top: offset,
    right: offset,
    bottom: offset,
    left: offset,
    backgroundColor: "#fff"
  });

  var loadingView = Ti.UI.createProgressBar({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    min: 0,
    max: 1,
    value: 0.5,
    message: L('LOADING'),
    backgroundColor: "#fff",
    font: {
      fontSize: 14,
      fontWeight: "bold"
    },
    style: 0
  });

  view.add(loadingContainer);
  loadingContainer.add(loadingView);
  loadingView.show();
  window.add(view);
  window.add(closeBar);

  if (!Ti.Android) {
    var tooBig = Ti.UI.createAnimation({
      transform: Ti.UI.create2DMatrix().scale(1.1),
      opacity: 1,
      duration: 350
    });
    var shrinkBack = Ti.UI.createAnimation({
      transform: Ti.UI.create2DMatrix(),
      duration: 400
    });

    tooBig.addEventListener("complete", function () {
      window.animate(shrinkBack);
    });

    window.animate(tooBig);
  }


  var webView = Ti.UI.createWebView({
    url: url,
    top: offset,
    right: offset,
    bottom: offset,
    left: offset
  });

  function onBeforeLoad(e) {

    if (closeTest && closeTest(e.url)) {
      // tear it down!
      setTimeout(function () {
        closeLabel.fireEvent('click', {source: closeLabel});
      }, 1000);
      return;
    }
    if (loading) {
      return;
    }


    loading = true;
    loadingView.value = 0;
    estimateID = "pageLoad";
    if (!estimates[estimateID]) {
      estimates[estimateID] = firstLoad ? 2000 : 1000;
    }
    firstLoad = false;
    startTime = (new Date).getTime();
    intervalID = setInterval(updateProgress, 1000);
    //console.log("HIDING WEBVIEW due to estimates");
    //webView && webView.hide();
    //loadingView && loadingView.show();
    //loadingContainer && loadingContainer.show();
  }


  function updateProgress() {
    loadingView && (loadingView.value = ((new Date).getTime() - startTime) / estimates[estimateID]);
  }

  function onLoad(e) {
    loadingView && loadingView.hide();
    loadingContainer && loadingContainer.hide();
    webView && webView.show();
    loading = false;
    clearInterval(intervalID);
    estimates[estimateID] = (new Date).getTime() - startTime;
    Ti.App.Properties.setString("Social-LoadingEstimates", JSON.stringify(estimates));

  }

  webView.addEventListener("beforeload", onBeforeLoad);
  webView.addEventListener("load", onLoad);
  view.add(webView);
};
liferay.ui.openWebPageLight = function (url, title, closeTest) {

  var window = Ti.UI.createWindow({
    backgroundColor: "white",
    zIndex: 1000,
    title: title
  });

  if (!Ti.Android) {
    window.opacity = 0;
    window.transform = Ti.UI.create2DMatrix().scale(0);
  }

  var view = Ti.UI.createView({
    top: liferay.model.android ? 0 : '40dp',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#52D3FE",
    borderColor: "#52D3FE",
    borderRadius: 10,
    borderWidth: 1,
    zIndex: -1
  });

  var webView = Ti.UI.createWebView({
    url: url,
    top: liferay.model.android ? '10dp' : 0,
    right: liferay.model.android ? '10dp' : 0,
    bottom: liferay.model.android ? '10dp' : 0,
    left: liferay.model.android ? '10dp' : 0
  });

  if (liferay.model.android) {
    webView.borderRadius = 1;
  }

  function tearDown() {
    if (window == null)
      return;
    try {
      if (webView) {
        webView.removeEventListener("beforeload", onBeforeLoad);
        webView.removeEventListener("load", onLoad);
        window.close({animated: true});
        webView = null;
        view = null;
        window = null;

      }
    } catch (ex) {
      console.log("Cannot destroy the window. Ignoring.");
    }

  }

  var actInd = Ti.UI.createActivityIndicator({
    center: {
      x: '50%'
    }
  });


  if (!liferay.model.android) {
    var closeBar = Ti.UI.createView({
      top: 0,
      width: Ti.UI.FILL,
      height: '40dp',
      backgroundColor: 'white'
    });

    var closeLabel = Ti.UI.createLabel({
      font: liferay.fonts.h4b,
      left: '5dp',
      color: "#005bff",
      text: L('CLOSE')
    });
    var titleLabel = Ti.UI.createLabel({
      font: liferay.fonts.h4b,
      right: '5dp',
      color: "black",
      text: title
    });

    closeBar.add(closeLabel);

    closeBar.add(titleLabel);
    closeBar.add(actInd);

    closeLabel.addEventListener("click", function (e) {
      tearDown();
    });
    window.add(closeBar);
  } else {
    window.add(actInd);
    window.addEventListener('close', function(e) {
      tearDown();
    });
  }

  view.add(webView);
  window.add(view);
  window.open();

  if (!Ti.Android) {
    var tooBig = Ti.UI.createAnimation({
      transform: Ti.UI.create2DMatrix().scale(1.1),
      opacity: 1,
      duration: 350
    });
    var shrinkBack = Ti.UI.createAnimation({
      transform: Ti.UI.create2DMatrix(),
      duration: 400
    });

    tooBig.addEventListener("complete", function () {
      window.animate(shrinkBack);
    });

    window.animate(tooBig);
  }



  function onLoad(e) {
    actInd.hide();

  }

  function onBeforeLoad(e) {

    actInd.show();

    if (closeTest && closeTest(e.url)) {
      // tear it down!
      setTimeout(function () {
        actInd.hide();
        if (liferay.model.android) {
          if (window) {
            window.close();
          }
        } else {
          closeLabel.fireEvent('click', {source: closeLabel});
        }
      }, 1000);
    }
  }

  webView.addEventListener("beforeload", onBeforeLoad);
  webView.addEventListener("load", onLoad);
  webView.show();
};

liferay.ui.getCountryPicker = function(countryNames) {
  var picker = Titanium.UI.createPicker(
      {
        selectionIndicator:true,
        type: Titanium.UI.PICKER_TYPE_PLAIN
      });

  picker.selectedCode = countryNames[0].code;
  picker.selectedName = countryNames[0].name;

  picker.addEventListener('change', function(e) {
    picker.selectedCode = countryNames[e.rowIndex].code;
    picker.selectedName = countryNames[e.rowIndex].name;
  });

  countryNames.forEach(function(nameObj) {
    picker.add(Ti.UI.createPickerRow({title: nameObj.name}));
  });

  return picker;
};

liferay.ui.getCountryMap = function() {

  var countryNames = countryCodes.map(function(code) {
    var name = L('COUNTRY_NAME_' + code);
    if (!name || name.indexOf('COUNTRY_NAME') == 0) {
      name = code;
    }
    return {
      name: name,
      code: code
    }
  });

  countryNames.sortBy('name');

  // major LR event countries first
  ["US", "GB", "ES", "IT", "DE", "FR", "BR"].forEach(function(code) {
    countryNames = [{name: L('COUNTRY_NAME_' + code), code: code}].concat(countryNames);
  });

  return countryNames;

};

liferay.ui.showCountryPicker = function (resultCb) {

  var nameMap = liferay.ui.getCountryMap();

  var picker = liferay.ui.getCountryPicker(nameMap);

  var win = Ti.UI.createWindow({
    windowSoftInputMode: (liferay.model.android ? Ti.UI.Android.SOFT_INPUT_ADJUST_PAN : null),
    navBarHidden: true,
    tabBarHidden: true,
    fullscreen: true,
    backgroundColor: 'transparent'
  });

  var container = Ti.UI.createView({
    layout: 'vertical',
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    bottom: 0
  });

  var buttonRow = Ti.UI.createView({
    width: Ti.UI.FILL,
    height: Ti.UI.SIZE,
    backgroundColor: '#CCCCCC'
  });

  var doneButton = Ti.UI.createButton({
    title: L('OK'),
    font: liferay.fonts.h4
  });

  var selectedIdx = 0;

  picker.addEventListener('change', function(e) {
    selectedIdx = e.rowIndex;
  });

  doneButton.addEventListener('click', function() {
    win.close({animated: true});
    resultCb(nameMap[selectedIdx].code);
  });

  buttonRow.add(doneButton);
  container.add(buttonRow);
  container.add(picker);
  win.add(container);
  win.open({animated: true});



};

var countryCodes = [

  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AN",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW"
];
