(function(){

    var subsections = ['banner', 'complementary', 'contentinfo', 'navigation', 'region', 'search'],
        artyom = null;

    var skip = ['#COMMENT', 'STYLE', 'SCRIPT', 'TEMPLATE'],
        spc = ['A', 'IMG'],
        blocks = ['DIV', 'H1', 'H2', 'P'],
        artyom = null,
        htmlTxt = null,
        indexHref = 1;

    function getAllTextNodes(node, name){
        var txt = '',
            lastNodeName = name || ''

        if(node.childNodes){
            node.childNodes.forEach( ( _node, n ) => {
                if( _node.nodeName == '#text' ){
                    txt += getText( _node, n == node.childNodes.length - 1 ? lastNodeName : '')
                }
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

    function getAttribute( node, attr ){
        var txt = '';
        if( node.getAttribute( attr ) )
            txt = node.getAttribute( attr );
        if( attr == 'href' && txt.toLowerCase().substring(0, 5) == "void(")
            return '';
        else
            return txt;
    }

    function getAttr( node ){
        var txt = '',
            ntc = node.textContent;
        ntc = ntc.trim();
        if(ntc == '')
            return ''
        else if( node.nodeName.toUpperCase() == 'A')
            txt = ntc + ' (' + indexHref++ + ') '
        else if( node.nodeName.toUpperCase() == 'IMG')
            txt = '\n\n' + getAttribute( node, 'alt' ) + ' '
        return txt
    }

    function getAttrLink( node ){
        var href = indexHref++ + ' '
        if( node.nodeName.toUpperCase() == 'A')
            href += getAttribute( node, 'href' ) + ' '
        return href + '\n'
    }

    function getText( node, name ){
        var txt = ''
        if( typeof node.textContent != 'undefined'){
            txt = node.childNodes[0] ? node.childNodes[0].textContent : ''
            txt = txt.trim()
            if( txt.length > 1 && txt.indexOf('.') != txt.length -1 )
                txt = txt + '.';
            if( blocks.indexOf( name.toUpperCase() ) > -1)
                txt += '\n\n'
        }
        return txt + ' '
    }

    function indicateEmoji( text ){
        return text.replace(/([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}])/ug, 
        "($1)")
    }

    function getSrc( deliver ){
        var endPoints = [ 'audio/', 'plaintext/'],
            promises = [
                fetch(wcagme_data.restURL + endPoints[0] + '' + wcagme_data.postID)
                .then(response => response.json())
                .then(data => { data.endPoint = endPoints[0]; return data})
                .catch(console.log),

                fetch(wcagme_data.restURL + endPoints[1] + '' + wcagme_data.postID)
                .then(response => response.json())
                .then(data => { data.endPoint = endPoints[1]; return data})
                .catch(console.log),

                new Promise( ( resolve, reject ) => {
                    var text = htmlTxt;
                    resolve( { endPoint: 'html', data: text });
                })
            ];
        Promise.all( promises )
        .then( deliver )
        .catch( console.log )
    }

    function getInfoText( deliver){
        var endPoint = 'post/'
        fetch(wcagme_data.restURL + endPoint)
        .catch(console.log)
        .then(response => response.json())
        .then( deliver )
    }

    function isVisible(node) {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && node.getAttribute('aria-hidden') !== 'true' && rect.width > 0 && rect.height > 0 && node.getAttribute('aria-expanded') !== 'false';
    }
    
    function dumpSection(node) {
        const landmarks = [];
        const rootElement = node;
    
        function traverse(element, ancestorArray) {
            var host = null;

            if(element.shadowRoot){
                host = element.host
                for(var c = 0; c < element.shadowRoot.childNodes.length; c++)
                    traverse(element.shadowRoot.childNodes[c], ancestorArray)
            }
            else if(host)
                element = host

            if(element.nodeType === 1 ){
                const attrs = Array.from(element.attributes)
                .filter(attr => attr.name.startsWith('aria-') || attr.name === 'placeholder' || attr.name == 'role')

                var  rl = attrs.filter( (attr) => { return attr.name == 'role' });
                
                indicatedElements.push({element})

                const currentElement = { name: element.nodeName, rel: indicatedElements.length - 1, visible: isVisible(element), role:null, descendants: [] };
        
                var role = ['form', 'main', 'header', 'nav', 'footer'].indexOf(element.nodeName.toLowerCase()) > -1 && 
                    nameOfRole(element) && (node.nodeName != 'form' || (!rl[0] || rl[0] != 'search'))
                    ? 
                    nameOfRole(element) 
                    : 
                    (rl[0] && subsections.indexOf( rl[0].value) > -1 ? /*'role=' +*/ rl[0].value : null)

                if (role) {
                    currentElement.role = role
                    ancestorArray.push(currentElement);
                }
            
                const children = element.children;
                for (let i = 0; i < children.length; i++) {
                    traverse(children[i], role ? currentElement.descendants : ancestorArray);
                }                
            }
        }
    
        traverse(rootElement, landmarks);
        return landmarks;
    }

    /*
        An <header> is only a landmark if it is not a descendant of aside, article, main, nav, section
    */
    function nameOfRole(node){
        if(node.nodeName != 'header' || node.closest('aside, article, main, nav, section') == null)
            return node.nodeName.toLowerCase()
    }

    function getLandmarks(node, el) {
        var result = [];

        indicatedElements = []

        if (node.nodeType === 1 && isVisible(node)) {

            result.push(dumpSection(node))
        }
        return result;
    }

    function initArtyom(listen){

        var html = document.querySelector('html'),
            lang = html && html.getAttribute('lang') ? html.getAttribute('lang') : wcagme_data.lang

        return new Promise( (resolve, reject) => {
            
            var a = new Artyom()
            // Start the commands !
            a.initVoices( lang ? {lang:lang} : 'en-GB' )
            .then( (voices) => {
                a.initialize({
                    voice: voices[0], 
                    lang: lang ? lang : "en-GB", // GreatBritain english
                    continuous: true, // Listen forever
                    soundex: false,// Use the soundex algorithm to increase accuracy
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
                    else reject( (lang ? lang : 'en-GB') + " not supported" );
                    resolve(a)
                }).catch((err) => {
                    console.log("Artyom couldn't be initialized: ", err);
                    reject( err )
                })
            })
            .then( () => {
                var commandHello = {
                    indexes:["1", "2", "3", ""], // These spoken words will trigger the execution of the command
                    action: () => { // Action to be executed when a index match with spoken word
                        a.shutUp()
                        a.say("Hey buddy ! How are you today?");
                    }
                };
                
                a.addCommands(commandHello)
            })
        })
    }

    function enablePlayButton(){
        btnPlay.classList.replace( 'state-paused', 'state-active' );
        btnPlay.classList.remove( 'inactive' );
    }

    function disablePlayButton(){
        btnPlay.classList.replace( 'state-active', 'state-paused' );
    }

    function enableFwrdButton(){
        btnFwrd.classList.remove( 'inactive' );
    }

    function disableFwrdButton(){
        btnFwrd.classList.add( 'inactive' );
    }

    function togglePlayPause(){
        if( btnPlay.classList.contains( 'state-paused' ) ){
            enableFwdrButton();
            enablePlayButton();
        }
        else{
            disablePlayButton();
            disableFwrdButton()
        }
    }

    var btnInfo = null,
        btnPlay = null,
        btnFwrd = null;

    customElements.define('wcagme-readaloud', 
    
        class extends HTMLElement {

            connectedCallback(){
                //this.shadowRoot.host.style.display = ''
            }

            constructor() {
                super();

                let landmarks = []
        
                const template = document.getElementById('wcagme-readaloud');
                const templateContent = template.content;
        
                let shadowDOM = this.attachShadow({mode: 'open'})
                shadowDOM.appendChild(
                    templateContent.cloneNode(true)
                );

                this.init = function(evnt){
                    shadowDOM.querySelector('.player').classList.remove('hidden')
                    
                    shadowDOM.host.style.display = ''

                    this.setAttribute('href', 'javascript:void(0)')
                    this.querySelector('span').style.display = 'none'

                    evnt.stopPropagation()
                    evnt.stopImmediatePropagation()
                }
            
                this.exit = function(evnt){
                    if( ! evnt.relatedTarget || evnt.relatedTarget.shadowRoot === null)
                        if( ! shadowDOM.querySelector('.player').classList.contains('hidden')){
                            shadowDOM.querySelector('.player').classList.add('hidden')
                            this.querySelector('span').style.display = ''
                        }

                    evnt.stopPropagation()
                    evnt.stopImmediatePropagation()
                }
                
                function getElement( selector ){
                    return shadowDOM.querySelector( selector );
                }

                function onError( error ){
                    if( ! btnInfo.classList.contains( 'error' ))
                        btnInfo.classList.add( 'error' );
                    getElement('.error-info > div').replaceChildren( document.createTextNode( error.toString().replaceAll('\n', ' ') ) );
                    getElement('.error-info').classList.remove( 'hidden' );
                }

                function info(evnt){
                    getInfoText((data) => {
                        if(!artyom){
                            initArtyom( false)
                            .then((a) => a.say(data.post_content))
                            .catch( onError )
                        }
                        else artyom.say(data.post_content)
                    })
                    evnt.stopPropagation()
                }
                
                var busy = false;

                function getPreferredSrc( arr ){
                    var fnd = null;
                    [ 'audio/', 'plaintext/', 'html' ].forEach( ( pref ) => {
                        arr.forEach( ( src ) => {
                            if(  typeof src.data !== undefined && src.endPoint == pref)
                                fnd = src;
                        })
                    })
                    return fnd
                }

                function play(evnt){

                    if(artyom && artyom.isSpeaking()){
                        console.log("pause toggle");
                        artyom.pause();
                        disableFwrdButton();
                    }
                    else if( artyom ){
                        console.log("pause1")
                        artyom.pause();
                    }
                    else if( ! busy ){
                        busy = true
                        getSrc( ( dataArr ) => {
                            var data = getPreferredSrc( dataArr )
                            if( data ){

                                if(data.endPoint.match(/audio/)){
                                    new Audio(data.url).play();
                                }

                                else{
                                    enableFwrdButton()
                                    if(!artyom){
                                        initArtyom(true)
                                        .then( (a) => artyom = a)
                                        .then( () => artyom.say(data.data))
                                        .catch(onError)
                                    }
                                    else artyom.say(data.text)
                                }
                            }
                        })
                    }
                    else
                        busy = false
            
                    var landmarks = getElement('.landmarks');
                    landmarks.classList.remove('hidden')
            
                    evnt.stopPropagation()
                }
                
                function fwrd(evnt){
                    evnt.stopPropagation()
                }

                function listLandmarks(dom){
                    var el = dom.querySelector('.landmarks'),
                        els = []
                    landmarks[0].forEach((landm) => {
                        var item = document.createElement('div')
                        item.appendChild(document.createTextNode( wcagme_data.translations[landm.role] || landm.role))
                        item.classList.add('inactive')
                        els.push(item)
                    })
                    if(els.length > 0)
                        el.replaceChildren(...els)
                }

                var asIcon = parseInt(this.getAttribute('icon')),
                    a = shadowDOM.host.closest('a')

                if(asIcon === 0){
                    shadowDOM.querySelector('.player').classList.remove('hidden')
                    a.querySelector('span').style.display = 'none'
                    a.setAttribute('href', 'javascript:void(0)')
                }
                else{
                    a.addEventListener('focus', this.init)
                    a.addEventListener('focusout', this.exit) 
                } 

                if(landmarks.length == 0){
                    landmarks = getLandmarks(document.body)
                    listLandmarks(shadowDOM)
                }

                btnInfo = shadowDOM.querySelector('button.info'),
                btnPlay = shadowDOM.querySelector('button.play'),
                btnFwrd = shadowDOM.querySelector('button.fwrd');
        
                btnInfo.addEventListener('click', info)
                btnPlay.addEventListener('click', play)
                btnFwrd.addEventListener('click', fwrd)

                getElement( '.landmarks' ).addEventListener( 'click', function( ){
                    if( ! this.classList.contains( 'expanded' ))
                        this.classList.add( 'expanded' );
                    else
                        this.classList.remove( 'expanded' );
                })

                document.addEventListener('SPEECH_SYNTHESIS_END', console.log)

                enablePlayButton();

                if( ! htmlTxt )
                    htmlTxt = getAllTextNodes( document.body );

                if(asIcon === 0)
                    setTimeout(() => {
                        shadowDOM.host.style.display = ''
                    }, 400)
            }
        }
    )

})()