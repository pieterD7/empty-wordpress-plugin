(function(){

    var skip = ['#COMMENT', 'EMBED', 'STYLE', 'SCRIPT', 'TEMPLATE'],
        spc = ['A', 'IMG'],
        blocks = ['DIV', 'H1', 'H2', 'P'],
        indexHref = 1;

    function getAllTextNodes(node, name){
        var txt = '',
            lastNodeName = name || ''

        if(node.childNodes){
            node.childNodes.forEach( ( _node, n ) => {
                if( _node.nodeName == '#text' )
                    txt += getText( _node, n == node.childNodes.length - 1 ? lastNodeName : '')
                else if( skip.indexOf(_node.nodeName.toUpperCase()) > -1)
                    ;
                else if( isHiddenElement( _node ) )
                    ;
                else if( spc.indexOf(_node.nodeName.toUpperCase()) > -1){
                    lastNodeName = _node.nodeName
                    if(spc.indexOf( _node.nodeName.toUpperCase()) > -1)
                        txt += getAttr( _node )
                }
                else
                    txt += getAllTextNodes( _node, lastNodeName )
            })   
        }
        return txt
    }

    function getAllLinkNodes(node, name){
        var txt = '',
            lastNodeName = name || ''

        if(node.childNodes){
            node.childNodes.forEach( ( _node, n ) => {
                if( _node.nodeName == '#text' )
                    ;//txt += getText( _node, n == node.childNodes.length - 1 ? lastNodeName : '')
                else if( skip.indexOf(_node.nodeName.toUpperCase()) > -1)
                    ;
                else if( isHiddenElement( _node ) )
                    ;
                else if( spc.indexOf(_node.nodeName.toUpperCase()) > -1){
                    lastNodeName = _node.nodeName
                    if(spc.indexOf( _node.nodeName.toUpperCase()) > -1)
                        txt += getAttrLink( _node )
                }
                else
                    txt += getAllLinkNodes( _node, lastNodeName )
            })   
        }
        return txt
    }

    function isHiddenElement( node ){
        var stl = getComputedStyle( node )
        return stl.display == 'hidden' && stl.visibility == 'visible'
    }

    function getAttr( node ){
        var txt = ''
        if( node.nodeName.toUpperCase() == 'A')
            txt = node.textContent + ' (' + indexHref++ + ') '
        else if( node.nodeName.toUpperCase() == 'IMG')
            txt = '\n\n' + node.getAttribute( 'alt' ) + ' '
        return txt
    }

    function getAttrLink( node ){
        var href = indexHref++ + ' '
        if( node.nodeName.toUpperCase() == 'A')
            href += node.getAttribute( 'href' ) + ' '
        return href + '\n'
    }

    function getText( node, name ){
        var txt = ''
        txt = node.textContent || ''
        txt = txt.trim() + ' '
        if( blocks.indexOf( name.toUpperCase() ) > -1)
            txt += '\n\n'
        return txt 
    }

    function indicateEmoji( text ){
        return text.replace(/([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}])/ug, 
        "($1)")
    }

    function bestLanguage(){
        var html = document.querySelector('html'),
        lang = html && html.getAttribute('lang') ? html.getAttribute('lang') : wcagme_data.lang
        return lang;
    }

    function initArtyom(n, listen){

        var lang = bestLanguage();

        return new Promise( (resolve, reject) => {
            
            var a = new Artyom()
            // Start the commands !
            a.initVoices( lang && typeof n !== undefined? {lang:lang} : null )
            .then( (voices) => {
                a.initialize({
                    voice: n ? voices[n] : voices[0], 
                    lang: lang && typeof n !== undefined? lang : "en-GB", // GreatBritain english
                    continuous: true, // Listen forever
                    soundex: true,// Use the soundex algorithm to increase accuracy
                    debug: true, // Show messages in the console
                    //executionKeyword: "and do it now",
                    listen: listen, // Start to listen commands !
            
                    // If providen, you can only trigger a command if you say its name
                    // e.g to trigger Good Morning, you need to say "Jarvis Good Morning"
                    //name: "Jarvis" 
                }).then(() => {
                    var vcs = a.getActualVoice();
                    if( vcs )
                        console.log("Artyom has been succesfully initialized. Voice: " + a.getActualVoice().name);
                    else if( lang && typeof n !== undefined )
                        reject( (lang ? lang : 'en-GB') + " not supported" );
                    else
                        reject( "Error" );
                    resolve(a)
                }).catch((err) => {
                    console.log("Artyom couldn't be initialized: ", err);
                    reject( err )
                })
            })
        })
    }

    function wcagme_speak(txt, voice){
        initArtyom(voice.value)
        .then( (artyom) => { artyom.say(txt) })
    }

    function initVoicesSelector(sel){
        initArtyom()
        .then( (artyom ) => { 
            artyom.initVoices({lang:bestLanguage()})
            .then( ( vcs ) => {
                var opts = []
                vcs.forEach( ( vc, n ) => {
                    var opt = document.createElement( 'option' )
                    opt.setAttribute( 'value', n )
                    opt.appendChild( document.createTextNode( vc.name) )
                    opts.push(opt)
                })
                if(opts.length > 0){
                    sel.replaceChildren(...opts)
                    sel.removeAttribute('disabled')
                    sel.closest('p').querySelector('button').removeAttribute('disabled')
                }
            } )
         })
         .catch( ( error ) => {
            var opt = document.createElement( 'option' )
            opt.appendChild( document.createTextNode( error ) );
            sel.replaceChildren( opt )
         })
    }

    function wcagme_generate(){
        var txt = indicateEmoji(getPlainTexts());
        indexHref = 1
        var lnks = getLinks(),
            textOut = document.querySelector( '#wcagme_plaintext_textarea' )

        indexHref = 1
        lnksOut = document.querySelector( '#wcagme_plaintext_textarea_urls' );

        if(textOut){
            textOut.value = txt
            lnksOut.value = lnks
        }
        else 
            console.log(txt)
    }

    function getPlainTexts(){
        var blcks = wp.data.select("core/block-editor").getBlocks(),
            txt = '';

        if(blcks){
            blcks.forEach((blck) => {
                txt += getAllText(blck)
            })
        }
        return txt
    }

    function getLinks(){
        var blcks = wp.data.select("core/block-editor").getBlocks(),
            txt = '';

        if(blcks){
            blcks.forEach((blck) => {
                txt += getAllLinks(blck)
            })
        }
        return txt
    }

    function getAllFromHTMLString(str, cb){
        var tpl = document.createElement('template')
        if(tpl){
            tpl.innerHTML = str
            return cb(tpl.content)
        }
        return ''
    }

    function getAllText(blocks){
        var txt = '',
            txtBlocks = ['core/paragraph', 'core/button'];

        if(blocks.innerBlocks){
            blocks.innerBlocks.forEach( (blck) => {
                if(txtBlocks.indexOf(blck.name) > -1)
                    txt += getAllFromHTMLString(blck.originalContent, getAllTextNodes)
                txt += getAllText(blck)
            })
        }
        return txt;
    }

    function getAllLinks(blocks){
        var txt = '',
            txtBlocks = ['core/paragraph', 'core/button'];

        if(blocks.innerBlocks){
            blocks.innerBlocks.forEach( (blck) => {
                if(txtBlocks.indexOf(blck.name) > -1)
                    txt += getAllFromHTMLString(blck.originalContent, getAllLinks)
                txt += getAllLinks(blck)
            })
        }
        return txt;
    }

    addEventListener("DOMContentLoaded", () => {
        var btn = document.querySelector( '#wcagme_generate_btn' ),
            btnPlay = document.querySelector( '#wcagme_play_btn' ),
            text = document.querySelector( '#wcagme_plaintext_textarea' ),
            select = document.querySelector( '#wcagme_select_voice' )

        if(btn)
            btn.addEventListener('click', () => { 
                //initVoicesSelector(select)
                wcagme_generate()
            })

        
        //document.body.addEventListener( 'click', () => {  })
        if( select )
            initVoicesSelector(select)

        if(btnPlay && text && text.value)
            btnPlay.addEventListener( 'click', () => { wcagme_speak( text.value, select ) } )
        
    })
})()