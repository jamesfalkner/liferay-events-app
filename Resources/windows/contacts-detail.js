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

liferay.screens.contactsDetail = new liferay.classes.window();
liferay.screens.contactsDetail.className = 'liferay.screens.contactsDetail';

liferay.screens.contactsDetail.render = function() {

	var self = this;

	this.panelBg = Ti.UI.createView(liferay.settings.screens.all.layout.panelBg);


	var tagBtn = Titanium.UI.createView(liferay.settings.screens.contacts.buttons.tag);
	tagBtn.left = '14%';
	tagBtn.width = liferay.tools.getDp(liferay.settings.screens.contacts.buttons.tag.psize * Titanium.Platform.displayCaps.platformWidth);
	tagBtn.height = tagBtn.width;

	tagBtn.addEventListener('click', function(e) {

		liferay.tools.flashButton({
			control : e.source,
			onRestore : function() {
				var sponsor = null;
				liferay.data.currentEventData.sponsors.forEach(function(sponsorIt) {
					if (sponsorIt.type && sponsorIt.type == 'scan') {
						sponsor = sponsorIt;
					}
				});

				liferay.scan.doScan({
					message: sponsor ? String.format(L('SCAN_SPONSORED_BY'), sponsor.name) : L('SCAN_TITLE'),
					logo: sponsor ? sponsor.docmedia : null,
					onSuccess: function(result) {
						liferay.scan.parseBarcode(result, function(contact) {
							liferay.screens.contacts.saveNewContact(contact);
							self.loadDetails(contact);
						}, function(err) {
							liferay.tools.alert(L('ALERT'), err);
						});

					},
					onFailure: function(err) {
						liferay.tools.alert(L('ALERT'), String.format(L('SCAN_UNABLE'), err));
					}
				});
			}
		});
	});

	this.deleteBtn = Titanium.UI.createView(liferay.settings.screens.contactsDetail.buttons.remove);
	this.deleteBtn.width = liferay.tools.getDp(liferay.settings.screens.contactsDetail.buttons.remove.psize * Titanium.Platform.displayCaps.platformWidth);
	this.deleteBtn.height = this.deleteBtn.width;

	this.addressBookBtn = Titanium.UI.createView(liferay.settings.screens.contactsDetail.buttons.addressBook);
	this.addressBookBtn.width = liferay.tools.getDp(liferay.settings.screens.contactsDetail.buttons.addressBook.psize * Titanium.Platform.displayCaps.platformWidth);
	this.addressBookBtn.height = this.addressBookBtn.width;

	this.window = liferay.ui.makeWindow({
        backEnabled: true,
		swipe: true,
		panelBg: this.panelBg,
		footerButtons: [tagBtn, this.deleteBtn, this.addressBookBtn]
	});

	return this.window;
};

