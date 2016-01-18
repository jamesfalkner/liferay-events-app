[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)

# The Big Picture of Building

The Liferay Events app consists of several major components that must be built and properly deployed to different places before anything will really work.

1. The native mobile app, built with Titanium. This is the thing that runs on the phone (or in a simulator/emulator in your dev environment)
2. The app talks to a Liferay server, so you'll need to [install and have Liferay running](https://liferay.com/downloads) so the app can talk to it.
3. The Liferay Server requires two plugins to be installed (one is in a git repo, the other is an off-the-shelf plugin in the Liferay Marketplace):
    * [Skinny JSON Provider](https://www.liferay.com/marketplace/-/mp/application/52188778). Use the [Liferay Marketplace](https://dev.liferay.com/discover/portal/-/knowledge_base/6-2/accessing-the-liferay-marketplace) to install it on your Liferay server.
    * The [Liferay Events Hook](https://github.com/jamesfalkner/liferay-events-hook). You'll need to build this with Liferay Studio or Maven (see
    below)

## Step-by-Step to build and run

1. Install the required software packages from below
2. Install the required Titanium Modules from below
3. Install Liferay somewhere on a server
4. Fork or otherwise obtain a copy of this repo
5. Build and deploy the [Liferay Events Hook](https://github.com/jamesfalkner/liferay-events-hook) to your Liferay server
6. Install the [Skinny JSON Provider](https://www.liferay.com/marketplace/-/mp/application/52188778) to your Liferay server using the Liferay Marketplace
7. Populate Liferay with the necessary content (Dynamic Data Lists, see the [Liferay](LIFERAY.md) docs for details)
8. Configure the `tiapp.xml` and `settings.json` file.
9. Build and deploy the app to your device or simulator
10. Congratulate yourself, because it's not easy being you!

To build this mobile app and the Liferay Events Hook, you'll need to install a few software packages. If you've built mobile apps before,
you probably have most or all of this this! But for the rest, here's what you need to install:

# Developer Environment requirements and setup

You'll need to install several software packages on your machine, depending on your development OS and target device OS.

* Java Development Kit (JDK) 7
    * Go to http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html
    * If you want to use Java 8, don't! Titanium Studio and Liferay IDE don't support it (yet).
* Node.js (note that Titanium Studio includes it, except on Linux)
    * Visit http://nodejs.org/download and download the appropriate binary, OR use a package manager to install
* TiCh
    * This is a Node.js module that is used to manage app configuration (see below), install it with `npm install -g tich`. More info: https://www.npmjs.com/package/tich
* Git (note that Titanium Studio includes it, except on Linux)
    * Visit http://git-scm.com/downloads and download the appropriate binary, OR use a package manager to install
* Maven
    * Go to https://maven.apache.org/ and install it
* Titanium Studio
    * Visit http://www.appcelerator.com/titanium/download-titanium, and sign up for a free account, and download Titanium Studio and [follow its docs](http://docs.appcelerator.com/titanium/latest/#!/guide/Installing_Studio).
    * Note that technically you only need the Titanium CLI and Titanium SDK 3.5.0+ to be able to build projects, but Studio includes a bunch of things you'll need

If you want to build for iOS, you'll need a Mac, and Xcode 6.1.1 or later

If you want to build for Android, you'll need a Mac, Windows, or Linux machine, and Android SDK for API Level 10 or later. Note that iBeacons are only supported in API Level 18 or later.

## Required Titanium Modules

This app relies on several [Titanium modules](http://docs.appcelerator.com/titanium/latest/#!/guide/Using_a_Module) that you must download and install. Your build will fail if you do not have these modules. To install them, first install *gittio* with `npm install -g gittio`.
Then use *gittio* to install these:

* Ti.Barcode (for QR code scanning)
    * Install with `gittio install -g ti.barcode`
    * Homepage: http://gitt.io/component/ti.barcode
* Ti.ImageFactory (for compressing and resizing images during gallery upload; no you can't use built-in Ti.Blob methods!)
    * Install with `gittio install -g ti.imagefactory`
    * Homepage: http://gitt.io/component/ti.imagefactory
* TiBeacons (org.beuckman.tibeacons) - for iBeacons on iOS only!
    * Install with `gittio install -g org.beuckman.tibeacons`
    * Homepage: http://gitt.io/component/org.beuckman.tibeacons
* Liferay beacons (com.liferay.beacons) - for iBeacons on Android only!
    * Install with `gittio install -g com.liferay.beacons`
    * Homepage: http://gitt.io/component/com.liferay.beacons
* benCoding Android Tools (bencoding.android.tools)
    * Install with `gittio install -g bencoding.android.tools`
    * Homepage:  http://gitt.io/component/bencoding.android.tools

## Getting the source code

You'll need a copy of the source code to this app to build it. You can use git's command line (the `clone` command) to fork the project, or use Titanium Studio's UI to fork a copy. You could even just download a ZIP file of the repo!

* In Titanium Studio: *File -> Import -> Git ->Git Repo as New Project*
    * Fill out URI Field (all others leave as default): https://github.com/jamesfalkner/liferay-events-app.git

# Filesystem structure of this project

* `i18n` - XML files in here contain translated strings in different languages of the world
* `platform` - Holds platform-specific files
* `tiapp-default.xml` - An example Titanium config file (see *Liferay Events app configuration* above)
* `tich.cfg` - The default values read by TiCh (see *Liferay Events app configuration* above)
* `Resources` - Anything in here can be accessed in the app at runtime
* `Resources/app.js` - The file that starts everything off. When apps startup, this file is interpreted and executed.
* `Resources/android` - Android-specific images
* `Resources/fonts` - Custom fonts go in here
* `Resources/images` - All the images the app uses. See [Branding](BRANDING.md) to understand how to brand your app and make it your own.
* `Resources/includes` - Utility classes for the app
* `Resources/windows` - Classes representing each screen in the app
* `Resources/data.json` - The data the app uses if it is started for the first time while not connected to the network.
* `Resources/settings.json` - configuration for each screen in the app and the general config of the runtime. You'll need to update several values in here:

# Liferay Events app configuration

You will need to configure the app to suit your needs, in two places: the `tiapp.xml` config file and `settings.json` config file. They serve similar but different purposes.

## `tiapp.xml` configuration

The main app configuration file is `tiapp.xml`. This is read by Titanium and used to setup the app buildtime and runtime environment. It is not read directly by the app itself.
You may also notice that this file does not exist in this git repository! That's because it usually contains specific configuration for YOUR app, and no one else's.
You will need to create this file in one of two ways:

* Copy `tiapp-default.xml` to `tiapp.xml` and then edit it to suit your configuration (not recommended)

OR

* Copy `tich.cfg` to something like `tich-mycompany.cfg`, and edit it, then run `tich --in tiapp-default.xml --cfgfile tich-mycompany.cfg --select default`. This will auto-generate `tiapp.xml` for you, and substitute the values found in `tich-mycompany.cfg`. This is the preferred method (and is how I maintain different `tiapp.xml`'s for various testing scenarios)

You will want to customize the following settings found in your tich config file, some of which are sensitive/private and should not be revealed to anyone:

* configs.settings.[id, name, version, publisher, url, description, copyright, guid, sdk-version]
    * These are the app configs that corresopnd to Titanium's [tiapp.xml settings](http://docs.appcelerator.com/titanium/latest/#!/guide/tiapp.xml_and_timodule.xml_Reference). If you are seriously going to publish your app to the app stores, you really should understand these values and how they evolve over the life of your app. If not, just make stuff up.
* config.settings.properties - These are settings that the app will reference during its execution, and you MUST customize these if you want things to really work
    * `ti.facebook.appid` - You'll need a [Facebook app](https://www.facebook.com/help/493707223977442/) id if you want attendees to be able to checkin/post to facebook within the app.
    * `liferay.twitter.consumerKey` - The twitter app consumer key. You'll need a [Twitter app](https://apps.twitter.com/) if you want attendees to do Twitter from within the app.
    * `liferay.twitter.consumerSecret` - The twitter app consumer secret. You'll need a [Twitter app](https://apps.twitter.com/) if you want attendees to do Twitter from within the app.
    * `liferay.json_shared_secret` - This is a string which is used to sign API requests to the Liferay Hook. The value here will need to match the value in the Liferay Hook, but it can be anything you want, preferably something hard to guess.
    * `liferay.flickr.sets_baseurl` - The URL to your main Flickr page. This link is used when posting images to Twitter/Facebook from the photo gallery.
    * `liferay.flickr.api_key` - Your Flickr API key. You'll need to get this from your Flickr account to enable attendees to upload and view images from your event. [Get one here.](https://www.flickr.com/services/apps/create/apply/)
    * `liferay.flickr.auth_token` - Your Flickr Auth token. You'll need to get this from your Flickr account to enable attendees to upload and view images from your event. [Get one here.](https://www.flickr.com/services/apps/create/apply/)
    * `liferay.flickr.mini_token` - Your Flickr Mini token. You'll need to get this from your Flickr account to enable attendees to upload and view images from your event. [Get one here.](https://www.flickr.com/services/apps/create/apply/)
    * `liferay.flickr.shared_secret` - Your Flickr Shared secret. You'll need to get this from your Flickr account to enable attendees to upload and view images from your event. [Get one here.](https://www.flickr.com/services/apps/create/apply/)
    * `liferay.regular.font` - The custom "regular" font face to use throughout the app.
    * `liferay.light.font` - The custom "light" font face to use throughout the app.
        * If you use custom fonts for the above two settings, you'll need to [understand how fonts work in Titanium](http://docs.appcelerator.com/titanium/latest/#!/guide/Custom_Fonts).
    * `liferay.default_event_url` - The default URL for your company or website (this can be customized per-event elsewhere)
    * `liferay.default_event_hashtag `- The default hashtag for your events (this can be customized per-event elsewhere)
    * `liferay.default_event_logo_url` - The URL to a logo for your event (this can be customized per-event elsewhere)
    * `liferay.version.string` - A human-readable description of the version of this app. You can *longpress* on the Event Select screen's text at the bottom to see this.
* config.settings.raw - More config settings, mostly for the `AndroidManifest.xml` that is part of any Android app. See the [Android Manifest docs](http://developer.android.com/guide/topics/manifest/manifest-intro.html) for details on what these represent.
    * `/ti:app/android/manifest/@package`: A fully qualified package name. This is copied from the `config.settings.id` setting by default.
    * `/ti:app/android/manifest/@android:versionCode`: Your version code. see Android Manifest docs above.
    * `/ti:app/android/manifest/@android:versionName`: Your version name. See Android Manifest docs above.
    * `/ti:app/android/manifest/application/@android:label`: The name given to your app. Usually same as your app name in properties above.
    * `/ti:app/android/manifest/application/@android:name`: Should be *<appname>*Application.
    * `/ti:app/android/manifest/application/activity[@android:label='Main Activity']/@android:name`: Should be *.AppName*Activity.
    * `/ti:app/android/manifest/application/meta-data[@android:name='com.google.android.maps.v2.API_KEY']/@android:value`: Should be your Google Maps API v2 API Key. See [Ti.Map docs](http://docs.appcelerator.com/titanium/latest/#!/guide/Google_Maps_v2_for_Android) for details.

## `settings.json` configuration

This file is read by the app itself at startup time and values found therein are used to configure the runtime behavior of the app. The settings that you *MUST* change are:

* `server.dataHost.host` - The URL scheme and hostname of the server with the *Skinny JSON Provider* app installed and that which will serve data about agenda, activities, headshots, etc. For example `https://www.company.com`
* `server.dataHost.siteListingType` - This is the numeric ID of your DDL that holds the list of events that the app knows about.
* `server.servicesHost.host` - The URL scheme and hostname of the server with the Liferay Events Hook installed. The app will use that server for the writeable telemetry, ratings, surveys, favorites, etc. For example `https://mdata.company.com`.

Others that you *might* need to change, but probably not (the defaults should work):

* `server.dataHost.endpoint` - The path to the Skinny JSON Provider plugin. The default is the one from the Skinny JSON Provider app.
* `server.servicesHost.ratingServiceEndpoint` - The path to the ratings service. The default is the one from the Liferay Events plugin.
* `server.servicesHost.surveyServiceEndpoint` - The path to the ratings service. The default is the one from the Liferay Events plugin.
* `server.servicesHost.favoritesServiceEndpoint` - The path to the ratings service. The default is the one from the Liferay Events plugin.
* `server.servicesHost.beaconServiceEndpoint` - The path to the ratings service. The default is the one from the Liferay Events plugin.

Other interesting settings:

* `beaconFetchFrequencyMins` - How often (in minutes) to fetch new beacon config data
* `beaconGlobalFrequencyLimitSecs` - Minimum time between any two beacon notifications
* `newsFrequencyMins` - How often (in minuets) to look to see if new news items are present
* `backoffMultiplier` - The bigger the multiplier, the longer the app waits for network fetch retries when they fail
* `initialBackoffSecs` - Initial amount of time (in seconds) to wait before retrying failed network fetches
* `eventListFetchMins` - How often (in minutes) to fetch updated lists of all events
* `eventDataFetchMins` - How often (in minutes) to fetch updated event data for the current event

The rest of the settings should be left alone until you know what you are doing!

# Building the Mobile app

Once you've created and configured your `tiapp.xml` and `settings.json`, it's time to build the app! You should consult the [Titanium documentation for details on how to build and run Titanium apps](http://docs.appcelerator.com/titanium/latest/#!/guide/Running_Titanium_Applications). You can build and deploy it using Titanium Studio (the GUI), or the Titanium CLI.
If you're able to build and run it successfully, pat yourself on the back and congratulate yourself!

## Using Titanium Studio

Note that if you import this project into Titanium Studio *before* you have created your customized `tiapp.xml` file, then Titanium Studio will probably not recognize the project as a Titanium project, and not offer the convenient *Run* or *Run as* menu.

Once you have created a proper `tiapp.xml`, you must force Titanium Studio to recognize your project as a real app, by right-clicking on the project in the *Project Explorer* window, and selecting *Properties* then clicking *Project Natures*, and selecting the *Mobile* nature, then clicking OK, and then follow the instructions to close and re-open the project.

## Using the Titanium CLI

Here is an example of using the CLI to build the app and run it in the iOS Simulator, which will probably not work for you since Device IDs change with each Xcode build. If this command fails, it will hopefully show you the valid Device IDs to use in your next attempt!

```bash
    # make sure you have created your tiapp.xml file!
    cd my-workspace
    ti build --platform iphone --target simulator --device-id 2E852AB5-E53B-44E2-91F5-95E61A7599DC --sim-type iphone
```

For Android:

```bash
    # make sure you have created your tiapp.xml file!
    cd my-workspace
    ti build --platform android --output-dir /tmp --target emulator
```

Note that if you intend to publish the app to the app stores, you'll have to setup the cryptographic signing infrastructure (which is different for Android vs. iOS) and way out of scope for this doc. See the Titanium docs above for details on how to set it up.

## A note on iOS 64-bit

Several modules used by this app have not yet been updated to support 64-bit ARM architectures by their maintainers. If you intend to submit an app
to Apple's iOS app store, be advised of their [64-bit requirement](https://developer.apple.com/news/?id=10202014a) and contact the maintainers of each
library and ask them to update their module! Alternatively, since they are all open source, you could download and re-build the modules yourself!

# Putting it all together

Once you've successfully built and deployed the app, and have your Liferay server running, congratulations! Run the app and ensure it reads and writes data successfully. See the [Data guide](DATA.md) for details on how to setup the data services.

[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)
