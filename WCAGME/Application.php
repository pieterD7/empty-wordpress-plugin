<?php

namespace WCAGME;

defined( 'ABSPATH' ) or die( 'Nope, not accessing this' );

define( 'WCAGME_NONCE', 'wp_rest' );

class Application{

    private $settings;

    private $post;

    private $options;

	protected $theme;

    protected $customizer;

    private $defaultNavMenuOptions = array( 
        "theme" => "black", 
        "icon" => "1",
        "styles" => array(
            "fontSize" => "1em",
            "colorText" => "#f7f7f7",
            "colorBackground" => "#202020",
            "colorBorder" => "aliceblue",
            "sizeButton" => "25px",
            "sizeBorderRadius" => "5px"
        )
    ); 

    public function __construct(){


        $options = array(
            WCAGME_TEXT_DOMAIN => array(
                __( "Audio", WCAGME_TEXT_DOMAIN ) => array(
                    /* "use_accept_header" => array(
                        "type" => 'checkbox',
                        "default" => '1',
                        "label" => __( 'Use the request header of the browser to start audio-only version&nbsp;:', WCAGME_TEXT_DOMAIN ),
                        'help_message' => __( 'Check this option to automatically deliver a plain text version to screenreaders.', WCAGME_TEXT_DOMAIN )
                    ), */
                    "apply_aria_labels_to_menu_items" => array(
                        "type" => "checkbox",
                        "default" => "1",
                        "label" => __( 'Add the post type as aria-description attribute for all menu items&nbsp;:', WCAGME_TEXT_DOMAIN  ),
                        "help_message" => __( 'If the aria-description tag is empty the value of this attribute will be set to the type of the post the menu item points to', WCAGME_TEXT_DOMAIN )
                    ),
                ),
                __( "Preview", WCAGME_TEXT_DOMAIN ) => array(
                    "preview_a11y" => array(
                        "type" => 'checkbox',
                        "default" => '0', 
                        "label" => __( 'Load a11y lint when previewing&nbsp;:', WCAGME_TEXT_DOMAIN ),
                        'help_message' => __( 'You can see the results of this accessibility test in the console of the browser (F12).', WCAGME_TEXT_DOMAIN )
                    ),
                    "preview_wcag" => array(
                        "type" => 'checkbox',
                        "default" => '0', 
                        "label" => __( 'Show secondary accessibilty widget in a drawer when previewing&nbsp;:', WCAGME_TEXT_DOMAIN ),
                        'help_message' => __( 'You can see the results of this accessibility test in a drawer at the bottom of the page.', WCAGME_TEXT_DOMAIN )
                    )
                ),
                __( "Experimental: audit", WCAGME_TEXT_DOMAIN ) => array(
                
                ),
            )
        );

        $this->settings = new Settings( $options, WCAGME_TEXT_DOMAIN );

        $this->options = $this->settings->get_option();

        $this->theme = get_option( 'stylesheet' );

        register_activation_hook( __FILE__, array( $this, 'plugin_activate' ));
        
        register_deactivation_hook( __FILE__, array( $this, 'plugin_deactivate' )); 

        add_filter( 'ajax_query_attachments_args', array( $this, 'media_by_mime_type' ), 1);

        add_filter( 'media_view_settings', array( $this, 'add_gallery_tab'));

        add_action( 'wp_enqueue_scripts', array( $this, 'frontend_scripts' ));

        add_action( 'admin_enqueue_scripts', array( $this, 'backend_scripts' )); 

        add_filter( 'manage_pages_columns', array( $this, 'add_column' ));

        add_action( 'manage_pages_custom_column', array($this, 'page_custom_column_views'), 5, 2);

        add_action( 'init', array( $this, 'init')); 

        add_action( 'admin_init', array( $this, 'admin_init') );

        add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ));

        add_action( 'save_post', array($this, 'save_meta_post' ), 10, 2);

        //add_action( 'wp_ajax_save_wcagme_audio', array( $this, 'add_audio_to_post'));

        add_action( 'rest_api_init', array( $this, 'init_rest_route') );   

        add_action( 'wp_footer', array( $this, 'footer'), 100);
        
		//add_action( 'customize_register', array( $this, 'customize_register' ));

        add_filter( 'wp_setup_nav_menu_item', array( $this, 'wp_setup_nav_menu_item' ) );

        //add_filter( 'option_nav_menu_options', array( $this, 'nav_menu_options' ) );

        //add_filter( 'pre_update_option_theme_mods_' . $this->theme, array( $this, 'pre_update_option_theme_mods' ) );

        add_filter( 'wp_get_nav_menu_items', array( $this, 'wp_get_nav_menu_items' ), 20 );

        add_filter( 'nav_menu_item_title', array( $this, 'filter_menu_item_title' ), 10, 3 );

        add_filter( 'nav_menu_link_attributes', array($this, 'label_menu_items'), 10, 4 );

    }

    private function navMenuOptionsStylesToCustomProps($styles){
        $stl = '';
        foreach($styles as $def => $val)
            $stl .= '--wcagme-' . $this->camelCaseToKebabCase($def)  . ":$val; ";
        return $stl;
    }

    private function camelCaseToKebabCase( $str ){
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $str));
    }

    public function plugin_activate(){  
        do_action( 'admin_init' );
        flush_rewrite_rules();
    }

    public function plugin_deactivate(){
        flush_rewrite_rules();
    }

    public function admin_init(){
        remove_meta_box( 'wcagme_readaloud_control', 'nav-menus', 'side');
        add_meta_box( 'wcagme_readaloud_control', __( 'Read aloud', WCAGME_TEXT_DOMAIN ), array( $this, 'readaloud_menu_item' ), 'nav-menus', 'side', 'default' );
        
        remove_meta_box( 'wcagme_adjust_fontsize_control', 'nav-menus', 'side');
        add_meta_box( 'wcagme_adjust_fontsize_control', __( 'Adjust font size', WCAGME_TEXT_DOMAIN ), array( $this, 'adjust_font_size_menu_item' ), 'nav-menus', 'side', 'default' );
        
        add_action( 'wp_update_nav_menu_item', array( $this, 'wp_update_nav_menu_item' ), 10, 2 );
    }

    public function init(){

         //arguments for post type
         $args = array(
            'labels'           => array(),
            'public'            => true,
            'show_ui'          => false,
            'show_in_nav'       => true,
            'query_var'         => false,
            'hierarchical'      => false,
            'supports'          => array(),
            'has_archive'       => false,
            'menu_position'     => 0,
            'show_in_admin_bar' => false,
            'menu_icon'         => 'dashicons-format-audio',
            'rewrite'           => false,
            'show_in_rest'      => true,
         );
         //register post type
         //unregister_post_type('wcagme_reader');
        register_post_type('wcagme_reader', $args);

        if(empty($this->options['info_readaloud'])){
            $this->options['info_readaloud'] = wp_insert_post(
                array(
                    'post_type' => 'wcagme_reader',
                    'post_status' => 'publish',
                    'comment_status' => 'closed',
                    'post_name' => 'info page for the read aloud function',
                    'post_content' => __( 'What can you do with the read-aloud player?', WCAGME_TEXT_DOMAIN)
                ) 
            );
            $this->settings->update_option($this->options);
        }

        register_post_type('wcagme_font_size', $args);
    }

    public function wp_setup_nav_menu_item( $item ) {
		if ( isset( $item->url ) && '#wcagme_readaloud_control' === $item->url ) {
			$item->post_title = __( 'Read aloud', WCAGME_TEXT_DOMAIN);
            $item->type_label = __( 'Starts the reader', WCAGME_TEXT_DOMAIN );
            
		}
        if ( isset( $item->url ) && '#wcagme_adjust_font_size_control' === $item->url ) {
			$item->post_title = __( 'Font size adjust', WCAGME_TEXT_DOMAIN);
            $item->type_label = __( 'Adjust font size', WCAGME_TEXT_DOMAIN );
            
		}
		return $item;
	}    

    public function readaloud_menu_item(){

        $_nav_menu_placeholder = -1;

        $name = __( 'Read aloud', WCAGME_TEXT_DOMAIN );
        $btnText = __( 'Add to menu', WCAGME_TEXT_DOMAIN);
        $label = __( 'Read aloud control', WCAGME_TEXT_DOMAIN );

        ?>
        <div id="posttype-lang-a11y" class="wcagme-posttypediv">
			<div id="tabs-panel-lang-a11y" class="tabs-panel tabs-panel-active">
				<ul id="lang-switch-checklist" class="categorychecklist form-no-clear">
					<li>
						<label class="menu-item-title">
							<input type="checkbox" class="menu-item-checkbox" checked name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-object-id]" ><?=$label?>
						</label>
						<input type="hidden" class="menu-item-type" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-type]" value="custom">
						<input type="hidden" class="menu-item-title" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-title]" value="<?=$name?>">
						<input type="hidden" class="menu-item-url" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-url]" value="#wcagme_readaloud_control">
					</li>
				</ul>
			</div>

			<p class="button-controls">
				<span class="add-to-menu">
					<input type="submit" class="button-secondary submit-add-to-menu right" value="<?php esc_attr_e( 'Add to Menu' ); ?>" name="add-post-type-menu-item" id="submit-posttype-lang-a11y">
					<span class="spinner"></span>
				</span>
			</p>
		</div>
        <?php
    }

    public function adjust_font_size_menu_item(){

        $_nav_menu_placeholder = -1;

        $name = __( 'Adjust font size', WCAGME_TEXT_DOMAIN );
        $btnText = __( 'Add to menu', WCAGME_TEXT_DOMAIN);
        $label = __( 'Adjust font size control', WCAGME_TEXT_DOMAIN );

        ?>
        <div id="posttype-lang-a11y-2" class="wcagme-posttypediv">
			<div id="tabs-panel-lang-a11y-2" class="tabs-panel tabs-panel-active">
				<ul id="lang-switch-checklist" class="categorychecklist form-no-clear">
					<li>
						<label class="menu-item-title">
							<input type="checkbox" class="menu-item-checkbox" checked name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-object-id]"><?=$label?>
						</label>
						<input type="hidden" class="menu-item-type" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-type]" value="custom">
						<input type="hidden" class="menu-item-title" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-title]" value="<?=$name?>">
						<input type="hidden" class="menu-item-url" name="menu-item[<?php echo (int) $_nav_menu_placeholder; ?>][menu-item-url]" value="#wcagme_adjust_font_size_control">
					</li>
				</ul>
			</div>

			<p class="button-controls">
				<span class="add-to-menu">
					<input type="submit" class="button-secondary submit-add-to-menu right" value="<?php esc_attr_e( 'Add to Menu' ); ?>" name="add-post-type-menu-item" id="submit-posttype-lang-a11y-2">
					<span class="spinner"></span>
				</span>
			</p>
		</div>
        <?php
    }


    public function wp_update_nav_menu_item( $menu_id = 0, $menu_item_db_id = 0 ){
        if ( empty( $_POST['menu-item-url'][ $menu_item_db_id ] ) 
            || '#wcagme' !== substr($_POST['menu-item-url'][ $menu_item_db_id ], 0, 7) ) { 
			return;
		}

		// Security check as 'wp_update_nav_menu_item' can be called from outside WP admin
		if ( current_user_can( 'edit_theme_options' ) ) {
			
            check_admin_referer( 'update-nav_menu', 'update-nav-menu-nonce' );

			$opts = $this->defaultNavMenuOptions;
            $options = array();

			// Our jQuery form has not been displayed
			if ( empty( $_POST['menu-item-pll-detect'][ $menu_item_db_id ] ) ) {
				if ( ! get_post_meta( $menu_item_db_id, 'wcagme_menu_item', true ) ) { 
					update_post_meta( $menu_item_db_id, 'wcagme_menu_item', json_encode( $opts ) );
				}
			}
			else {
				foreach ( array_keys( $opts ) as $opt ) {
                    if(isset($_POST[ 'menu-item-' . $opt ])){
                        $value = $_POST[ 'menu-item-' . $opt ][ $menu_item_db_id ];
                        if($value == 'on') $value = '1';
                        $options[ $opt ] = empty( $value ) ? 0 : $value;
                    }
				}
                $options['styles'] = array_merge($this->defaultNavMenuOptions['styles'], $_POST['menu-item-styles'][$menu_item_db_id]);
                if(!isset($options['icon'])) $options['icon'] = '0';
				update_post_meta( $menu_item_db_id, 'wcagme_menu_item', json_encode( $options )); 
			}
		}    
    }

    public function wp_get_nav_menu_items( $items ){
        foreach( $items as $item){
            if( $item->url == '#wcagme_readaloud_control'){
               $item->classes = "wcagme-menu-item";
            }
        }
        return $items;

    }

    public function filter_menu_item_title( $title, $item, $args ){

        if(substr($item->url, 0, 7) == '#wcagme'){
            $items = get_posts(
                array(
                    'numberposts' => -1,
                    'nopaging'    => true,
                    'post_type'   => 'nav_menu_item',
                    'fields'      => 'ids',
                    'meta_key'    => 'wcagme_menu_item',
                )
            );
            foreach($items as $i)
                $meta[$i] = get_post_meta( $i, 'wcagme_menu_item', true );

            $opts = isset($meta[$item->ID]) ? json_decode($meta[$item->ID]) : null;
        }

        if($item->url == '#wcagme_readaloud_control'){

            $icon = $opts && isset($opts->icon) ? $opts->icon : $this->defaultNavMenuOptions['icon'];
            $styles = $opts && isset($opts->styles) ? $opts->styles : $this->defaultNavMenuOptions['styles'];
            $stl = $this->navMenuOptionsStylesToCustomProps($styles);
            
            $tpl = '<span class="dashicons dashicons-universal-access"></span>
                    <wcagme-readaloud 
                        icon="' . $icon . '"
                        style="display:none; ' . $stl . '"
                    ></wcagme-readaloud>';

            return $tpl;
        }
        else  if($item->url == '#wcagme_adjust_font_size_control'){

            return '<wcagme-font-size-adjust></wcagme-font-size-adjust>';
        }
        else return $title;
    }

    public function label_menu_items( $atts, $item, $args, $depth){

        if($this->options['apply_aria_labels_to_menu_items'] == '1'){
            if ( empty( $atts['aria-description']) )
                $atts['aria-description'] = $item->type_label;
        }
        else if(substr($item->url, 0, 7) == '#wcagme')
            $atts['aria-description'] = $item->type_label;

        return $atts;
    }

    public function footer( $content ){

        $css = plugin_dir_url( WCAGME_PLUGIN_FILE ) . "font-size-adjust/fontSizeAdjust.css";

        echo '<template id="wcagme-font-size-adjust">
            <link rel="stylesheet" href="' . $css . '"/>
            <div class="">
                <div class="buttons">
                    <a class="down" role="button" aria-label="' . __("Smaller font", WCAGME_TEXT_DOMAIN) . '"><span>&nbsp;-&nbsp;</span></a>
                    <span class="font-size"></span>
                    <a class="up" role="button" aria-label="' . __("Bigger font", WCAGME_TEXT_DOMAIN) . '"><span>&nbsp;+&nbsp;</span></a>
                </div>
            </div>
        </template>';

        $css = plugin_dir_url( WCAGME_PLUGIN_FILE ) . "readaloud/readaloud.css";

        echo '<template id="wcagme-readaloud">
            <link rel="stylesheet" href="' . $css . '"/>
            <div class="player hidden">
                <button class="play state-paused inactive" aria-description="' . __('Starts reading aloud', WCAGME_TEXT_DOMAIN) . '">
                    <span class="active">
                        <svg
                            viewBox="0 0 6.6145832 6.6145835"
                            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:svg="http://www.w3.org/2000/svg">
                            <path
                                style="opacity:0.98;fill:none;stroke-width:0.15875;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;stop-color:#000000"
                                d="m 2.7805262,1.6297215 1.8313855,1.684368 -1.8313855,1.684368 z"
                                />
                        </svg>
                    </span>
                    <span class="paused">
                        <svg
                            viewBox="0 0 6.6145832 6.6145835"
                            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                            xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:svg="http://www.w3.org/2000/svg">
                                <path
                                    id="rect846-7-4"
                                    style="opacity:0.98;fill:none;stroke-width:0.15875;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;stop-color:#000000"
                                    d="m 6.1492622,1.6297215 h -3.368736 v 3.368736" />
                                    
                                <path
                                    id="rect846-7-4-9"
                                    style="opacity:0.98;fill:none;stroke-width:0.15875;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;stop-color:#000000"
                                    d="m 6.0698872,1.5503465 v 3.368736 h -3.368736" />

                        </svg>
                    </span>
                </button>
                <button class="fwrd inactive" aria-description="' . __('Jumps to the next landmark on the page', WCAGME_TEXT_DOMAIN) . '">
                    <span>
                        <svg
                            viewBox="0 0 6.6145832 6.6145835"
                            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:svg="http://www.w3.org/2000/svg">

                            
                            <path
                                style="opacity:0.98;fill:none;stroke-width:0.15875;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;stop-color:#000000"
                                d="m 2.7805262,1.6297215 1.8313855,1.684368 -1.8313855,1.684368 z"
                                sodipodi:nodetypes="cccc" />
                            <path
                                style="opacity:0.98;fill:none;stroke-width:0.15875;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;stop-color:#000000"
                                d="M 4.9082322,4.9984575 V 1.6297215"
                                sodipodi:nodetypes="cc" />
                            
                        </svg>
                    </span>
                </button>
                <button class="info" aria-description="' . __('Tells what you can do with the play aloud function', WCAGME_TEXT_DOMAIN) . '">
                    <span>
                        <svg
                            viewBox="0 0 6.6145832 6.6145835"
                            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                            xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:svg="http://www.w3.org/2000/svg">
                            <path
                                d="m 3.2896046,1.5308634 c 0.085266,0 0.1578322,0.029934 0.2176996,0.089801 0.059867,0.059867 0.089801,0.132434 0.089801,0.2176997 0,0.083452 -0.029934,0.155111 -0.089801,0.2149784 -0.059867,0.059867 -0.1324339,0.089801 -0.2176996,0.089801 -0.083451,0 -0.156018,-0.029027 -0.2176996,-0.08708 C 3.012038,1.9961965 2.982104,1.9236296 2.982104,1.8383639 c 0,-0.085266 0.029934,-0.1578323 0.089801,-0.2176997 0.061682,-0.059867 0.1342481,-0.089801 0.2176996,-0.089801 z M 2.660996,5.0837199 2.636505,5.0592289 V 4.9449368 l 0.024491,-0.02177 c 0.1759739,-0.010885 0.2748458,-0.019049 0.2966157,-0.024491 0.023584,-0.00544 0.04354,-0.016328 0.059867,-0.032655 0.018142,-0.018142 0.029934,-0.044447 0.035376,-0.078916 0.00726,-0.036283 0.014513,-0.1532968 0.02177,-0.3510406 0.00907,-0.199558 0.013606,-0.3501336 0.013606,-0.4517267 V 3.4482519 c 0,-0.072566 -0.00363,-0.1714384 -0.010885,-0.2966157 -0.00726,-0.1251773 -0.013606,-0.2022792 -0.019049,-0.2313058 -0.00363,-0.029026 -0.017234,-0.04989 -0.040818,-0.062589 -0.023584,-0.014513 -0.070752,-0.02177 -0.1415047,-0.02177 l -0.2285846,-0.00272 -0.024491,-0.02177 V 2.6944657 l 0.02177,-0.02177 C 2.9911737,2.6309707 3.283254,2.5629401 3.5209094,2.4686036 l 1e-6,1e-7 0.051704,0.035376 c -0.019956,0.2376555 -0.029934,0.5397137 -0.029934,0.9061747 v 0.6150014 c 0,0.039912 0.00363,0.1687172 0.010885,0.3864168 0.00726,0.2158854 0.014513,0.3419698 0.02177,0.378253 0.00907,0.036284 0.02177,0.062589 0.038097,0.078916 0.016328,0.016328 0.036284,0.027212 0.059867,0.032655 0.023584,0.00363 0.1215489,0.010885 0.2938945,0.02177 l 0.024491,0.02177 v 0.1387833 z"
                                style="stroke-width:0.105833;stroke-miterlimit:4;stroke-dasharray:none;"
                            />
                        </svg>
                    </span>
                </button>
                <div class="scroll">
                    <div class="error-info hidden">
                        <div></div>
                    </div>
                    <div class="landmarks hidden">
                        <div>' . __('No landmarks found on this page', WCAGME_TEXT_DOMAIN) . '</div>
                    </div>
                </div>
            </div>
        </template>';

        $css = plugin_dir_url( WCAGME_PLUGIN_FILE ) . "linter/overlay.css";

        echo '<wcagme-linter></wcagme-linter>
            <template id="wcagme-linter">
                <link rel="stylesheet" href="' . $css . '"/>
                <div id="indicator"></div>
                <console-main class="main" role="complementary">
                    <section class="header" >
                        <div class="title">WCAG 2.0</div> 
                        <div id="form" class="show-form">
                            <div class="form">
                                <fieldset>
                                    <legend></legend>
                                    <ul>
                                        <li>
                                            <label title="' . __("Minimal compliancy", WCAGME_TEXT_DOMAIN) . '">
                                                <input 
                                                type="radio" 
                                                value="WCAG2A" 
                                                name="level" 
                                                checked>
                                                A
                                            </label>
                                        </li>
                                        <li>
                                            <label title="' . __("High compliancy", WCAGME_TEXT_DOMAIN) . '">
                                                <input 
                                                type="radio" 
                                                value="WCAG2AA" 
                                                name="level" >
                                                AA
                                            </label>
                                        </li>
                                        <li>
                                            <label title="' . __("Highest compliancy", WCAGME_TEXT_DOMAIN) . '">
                                                <input 
                                                type="radio" 
                                                value="WCAG2AAA" 
                                                name="level" >
                                                AAA
                                            </label>
                                        </li>
                                        <li class="aria-browser">
                                            <label title="' . __("List landmarks", WCAGME_TEXT_DOMAIN) . '">
                                                <a role="button">'
                                                    .  __("Landmarks") . 
                                                '
                                                </a>
                                            </label>
                                        </li>
                                    </ul>
                                </fieldset>
                            </div>
                            <div class="result">
                                <span class="level"></span>&nbsp;
                                <a class="errors" href="javascript:void(0)" role="button" aria-label="' . __("Show only errors", WCAGME_TEXT_DOMAIN) . '">
                                    <span class="result-type">' . __("Errors") . ':</span>
                                    <span class="result-count result-count-errors"></span>&nbsp;
                                </a> 
                                <a class="warnings" href="javascript:void(0)" role="button" aria-label="' . __("Show only warnings", WCAGME_TEXT_DOMAIN) . '">
                                    <span class="result-type">' . __("Warnings") . ':</span>
                                    <span class="result-count result-count-warnings"></span>&nbsp;
                                </a> 
                                <a class="notices" href="javascript:void(0)" role="button" aria-label="' . __("Show only notices", WCAGME_TEXT_DOMAIN) . '">
                                    <span class="result-type">' . __("Notices") . ':</span>
                                    <span class="result-count result-count-notices"></span>&nbsp;
                                </a> 
                                <a class="all" href="javascript:void(0)" role="button" aria-label="' . __("Show all errors, warnings and notices", WCAGME_TEXT_DOMAIN) . '">
                                    &nbsp;(' . __("All") . '&nbsp;
                                    <span class="result-count result-count-all"></span>)
                                </a> 
                            </div>
                            <div class="landmarks">' . __("Landmarks", WCAGME_TEXT_DOMAIN) . 
                            '</div>
                        </div>
                        <div class="font-size-selector show-icon">
                            <div class="icon">
                                <span role="button" aria-label="' . __("Adjust font size", WCAGME_TEXT_DOMAIN) . '"></span>
                            </div>
                            <div class="buttons">
                                <span class="down" role="button" aria-label="' . __("Smaller font", WCAGME_TEXT_DOMAIN) . '">&nbsp;-&nbsp;</span>
                                <span class="font-size"></span>
                                <span class="up" role="button" aria-label="' . __("Bigger font", WCAGME_TEXT_DOMAIN) . '">&nbsp;+&nbsp;</span>
                            </div>
                        </div>
                        <div class="button expand" role="button" aria-label="' . __("Minimize", WCAGME_TEXT_DOMAIN) . '"></div>
                    </section>
                    <ruler></ruler>
                    <section class="modal">
                        <console-pane>
                            <console-output>
                            </console-output>
                        </console-pane>
                    </section>
                </console-main>
            </template>';
    }

    public function add_meta_boxes( $postType ){

        $screen = ['post', 'page'];
        if( in_array($postType, $screen))
            add_meta_box(
                'wcagme_box_id',
                __('Plain text version', WCAGME_TEXT_DOMAIN),
                array( $this, 'custom_box_html'),  
                $postType,
                'side',
                'default',
                array()
            );
    }

    public function save_meta_post( $postID, $post ){
        
        if( current_user_can('edit_post', $post->ID)){
            if( isset($post->ID) &&  !empty( $_POST["wcagme_plaintext_value"] ) && 
                wp_verify_nonce( $_POST['wcagme_nonce_meta'], WCAGME_NONCE) !== false){
                    update_post_meta( $post->ID, 'wcagme_plaintext', esc_html( $_POST["wcagme_plaintext_value"]));
                    update_post_meta( $post->ID, 'wcagme_urls', esc_html( $_POST["wcagme_plaintext_urls"]));
                }
            else
                error_log("Error save meta plaintext");
        }
    }

    public function custom_box_html( $post, $args ) {
        $post = get_post($post);
        
        $plaintext = "";
        $plaintextUrls = "";
        $plaintextText = "";
        if(!empty($post->ID)){
            $plaintext = get_post_meta($post->ID, 'wcagme_plaintext', true);
            $plaintextUrls = get_post_meta($post->ID, 'wcagme_urls', true);
        }

        $nonce = wp_create_nonce(WCAGME_NONCE);
        
        if(current_user_can("edit_post", $post->ID))
            submit_button("Genereer", 'primary', 'wcagme_generate', true, array('title' => 'Generate plain text version', 'id' => 'wcagme_generate_btn'));
        
        echo "<p>
                
                <label>
                " . __("Artificial voice", WCAGME_TEXT_DOMAIN) . "
                    <select id='wcagme_select_voice' style='max-width:50%;vertical-align:baseline;' disabled>
                        <option value='0'>" . __("No artificial voices found for your language", WCAGME_TEXT_DOMAIN) . "</option>
                    </select>
                </label>

                <label>
                    <button disabled id='wcagme_play_btn' role='button' aria-label='listen' type='button' class='button'><span class='dashicons dashicons-controls-play' style='padding:0.2rem 0;'></span></button>
                </label>

            </p>";
        ?>

        <input type='hidden' name='wcagme_nonce_meta' value='<?=$nonce?>'></input>
        <textarea name="wcagme_plaintext_urls" id="wcagme_plaintext_textarea_urls" style="display:none;width:100%;" rows="4"><?=$plaintextUrls?></textarea>
        <label>
            Plaintext
            <textarea name="wcagme_plaintext_value" id="wcagme_plaintext_textarea" style="width:100%;" rows="4"><?=$plaintext?></textarea>
        </label>
        <?php
    }

    public function media_by_mime_type( $query ){
        if(! empty($_POST['query']['wcagme-audio'])){
            //if( ! isset($_POST['query']['post_mime_type']) // &&
            //    ! isset($_POST['query']['post_parent']) &&
            //    ! isset($_POST['query']['post_status']) &&
            //    ! isset($_POST['query']['author'])
            //)
                $query['post_mime_type'] = 'audio/*, video/webm';
            unset( $_POST['query']['wcagme-audio'] );
        }
        return $query;
    } 

    public function frontend_scripts( $post ){
        $post = get_post( $post );

        $lang = '';
        $parts = explode("-", str_replace("_", "-", get_locale()));
        $lang = count($parts) > 1 ? implode("-", array_slice($parts, 0, 2)) : strtolower($parts[0]) . "-" . $parts[0];

        wp_enqueue_style( 'dashicons' );
        
        wp_enqueue_style( 'wcagme_read_aloud_style', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'readaloud/readaloud.css' );
        wp_enqueue_script( 'wcagme_read_aloud_js', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'readaloud/readaloud.js', null, null, array("strategy" => "defer"));
        wp_localize_script( 'wcagme_read_aloud_js', 
            'wcagme_data', array(
                'lang' => $lang,
                'postID' => $post->ID,
                'restURL' => get_rest_url() . 'WCAGME/v1/',
                'translations' => array(
                    'form' =>           __('formulier', WCAGME_TEXT_DOMAIN), 
                    'main' =>           __('inhoud', WCAGME_TEXT_DOMAIN), 
                    'header' =>         __('intro', WCAGME_TEXT_DOMAIN), 
                    'nav' =>            __('navigatie', WCAGME_TEXT_DOMAIN), 
                    'footer' =>         __('info', WCAGME_TEXT_DOMAIN),
                    'banner' =>         __('intro', WCAGME_TEXT_DOMAIN), 
                    'complementary' =>  __('aanvullend', WCAGME_TEXT_DOMAIN), 
                    'contentinfo' =>    __('info', WCAGME_TEXT_DOMAIN), 
                    'navigation' =>     __('navigatie', WCAGME_TEXT_DOMAIN), 
                    'region' =>         __('sectie', WCAGME_TEXT_DOMAIN), 
                    'search' =>         __('zoeken', WCAGME_TEXT_DOMAIN))
                )
            );

        wp_enqueue_style( 'wcagme_font_size_adjust_style', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'font-size-adjust/fontSizeAdjust.css' );
        wp_enqueue_script( 'wcagme_font_size_adjust_js', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'font-size-adjust/fontSizeAdjust.js', null, null, array("strategy" => "defer"));
        wp_localize_script( 'wcagme_font_size_adjust_js', 
            'fsdata', array(
                )
            );

        wp_enqueue_style( 'wcagme_styles', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/css/styles.css' );
        //wp_enqueue_script( 'wcagme_metabox', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/metabox.js');
        wp_enqueue_script( 'wcagme_front_artyom2', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/artyom.window.js');

        if(isset($_GET['preview_id'])){
            $set = array(
                "indicate_element_on_page" => __("Indicate element on the page", WCAGME_TEXT_DOMAIN)
            );
            wp_enqueue_style( 'wcagme_overlay_css', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'linter/preview.css' );
            //wp_enqueue_style( 'wcagme_a11_css', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/css/html_codesniffer/HTMLCS.css');
            wp_enqueue_script( 'wcagme_a11lint', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/html_codesniffer/HTMLCS.js' );

            if( ! empty($this->options) && $this->options['preview_wcag'] == '1'){
                wp_enqueue_script( 'wcagme_overlay', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'linter/preview.js' );
                wp_localize_script( 'wcagme_overlay', 'wcagme_translations', $set );
            }

            if( ! empty($this->options) && $this->options['preview_a11y'] == '_1')
                wp_enqueue_script( 'wcagme_a11y', 'https://cdn.accesslint.com/a11y-logger-0.1.0.js', null, null, array("strategy" => "defer"));
        }
    }

    public function backend_scripts( $hook ){

        $screen = get_current_screen();

        if( $screen->base == 'toplevel_page_' . WCAGME_PLUGIN_TEXT_DOMAIN){
            wp_enqueue_style( 'admin_grid_css', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/css/styles.css' );
            wp_enqueue_script( 'wcagme_audit', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'js/audit.js', null, null, array("strategy" => "defer"));

            $data = array(
                "url" => plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'js/html_codesniffer/auditor.js',
                "logo" => plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'logo.jpg',
                "translations" => array(
                    "busy" => __( "Working...", WCAGME_PLUGIN_TEXT_DOMAIN),
                    "WCAG2A" => "WCAG 2.1 A",
                    "WCAG2AA" => "WCAG 2.1 AA",
                    "WCAG2AAA" => "WCAG 2.1 AAA",
                    "Section508" => "Section 508",
                    "Landmarks on this page:" => __( "Landmarks on this page:" )
                )
            );
            wp_localize_script( 'wcagme_audit', 'wcagme_data', $data );

            wp_enqueue_script( 'wcagme_auditor', plugin_dir_url( WCAGME_PLUGIN_FILE ) . 'js/html_codesniffer/auditor.js', null, null, array("strategy" => "defer"));

        }

        if( $screen->base == 'nav-menus'){

            $data['default'] = json_encode($this->defaultNavMenuOptions);

            $items = get_posts(
                array(
                    'numberposts' => -1,
                    'nopaging'    => true,
                    'post_type'   => 'nav_menu_item',
                    'fields'      => 'ids',
                    'meta_key'    => 'wcagme_menu_item',
                )
            );
    
            foreach ( $items as $item ) {
                $data[ $item ] = get_post_meta( $item, 'wcagme_menu_item', true );
            }

            $data['translations'] = json_encode(
                array(
                 'icon' => __('Display as icon', WCAGME_TEXT_DOMAIN),
                 'info' => __( 'The functionality to adjust the font size only works properly if the size of the font is specified once with the BODY-tag in the current WordPress theme. Relative sizes must be used for any other tags.', WCAGME_TEXT_DOMAIN ),
                 'fontSize' => __( 'Font size of the landmarks' ,  WCAGME_TEXT_DOMAIN),
                 'colorText' => __( 'Text color of the landmarks' ,  WCAGME_TEXT_DOMAIN),
                 'colorBackground' => __( 'Background color' ,  WCAGME_TEXT_DOMAIN),
                 'colorBorder' => __( 'Color of the foreground' ,  WCAGME_TEXT_DOMAIN),
                 'sizeButton' => __( 'Size of the buttons' ,  WCAGME_TEXT_DOMAIN),
                 'sizeBorderRadius' => __( 'Border radius around player' ,  WCAGME_TEXT_DOMAIN),
                )
            );

            wp_enqueue_script( 'wcagme_update_nav_menu', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/updateNavMenu.js');
            wp_localize_script( 'wcagme_update_nav_menu', 'wcagme_data', $data );
        }

        if( substr($hook, 0, 4) == "edit"){
            wp_enqueue_media();
            wp_enqueue_script( 'wcagme_app', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/app.js');
            $set = array(
                'rest_url' => get_rest_url() . 'WCAGME/v1/',
                'plugin_url' => plugin_dir_url( WCAGME_PLUGIN_FILE ),
                'nonce' => wp_create_nonce(WCAGME_NONCE),
                'strings' => [
                    'select_file' => __('Select audio file', WCAGME_TEXT_DOMAIN),
                ]
            );
            wp_localize_script( 'wcagme_app', 'wcagme_data', $set );
            wp_enqueue_style( 'admin_grid_css', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/css/styles.css' );            
        }

        if( substr($hook, 0, 4) == 'post'){
            wp_enqueue_script( 'wcagme_front_artyom2', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/artyom.window.js');
            wp_enqueue_style( 'wcagme_a11c_codesniffer_css', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/html_codesniffer/HTMLCS.css' );
            wp_enqueue_script( 'wcagme_a11c_codesniffer', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/html_codesniffer/HTMLCS.js' );
            wp_enqueue_script( 'wcagme_metabox', plugin_dir_url( WCAGME_PLUGIN_FILE ) . '/js/metabox.js');
        }
    }

    public function add_gallery_tab( $tabs ){
        $tabs['audio'] = array('audio' => 'Audio');
        return $tabs;
    }

    public function init_rest_route(){
        register_rest_route( 'WCAGME/v1', '/audio/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_audio_file'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route( 'WCAGME/v1', '/audio/save/(?P<id>\d+)/(?P<audioID>\d+)', array(
            'methods' => 'POST',
            'callback' => array( $this, 'add_audio_to_post'),
            'permission_callback' => function ($data) {
                return current_user_can( 'edit_post', $data['id'] );
            }
        ));
        
        register_rest_route( 'WCAGME/v1', '/audio/remove/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array( $this, 'remove_audio_from_post'),
            'permission_callback' => function ($data) {
                return current_user_can( 'edit_post', $data['id'] );
            }
        ));

        register_rest_route( 'WCAGME/v1', '/post/', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_post_content'),
            'permission_callback' => '__return_true',
        ));       
        
        register_rest_route( 'WCAGME/v1', '/plaintext/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_plaintext'),
            'permission_callback' => '__return_true',
        ) );
    }

    public function get_post_content(){
        $post = get_posts(  array(
            'post_type'   => 'wcagme_reader',
            'numberposts' => 1,
            'post_status' => 'publish'
            ) 
        );

        if(isset($post[0]))
            return new \WP_REST_Response( $post[0] );
    }

    public function get_plaintext($request){
        $meta = get_post_meta( $request->get_param('id') , 'wcagme_plaintext', true);
        return new \WP_REST_Response(array("data" => $meta));
    }

    public function add_column( $columns ) {

        $before = array_search( 'comments', array_keys($columns) );
        if($before)
            $before = array_keys($columns)[$before];
        else
            $before = array_pop(array_keys($columns));
        if ( $n = array_search( $before, array_keys( $columns ) ) ) {
			$end = array_slice( $columns, $n );
			$columns = array_slice( $columns, 0, $n );
		}

		$columns[ 'audio' ] = "<span class='dashicons dashicons-format-audio'></span>
                                <span class='screen-reader-text'>" . esc_html( __('Audio', WCAGME_TEXT_DOMAIN) ) . "</span>";

        return isset( $end ) ? array_merge( $columns, $end ) : $columns;	
    }

    public function page_custom_column_views( $name, $postID ){
        if( $name == 'audio'){
            $audioID = $this->_get_audio_file( $postID );
            if( ! current_user_can( 'edit_post', $postID))
                echo "-";
            else if( !empty( $audioID ))
                echo "<audio-attachment rel='$postID' class='hasAudio'>
                        <a class='attach-audio'>
                            <span class='dashicons dashicons-plus-alt2'></span>
                        </a> 
                        <a class='remove-audio' title='$audioID'>
                            <span class='dashicons dashicons-no-alt'></span>
                        </a>
                    </audio-attachment>";
            else
                echo "<audio-attachment rel='$postID'>
                        <span></span>
                        <a class='attach-audio'>
                            <span class='dashicons dashicons-plus-alt2'></span>
                        </a> 
                        <a class='remove-audio'>
                            <span class='dashicons dashicons-no-alt'></span>
                        </a>
                    </audio-attachment>";
        }
    }

    public function get_audio_file($request ){
        if(!empty($request->id))
            return new \WP_REST_Response( 
                array( "data" => wp_get_attachment_url( $this->_get_audio_file( $request->id ) ))
            );
        else
            return new \WP_REST_Response(array());
    }

    public function remove_audio_from_post( $request ){
        error_log("REMOVE:" . print_r($request['id'], 1));
        $postID = $request['id'];
        if(!empty($postID))
            return update_post_meta($postID, 'wcagme_id', '');
    }

    public function add_audio_to_post( $request ){
        $postID = $request['id'];
        $audioID = $request['audioID'];
        if(!empty($postID))
            return $this->save_meta_box_wcagme_audio($postID, $audioID);
    }

    public function _get_audio_file( $postID ){ 
        return get_post_meta( $postID, 'wcagme_id', true);
    }

    public function save_meta_box_wcagme_audio( $postID, $audioID ){
        update_post_meta($postID, 'wcagme_id', $audioID);
    }
}

?>