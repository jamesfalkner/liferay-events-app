[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)

# A Note About Branding (aka how to brand it, aka white-labelling)

If you intend to use this app for "real" events, chances are you're going to want to re-brand it to represent your event or company or whatever.

This project includes many graphics files, all of which can be used for your own events (subject to the Creative Commons license, see the [README](../README.md) for details), or can be replaced with your own.

# How to re-brand

1. Review and replace as needed any images in `Resources/images`.
2. Create splash screens and app icons with multiple sizes (see the *iOS graphic asset requirements and options* and *Android graphic asset requirements and options* sections of the [Titanium Icons and Splash Screens docs](http://docs.appcelerator.com/titanium/latest/#!/guide/Icons_and_Splash_Screens).
3. Ensure all title labels, urls, etc that refer to the app name or Liferay are changed to whatever you want to use, in the `tiapp.xml` file, `settings.json` file and the localization files in the `i18n/` directory.
4. Test it!

## App images

Most of the images are in the `Resources/images` directory. If you look at the images, then run the app, you can see where they are used. Many of them have `@2x` versions of the images, which are used on iOS Retina displays and Android. This is not the offically correct way of doing things for Android, but it works OK!

These images are used to construct the User Interface, provide button icons, animations, separators, etc.

## Splash screens, app icons, app store graphics

You will need to supply your own in many different sizes. Details about filenames, image formats, and how to add them to your app can be found in the *iOS graphic asset requirements and options* and *Android graphic asset requirements and options* sections of the [Titanium Icons and Splash Screens docs](http://docs.appcelerator.com/titanium/latest/#!/guide/Icons_and_Splash_Screens).

[Overview](OVERVIEW.md) | [Building](BUILDING.md) | [Data](DATA.md) | [Liferay](LIFERAY.md) | [Branding](BRANDING.md)
