<div class='empty-settings'>
    <span id='scrollTop'> <a id='chapter_1'></a> <a id='chapter_2'></a> <a id='chapter_3'></a> <a id='chapter_help'></a> <a id='chapter_about'></a></span>
    <br>
    <br>
    <?php 
    $sections = $this->get_all_sections( EMPTY_PLUGIN_TEXT_DOMAIN );
    $n = 0;
    foreach( $sections as $key){
        if( $n++ != 0)
            echo " | ";
        echo "<a class='cls" . $n . " " . ($n == 1? 'active' : '') . "' href='#chapter_" . $n . "'>";
        echo $key . "</a>";
    }
    ?>
    | <a class='clshelp' href='#chapter_help'><?php echo __( 'Help', EMPTY_PLUGIN_TEXT_DOMAIN ); ?></a>
    | <a class='clsabout' href='#chapter_about'><?php echo __( 'About', EMPTY_PLUGIN_TEXT_DOMAIN ); ?></a>

    <br>
    <div>
        <form method="post" action="options.php">
        
        <input type='hidden' name='page_options' value='<?php echo $this->options_root; ?>'/>

        <?php
            settings_fields( 'options' );
            $c = 0;
            $sections = $this->get_all_sections( EMPTY_PLUGIN_TEXT_DOMAIN );
            foreach( $sections as $key){
                $c++;
                echo "<div id='id" . $c . "' class='" . ($c != 1? 'hide' : '')  . "'>";
                do_settings_sections( $key . '_admin_' . EMPTY_PLUGIN_TEXT_DOMAIN );
                submit_button( __( 'Save all changes', EMPTY_PLUGIN_TEXT_DOMAIN ));
                echo "</div>";
            }

            echo "<div id='idhelp' class='hide'>" ;
            echo "<h2>" . __( 'Help ', EMPTY_PLUGIN_TEXT_DOMAIN )  . "</h2>"; 
            echo "<div>";
            echo "<p>Some informative help :-)</p>";
            echo "</div>";
            echo "</div>";

            echo "<div id='idabout' class='hide'>"; 
            echo "<h2>" . __( 'About me ' )  . "</h2><p>"; 
            echo __( 'Thank you for trying out Empty Plugin!', EMPTY_PLUGIN_TEXT_DOMAIN );
            echo '<br><br>';
            //echo '<b>' . __( 'Currently installed version : ' ), get_plugin_data( EMPTY_PLUGIN_TEXT_DOMAIN )['Version'] . '</b>';
            echo "</p></div>";
        ?>
        </form>
    </div>
</div>