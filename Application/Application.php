<?php

/*
    Copyright License GPL
    Written by Pieter Hoekstra, pieterhoekstra@gmail.com, july 2020
*/

namespace Application;

defined( 'ABSPATH' ) or die( 'Nope, not accessing this' );

class Application{

    private $settings;


    public function __construct(){

        $options = array(
            EMPTY_PLUGIN_TEXT_DOMAIN => array(
                __( "General", EMPTY_PLUGIN_TEXT_DOMAIN ) => array(
                    "no_auth_needed" => array(
                        "type" => 'checkbox',
                        "default" => '1',
                        "label" => __( 'Anybody can send a post:', EMPTY_PLUGIN_TEXT_DOMAIN ),
                        'help_message' => ( 'Check this option to make posts possible for visitors who are not logged in to WordPress.' )
                    ),
                    "email_posts" => array(
                        "type" => 'text',
                        'label' => __( 'Email address to send posts to: ', EMPTY_PLUGIN_TEXT_DOMAIN ),
                    )
                ),
                __( "Attachments", EMPTY_PLUGIN_TEXT_DOMAIN ) => array(
                    "path_to_attachments" => array(
                        "type" => 'text',
                        "default" => wp_upload_dir()['path'], 
                        "label" => __( 'Path to attachments :', EMPTY_PLUGIN_TEXT_DOMAIN ),
                        'help_message' => sprintf( 
                            __( 'Create a folder and assign write permission to it for system user : %1$s ', EMPTY_PLUGIN_TEXT_DOMAIN ), 
                            get_current_user()
                            ) . "."
                    )
                )
            )
        );

        $this->settings = new Settings( $options, 'general' );

        register_activation_hook( __FILE__, array( $this, 'plugin_activate' ));
        
        register_deactivation_hook( __FILE__, array( $this, 'plugin_deactivate' )); 

    }

    public function plugin_activate(){  
        do_action( 'admin_init' );
        flush_rewrite_rules();
    }

    public function plugin_deactivate(){
        flush_rewrite_rules();
    }

}

?>