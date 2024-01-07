<?php
/*
Plugin Name: WCAG Made easy
Description: Accessibility guidelines made easy. Inclusive websites and WCAG compattability in a breeze!
Version:     1.0.0
Author:      Pieter Hoekstra
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

defined( 'ABSPATH' ) or die( 'Nope, not accessing this' );

define( 'WCAGME_PLUGIN_DIR', __DIR__ );

define( 'WCAGME_PLUGIN_FOLDERNAME', basename( __DIR__ ) );

define( 'WCAGME_PLUGIN_FILE', __FILE__ );

define( 'WCAGME_PLUGIN_TEXT_DOMAIN', 'wcagme-textdomain' );

define( 'WCAGME_TEXT_DOMAIN', WCAGME_PLUGIN_TEXT_DOMAIN );

function autoloader_wcagme_plugin( $class_name ){

	$class_name = str_replace( '\\', DIRECTORY_SEPARATOR, $class_name );

	include_once WCAGME_PLUGIN_DIR . DIRECTORY_SEPARATOR .  ".." . 
		DIRECTORY_SEPARATOR . WCAGME_PLUGIN_FOLDERNAME . DIRECTORY_SEPARATOR 
		. $class_name . '.php';
}

spl_autoload_register( 'autoloader_wcagme_plugin');

new WCAGME\Application;

spl_autoload_unregister( 'autoloader_wcagme_plugin' );

?>