(function(){

    if(wp.customize)
        wp.customize('custom_theme_css2', (settings) => { settings.bind((data) => { console.log("KILO", data)}) })

    function wrapInPTag(node){
        el = document.createElement('p')
        el.appendChild(node)
        return el
    }

    function updateMenu(){
        var el = document.querySelector('#update-nav-menu, #customize-theme-controls')
        
        if(el){
            el.addEventListener( 'click', (evnt) => {
                
                var el0 = evnt.target.closest('li') ? evnt.target.closest('li').querySelector(
                        "input[type=text][value=\\#wcagme_readaloud_control], input[type=text][value=\\#wcagme_adjust_font_size_control]"
                        ) : null,
                    customizer = false;

                if(el0 == null){
                    var ids = Object.keys(data).map( (id) => {
                        if(! isNaN(parseInt(id)))
                            return id
                    })
                    ids.forEach((id) => {
                        var _el0 = document.querySelector('#edit-menu-item-url-' + id)
                        if( _el0){
                            //el0 = _el0
                            //customizer = true
                        }
                    })
                }

                if(el0)
                    var item = el0.closest('li'),
                        type = null
                    if(item)
                        type = el0.value.match(/.*readaloud.*/) ? 1 : 2;

                if(el0 && item){
                    var el1 = el0.closest('div.menu-item-settings')
                    item = item.getAttribute('id').substring(item.getAttribute('id').lastIndexOf('-')+1)

                    var data = JSON.parse((data[item] || data['default'])),
                        translations = JSON.parse(data['translations'])

                    if(el1){
                        var node = document.createElement('div'),
                            div = document.createElement('div'),
                            inpPll = document.createElement('input'),
                            lbl = document.createElement('label'),
                            lbl2 = document.createElement('label'),
                            lbl3 = document.createElement('label'),
                            check2 = document.createElement('input');

                        if(!customizer)
                            inpPll.setAttribute('name', 'menu-item-pll-detect[' + item + ']');
                        else
                            inpPll.setAttribute('name', 'menu-item-pll-detect');

                        inpPll.setAttribute('value', '1');
                        inpPll.setAttribute('type', 'hidden');

                        check2.setAttribute('type', 'checkbox');

                        check2.setAttribute('name', 'menu-item-icon[' + item + ']')

                        if(wcagme_data.icon == '1')
                            check2.setAttribute('checked', '')


                        div.appendChild(inpPll)
                        div.appendChild(wrapInPTag(lbl))

                        lbl3.appendChild(check2)
                        lbl3.appendChild(document.createTextNode(' ' + translations.icon))
                        
                        if(type == 1){
                            div.appendChild(wrapInPTag(lbl2))
                            div.appendChild(wrapInPTag(lbl3))
                        }
                        else
                            div.appendChild(wrapInPTag(document.createTextNode(translations.info)))

                        for(var prop in wcagme_data.styles){
                            var inpEl = document.createElement('input'),
                                lbl = document.createElement('label')

                            inpEl.setAttribute('name', 'menu-item-styles[' + item + '][' + prop + ']')
                            inpEl.setAttribute('value', wcagme_data.styles[prop])

                            lbl.appendChild(document.createTextNode(translations[prop] + ' :  '))
                            lbl.appendChild(document.createElement('br'))
                            lbl.appendChild(inpEl)

                            div.appendChild(wrapInPTag(lbl))
                        }

                        node.appendChild(div)

                        var inps = el1.querySelectorAll( 'input[type=text], input[type=hidden]' )
                            
                        inps.forEach( (inp) => {
                            inp = inp.cloneNode()
                            inp.setAttribute('type', 'hidden')
                            node.appendChild(inp)
                        })

                        var rmEls = el1.querySelectorAll('p')
                        if(rmEls)
                            rmEls.forEach( (el) => { el.remove()})

                        node.appendChild(document.createElement('br'))
                        el1.prepend(node)
                    }
                }
            } )
        }

    }

    document.addEventListener( 'DOMContentLoaded', updateMenu)
})()