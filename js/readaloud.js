(function(){

    function init(evnt){
        this.querySelector('div').classList.toggle('wcagme-hidden')
        this.setAttribute('href', 'javascript:void(0)')
        evnt.stopPropagation()
        evnt.stopImmediatePropagation()
    }

    document.addEventListener('DOMContentLoaded', () => {
        var els = document.querySelectorAll('a[href=\\#wcagme_a11y_controls]')
        if(els){
            els.forEach( (el) => {
                el.addEventListener('click', init)
                el.addEventListener('keydown', init)
            })
        }
    })

    var shadowDOM = null

    if ("content" in document.createElement("template")) {
        const template = document.querySelector("#wcagme-player-"+data.id);
        const clone = template.content.cloneNode(true);
        let el = document.querySelector('div[slot=wcagme-readaloud-slot-'+data.id+']')
        shadowDOM = el.attachShadow({mode:'open'})
        shadowDOM.appendChild(clone);
    }
})()