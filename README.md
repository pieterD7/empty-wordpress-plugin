## In order to make a plugin: ##
- Change the name of the folder Application into the name of a namespace
- Change the namespace in Application and Settings
- Change all defines in empty-plugin.php, Application, Settings and template
- Rename the autoloader in empty-plugin.php and change the namespace
- Ajust the second variable in the call to new Settings():  leave blank to get settings with the gear icon or give it a unnique name to get the settings underneath the wordpress Settings menu item