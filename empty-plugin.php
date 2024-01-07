<?php
/*
Plugin Name: Empty Plugin
Description: Empty WordPress plugin with settings page
Version:     1.0.0
Author:      Pieter Hoekstra
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

defined( 'ABSPATH' ) or die( 'Nope, not accessing this' );

define( 'EMPTY_PLUGIN_DIR', __DIR__ );

define( 'EMPTY_PLUGIN_PLUGIN_FILE', __FILE__ );

define( 'EMPTY_PLUGIN_TEXT_DOMAIN', 'empty-plugin' );

function autoloader_empty_plugin( $class_name ){

	$class_name = str_replace( '\\', '/', $class_name );

	include_once EMPTY_PLUGIN_DIR . "/" . $class_name . '.php';
}

spl_autoload_register( 'autoloader_empty_plugin');

new Application\Application;

spl_autoload_unregister( 'autoloader_empty_plugin' );

?>