liferay.screens.contactsDetail.loadDetails = function(info) {

	var self = this;

	if (this.panelBg.getChildren() && this.panelBg.getChildren().length > 0) {
		this.panelBg.removeAllChildren();
	}

	var overallSpacer = Ti.UI.createView({
		top: '5dp',
		left: '10dp',
		right: '10dp',
		bottom: '5dp'
	});

	var topContainer = Ti.UI.createView({
		top: 0,
		width: Ti.UI.FILL,
		height: '40%'
	});

	var bottomContainer = Ti.UI.createView({
		top: '40%',
		height: '60%',
		width: Ti.UI.FILL
	});

	overallSpacer.add(topContainer);
	overallSpacer.add(bottomContainer);
	this.panelBg.add(overallSpacer);

	this.imageContainer = Ti.UI.createView({
		left: 0,
		height: Ti.UI.FILL,
		width: '40%'
	});

	this.image = Titanium.UI.createImageView({
		backgroundColor    : 'transparent',
		preventDefaultImage: true,
		touchEnabled       : false,
		width: '100%',
		height: 'auto'
	});

	this.imageContainer.add(this.image);
	if (!info.picture) {
		this.image.image = liferay.settings.screens.contacts.defaultPicture;
	} else {
		this.loadImage({
			setImage: true,
			imageView: this.image,
			url: info.picture,
			onLoad : function() {
				if (liferay.model.android && info.picture) {
					setTimeout(function() {
						var ifi = liferay.screens.contactsDetail.image.toBlob();
						ifi = ifi.imageAsResized(ifi.width *2, ifi.height * 2);
						liferay.screens.contactsDetail.image.setImage(ifi);
					}, 200);
				}
			}
		});
	}

	topContainer.add(this.imageContainer);

	var titleContainer = Ti.UI.createView({
		left: '40%',
		width: '60%',
		height: Ti.UI.SIZE
	});

	var titleSpacer = Ti.UI.createView({
		top: '5dp',
		left: '5%',
		right: '5dp',
		height: Ti.UI.SIZE
	});

	var titleLabelContainer = Ti.UI.createView({
		layout: 'vertical',
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE
	});

	titleSpacer.add(titleLabelContainer);
	titleContainer.add(titleSpacer);
	topContainer.add(titleContainer);

	var label;

	label = Titanium.UI.createLabel(liferay.settings.screens.contactsDetail.labels.name);
	label.text = info.firstname + ' ' + info.lastname;
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h3;
	titleLabelContainer.add(label);

	label = Titanium.UI.createLabel(liferay.settings.screens.contactsDetail.labels.companyName);
	label.height = Ti.UI.SIZE;
	label.width = Ti.UI.SIZE;
	label.font = liferay.fonts.h2;
	label.text = info.companyname.trim().toUpperCase();
	titleLabelContainer.add(label);

	if (info.msgCallback) {
		label = Titanium.UI.createLabel(liferay.settings.screens.contactsDetail.labels.sendMsg);
		label.height = Ti.UI.SIZE;
		label.width = Ti.UI.SIZE;
		label.font = liferay.fonts.h2;
		label.text = '(' + L('MSG_SEND_A_MSG') + ')';

		label.addEventListener('click', info.msgCallback);
		titleLabelContainer.add(label);
	}

	var fields = [];

	if (info.street) {
        var parts = [];
        if (info.street) parts.push(info.street);
        if (info.city) parts.push(info.city);
        if (info.state) parts.push(info.state);
        if (info.zip) parts.push(info.zip);

		fields.push(
			{
				name : L('FMT_ADDRESS'),
                value: parts.join(', ')
//				value: info.street + ', ' + info.city + ', ' + info.state + ' ' + info.zip
			}
		);
	}
	if (info.title) {
		fields.push(
			{
				name : L('FMT_TITLE'),
				value: info.title
			})
	}
	if (info.phone) {
		fields.push(

			{
				name : L('FMT_PHONE'),
				value: info.phone
			});
	}

	if (info.email) {
		fields.push(

			{
				name : L('FMT_EMAIL'),
				value: info.email
			});
	}

	if (info.url) {
		fields.push(

			{
				name : L('FMT_WEBSITE'),
				value: info.url
			})
	}
	if (info.displayNote) {
		fields.push(

			{
				name : L('MESSAGE'),
				value: info.displayNote
			})
	}


	var fieldContainer = Titanium.UI.createView({
		layout : 'vertical',
		height: Ti.UI.SIZE
	});

	for (var i = 0; i < fields.length; i++) {
		var item = fields[i];

		if ((!item.value) || item.value == '') {
			continue;
		}

		var fieldRow = Titanium.UI.createView({
			layout: 'horizontal',
			width : Ti.UI.FILL,
			height : Ti.UI.SIZE,
			top : '3%'
		});

		var labelContainer = Titanium.UI.createView({
			width: '30%',
			height: Ti.UI.SIZE,
			left: 0,
			top: 0
		});

		label = Titanium.UI.createLabel({
			top: 0,
			right: '10%',
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			textAlign: 'right',
			color: '#89A9C9'

		});
		label.text = item.name;
		label.font = liferay.fonts.h3;
		labelContainer.add(label);
		fieldRow.add(labelContainer);

//		// separator ---------------------------------------

		labelContainer = Titanium.UI.createView({
			width: '65%',
			height: Ti.UI.SIZE,
			left: 0,
			top: 2
		});

		label = Titanium.UI.createLabel({
			top: 0,
			left: '10%',
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			textAlign: 'left',
			color: '#444444'

		});
		label.text = item.value;
		label.font = liferay.fonts.h2;
		labelContainer.add(label);
		fieldRow.add(labelContainer);

		if (item.name == L('MESSAGE')) {
			label.font = liferay.fonts.h1;
		} else if (item.name == L('FMT_PHONE')) {
			if (liferay.model.android) {
				label.text = Ti.Locale.formatTelephoneNumber(label.text);
			}
			label.color = "#33ACDC";
			label.touchEnabled = true;
			label.addEventListener('click', function(e) {
				var number = e.source.text;
				if (liferay.model.android) {
					Titanium.Platform.openURL('tel:' + number);
				} else {
					liferay.tools.expandButton({
						control : e.source,
						onRestore : function() {
							Titanium.Platform.openURL('tel:' + number);
						}
					});
				}
			});
		} else if (item.name == L('FMT_WEBSITE')) {
			label.touchEnabled = true;
			label.color = "#33ACDC";

			if (label.text.indexOf("http://" == 0)) {
				label.scheme = "http://";
				label.text = label.text.replace("http://", "");
			}
			if (label.text.indexOf("https://" == 0)) {
				label.scheme = "https://";
				label.text = label.text.replace("https://", "");
			}
			label.addEventListener('click', function(e) {
				var url = e.source.text;
				if (e.source.scheme) {
					url = e.source.scheme + url;
				}
				if (liferay.model.android) {
					Titanium.Platform.openURL(url);
				} else {
					liferay.tools.expandButton({
						control : e.source,
						onRestore : function() {
							Titanium.Platform.openURL(url);
						}
					});
				}
			});

		} else if (item.name == L('FMT_EMAIL')) {
			label.touchEnabled = true;
			label.color = "#33ACDC";
			label.addEventListener('click', function(e) {
				if (liferay.model.android) {
					var emailDialog = Titanium.UI.createEmailDialog();
					emailDialog.subject = String.format(L('CONTACT_EMAIL_SUBJ'), liferay.controller.selectedEvent.title, liferay.controller.selectedEvent.location_label);
					emailDialog.toRecipients = [e.source.text];
					emailDialog.messageBody = '';
					emailDialog.open();
				} else {
					liferay.tools.expandButton({
						control : e.source,
						onRestore : function() {
							var emailDialog = Titanium.UI.createEmailDialog();
							emailDialog.subject = String.format(L('CONTACT_EMAIL_SUBJ'), liferay.controller.selectedEvent.title, liferay.controller.selectedEvent.location_label);
							emailDialog.toRecipients = [e.source.text];
							emailDialog.messageBody = '';
							emailDialog.open();
						}
					});
				}
			});
		}
		//Ti.API.info("added " + fieldRow);
		fieldContainer.add(fieldRow);
	}
	var iconSize = liferay.tools.getDp(.08 * Titanium.Platform.displayCaps.platformWidth);

	var socialIconContainer = Titanium.UI.createView({
		width: '60%',
		height: Ti.UI.SIZE,
		left: '6.5%',
		layout: 'horizontal'
	});
	var iconAdded = false;

	['twitter', 'facebook', 'linkedin', 'youtube', 'blog'].forEach(function(el, id, ar) {
		if (info[el]) {

			var icon = Titanium.UI.createView({
				backgroundImage: liferay.settings.screens.all["speaker_social_"+el].image,
				width: iconSize,
				left: iconAdded ? '5%' : 0,
				top: 0,
				height: iconSize,
				type: el
			});
			icon.addEventListener('click', function (e) {
				if (liferay.model.android) {
					if (info[e.source.type].indexOf('http') == 0) {
						Titanium.Platform.openURL(info[e.source.type]);
					} else {
						Titanium.Platform.openURL(liferay.settings.screens.all["speaker_social_"+e.source.type].prefix + info[e.source.type]);
					}
				} else {
					liferay.tools.expandButton({
						control  : e.source,
						onRestore: function () {
							if (info[e.source.type].indexOf('http') == 0) {
								Titanium.Platform.openURL(info[e.source.type].trim());
							} else {
								Titanium.Platform.openURL(liferay.settings.screens.all["speaker_social_"+e.source.type].prefix + info[e.source.type]);
							}
						}
					});
				}
			});
			socialIconContainer.add(icon);
			iconAdded = true;
		}
	});
	if (iconAdded) {
		var followRow = Titanium.UI.createView({
			layout: 'horizontal',
			width : Ti.UI.FILL,
			height : Ti.UI.SIZE,
			top : '5%'
		});

		var followLabelContainer = Titanium.UI.createView({
			width: '30%',
			height: Ti.UI.SIZE,
			left: 0,
			top: '20%'
		});

		var followLabel = Titanium.UI.createLabel({
			right: '10%',
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			textAlign: 'right',
			color: '#89A9C9',
			text: L('FMT_FOLLOW'),
			font: liferay.fonts.h3
		});

		followLabelContainer.add(followLabel);
		followRow.add(followLabelContainer);
		followRow.add(socialIconContainer);
		fieldContainer.add(followRow);
	}

	var scrollContainer = Ti.UI.createScrollView();
	scrollContainer.add(fieldContainer);
	bottomContainer.add(scrollContainer);

	// separator
	bottomContainer.add(Ti.UI.createView({
		left: '33%',
		top: '20dp',
		width: 2,
		bottom: '20dp',
		backgroundColor: '#EEEEEE',
		touchEnabled: false
	}));

	this.deleteBtn.addEventListener('click', function(e) {
		liferay.tools.flashButton({
			control : e.source,
			onRestore : function() {
				self.deleteContact(info);
			}
		});
	});

	this.addressBookBtn.addEventListener('click', function(e) {
		liferay.tools.flashButton({
			control : e.source,
			onRestore : function() {
				self.saveContactToAddressBook(info);
			}
		});
	});

	this.deleteBtn.visible = (info.id) ? true : false;

};

