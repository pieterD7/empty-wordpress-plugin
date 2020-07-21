(function(){

    var ids =[
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        'help',
        'about'
    ]

    function setActiveElements(){
        ids.forEach( ( id ) => {
            if( document.location.hash == '#chapter_' + id ){
                ids.forEach( ( id2 ) => {
                    if( id2 == id ){
                        if( document.querySelector( '#id' + id2 )){
                            document.querySelector( '#id' + id2 ).classList.remove( 'hide' )
                            document.querySelector( '.cls' + id2 ).classList.add( 'active' )
                        }
                    }
                    else{
                        if( document.querySelector( '#id' + id2 )){
                            document.querySelector( '#id' + id2 ).classList.add( 'hide' )
                            document.querySelector( '.cls' + id2 ).classList.remove( 'active' )
                        }
                    }
                } )
            }
        })

        setTimeout( () => {
            window.scrollTo(50, 0);
        }, 25)
    }

    jQuery( document ).ready( () => {
        setActiveElements()

        var cbs = document.querySelectorAll( '.empty-settings input[type=checkbox]' )

        cbs.forEach( ( cb ) => {
            cb.addEventListener( 'change', ( evnt ) => {
                if( evnt.target.checked )
                    evnt.target.setAttribute( 'value', '1')
                else
                    evnt.target.setAttribute( 'value', '0' )
            } )
            
        })
    })

    window.onpopstate = function(){
        setActiveElements()
    }
    
})()