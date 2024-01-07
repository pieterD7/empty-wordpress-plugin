<div class='empty-settings'>
    <span id='scrollTop'> <a id='chapter_1'></a> <a id='chapter_2'></a> <a id='chapter_3'></a> <a id='chapter_help'></a> <a id='chapter_about'></a></span>
    <br>
    <br>
    <?php 
    $sections = $this->get_all_sections( WCAGME_PLUGIN_TEXT_DOMAIN );
    $n = 0;
    foreach( $sections as $key){
        if( $n++ != 0)
            echo " | ";
        echo "<a role='button' aria-label='$key' class='cls" . $n . " " . ($n == 1? 'active' : '') . "' href='#chapter_" . $n . "'>";
        echo $key . "</a>";
    }
    ?>
    <!-- 
    | <a class='clshelp' href='#chapter_help'><?php echo __( 'Help', WCAGME_PLUGIN_TEXT_DOMAIN ); ?></a>
    | <a class='clsabout' href='#chapter_about'><?php echo __( 'About', WCAGME_PLUGIN_TEXT_DOMAIN ); ?></a>
-->

    <br>
    <div>
        <form method="post" action="options.php">

        <div>
            <img width='150px' src='<?= plugin_dir_url( WCAGME_PLUGIN_FILE ) . "logo.png" ?>'/>
        </div>
        <div>
            <input type='hidden' name='page_options' value='<?php echo $this->options_root; ?>'/>

            <?php
                settings_fields( 'options' );
                $c = 0;
                $sections = $this->get_all_sections( WCAGME_PLUGIN_TEXT_DOMAIN );
                foreach( $sections as $n => $key){
                    $c++;
                    echo "<div id='id" . $c . "' class='" . ($c != 1? 'hide' : '') . "'>";
                    do_settings_sections( $key . '_admin_' . WCAGME_PLUGIN_TEXT_DOMAIN );
                    //submit_button( __( 'Save all changes', WCAGME_PLUGIN_TEXT_DOMAIN ));
                    if($n < 2)
                        submit_button();
                    else{
                        ?>
                        <div class='wcagme-audit'>
                            <div>
                                <label>
                                    <input 
                                        name='cookies' 
                                        type='checkbox'>
                                    </input> 
                                    <?= __("With my cookies", WCAGME_TEXT_DOMAIN) ?>
                                </label>
                                <label>
                                    <input 
                                        name='url' 
                                        type='text' 
                                        placeholder='<?= __("URL of the website", WCAGME_TEXT_DOMAIN) ?>'
                                        value='<?= get_site_url() ?>'
                                    >
                                    </input>
                                </label>
                                <label>
                                    <select name='standard'>
                                        <option value='WCAG2A'>WCAG 2.1 A</option>
                                        <option value='WCAG2AA'>WCAG 2.1 AA</option>
                                        <option value='WCAG2AAA'>WCAG 2.1 AAA</option>
                                        <option value='Section508'>Section 508</option>
                                    </select>
                                </label>
                                <button class="button" name="wcagme-start" role="button">
                                    <?= __("Start audit", WCAGME_TEXT_DOMAIN) ?>
                                </button>
                                <span class='pdf unvisible'>
                                    <a target='_blank' title='<?= __("Audit report", WCAGME_TEXT_DOMAIN) ?>'>
                                        <span class="dashicons dashicons-pdf"></span>
                                    </a>
                                </span>
                            </div>
                        </div>
                        <?php
                    }
                    echo "</div>";
                }

                /* echo "<div id='idhelp' class='hide'>" ;
                echo "<h2>" . __( 'Help ', WCAGME_PLUGIN_TEXT_DOMAIN )  . "</h2>"; 
                echo "<div>";
                echo "<p>Some informative help :-)</p>";
                echo "</div>";
                echo "</div>";

                echo "<div id='idabout' class='hide'>"; 
                echo "<h2>" . __( 'About me ' )  . "</h2><p>"; 
                echo __( 'Thank you for trying out the Inclusy Wordpress plugin!', WCAGME_PLUGIN_TEXT_DOMAIN );
                echo '<br><br>'; */
                //echo '<b>' . __( 'Currently installed version : ' ), get_plugin_data( EMPTY_PLUGIN_TEXT_DOMAIN )['Version'] . '</b>';
                echo "</p>
                    <div class='wcagme-audit'>
                        <div class='result'>
                        </div>
                    </div>";
            ?>
            </div>
        </form>
    </div>
</div>