[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)

# Liferay Integration

This app runs on mobile devices, but talks to backend data services through Liferay Portal and its associated web services.


## Setting up Liferay

You will need to follow these steps to install and configure Liferay Portal such that this app can talk to it:

1. Deploy a server (virtual or physical) somewhere on the internet with a fixed hostname or IP address. It should be running a modern OS variant of Windows, Mac OS X, or Linux. Details on setting this up are way beyond the scope of this document.
2. Install Liferay Portal on this server by [downloading it](http://liferay.com/downloads) and [following the docs](https://dev.liferay.com/discover/portal/-/knowledge_base/6-1/installing-a-bundle). You can configure an Apache frontend, configure HTTPS (or not), and do all sorts of tweaks depending on your IT stills. But the end result should be a Liferay Portal server that can be accessed anonymously by anyone in the world.
3. Install the [Skinny JSON Provider](https://www.liferay.com/marketplace/-/mp/application/52188778). This plugin serves JSON objects from Liferay's DDL service.
4. Build and deploy the [Liferay Events Hook](https://github.com/jamesfalkner/liferay-events-hook) to your Liferay server.

Note that if you wish to use separate servers (one for read-only and one for read-write), then you'll set Liferay up twice, and on one instance,
install the *SKinny JSON Provider* and on the other instance install the [Liferay Events Hook](https://github.com/jamesfalkner/liferay-events-hook).

## Partitioning data for multiple events

Data for each event is stored in multiple [Dynamic Data Lists](https://dev.liferay.com/discover/portal/-/knowledge_base/6-2/using-web-forms-and-dynamic-data-lists). One strategy for supporting multiple events is to create separate Sites in Liferay to house content for events,
especially if you are also using Liferay to serve traditional website content for each event. Although the app doesn't "know" about these sites, and merely requests data based on DDL IDs, you may desire such separation.

If instead you put all your DDLs into a single Site, then you'll have a lot of DDLs. For example, if you have 3 events worth of data, you'll have around 30 DDLs! Make sure you choose a good naming strategy for your DDLs (the names of the DDLs and DDL Definitions do not matter - it's only the IDs that the app actually cares about!).

## Creating event content

Follow these steps to create data that will be used by the app.

1. [Understand what a Dynamic Data List is](https://dev.liferay.com/discover/portal/-/knowledge_base/6-2/using-web-forms-and-dynamic-data-lists) and how to create them.
2. Create a Dynamic Data List Definition representing the list of events on the server with the Skinny JSON Provider installed. See the [Data docs](DATA.md) for details about the fields you will need to create.
3. Create a Dynamic Data List Definition representing Agenda, Activities, Contacts, Galleries (Photostream), Maps, Rooms, Speakers, Sponsors, News, and Beacon Data. See the [Data docs](DATA.md] for details about the fields you will need to create.
4. Create a Dynamic Data List for events, and populate it with one or more events.
5. For each event, create multiple lists to house the different kinds of data (Agenda, Activities, etc). In some cases (e.g. the `metadata_types` field in the Event Listing DDL) you'll need to insert references to other DDLs by using their IDs. In other cases you'll need the UUID. See below for strategies for getting these IDs easily via Liferay's Control Panel.
6. Test! You can use the app to test, or just use your browser (or command line utilities like *curl*, *wget*, or some web services test console, often times built into developer environments like Eclipse or IntelliJ IDEA).

## Managing Event Data

You can create and edit Liferay DDLs using Liferay's Control Panel, but another option is to create web pages in Liferay and use the *Dynamic Data List Display* portlet to construct a page to allow you to edit the DDLs without using Control Panel.

This also lets you customize that page and control access to it, giving event staff permissions to view the page and manage the content.

One thing to keep in mind is that some of the data is linked using UUIDs which are auto-generated and not readily visible in the Liferay UI. You can create [DDL Display Templates](https://dev.liferay.com/discover/portal/-/knowledge_base/6-2/make-it-pretty-creating-custom-displays) to reveal this info though! Hint: `ddlRecord.getUuid()`.

[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)
