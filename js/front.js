(function(){

    addEventListener("DOMContentLoaded", () => {
        const artyom = new Artyom()

        // Add command (Short code artisan way)
        artyom.on(['Good morning','Good afternoon']).then((i) => {
            switch (i) {
                case 0:
                    artyom.say("Good morning, how are you? ");
                break;
                case 1:
                    artyom.say("Good afternoon, how are you?");
                break;            
            }
            artyom.say("You speak double dutch!")
        });
    
       /*  artyom.on(['Repeat after me *'] , true).then((wildcard) => {
            artyom.say("You've said : " + wildcard);
        }); */
        
    
        // Start the commands !
        artyom.initialize({
            //lang: "en-GB", // GreatBritain english
            lang: "nl-NL",
            continuous: true, // Listen forever
            soundex: true,// Use the soundex algorithm to increase accuracy
            debug: true, // Show messages in the console
            //executionKeyword: "and do it now",
            listen: true, // Start to listen commands !
    
            // If providen, you can only trigger a command if you say its name
            // e.g to trigger Good Morning, you need to say "Jarvis Good Morning"
            //name: "Jarvis" 
        }).then(() => {
            console.log("Artyom has been succesfully initialized");
        }).catch((err) => {
            console.error("Artyom couldn't be initialized: ", err);
        });
    })
})()