liferay.screens.contactsDetail.loadAction = function(action, event_uuid, cb) {
    liferay.data.currentEventData.contacts.forEach(function(contact) {
        if ((contact.firstname + ' ' + contact.lastname) == action[0]) {
            liferay.screens.contactsDetail.loadDetails(contact);
        }
    });
    cb();
};

liferay.screens.contactsDetail.saveContactToAddressBook = function(info) {
	//Ti.API.info(this.className + ".saveContactToAddressBook()");
	var self = this;

	var alertDialog = Titanium.UI.createAlertDialog({
		title : L('CONTACT_SAVE_TO_ADDRBOOK_TITLE'),
		message : L('CONTACT_SAVE_TO_ADDRBOOK_PROMPT'),
		buttonNames : [L('YES'), L('NO')]
	});
	alertDialog.addEventListener('click', function(e) {
		if (e.index == 0) {
			if (Ti.Contacts.contactsAuthorization != Ti.Contacts.AUTHORIZATION_AUTHORIZED){
				Ti.Contacts.requestAuthorization(function(e){
					if (e.success) {
						liferay.screens.contactsDetail.saveToDevice(info);
					} else {
                        liferay.tools.alert(L('ALERT'), String.format(L('ERROR_1'), "Could not save new contact - check Privacy Settings"));
                    }
				});
			} else {
				liferay.screens.contactsDetail.saveToDevice(info);
			}
		}
	});
	alertDialog.show();
};

