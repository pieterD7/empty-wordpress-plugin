(function(){

    let shadowDOM = null

    function showFontSize(el){
        var fontSize = getComputedStyle(el).fontSize.replace('px', ''),
            sel = shadowDOM.querySelector('.font-size')
        if(sel)
            sel.replaceChildren(document.createTextNode(fontSize))
    }

    function changeFontSize(evnt){
        var el = document.querySelector("body"),
            val = getComputedStyle(el).fontSize,
            up = evnt.target.closest('a').classList.contains('up')

        if(val){
            if(up)
                el.style.fontSize = (parseInt(val) < 32 ? (parseInt(val) + 1) + 'px' : val)
            else
                el.style.fontSize = (parseInt(val) > 10 ? (parseInt(val) - 1) + 'px' : val)
            showFontSize(el)
        }

        evnt.stopPropagation()
    }


    customElements.define('wcagme-font-size-adjust', 
    
        class extends HTMLElement {

            constructor() {
                super();

                const template = document.getElementById('wcagme-font-size-adjust');
                const templateContent = template.content;
        
                shadowDOM = this.attachShadow({mode: 'open'})
                shadowDOM.appendChild(
                    templateContent.cloneNode(true)
                );

                var btnUp = shadowDOM.querySelector('.buttons .up'),
                    btnDown = shadowDOM.querySelector('.buttons .down')
                btnUp.addEventListener('click', changeFontSize)
                btnDown.addEventListener('click', changeFontSize)

                shadowDOM.host.closest('a').setAttribute('href', 'javascript:void(0)')

                showFontSize(document.body) 
            }
        }
    )
})()