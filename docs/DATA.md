[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)

# Data formats Overview

This app reads and writes data to and from Liferay through its web services, across the internet. Most of the time, the compact JSON syntax is used to minimize network traffic and provide
convenience to developers of this app, since the app is written in JavaScript.

The app reads read-only JSON data through the [Skinny JSON Provider](https://www.liferay.com/marketplace/-/mp/application/52188778). The app writes read/write data through the Liferay Events Hook included in this project.

The read-only data is entered into Liferay in the form of [Dynamic Data Lists](https://dev.liferay.com/discover/portal/-/knowledge_base/6-2/using-web-forms-and-dynamic-data-lists). You'll need to create several Dynamic Data List Definitions outlined in this document before you can enter the actual data into the lists.
See the [Liferay](LIFERAY.md) chapter for details.

## Read-only data types

1. Event Listing. On startup, the app will first fetch a DDL list of events using the `server.dataHost` settings from `settings.json` (see the [Building](BUILDING.md) doc for details on this setting).
2. Per-Event Data. Once an event is chosen by the user, the app fetches data about the entire event (agenda, speakers, sessions, etc) using the same endpoint as above.
3. News. The app periodically fetches any new news items.

## Read/write data types

1. Ratings. When a photo is "thumbs-upped", a call is made to the `ratingServiceEndpoint` specified in `settings.json` to register (write) it. Also, when the photostream is browsed, a call is made to fetch the number of "likes" for each photo as it is viewed.
2. Surveys. When a user fills out the feedback form for a session, or the event survey, a call is made to the `surveyServiceEndpoint` to record it.
3. Favorites. When a user favorites ("add to my agenda") a session, a call is made to the `favoritesServiceEndpoint` to record it.
4. Beacons. When a user encounters iBeacons, a periodical recording of telemetry (which beacons can be seen) is made to the `beaconServiceEndpoint`.

Note that you can configure the read-only host to be separate from the read-write host (using the `server.dataHost` vs. `server.servicesHost` setting in `settings.json`. This can be used in the case where the read-only data is on a mission-critical server and one wishes to never allow "writes" to it for security.

## Read/write data security

Currently the app is completely anonymous, and as such, calls to the read-only and read/write APIs are done without authentication. Therefore, there is potential for denial-of-service abuse. To minimize that, the read/write endpoints in the Liferay Events Hook
are designed to require *signed* API calls. API calls are signed by concatenating all of the arguments of the call, along with a *shared secret* string, and then computing the hash of that, and sending the hash along with the API call.
The server will compute the same hash using the supplied arguments, and the two hashes must match.

For example, suppose you want to make an HTTP GET request to an endpoint, with arguments `a` and `b` and `c` set to values `1` and `2` and `3`, respectively. So something like `http://foo.com?a=1&b=2&c=3`. To sign this request,
you would concatenate the arguments (in alphabetical order) along with a a secret that must be known to both sides, for example `secret`. So you would end up with `a=1b=2c=3secret`. The SHA-256 hash of this string is `e7f7348920807e402c5911b4b39e188f61c6041d42e9a95e16b170f1646335bc`.
So the actual request would look like `http://foo.com?api_key=e7f7348920807e402c5911b4b39e188f61c6041d42e9a95e16b170f1646335bc&a=1&b=2&c=3` (but keep in mind these arguments are NOT encoded as part of the URL - they are sent via a multi-part HTTP POST).

Even with signed APIs, there is still a possibility of abuse via replay attacks. Therefore, the Liferay Events Hook attempts to disallow repeat requests using the exact same arguments. While not completely foolproof,
it is this author's opinion that it's "good enough" for the purposes of our use case. If you want something better, then code it up and send it in!

Furthermore, the app uses TLS at all times, via built-in support for https. The app also uses HTTP POST whenever feasible, to avoid encoding parameters into the HTTP request URLs (which show up in web server log files and elsewhere).

# General Guidelines

* All times are represented in format `YYYY-MM-DD` or `HH:MM` and are assumed to be in the local event timezone unless otherwise noted. The app reads these and parses them.
* Boolean values are represented by the strings `true` and `false` - the app converts to real booleans before use.
* Some items are themselves are strings that represent JSON documents and must be parsed as such again, in code. For example, you might find a string like `"{\"foo\": \"bar\", \"baz\": 3}"` and you would need to parse this to programmatically access it (e.g. using `JSON.parse()`).
* Some items are lists of name/value pairs, e.g. `a=b,c=d` and may contain whitespace (including tab characters!) that this app deals with, for example by parsing `a=b,c=d` the same as ` a =b , c = d`. Also, colon-separated lists like `a:b:c,d:e:f` are parsed the same as ` a: b : c ,d: e :f `. Lots of `String.trim()` here. Enjoy!
* Every record in a Liferay DDL will automatically have a UUID associated with it named `uuid`. This is sometimes used to relate two items together, e.g. agenda items have a list of speakers represented as a list of uuids, which is used to get the right speaker record via the uuid.
* This app will download and cache all event data for a given event. However, because it requires multiple fetches to get all data, if any one of the fetches fails, all data is thrown away until next attempt.
* In the first versions of this app, care was taken to ensure fields were internationalized, so that you could, for example create agenda entries in multiple languages. Experience taught us that this was rarely desired, events are primarily held in one language, and while nice to have, most event staff did not have the time or energy or money to get data translated. Therefore most data fields are not localized (although the app's UI is!).

# Required DDL Data Definitions

Note that none of these are nested or repeatable fields! Also note that the name of the fields is critical - if you mess that up, things won't work. So be sure to name them properly (and case matters!).

## The Event List DDL Definition

* `active`: DDL Field Type: Boolean. inactive events aren't ready for primetime and the app has a special trick to unlock them (used for testing prior to launching an event in the app)
* `booth_map_name`: DDL Field Type: Text. name of map (see below) that represent sponsor booths
* `end_date`: DDL Field Type: Date. when the "thanks for attending" message should show in the app
* `end_time`: DDL Field Type: Date. when the "thanks for attending" message should show in the app
* `event_hashtag`: DDL Field Type: Text. official event Twitter hashtag (e.g. `#lrdevcon`)
* `event_type_dict`: DDL Field Type: Text. translations for select options for sponsor levels, session types, and agenda filter names. Format: comma-separated name=value pairs. E.g. `diamond=DIAMANT,gold=Gold` means the level with key "diamond" should be displayed as "DIAMANT" (German translation of Diamond) and key "gold" should be displayed as "Gold".
* `event_tz`: DDL Field Type: Text. number of hours ahead or behind GMT (negative numbers indicate ahead, e.g. France is -2 in summer, can be used to correct for phones that are set to a different timezone than the event itself to calculate 'local event time' based on device time.
* `event_url`: Web URL to the event microsite
* `eventid`: DDL Field Type: Text. identifier used to namespace the writeable data in the Liferay Events Hook for this event
* `inactive_msg`: DDL Field Type: Text. message to show user when trying to access inactive event via mobile app
* `latitude`: DDL Field Type: Text. Decimal degrees of latitude for event location (approximate, used for the 'pick the closest location' button in app)
* `location_label`: DDL Field Type: Text. Name of location (usually a city name, e.g. Paris or Boston)
* `logo`: DDL Field Type: Documents and Media. the logo to use to represent the event. Note that the string generated by the SKinny JSON Provider is an embedded JSON document which the app uses to construct the final URL to the logo.
* `longitude`: DDL Field Type: Text. Decimal degrees of longitude for event location (approximate)
* `menutitle`: DDL Field Type: Text. String which appears at top of mobile app screens
* `metadata_types`: DDL Field Type: Text. See below for details!
* `news_type`: DDL Field Type: Text. ddlRecordSetId of the list of news to show user, can periodically check this to see if there is breaking news (see news item below)
* `ordered_sponsor_levels`: DDL Field Type: Text. the order and size of the sponsor logos on the Sponsors screen. Format: comma-separated list of [name:logos-per-row:size] triplets. For example `diamond:1:large,platinum:2:small` means that Diamond-level sponsor logos should be shown at the top, 1 per row, and 'large' size, where Platinum-level sponsors are shown 2 per row, and a smaller size. Size can be large or small. Names of sponsor levels are used in the sponsor list, and the display name can be found in the event_type_dict.
* `randomize_sponsors`:DDL Field Type: Boolean. whether or not to randomize order of individual logos within each sponsor level.
* `register_url`: DDL Field Type: Text. the URL for people to register to attend.
* `session_survey_questions`: DDL Field Type: Text Area.  A list of questions to ask when asking for session feedback. Specific sessions can override this value in the Agenda data (see below).
* `start_date`: DDL Field Type: Date. when the event begins, used to order on the 'event select' screen.
* `start_time`: DDL Field Type: Text. when the event begins, used to order on the 'event select' screen. format HH:MM
* `survey_questions`: DDL Field Type: Text Area. A list of questions to ask when event feedback is given (if this field is specified, there is an icon on the home screen of the app).
* `title`: DDL Field Type: Text. name of event to show on the event select screen.
* `track_colors`: DDL Field Type: Text. Custom definition of track bar colors for agenda screen. Format: comma-separated list of hex values (where the first one represents Room 1, etc) For example #234233,#66DDAA
* `upload_photosetid`: DDL Field Type: Text. the Flickr.com photoset id used to upload and retrieve pictures from the event [see below for details]

### The `metadata_types` element

The event list above has a `metadata_types` field. The format of this element is a comma-separated list of name:ID pairs. For example `agenda:12323423,activities:23423243,...` The IDs refer to other Dynamic Data Lists (DDLs) holding the associated data. The app uses these IDs to retrieve data for specific events. The elements in the `metadata_types` list include:

* `agenda`: A list of all agenda items for the event
* `activities`: A list of onsite and offsite activities (e.g. community meetups, social hours, etc)
* `contacts`: A list of initial contacts to populate the 'Contacts' screen for the event
* `galleries`: A list of photo galleries to show on the 'Gallery' screen for the event
* `maps`: A list of maps to show on the 'Maps' screen for the event
* `rooms`: A list of rooms used at the event (used to map agenda items to physical rooms)
* `speakers`: A list of all speakers (used to generate pics, biographies, etc)
* `sponsors`: A list of the sponsors of the event, for the 'Sponsors' screen
* `beacon_forms`, `beacon_individual_events`, `beacon_region_events`, and `beacon_regions`: These are related to the use of iBeacons feature at events (see below).

## The News DDL Definition

This refers to a DDL holding news items for an event and is referenced via the above `news_type` field in the event listing. This list should have the following fields:

* `date` - The date the news should be shown. DDL type: Date.
* `time` - The time of day the news should be shown. DDL Type: Text. Format: HH:MM
* `content` - The actual news content. Type: Text Area.

## The Agenda DDL Definition

The agenda DDL Definition is the most complicated of all the schemas. Note that all agenda items are represented here, including breaks, after-parties, registration, etc. Some elements may not have all fields filled out (e.g. there are no speakers for the 'Breakfast' agenda item, and no video URLs either). The DDL Definition must have the following fields:

* `date`: Type: Date. Day of the session.
* `display_in_mobile_app`: Type: Boolean. whether to display in mobile app or not (some items are not)
* `display_on_live`: Type: Boolean. whether to display on web site or not
* `download_url`: slides URL
* `enable_notes`: Type: Boolean. Whether to enable 'personal notes' field in app (e.g. "Lunch" is not enabled for this)
* `enable_ratings`: Type: Boolean. Whether to enable the session to be rated (e.g. "Afternoon Break" is not rateable)
* `end_time_hour`:Type: Multi-Select (1, 2, ..., 23). When the session ends
* `end_time_minutes`: Multi-Select (00, 05, 10, ..., 55). When the session ends
* `room_uuid`: Type: Text. The UUID of the room element that in which this session takes place
* `session_summary`: Type: Text. The human-readable abstract/summary of the session
* `session_type`: Multi-select representing the type ("Technical", "Case Study", "Workshop", etc. used to put cool icons on the display)
* `speakers_uuid`:  Type: Text. A comma-separated list of speaker UUIDs for the session.
* `select_category`:  Type: Multi-select. E.g. all Mobile-related talks would have mobile as a category, or perhaps mobile, responsive. These are free-form tags that are used on the website and mobile app to allow attendees to only show certain kinds of sessions. The display name of the filters can be found in the event_type_dict dictionary for the event.
* `sponsors_uuid`: A comma-separated list of sponsor UUIDs that are sponsoring the session (e.g. for sponsored after-parties, etc)
* `start_time_hour`: Type: Multi-Select (1, 2, ..., 23). When it starts.
* `start_time_minutes`:Type: Multi-Select (00, 05, ..., 55).  When it starts.
* `survey_questions`: Type: Text Area. The list of questions to ask when rating this specific session. If blank, the `session_survey_questions` field from the event data is used.
* `title`: Type: Text. The title of the session.

### Survey Question fields

The `survey_questions` and `session_survey_questions` fields in the Event Listing DDL, and the `survey_questions` field in the Agenda DDL represent a form that users can fill out, and the results are stored using the Liferay Events Hook `surveyServiceEndpoint` web service endpoint.

The format of this field are a set of questions (one per line). Each line is of the format:

~~`TYPE`^^`QUESTION`^^`OPTION1`^^`OPTION2`^^...^^`OPTIONN`

Where `TYPE` is one of:

* `text` - A one-liner text response question. `QUESTION` is the question to ask, and there are no options.
* `texarea` - Same as `text` but a bigger area for the answer.
* `rating` - A slider to rate from 1 to 10. `QUESTION` is the question to ask. No options.
* `option` - A single-choice question. `QUESTION` is the question to ask. Possible answers are specified with options.
* `option-multiple` - Same as `option` except multiple answers can be chosen.

Note the use if `~~` and `^^` as delimiters. These are required. These were chosen because they are very unlikely to be part of a human-readable question or answer (as opposed to single-character delimiters like `,` or `:` or `!` or any of those other symbols on a typical English keyboard).

## The Speakers DDL Definition

This list will hold all speakers for an event.

* `speaker_bio`: Type: Textarea. Human-readable biography of speaker
* `speaker_company`: Type: Text. Their company
* `speaker_highlight`: Type: Boolean.  Whether they are highlighted. Highlighted speakers could be possibly shown on a "Highlighted speakers" page on the website.
* `speaker_image`: Type: Documents and Media. The URL to the headshot.
* `speaker_keynote`: Type: Boolean. true means it's a keynote, and is highlighted on the agenda listing.
* `speaker_name`: Type: Text. Name of speaker
* `speaker_social_blog`: Type: Text. URL to their blog
* `speaker_social_facebook`: Type: Text. URL to their Facebook page
* `speaker_social_liferay`: Type: Text. URL to their Liferay profile
* `speaker_social_linkedin`: Type: Text. URL to their LinkedIn page
* `speaker_social_twitter`: Type: Text. URL to their twitter page
* `speaker_social_youtube`: Type: Text. URL to their youtube page
* `speaker_title`: Type: Text. Their job title

## The Sponsors DDL Definition

This list will hold all sponsors (and their logos and URLs) for an event.

* `docmedia`: Type: Documents and Media. The sponsor's logo.
* `level_rank`: Type: Text. Their rank within their level. E.g. a Gold sponsor of rank 2 would be displayed below rank 1 or 0. Ignored if randomize_sponsors is in effect for this event.
* `link`: Type: Text. The link to the sponsor's homepage/website.
* `name`: Type: Text.The name of the sponsor.
* `rank`: Type: single-choice select. Their rank - e.g. 'diamond' or 'platinum' or 'exhibitor'.
* `type`: Type: single-choice select. The app recognizes different sponsor types. 'event' is a traditional sponsor. 'photo' is a photostream sponsor. 'scan' is a badge scanner sponsor.

# The Rooms DDL Definition

Rooms are linked to sessions via UUID

* `room_name`: Type: text. Name of room (e.g. "Grote Zaal" or "Grand Ballroom")
* `room_number`: Type: text. This field is parsed as a decimal number and used as a 1-based offset into the `track_colors` list. So if this field is "1" then the first color listed in `track_colors` for this event will be the color used on the agenda screen for any sessions in this room.

# The Activities DDL Definition

Activities are things like Community Meetups, etc that appear on the "Activities" screen in the mobile app.

* `date`: Type: Date, The date of the activity.
* `description`: Type: Text. Human-readable description of activity.
* `endtime`: Type: Text. When it ends. Format: HH:MM
* `hostedby`: Type: Text. Company or individual that is hosting activity
* `map_name`: Type: Text.  The name of the map element that can be used to generate a pointer to the map itself. If this name matches the name of a Map entry, then the link is created automatically.
* `picture`: Type: Documents and Media. The the image for the activity.
* `starttime`: When it starts. Format: HH:MM
* `title`: The title of the activity

# The Maps DDL Definition

Maps are used to show room layouts and provide maps to relevant physical locations (e.g. hotels, pubs, tennis courts, etc).

* `address`: Type: Textarea. The physical address of the place. Don't try to parse it, just use it as input to some map service like google. Also, for room maps, there's no address.
* `icon`: Type: Documents and Media. A small thumbnail representing the location.
* `image`:  Type: Documents and Media. A bigger image representing the location.
* `name`: Type: text. The name of the place (is used in the Activities list to generate a link to this map)
* `phone`: Type: text.If you want to call/text the location, use this phone number.
* `show_map`: Type: Boolean. For items that don't have an actual address (like a room in a venue), this is 'false', and the mobile app won't generate a dynamic google map.

# The Contacts DDL Definition

In the mobile app, there is a Contacts screen with a default list of contacts, that can be added to at certain events that have QR codes printed on badges.

* `blog`: Type: Text. Their blog pointer
* `city`: Type: Text.The city in which they do business
* `companyname`: Type: Text.Name of company
* `country`: Type: Text.Name of country
* `facebook`: Type: Text.Their facebook page
* `firstname`: Type: Text.Their given name
* `googleplus`: Type: Text.Their Google+ page
* `lastname`: Type: Text.Their family name
* `linkedin`: Type: Text.Their LinkedIn page
* `phone`: Type: Text.Their business phone number
* `picture`: Type: Documents and Media.Their image (again, a JSON object that must be parsed to construct an image URL)
* `readonly`: Type: Boolean. Whether they can be deleted.
* `state`: Type: Text. Their state/region
* `street`: Type: Text. Their street address
* `twitter`: Type: Text. Their twitter page
* `url`: Type: Text. Their company's URL
* `youtube`: Type: Text.Their YouTube page
* `zip`: Type: Text.Their postal code

If you want to use QR code badge scanning, make sure the QR codes are of the [MeCard variety](http://en.wikipedia.org/wiki/MeCard).

# The Gallery DDL Definition

In the mobile app, there is a Gallery page with different tabs for different events. Generally, the gallery in position 1 is the gallery representing the current event that is being browsed.

* `photosetid`: The flickr.com photoset identifier
* `position`: Single-select of 1, 2, 3, or 4. The position of the tab on the gallery screen in the app (1=leftmost, 4=rightmost)
* `rateable`: Type: boolean. Whether pics in this gallery can be rated (thumbs up). Generally only the current event's pics can be rated.
* `title`: Type: text. The title of the gallery (appears on tabs)

During the event, attendees are encouraged to take pics and upload them with the mobile app, and the pics go to Flickr. You can retrieve a listing of all the pics from Flickr using the photosetid and [Flickr's web service](https://www.flickr.com/services/api/flickr.photosets.getPhotos.html) (be sure to specify your Flickr API Key in the `tiapp.xml` config). This listing you get back from Flickr also includes a direct photo URL for each photo, so you can make pretty pictures dance.

# iBeacon Configuration

There are many variables to consider when designing an app that will interact with Bluetooth beacons. How many different spaces and times you want to support,
the physical size and layout of the space (your local user group meetup, or the World Cup?), what kinds of interactions you wish to have, how crowded the space
will be, how many beacons you can get your hands on, and a whole lot more. This means that your beacon configuration is most likely going to be changing a lot,
and in some cases will be unknown until you are actually present to do setup. So no hard-coding of beacon identifiers or region names or anything of the sort is allowed!

You should read [this series of blog entries](https://www.liferay.com/web/james.falkner/blog/-/blogs/ibeacons-and-liferay-for-audience-engagement-part-3) to understand more about iBeacon configurations, but you need to create 4 DDLs for each event at which you wish to support beacons. If
you do not want to support beacons at your events, be sure NOT to include the `beacon_forms`, `beacon_individual_events`, `beacon_region_events`, or `beacon_regions`
values in the `metadata_types` field for the event in the Event Listing DDL.

The DDL Definitions to create:

## The Beacon Regions List `beacon_regions` DDL Definition

This list defines the set of beacon regions for a given event. Each region is defined with an identifier, and one or more of Beacon UUID, Major, and Minor. So that's the schema for this dynamic data list:

* `name`- Type: text. A human-readable identifier that shows up in the app (but is otherwise unknown to the beacons)
* `beacon_uuid`- Type: text. The hardware UUID of all beacons in this region
* `beacon_major`- Type: Text. The hardware major number of all beacons in this region (or blank to represent any major number)
* `beacon_minor`- Type: Text. The hardware minor number of all beacons in this region (or blank to represent any minor number)
* `muted`- Type: boolean. a flag that allows event staff to selectively turn off a region for any particular reason

## The Beacon Region Events List `beacon_region_events` DDL Definition

This list defines the things that can happen based on region actions such as entering or leaving one of the above defined regions. This is usually your largest, because most interactions are based on region entry/exit (which is the only thing your app can detect when it's backgrounded or quit entirely). Only those notifications deemed most worthy make it through the gauntlet of checks represented by the below. So each possible interaction is defined with this schema:

* `region_name`- Type: text. A textual description of the region for which the action should occur (this name shows up in the app as well)
* `on`- Type: A 'select' field to define the kind of event for this region - `entry` or `exit`.
* `initial_delay`- Type: Number. How long to wait after entry/exit before the notification is shown. This allows you to delay the notification (e.g. waiting 10 minutes after entering the Cafe before offering a discounted drink ticket). It also works with the cancelable flag below to avoid transient events and NOT trigger interactions in certain situations.
* `repeat`- Type: Number. How many times to repeat this specific notification. No sense in repeating most messages, right? Maybe 1-5 times, but more than that and people get annoyed.
* `min_repeat_period`-Type: Number. How long to wait before repeats. If you have a repeating message (e.g. a "Welcome to the sponsor expo, sign in to get your prize" kind of interaction, you would get annoyed if you got that every time you walked in!)
* `cancelable`- Type: boolean A flag to indicate that a delayed notification can be cancelled if the user reverses their behavior. See Death Row below.
* `message`- Type: text. the initial message to display (and we have string substitution, for example $SESSION_TITLE and $SPEAKER_NAME so we can show dynamic messages, based on the agenda and time of day)
* `actions`- Type: text. the options to present. Each notification consists of the message and an optional set of actions the user can take. For example, in a "Welcome to the event" message you might want to offer a quick link to the registration desk map, a link to the agenda, or a link to checkin on Foursquare or Twitter, or a form to fill out to register for something. We invented our own simple list syntax here to encode a list of actions into a String, which identifies different kinds of actions (take the user to a specific screen in the app, load a web page, show a document or form, create a tweet that the user can edit and send, etc). See below for details.
* `preferences_gate`- This allows logic to be introduced as part of the gamification design. Preferences can be programmatically set based on user behavior (e.g. filling out a form, finding a mystery object, or completing a game quest), and those preferences can then be checked later on using this field to avoid showing the wrong notification, or duplicate notifications for game elements that have already been completed.
* `start_date`/`start_time`/`end_date`/`end_time`- Type: Date (for `start_date`/`end_date`), or Text (`start_time`/`end_time` format: HH:MM) A way to avoid interactions at certain times of the day. For example, you don't want to show a "Come join us after today's sessions for happy hour!" if happy hour took place yesterday.

All of these configurations are designed to filter the interactions to only those that really should show up. In addition, the app also hard-codes a global event frequency limit (see the `beaconGlobalFrequencyLimitSecs` setting in the [Building](BUILDING.md) guide), so even the most "chatty" event staffers can be thwarted in their plan to fill your notification tray.

## The Individual Beacon Events List  `beacon_individual_events` DDL Definition

In addition to region-wide events (entry/exit) the app also supports interactions to take place within the context of a specific beacon. The schema is virtually identical to those for region-wide events, but in this case you define the action to occur based on proximity to a specific beacon:

* `beacon_name`- Type: text The name of the beacon (a human-readable name, e.g. "Mystery Object 5")
* `region_name`- Type: text. The name of the region in which the person must be in for this event to occur.
* `beacon_major`/`beacon_minor`- Since this event is specific to a specific beacon, you need to identify it here!
* `on_proximity`- A select field. How close you have to get to the beacon before triggering the interaction. It's a multi-select field for immediate, near, or far, or any.
* `initial_delay`/`repeat`/`min_repeat_period`/`cancelable`/`message`/`actions`/`preferences_gate`/`start_date`/`start_time`/`end_date`/`end_time` - identical to the schema for Region Events.

## The Beacon Forms `beacon_forms` DDL Definition

One of the interactive features of the Liferay Events app is the ability to present forms to the user as part of a region or beacon trigger. This has been for example used as part of a "mystery guest" game where attendees would walk around to each sponsor booth and be presented a form, and if they entered the right values they'd be entered into a drawing for a prize. The form is submitted to a special game server which evaluates the answers and returns results (a simple Liferay web service). So in the above event definitions, there is an "Actions" field and one of those actions is to present one of these forms.

* `form_id`- Type: text. The identifier for the form (referenced from the actions list above)
* `title`/ `subtitle` / `sub-subtitle` / `intro` - These are textual elements at the top of the form (introductory text for describing the purpose of the form)
* `form`- Type: text. The form itself. The syntax here is is identical to the `survey_questions` in the Agenda and Event Listing DDLs.
* `content_url`- Type: text. If present, this is a URL to a piece of web content to display at the top of the form. Useful for marketing collateral!
* `preferences_on_success`- Type: text. Remember the preferences_gate defined for beacon events? If you successfully fill out the form, this list of comma-separated preference_on_success flags are "set". If you fail the form, the `preferences_on_fail` preferences are set.
* `preferences_on_fail`- Type: text. See `preferences_on_success`.
* `repeat`- How many times to repeat the form. You might only want some forms fill-out-able once.



[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)
