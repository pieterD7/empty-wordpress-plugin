(function(){

    if (!(('webkitSpeechRecognition'||'SpeechRecognition') in window)) {
        alert('Web Speech API is not supported by this browser. upgrade_info to Chrome version 25 or later');
    }


    var errors = [ 'no-speech', 'not-allowed', 'audio-capture']

    var recognition = null,
        recognizedText = [],
        current = 0,
        running = false

    function recognize(){
        var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition,
            //SpeechRecognitionResultList = SpeechRecognitionResultList || webkitSpeechRecognitionResultList,
            SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
            
        //SpeechRecognitionResultList.prototype.forEach = Array.prototype.forEach

        running = true

        recognition = new SpeechRecognition();

        recognition.lang = 'nl-NL';

        var grammar = '#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;'

        var speechRecognitionList = new SpeechGrammarList();

        speechRecognitionList.addFromString(grammar, 1);

        recognition.grammars = speechRecognitionList;

        recognition.continuous = false

        recognition.interimResults = true

        recognition.maxAlternatives = 5

        recognition.onend = function(evnt){
            console.log(evnt, recognizedText)
            //if( running )
                recognition.start()
        }

        recognition.onsoundstart = function(){
            //recognition.start()
        }

        recognition.onsoundend = function(){
            //recognition.stop()
        }

        var hnds = [ /*'onaudioend',*/ 'onaudiostart', /*'onend',*/ 'onerror', 'onnomatch', /*'onresult',*/
        'onsoundend', 'onsoundstart', 'onspeechend', 'onspeechstart', 'onstart']

        recognition.onaudioend = (evnt) => {
            console.log(evnt, recognizedText)
            recognition.stop();
        };

        hnds.forEach( (h) => {
            recognition[h] = (evnt) => { console.log(h, evnt, recognizedText)}
        })

        recognition.onresult = function(event) {

            console.log("RESULT")

            if( ! recognizedText[ current ] ){
                //recognizedText.push('')
            }

            var color = event.results;
            console.log( color, event.results )
            //console.log('Confidence: ' + event.results[0][0].confidence);

            //recognizedText[current] = ''

            color.forEach = Array.prototype.forEach

            color.forEach( ( result ) => {
                recognizedText.push( result )
            })

            console.log(recognizedText)

        }

        recognition.onspeechend = function( event ) {

            current++
            //recognition.stop()
        }

        recognition.start();
    }

    function stopListening(){
        recognition.stop();

        running = false

        current = 0

        setTimeout( () => {
            var p = document.createElement('p')
                p.innerText = recognizedText.join( ' ' )

            document.body.appendChild( p )

            //recognizedText = []
        }, 1000)

    }

    recognize()

})()