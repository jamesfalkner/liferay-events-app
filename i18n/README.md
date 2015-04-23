# Liferay Apps Translations

Translations for this app are pretty straightforward and follow [conventions for Titanium Internationalization](http://docs.appcelerator.com/titanium/latest/#!/guide/Internationalization).

If you wish to provide a new translation, simply copy an existing file, put it in a new directory named after the language to which you're translating, and then change the strings.

## Gotchas

* Not backslash-escaping double quotes
* Forgetting to use `formatted=false` for strings that have positional parameters
* Trying to construct phrases using translations of smaller words. Don't try to translate "The" into any language and use it in the same order as you'd use it in English. It's all about the context.
* Messing up the positional parameters. It's `%1$s` not `%s$1` or `$1` or `%s` or anything else.
* Being too verbose in what should be succinct messages.
*