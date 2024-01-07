(function(){

    let shadowDOM = null,
        observer = null,
        indicatedElements = [],
        header = null,
        subsections = ['banner', 'complementary', 'contentinfo', 'navigation', 'region', 'search']

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

                if(element.nodeType === Node.ELEMENT_NODE ){
                    const attrs = Array.from(element.attributes)
                    .filter(attr => attr.name.startsWith('aria-') || attr.name === 'placeholder' || attr.name == 'role')
        
                    var  rl = attrs.filter( (attr) => { return attr.name == 'role' });
                    
                    indicatedElements.push({element})

                    const currentElement = { name: element.nodeName, rel: indicatedElements.length - 1, visible: isVisible(element), role:null, descendants: [] };
            
                    var role = ['form', 'main', 'header', 'nav', 'footer'].indexOf(element.nodeName.toLowerCase()) > -1 
                        ? 
                        element.nodeName 
                        : 
                        (rl[0] && subsections.indexOf( rl[0].value) > -1 ? 'role=' + rl[0].value : null)
        
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

        function dumpARIA(node) {
            var result = [];

            indicatedElements = []

            if (node.nodeType === Node.ELEMENT_NODE && isVisible(node)) {

                result.push(dumpSection(node))
            }
            return result;
        }
        

    function runHTMLCS(standard, source, resultsDiv, callback)
    {
    
        var  langs = ['cn', 'en', 'fr', 'it', 'ja', 'nl', 'pl'],
            lang = document.querySelector('html').getAttribute('lang'),
            trs = 'en',
            t = lang ? lang.split('-') : []
        
        if(langs.indexOf(t[0]) > -1)
            trs = t[0]

        var resultsEl = shadowDOM.querySelector("#form")
        resultsEl.classList.remove('show-all')
        resultsEl.classList.remove('show-error')
        resultsEl.classList.remove('show-warning')
        resultsEl.classList.remove('show-notice')
        resultsEl.classList.add('show-all')

        indicatedElements = []

        HTMLCS.process(standard, source, function() {
            if (standard === 'Section508') {
                updateResults508(resultsDiv);
            } else {
                updateResults(resultsDiv);
            }

            if (callback instanceof Function === true) {
                callback.call();
            }
        }, null, trs); 

    }
    
    function updateResults(resultsWrapper)
    {
        resultsWrapper.innerHTML = '';
    
        var principles = {
            'Principle1': 'Perceivable',
            'Principle2': 'Operable',
            'Principle3': 'Understandable',
            'Principle4': 'Robust'
        };
    
        indicatedElements = []
        var msgs = HTMLCS.getMessages();
        indicatedElements = msgs
        if (msgs.length === 0) {
            resultsWrapper.innerHTML = '<span class="no-violations">No violations found</span>';
            return;
        }
    
        var content = '<table id="test-results-table"><tr>';
        content    += '<th></th><th>Tag</th><th>Message</th><th>Principle</th><th><acronym title="Success Criterion"></acronym></th><th>Techniques</th></tr>';
    
        var errors   = 0;
        var warnings = 0;
        var notices  = 0;
    
        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            var type = '';
            switch (msg.type) {
                case HTMLCS.ERROR:
                    type = 'Error';
                    errors++;
                break;
    
                case HTMLCS.WARNING:
                    type = 'Warning';
                    warnings++;
                break;
    
                case HTMLCS.NOTICE:
                    type = 'Notice';
                    notices++;
                break;
    
                default:
                    type = 'Unknown';
                break;
            }
    
            // Get the success criterion so we can provide a link.
            var msgParts   = msg.code.split('.');
            var principle  = msgParts[1];
            var sc         = msgParts[3].split('_').slice(0, 3).join('_');
            var techniques = msgParts[4];
            techniques     = techniques.split(',');
    
            // Build a message code without the standard name.
            msgParts.shift();
            msgParts.unshift('[Standard]');
            var noStdMsgParts = msgParts.join('.');
    
            content += '<tr class="' + type.toLowerCase() + '">';
            content += '<td class="number"><span class="flag"></span></td>';
            content += '<td><a rel="' + i + '" class="indicateElement" aria-label="' + wcagme_translations['indicate_element_on_page'] + '" href="javascript:void(0)">' + (getTextContent(msg.element)) + '</a></td>'
            content += '<td class="messageText"><a rel="' + i + '" class="indicateElement" aria-label="' + wcagme_translations['indicate_element_on_page'] + '" href="javascript:void(0)"><strong>' + type + ':</strong> ' + msg.msg + '</a></td>';
            content += '<td class="messagePrinciple">';
            content += '<a href="http://www.w3.org/TR/WCAG20/#' + principles[principle].toLowerCase() + '">' + principles[principle] + '</a>';
            content += '</td>';
            content += '<td class="messageSC">';
            //content += '<a href="Standards/WCAG2/' + sc + '">' + sc.replace(new RegExp('_', 'g'), '.') + '</a>';
            content += '</td>';
            content += '<td class="messageTechniques"><ul>';
            for (var j = 0; j < techniques.length; j++) {
                content += '<li><a href="http://www.w3.org/TR/WCAG20-TECHS/' + techniques[j] + '">' + techniques[j] + '</a></li>';
            }
            content += '</ul></td>';
            content += '</tr>';
        }
    
    
        var heading = '';
    
        var noticeActive     = '';
        var testResultsClass = 'show-error show-warning show-notice';
        if ((errors === 0) && (warnings === 0)) {
            noticeActive     = '';
            testResultsClass = '';
        }
    
        heading += '<div id="test-results" class="' + testResultsClass + '">';
    
        content  = heading + content;
        content += '</table>';
        content += '<div id="test-results-noMessages"><em>No messages matched the types you selected</em></div>';
        resultsWrapper.innerHTML = content;

        var els = shadowDOM.querySelectorAll('.result a')
        if(els)
            els.forEach( ( el, n ) => {
            if( n == 0)
                el.addEventListener( 'click', (evnt) => { toggleMsgTypes( evnt, 'error') }, true)
            else if( n == 1)
                el.addEventListener( 'click', (evnt) => { toggleMsgTypes( evnt, 'warning') })
            else if( n == 2)
                el.addEventListener( 'click', (evnt) => { toggleMsgTypes( evnt, 'notice') })
            else
                el.addEventListener( 'click', (evnt) => { toggleMsgTypes( evnt, 'all') })
            })

            var el1 = shadowDOM.querySelector('.result-count.result-count-errors')
            if(el1)
                el1.replaceChildren(document.createTextNode(errors))
            var el2 = shadowDOM.querySelector('.result-count.result-count-warnings')
            if(el2)
                el2.replaceChildren(document.createTextNode(warnings))
            var el3 = shadowDOM.querySelector('.result-count.result-count-notices')
            if(el3)
                el3.replaceChildren(document.createTextNode(notices))
            var el4 = shadowDOM.querySelector('.result-count.result-count-all')
            if(el4)
                el4.replaceChildren(document.createTextNode(notices + warnings + errors))

            shadowDOM.querySelector('#form').classList.replace('show-form', 'show-result')

            var els = shadowDOM.querySelectorAll('#test-results .indicateElement')
            if(els)
                els.forEach( ( el ) => {
                    shadowDOM.addEventListener( 'click', indicateElement )
                })
    
        reorderResults();
    }

    function getTextContent(node){
        return node.childNodes[0] && node.childNodes[0].nodeValue ? 
            '<div class="italic">' + node.childNodes[0].nodeValue + '</div>' : 
            '<span>' + node.nodeName + '</span>'
    }

    function indicateElement(evnt){
        var rel = evnt.target.getAttribute('rel') ||
            (evnt.target.parentNode && evnt.target.parentNode.getAttribute ? evnt.target.parentNode.getAttribute('rel') : null)
        if( rel && rel < indicatedElements.length ){
            var node = indicatedElements[rel].element
            showIndicator(node)
            if(node.scrollIntoView)
                node.scrollIntoView(true)
        }
    }
    
    function showIndicator(node){

        if(! node.getBoundingClientRect) return

        var ind = shadowDOM.querySelector('#indicator'),
            top = 0;

        var rect = node.getBoundingClientRect(),
            body = document.querySelector('body'),
            scrollWidth = body.scrollWidth,
            scrollHeight = body.scrollHeight

        top = parseInt(rect.y + window.scrollY)
        
        ind.style.zIndex = '99999'
        ind.style.left = parseInt(rect.x + window.scrollX) + 'px'
        //ind.style.top = (rect.y + window.scrollY + 2 * rect.height / 3 ) + 'px'
        ind.style.top = top + 'px'//(top > rect.height ? top : top + rect.height) + 'px'
        ind.style.height = parseInt(Math.min(scrollHeight, Math.max(rect.height, 30))) + 'px'
        ind.style.width = parseInt(Math.min(scrollWidth, Math.max(rect.width, 30))) + 'px'

        var rgb = getBackgroundColor(node) || [],
            rgbStr = rgb ? contrastingColor(rgb) : 'red'
        
        ind.style.border = '3px dotted ' + rgbStr

        //console.log(rgb)

        var bb = ('rgb(' + rgb.join(',') + ')')
        if((rgb[0] < 255 - 64 && rgb[0] > 64) || (rgb[1] < 255 - 64 && rgb[1] >  64) || (rgb[2] < 255 - 64 && rgb[2] > 64))
            ind.style.borderBottom = '3px solid ' + bb
        else
            ind.style.borderBottom = '3px solid red'


        //ind.style['z-index'] = 999999999

        //node.style += ';filter: brightness(0.5);'

        //console.log(ind, rect, node)
    }

    function contrastingColor(a){
        var r = a[0],
            g = a[1],
            b = a[2];

        var c = ((~~(r*299) + ~~(g*587) + ~~(b*114))/1000) >= 128 || (!!(~(128/a) + 1) ) ? '#000' : '#FFF'
        return c
    } 

    function getBackgroundColor(node){
        if(node instanceof Element){
            var bg = getComputedStyle(node).backgroundColor,
                parts = bg.replaceAll('(', ',').replaceAll(')', ',').split(','),
                clr = ''

            if( parts[0] == 'rgb')
                return parts.slice(1,4).map((s) => {s.trim(); return parseInt(s)})
            if( (bg == 'transparent' || parts[4] == 0) && node.parentNode)
                return getBackgroundColor( node.parentNode)
            else    
                clr = parts.slice(1, 3)
            return clr.map(parseInt)
        }
        if(node.parentNode)
            return getBackgroundColor(node.parentNode )
        return null
    }

    function updateResults508(resultsWrapper)
    {
        resultsWrapper.innerHTML = '';
    
        var msgs = HTMLCS.getMessages();
        console.info(msgs);
        if (msgs.length === 0) {
            resultsWrapper.innerHTML = '<span class="no-violations">No violations found</span>';
            return;
        }
    
        var content = '<table id="test-results-table"><tr>';
        content    += '<th>#</th><th>Message</th><th>Rule</th></tr>';
    
        var errors   = 0;
        var warnings = 0;
        var notices  = 0;
    
        for (var i = 0; i < msgs.length; i++) {
            var msg = msgs[i];
            var type = '';
            switch (msg.type) {
                case HTMLCS.ERROR:
                    type = 'Error';
                    errors++;
                break;
    
                case HTMLCS.WARNING:
                    type = 'Warning';
                    warnings++;
                break;
    
                case HTMLCS.NOTICE:
                    type = 'Notice';
                    notices++;
                break;
    
                default:
                    type = 'Unknown';
                break;
            }
    
            // Get the success criterion so we can provide a link.
            var msgParts = msg.code.split('.');
            var section  = msgParts[1];
    
            // Build a message code without the standard name.
            msgParts.shift();
            msgParts.unshift('[Standard]');
            var noStdMsgParts = msgParts.join('.');
    
            content += '<tr class="' + type.toLowerCase() + '">';
            content += '<td class="number"><span class="flag"></span></td>';
            content += '<td class="messageText"><strong>' + type + ':</strong> ' + msg.msg + '</td>';
            content += '<td class="messagePrinciple">';
            content += '<a href="./Standards/Section508#pr' + section.toUpperCase() + '">1194.22 (' + section.toLowerCase() + ')</a>';
            content += '</td>';
            content += '</tr>';
        }
    
    
        var heading = '<h3>Test results</h3>';
    
        var noticeActive     = '';
        var testResultsClass = 'hide-notice';
        if ((errors === 0) && (warnings === 0)) {
            noticeActive     = '';
            testResultsClass = '';
        }
    
        heading += '<ul id="results-overview">';
        heading += '<li class="active"><a href="#" onclick="return toggleMsgTypes.call(this, \'error\');"><span class="result-count result-count-errors">' + errors + '</span> <span class="result-type">errors</span></a></li>';
        heading += '<li class="active"><a href="#" onclick="return toggleMsgTypes.call(this, \'warning\');"><span class="result-count result-count-warnings">' + warnings + '</span> <span class="result-type">warnings</span></a></li>';
        heading += '<li' + noticeActive + '><a href="#" onclick="return toggleMsgTypes.call(this, \'notice\');"><span class="result-count result-count-notices">' + notices + '</span> <span class="result-type">notices</span></a></li>';
        heading += '</ul>';
        heading += '<div id="test-results" class="' + testResultsClass + '">';
    
        content  = heading + content;
        content += '</table>';
        content += '<div id="test-results-noMessages"><em>No messages matched the types you selected</em></div>';
        content += '<span class="footnote"><em>Add the Accessibility Auditor bookmarklet to your browser to run this test on any web page.</em></span></div>';
        resultsWrapper.innerHTML = content;
    
        reorderResults();
    }
    
    function toggleMsgTypes(evnt, type) {
    
        var testResultsDiv = shadowDOM.getElementById('test-results'),
            headerSpan = shadowDOM.querySelector('.show-result');  

        testResultsDiv.classList.remove('show-error')
        testResultsDiv.classList.remove('show-warning')
        testResultsDiv.classList.remove('show-notice')

        headerSpan.classList.remove('show-error')
        headerSpan.classList.remove('show-warning')
        headerSpan.classList.remove('show-notice')
        headerSpan.classList.remove('show-all')
        
        if(type == 'all'){
            testResultsDiv.classList.add('show-error')
            testResultsDiv.classList.add('show-warning')
            testResultsDiv.classList.add('show-notice')
            headerSpan.classList.add('show-all')
        }
        else{
            testResultsDiv.classList.add('show-'+type)
            headerSpan.classList.add('show-'+type)
        }

        reorderResults();
        evnt.stopPropagation()
    }
    
    function reorderResults() {
        var testResultsDiv = shadowDOM.getElementById('test-results');
        var numberCells    = testResultsDiv.querySelectorAll('tr td.number');
        var currRow        = 0;
    
        for (var i = 0; i < numberCells.length; i++) {
            if (window.getComputedStyle) {
                var display = window.getComputedStyle(numberCells[i].parentNode).display;
            } else {
                var display = numberCells[i].parentNode.currentStyle.display;
            }
    
            if (display !== 'none') {
                currRow++;
                numberCells[i].innerHTML = currRow;
            } else {
                numberCells[i].innerHTML = '';
            }
        }
    
        if (currRow === 0) {
            shadowDOM.getElementById('test-results-noMessages').style.display = 'block';
        } else {
            shadowDOM.getElementById('test-results-noMessages').style.display = 'none';
        }
    }

    function startA11(){

        var rd = shadowDOM.querySelector('fieldset input[name=level]:checked')
        var lvl = rd.value
        shadowDOM.querySelector('console-main').classList.add('busy')

        new Promise( (resolve, reject) => {
            runHTMLCS(lvl, document, shadowDOM.querySelector('console-output'))
            openClose(true)
            resolve()
        })
        .then(() => {
            shadowDOM.querySelector('console-main').classList.remove('busy')
            var el = shadowDOM.querySelector('.result .level')
            if(el)
                el.replaceChildren(document.createTextNode(lvl.replace('WCAG2', '')))
        })
    }

    function open(content, icon, section){
        content.classList.add('expanded')
        icon.classList.replace('expand', 'minimize')
        if(section)
            shadowDOM.querySelector('#form').classList.replace( 'show-form', 'show-landmarks')
        else
            shadowDOM.querySelector('#form').classList.replace( 'show-form', 'show-result')
    }

    function close(content, icon){
        content.classList.remove('expanded')
        icon.classList.replace('minimize', 'expand')
        shadowDOM.querySelector('#form').classList.replace('show-result', 'show-form')
        shadowDOM.querySelector('#form').classList.replace('show-landmarks', 'show-form')

        var ind = shadowDOM.querySelector('#indicator'),
            tbl = shadowDOM.querySelector('#test-results');

        if(ind)
            ind.style = ''
        
        if(tbl)
            tbl.remove()

        if(observer)
            observer.disconnect()
    }

    function openClose( state, section ){
        var content = shadowDOM.querySelector('console-main section.modal'),
        icon = header.querySelector('div:nth-child(4)')

        if(typeof state != 'undefined' && state == true){
            open(content, icon, section)
        }
        else if(typeof state != 'undefined' && state == false){
            close(content, icon, section)    
        }
        else if( icon.classList.contains('expand')){
            open(content, icon)
            startA11()
        }
        else if(icon.classList.contains('minimize')){
            close(content, icon)
        }

        showFontsizeSelectorAsIcon()

        content.removeAttribute('style')  
    }

    function fontSizeSelector(evnt){
        var el = shadowDOM.querySelector('.font-size-selector'),
            up = evnt.target.classList.contains('up'),
            down = evnt.target.classList.contains('down')
        if(up)
            changeFontSize(true)
        else if(down)
            changeFontSize(false)
        else if(el.classList.contains('show-icon'))
            toggleFontSizeSelector(el)
        else
            showFontsizeSelectorAsIcon()
        evnt.stopPropagation()
    }

    function changeFontSize(up){
        var el = shadowDOM.querySelector("console-main"),
            val = getComputedStyle(el).fontSize
        if(val){
            if(up)
                el.style.fontSize = (parseInt(val) < 24 ? (parseInt(val) + 1) + 'px' : val)
            else
                el.style.fontSize = (parseInt(val) > 10 ? (parseInt(val) - 1) + 'px' : val)
            showFontSize(el)
        }
    }

    function showFontSize(el){
        var fontSize = getComputedStyle(el.closest('console-main')).fontSize.replace('px', ''),
            sel = el.querySelector('.font-size')
        if(sel)
            sel.replaceChildren(document.createTextNode(fontSize))
    }

    function showFontsizeSelectorAsIcon(){
        var el = shadowDOM.querySelector('.font-size-selector')
        if(el && el.classList.contains('show-buttons')){
            el.classList.remove('show-buttons')
            el.classList.add('show-icon')
        }
    }

    function toggleFontSizeSelector(el){
        if(el.classList.contains('show-icon')){
            showFontSize(el)
            el.classList.replace('show-icon', 'show-buttons')
        }
        else if(el.classList.contains('show-buttons'))
            el.classList.replace('show-buttons', 'show-icon')
    }

    function showlandmarks(){
        listArrayAsUL(
            shadowDOM.querySelector('console-main section.modal console-output'), 
            dumpARIA(document.body)[0]
        );        
    }

    function listArrayAsUL(el, ar){
        
        function traverse(ar, hidden){
            var ul = document.createElement('div')

            if(ar && ar.length > 0)
                ar.forEach( (a) => {

                    var li = document.createElement('div'),
                        txt = document.createTextNode(a.role.toLowerCase())    
                    
                    if(a.visible == false || hidden){
                        li.classList.add('grayed')
                        li.setAttribute('title', 'Not visible at the moment')
                    }
                    li.classList.add('pointer')

                    li.setAttribute('rel', a.rel)
                    li.addEventListener('click', (evnt) => {indicateElement(evnt)})
                    li.appendChild(txt)
                    ul.appendChild(li)
            
                    ul.appendChild(traverse(a.descendants, ! a.visible))
                })
            return ul
        }

        var ul = traverse(ar, false)
        ul.classList.add('list')
        el.replaceChildren(ul)
  }

  function draggableElement(elmnt) {
    elmnt.addEventListener('mousedown', dragMouseDown);
    
    function dragMouseDown(e) {
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      // call a function whenever the cursor moves:
      document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
      e.preventDefault();
      e.stopPropagation()
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      var content = elmnt.closest('console-main'),
        btn = content.querySelector('section.header div:nth-child(4)')
        pane = content.querySelector('section.modal'),
        tbl = content.querySelector('table tbody')

      if( e.movementY != 0){
        pane.style.height = (window.innerHeight - e.clientY) + 'px'
        if(tbl)
            tbl.style['max-height'] = (window.innerHeight - e.clientY) + 'px'

        var drawer = document.querySelector('#wcagme-slot')
        drawer.style.marginTop = (window.innerHeight - e.clientY) + 'px'
      }

      btn.classList.replace('expand', 'minimize')
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.removeEventListener('mousedown', dragMouseDown)
      document.removeEventListener('mousemove', elementDrag);
    }
  }

    document.addEventListener('DOMContentLoaded', () => {

        customElements.define('wcagme-linter', 
        
            class extends HTMLElement {

                constructor() {
                    super();

                    const template = document.getElementById('wcagme-linter');
                    const templateContent = template.content;
            
                    shadowDOM = this.attachShadow({mode: 'open'})
                    shadowDOM.appendChild(
                        templateContent.cloneNode(true)
                    );

                    header = shadowDOM.querySelector('console-main section.header');

                    if(header)
                    header.addEventListener('click', () => {
                        openClose()
                    })
                
                
                    //Close Modal with ESC key
                    document.addEventListener('keydown', (evnt) => {
                    if (evnt.key == 'Escape' ) 
                        openClose(evnt, false)
                    else if(evnt.key == 'Enter'){
                        if(! shadowDOM.querySelector('.modal.expanded'))
                            startA11(evnt)
                    }
                    });
            
                    var fontsizeSel = shadowDOM.querySelector(".font-size-selector")
                    if(fontsizeSel)
                        fontsizeSel.addEventListener('click', (evnt) => { fontSizeSelector(evnt) })
                
                    draggableElement(shadowDOM.querySelector('console-main ruler'));
            
                    var radios = shadowDOM.querySelectorAll('.form label')
                    radios.forEach( (radio) => {
                        radio.addEventListener('click', (evnt) => { evnt.stopPropagation(); startA11()})
                    })
            
                    var btn = shadowDOM.querySelector('li.aria-browser a')
                    if(btn){
                        btn.addEventListener('click', ( evnt ) => {  
                            evnt.stopPropagation(); 
                            openClose(true, true)
                            showlandmarks()
                            observer = new MutationObserver(() => {
                                showlandmarks() 
                            });
                            observer.observe(document.body, { subtree: true, childList: true, attributes: true});
                            evnt.stopPropagation()
                        })
                    }
                }
            }
        )
    })

})()


