(function(){
    
    var subsections = ['banner', 'complementary', 'contentinfo', 'navigation', 'region', 'search']

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

    console.log(document)

    //document.addEventListener( 'DOMContentLoaded', () => {
        console.log("PLayer")
        var landmarks = dumpARIA(document.body)
        var players = document.querySelectorAll('div[slot^=wcamge]')
        console.log(landmarks, players)
    //})

})()