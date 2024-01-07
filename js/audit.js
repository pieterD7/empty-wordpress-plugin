(function(){
    var btn = document.querySelector('.wcagme-audit button'),
        pdfLink = document.querySelector('.wcagme-audit .pdf'),
        result = document.querySelector('.wcagme-audit > div.result');

    if( btn ){
        btn.addEventListener( 'click', ( evnt ) => {
            evnt.preventDefault();

            let url = document.querySelector('.wcagme-audit input[name=url]').value,
                cookies = document.querySelector('.wcagme-audit input[name=cookies]:checked'),
                standard = document.querySelector('.wcagme-audit select[name=standard]').value;
            
            result.replaceChildren();
            isBusy(wcagme_data.translations['busy']);
            disablePDFLink();

            //startWorker(url, cookies !== null)
            startOnUIThread(url, cookies !== null, standard)
        } )
    }

    function isBusy(txt){
        if( ! document.querySelector('body').classList.contains('wcagme-busy'))
            document.querySelector('body').classList.add('wcagme-busy');
        var el = document.createElement('div');
        if( ! el.classList.contains('busy-indicator') )
            el.classList.add('busy-indicator')
        el.appendChild(document.createTextNode(txt || ''));
        result.replaceChildren( el );
        btn.setAttribute('disabled', '')
    }

    function isReady(){
        document.querySelector('body').classList.remove('wcagme-busy')
        btn.removeAttribute('disabled')
    }

    function showGuidelineResult( guideline, msgs, landmarks ){
        var els = [],
            msgGuideline = document.createElement( 'div' ),
            nErrors = msgs.filter( ( msg ) => msg.type == 1),
            nWarnings = msgs.filter( ( msg ) => msg.type == 2),
            nNotices = msgs.filter( ( msg ) => msg.type == 3),
            indicator = result.querySelector( '.busy-indicator' );

        if( ! indicator.classList.contains('hide') )
            indicator.classList.add('hide')

        var title = document.createElement('div'),
            txt = guideline + ' errors:\u00A0' + nErrors.length + ' warnings:\u00A0' + nWarnings.length + ' notices:\u00A0' + nNotices.length;

        title.classList.add( 'guideline' );
        title.appendChild( document.createTextNode( txt ) );
        els.push( title );

        msgs.sort( ( a, b ) => { if( a.type > b.type ) return 1; else if( a.type < b.type ) return -1; else return 0 });
        
        msgs.forEach( (msg) => {
            if( msg.display ){
                var el = document.createElement('div'),
                    cls = msg.type == 1 ? 'error' : ( msg.type == 2 ? 'warning' : 'notice' );
                el.classList.add( cls )
                el.appendChild(document.createTextNode(msg.msg));
                els.push(el);
            }
        })

        msgGuideline.classList.add('results')
        msgGuideline.replaceChildren(...els);
        result.appendChild( msgGuideline );
    }

    function enablePDFLink( data){
        pdfLink.querySelector( 'a' ).setAttribute( 'href', data.pdf )
        //pdfLink.querySelector( 'a' ).setAttribute( 'download', 'XXXX.pdf' )
        var fi = new File([data.blob], 'SDSDSD.pdf', {type:'application/pdf'});
        console.log(URL.createObjectURL(fi))
        pdfLink.classList.remove('unvisible')
    }

    function disablePDFLink(){
        pdfLink.querySelector( 'a' ).removeAttribute('href')
        if( ! pdfLink.classList.contains('unvisible'))
            pdfLink.classList.add('unvisible')
    }

    function showError(evnt){
        var txt = document.createElement('div')
        txt.appendChild( document.createTextNode(evnt.detail.error.message))
        result.replaceChildren( txt )
    }

    function startOnUIThread( url, cookies, standard ){
        document.dispatchEvent(
            new CustomEvent( "wcagme_do_page", {
                detail: {
                        url,
                        logo: wcagme_data.logo, 
                        standard,
                        cookies
                    }
                } 
            )
        )
    }

    function startWorker(url, cookies){
        isBusy(wcagme_data.translations['busy'])
        disablePDFLink()
        let wrkr = new Worker(wcagme_data.url, {type: 'module'});

        if(wrkr){
            wrkr.addEventListener('message', (msg) => {
                console.log(msg)
                if(msg.data.error)
                    showError(msg.data.error)
                else
                    enablePDFLink(msg.data)

                console.log(msg.data)
                isReady()
            })
            wrkr.postMessage({cmd: 'getPage', url: url, cookies: cookies});
        }
    }

    isBusy();
    document.addEventListener( 'wcagme_done_guideline', ( evnt ) => {
        if( ! evnt.detail.error )
            showGuidelineResult( evnt.detail.guideline, evnt.detail.msgs );
        evnt.stopPropagation();
    })

    document.addEventListener( 'wcagme_result_page', ( evnt ) => {
        console.log( "Result" );
        var results = evnt.detail.result,
            landmarks = evnt.detail.landmarks,
            standard = evnt.detail.standard,
            el = document.createElement( 'div' ),
            spn1 = document.createElement( 'span' ),
            spn2 = document.createElement( 'span' ),
            spn3 = document.createElement( 'span' ),
            landmarksEl = document.createElement( 'div' ),
            landmarksUl = document.createElement( 'ul' );
    
        evnt.stopPropagation();

        var lmarks = [],
            title = document.createElement( 'div' );

        title.appendChild( document.createTextNode( wcagme_data.translations['Landmarks on this page:'] ))
        landmarks.forEach( ( mark ) => {
            var el = document.createElement( 'li' )
            el.appendChild( document.createTextNode( mark.role ))
            lmarks.push(el)
        })

        el.classList.add( 'results' );
        spn1.appendChild( document.createTextNode( 'errors:\u00A0' + results.errors ) );
        spn2.appendChild( document.createTextNode( 'warnings:\u00A0' + results.warnings ) );
        spn3.appendChild( document.createTextNode( 'notices:\u00A0' + results.notices ) );
        
        el.replaceChildren(spn1, spn2, spn3);
        result.prepend( el );

        var standardEl = document.createElement( 'div' ),
            spn1 = document.createElement( 'span' );
        standardEl.classList.add('results');
        spn1.appendChild( document.createTextNode( wcagme_data.translations[standard] ) );
        standardEl.appendChild(spn1);
        result.prepend( standardEl );

        landmarksEl.classList.add( 'landmarks' );
        landmarksEl.appendChild( title ); 
        landmarksUl.replaceChildren( ...lmarks );
        landmarksEl.appendChild( landmarksUl );
        result.prepend( landmarksEl );
        addBR()
    })

    function prependParseMsg( txt, bold ){
        var el = document.createElement( 'div' ),
            spn1 = document.createElement( 'span' );
        el.classList.add( 'results' );

        if( bold === false)
            el.classList.add( 'text-weight-normal' )

        spn1.appendChild( document.createTextNode( txt ));
        el.appendChild(spn1);
        result.prepend( el );
    }

    function addBR(){
        var el = document.createElement('div'),
            br = document.createElement('br');
        el.appendChild( br );
        result.prepend( el );
    }

    document.addEventListener( 'wcagme_done_page', ( evnt ) => {
        if(evnt.detail.error)
            showError(evnt)
        else{
            enablePDFLink(evnt.detail)
            //console.log(evnt.detail.el)
            //document.querySelector('body').appendChild(evnt.detail.el)
        }

        if( evnt.detail.viewport)
            prependParseMsg("The page has a viewport : accessibility features of iOS and Android to set font size work. Please check if the design is ok with other font sizes and viewport scalings.", false);
        else
            prependParseMsg("The page has no viewport : accessibility features of iOS and Andriod to set font size may not work.", false);

        prependParseMsg("Accessibility guidelines\u000A:");
        addBR();

        prependParseMsg( evnt.detail.errorStyles  + "\u00A0style sheets couldn't be applied without errors.", false );
        prependParseMsg( evnt.detail.errorScripts  + "\u00A0scripts couldn't be loaded without errors.", false );
        prependParseMsg( "Emulation of the page with jsDOM\u00A0:" );

        evnt.stopPropagation();
        
        console.log(evnt)
        isReady();
    })

    document.addEventListener( 'wcagme_ready', () => {
        isReady();
    })
})()