liferay.screens.contactsDetail.saveToDevice = function(info) {
	var imgBlob = null;
	if (liferay.model.iOS) {
		if (info.picture) {
			var filename = Ti.Utils.md5HexDigest(info.picture) + '.png';
			var cacheFilePath = liferay.cache.getFilePath(filename);
			var cacheFile = Titanium.Filesystem.getFile(cacheFilePath);
			if (cacheFile.exists()) {
				imgBlob = cacheFile.read();
			}
		} else {
			imgBlob = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, liferay.settings.screens.contacts.defaultPicture).read();
		}
	}

    var newperson = null;
    try {
			var first = info.firstname || '';
			if ((first.constructor === Array) && first[0]) {
				first = first[0];
			}

			var last = info.lastname || '';
			if ((last.constructor === Array) && last[0]) {
				last = last[0];
			}

			newperson = Titanium.Contacts.createPerson({
            image: imgBlob,
            firstName: first,
            lastName: last,
            organization: info.companyname || '',
            jobTitle: info.title || '',
            phone: {
                work: [info.phone || '']
            },
            email: {
                work: [info.email || '']
            },
            note: info.notes || '',
            url: {
                work: [info.url || '']
            },
            address: {
                work: [
                    {
                        Street: info.street || '',
                        City: info.city || '',
                        State: info.state || '',
                        ZIP: info.zip || '',
                        Country: info.country || ''
                    }
                ]
            }
        });
    } catch (ex) {
        newperson = null;
    }
    if (newperson) {
        liferay.tools.toastNotification(null, L('CONTACT_SAVE_TO_ADDRBOOK_SAVED'));
    } else {
        liferay.tools.alert(L('ALERT'), String.format(L('ERROR_1'), "Could not save new contact - check Privacy Settings"));
    }
};

liferay.screens.contactsDetail.deleteContact = function(info) {
	//Ti.API.info(this.className + ".deleteContact()");
	var self = this;

	var alertDialog = Titanium.UI.createAlertDialog({
		title : L('CONTACT_DELETE_TITLE'),
		message : L('CONTACT_DELETE_PROMPT'),
		buttonNames : [L('YES'), L('NO')]
	});
	alertDialog.addEventListener('click', function(e) {
		if (e.index == 0) {
			liferay.screens.contacts.deleteContact(info.id);
			liferay.screens.contactsDetail.deleteBtn.visible = false;
            liferay.tools.toastNotification(null, L('CONTACT_DELETE_DELETED'));
		}
	});
	alertDialog.show();
};
