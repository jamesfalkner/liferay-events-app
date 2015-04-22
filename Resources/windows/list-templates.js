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

liferay.list_templates = {};
liferay.list_templates.init = function () {

    liferay.list_templates.agenda = {
        base: {
            childTemplates: [
                {
                    // main container
                    type: 'Ti.UI.View',
                    properties: {
                        top: 0,
                        left: 0,
                        width: Ti.UI.FILL,
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.View',
                            bindId: 'sessionBackgroundView',
                            properties: {
                                top: 0,
                                width: Ti.UI.FILL,
                                height: Ti.UI.FILL
                            },
                            childTemplates: [
                                {
                                    type: 'Ti.UI.View',
                                    properties: {
                                        left: 0,
                                        width: '20%',
                                        height: Ti.UI.FILL

                                    },
                                    childTemplates: [
                                        {
                                            type: 'Ti.UI.Label',
                                            bindId: 'timeLabel',
                                            properties: {
                                                width: Ti.UI.FILL,
                                                top: 0,
                                                height: Ti.UI.FILL,
                                                font: liferay.fonts.h2,
                                                color: '#444444',
                                                backgroundColor: 'transparent',
                                                verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
                                                textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: 'Ti.UI.View',
                                    bindId: 'trackBar',
                                    properties: {
                                        left: '20%',
                                        width: '2%',
                                        top: 0,
                                        bottom: 0,
                                        backgroundColor: '#444444',
                                        zIndex: 2
                                    }
                                },
                                {
                                    type: 'Ti.UI.View',
                                    properties: {
                                        left: '22%',
                                        width: '8%',
                                        height: Ti.UI.FILL
                                    },
                                    childTemplates: [
                                        {
                                            type: 'Ti.UI.ImageView',
                                            bindId: 'typeImage',
                                            properties: {
                                                backgroundColor: 'transparent',
                                                width: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .05),
                                                height: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .05)
                                            }
                                        }
                                    ]},
                                {
                                    type: 'Ti.UI.View',
                                    properties: {
                                        left: '30%',
                                        width: '60%',
                                        height: Ti.UI.FILL
                                    },
                                    childTemplates: [
                                        {
                                            type: 'Ti.UI.View',
                                            properties: {
                                                layout: 'vertical',
                                                height: Ti.UI.FILL
                                            },
                                            childTemplates: [
                                                {
                                                    type: 'Ti.UI.View',
                                                    bindId: 'titleLabelPadTop'

                                                },
                                                {
                                                    type: 'Ti.UI.ImageView',
                                                    bindId: 'sponsorLogo',
                                                    properties: {
                                                        left: 0
                                                    }
                                                },
                                                {
                                                    type: 'Ti.UI.View',
                                                    bindId: 'titleLabelPad',
                                                    childTemplates: [
                                                        {
                                                            type: 'Ti.UI.Label',
                                                            bindId: 'titleLabel',
                                                            properties: {
                                                                font: liferay.fonts.h2,
                                                                color: '#444444',
                                                                width: Ti.UI.FILL,
                                                                height: Ti.UI.SIZE,
                                                                ellipsize: false,
                                                                wordWrap: true,
                                                                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
                                                                verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER
                                                            }
                                                        }

                                                    ]
                                                },
                                                {
                                                    type: 'Ti.UI.View',
                                                    bindId: 'titleLabelPadBottom'

                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: 'Ti.UI.View',
                                    properties: {
                                        left: '90%',
                                        width: '10%',
                                        height: Ti.UI.FILL
                                    },
                                    childTemplates: [
                                        {
                                            type: 'Ti.UI.ImageView',
                                            properties: {
                                                backgroundColor: 'transparent',
                                                width: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .05),
                                                height: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .05),
                                                image: liferay.settings.screens.agenda.layout.arrowIcon.backgroundImage
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'Ti.UI.View',
                            bindId: 'separatorView',
                            properties: {
                                bottom: 0,
                                height: '2%',
                                backgroundColor: '#DDDDDD'
                            }
                        }
                    ]
                }
            ]
        }
    };

    liferay.list_templates.list = {
        base: {
            properties: {
                height: '200dp'
            },
            childTemplates: [
                {
                    // left image container
                    type: 'Ti.UI.View',
                    properties: {
                        left: 0,
                        width: '25%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.View',
                            properties: {
                                top: '5dp',
                                bottom: '5dp',
                                left: '5dp',
                                right: '5dp'
                            },
                            childTemplates: [
                                {
                                    type: 'Ti.UI.ImageView',
                                    bindId: 'image',
                                    height: 'auto',
                                    width: 'auto'
                                }
                            ]
                        }
                    ]
                },
                {
                    // middle title container
                    type: 'Ti.UI.View',
                    properties: {
                        left: '28%',
                        width: '62%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.Label',
                            bindId: 'title',
                            properties: {
                                width: Ti.UI.FILL,
                                height: Ti.UI.FILL,
                                font: liferay.fonts.h3,
                                color: '#89A9C9',
                                backgroundColor: 'transparent',
                                verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
                                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
                            }

                        }
                    ]
                },
                {
                    // left image container
                    type: 'Ti.UI.View',
                    properties: {
                        left: '90%',
                        width: '10%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.ImageView',
                            properties: {
                                backgroundColor: 'transparent',
                                width: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .06),
                                height: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .06),
                                image: liferay.settings.screens.agenda.layout.arrowIcon.backgroundImage
                            }
                        }
                    ]
                }
            ]
        },
        base: {
            properties: {
                height: '200dp'
            },
            childTemplates: [
                {
                    // left image container
                    type: 'Ti.UI.View',
                    properties: {
                        left: 0,
                        width: '25%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.View',
                            properties: {
                                top: '5dp',
                                bottom: '5dp',
                                left: '5dp',
                                right: '5dp'
                            },
                            childTemplates: [
                                {
                                    type: 'Ti.UI.ImageView',
                                    bindId: 'image',
                                    height: 'auto',
                                    width: 'auto'
                                }
                            ]
                        }
                    ]
                },
                {
                    // middle title container
                    type: 'Ti.UI.View',
                    properties: {
                        left: '28%',
                        width: '62%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.Label',
                            bindId: 'title',
                            properties: {
                                width: Ti.UI.FILL,
                                height: Ti.UI.FILL,
                                font: liferay.fonts.h3,
                                color: '#89A9C9',
                                backgroundColor: 'transparent',
                                verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
                                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
                            }

                        }
                    ]
                },
                {
                    // left image container
                    type: 'Ti.UI.View',
                    properties: {
                        left: '90%',
                        width: '10%',
                        height: Ti.UI.FILL,
                        backgroundColor: 'transparent'
                    },
                    childTemplates: [
                        {
                            type: 'Ti.UI.ImageView',
                            properties: {
                                backgroundColor: 'transparent',
                                width: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .06),
                                height: liferay.tools.getDp(Ti.Platform.displayCaps.platformWidth * .06),
                                image: liferay.settings.screens.agenda.layout.arrowIcon.backgroundImage
                            }
                        }
                    ]
                }
            ]
        }
    };

    liferay.list_templates.list['with_subtitle'] = JSON.parse(JSON.stringify(liferay.list_templates.list.base));

    liferay.list_templates.list.with_subtitle.childTemplates[1].childTemplates =
            [
                {
                    type: 'Ti.UI.View',
                    properties: {
                        height: Ti.UI.SIZE,
                        width: Ti.UI.FILL,
                        layout: 'vertical'
                    },
                    childTemplates:
                    [
                        {
                            type: 'Ti.UI.Label',
                            bindId: 'title',
                            properties: {
                                width: Ti.UI.FILL,
                                height: Ti.UI.SIZE,
                                font: liferay.fonts.h3,
                                color: '#89A9C9',
                                backgroundColor: 'transparent',
                                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
                            }

                        },
                        {
                            type: 'Ti.UI.Label',
                            bindId: 'subtitle',
                            properties: {
                                top: '2dp',
                                width: Ti.UI.FILL,
                                height: Ti.UI.SIZE,
                                font: liferay.fonts.h1,
                                color: '#89A9C9',
                                backgroundColor: 'transparent',
                                textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT
                            }
                        }
                    ]
                }
        ];
};
