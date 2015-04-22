[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)

# Liferay Events Overview

The app store description:

> The Liferay events app allows you to keep up with the latest and greatest activities at Liferay's worldwide conferences and other events. Built on the Liferay Platform, use this powerful tool to plan which sessions you'd like to attend ahead of time, read up on conference presenters and the cool things they've done in the industry, and acquire other attendee contact information as you network. This app will also help you explore the city, from the best places to shop to the finest dining each event venue has to offer.

Basically, this app allows staffers to populate event data (speakers, headshots, session descriptions, iBeacon configuration) on a Liferay server,
and then the app will read from that server to present the data to the user (attendees).

## Features

* **Cross-Platform** (Android & iOS) - 99% of the code is cross-platform, with 2% being specific to Android or iOS (usually through if/else statements. Supports any form factor.
* **Works offline** - caches event data (including images) for quick startup and ability to use while disconnected from the network
* **Asynchronous updates** - Periodically updates itself in the background to show the most up to date data - or shake the device to force an update
* **Supports multiple events** - with an "event selection" screen
* **Supports event surveys**, and per-session ratings and feedback
* **Photo streams** using Fickr
* **Social media** including Facebook, LinkedIn, Twitter, Google+, and more
* **Badge scanning** via embedded QR scanner to build personal contacts list
* **Integration** with camera, contacts, media, major social media apps
* **Signed API** requests and HTTPS always
* **Fully internationalized**, with translations for many major languages

## Major functions and screens

* **Multiple events** - attendees can choose events based on preference or location (closest) and can freely switch between them.
* **Main (Home) screen** - links to major areas of app, social media checkins, QR badge scanning
* **Agenda** - (the most popular screen usually) show multi-day agendas, allowing attendees to build a personal agenda, filter the agenda to show specific categories only, along with color-coded events and sponsor logos.
    * **Agenda-Detail** - shows details of a specific session, including speaker pictures, session descriptions, social media checkins, rating/feedback, links to related maps and activities
* **Maps** - Shows a list of maps with images
    * **Maps-Detail** - includes a dynamic, navigable/scrollable google map, directions links, and other detail
* **Sponsors** - Shows the event's sponsor logos, with control over placement, ordering, level names, links, size of logos, and more
* **Contacts** - Allows attendees to see a list of pre-defined contacts and add their own via QR Code badge scans
    * **Contacts-Detail** - SHow detail of a specific contact, including name/company/job title/contact info/etc. Pulls pictures from gravatar.com
* **Activities** - Shows a list of local activities (after parties, etc)
    * **Activities-detail** - Shows details of a specific activity
* **Gallery** - Shows a photostream, allowing users to see pics taken by other attendees, and to upload their own (with optional names/tags) from their camera or photo library. Also allows "liking" of photos.
* **Gallery-detail** - swipable large versions of each image in the gallery
* **News** - Shows late-breaking news through a push notification of sorts

## What the app does when it is run

It's pretty simple:

1. Start background data fetch timers
2. Display splash screen
3. If an event was previously selected, load its data from the cache and go to that event and show the homepage for the event
4. If no event has been selected, show the event select screen

Note that if the app is disconnected when it is started, it will use the last "good" copy it was able to retrieve. If no "good" copy has been
retrieved, then the app will show a loading message.

When an event is "selected", then the home screen is shown, and several background timers are set in motion:

* News fetch timer (hopefully replaced with "real" push notifications in the future)
* Data fetch timer for the event
* iBeacon listeners (if iBeacons are enabled for the event)
* Telemetry timers to send/receive telemetry

## Network access details

* HTTPS Always
* Exponential backoffs when faced with network failure
* Compact JSON syntax for all data
* Periodic and silent async refresh of data

[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)
