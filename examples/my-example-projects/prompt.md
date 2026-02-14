Let's develop for index.js. 

Do not use JanitorAISandbox wrapper. Use the global objects directlly. 

First, it would traverse (in reverse) an array `context.chat.last_messages` where each item has a `message` property. It will try to fish out [NARRATION_SUMMARY] and [RP_STATE] using extractNarrationSummary and decodeState functions from llm_utils.js. 

If [RP_STATE] is not found, default rpState to defaultCharacterSheet. If [NARRATION_SUMMARY] is not found, default naSum to a hard-coded value (empty effects array and empty debug object) with elapsed time set to 1 minute. Then, clean up teh naSum using the cleanInput function. 

Secondly, using the elapsed_time in naSum, update the current_time in rpState. 

Thirdly, reverse the expired effects in rpState (call reverseEffects function from character_sheet.js). 

Fourthly, in the order defined in the user_defined.js, call the aspect functions using the effects in naSum. Accumulate the returned narrationGuide into a large string. Use the returned cleanedEffects to call applyEffects function. Skip if the effect for a given aspect function is not there in naSum. 

Fifthly, encode the rpState (call encodeState function from llm_utils.js). 

---

Let's develop src/user_defined.js file. 

It should include three main parts. 

1. The default character sheet (to reference for the character sheet in the orchestrator)
2. All the possible effect JSONs (to reference for the effect JSONs in the orchestrator)
3. The aspect functions (one for each possible "key" in the effect JSON)

The effect JSONs (in this file will) looks like the following (data types are different from earlier definition and has one more key, "condition"): 

{
    "key": "consume_alcohol",  
    "what": "string; name of alcohol; allowed values are 'beer', 'wine', 'liqueur'", 
    "temp": true, 
    "when": "string; in yyyy-mm-ddTHH:MM:SS format; when does {{user}} consume the {{what}}", 
    "duration": "string; in PT1H30M format; how long would the alcohol affect {{user}}", 
    "impacts": [
        {"stats": "strength", "op": "set", "value": "integer: 0 or 1 depending on potency of alcohol}, 
        {"stats": "dexterity", "op": "sub", "value": 1}
    ]
    "condition": "{{user}} consume a type of alcohol"
}

Write a function (in llm_utils.js) that given a JSON like above, return the following text string (for LLM's consumption): 

```
In the above narration of yours, if and only if {{user}} consume a type of alcohol, include one instance of the following in the "effects" array.

{
    "key": "consume_alcohol",  
    "what": "string; name of alcohol; allowed values are 'beer', 'wine', 'liqueur'", 
    "temp": true, 
    "when": "string; in yyyy-mm-ddTHH:MM:SS format; when does {{user}} consume the {{what}}", 
    "duration": "string; in PT1H30M format; how long would the alcohol affect {{user}}", 
    "impacts": [
        {"stats": "strength", "op": "set", "value": "integer: 0 or 1 depending on potency of alcohol}, 
        {"stats": "dexterity", "op": "sub", "value": 1}
    ]
}
```

Notice that "condition" is part of the constructed string (at the top).

---

Branch into `dev` branch. 

I want you to scaffold a plain (vanilla) javascript (node and npm) project. It should have the following directory structure. 

* dist (where non-minimized compiled file lives. this directory should be in .gitignore)
* src (the .js source files live here)
* tests (the unit tests that test the functions in .js files in the src directory live here)
* scripts (the cli scripts for developers live here) 

The output is for a strictly secured customized sandbox environment (it does not even have btoa and atob functions). The environment does not like modules. Therefore, create a custom script to concenate the .js source files in the src directory together to build the compiled file in the dist. 

Furthermore, the .js files in src need the following guides (put them in developer-notes.md file for future reference): 

🟡 Safe Tools (Always Work)

**Text**

toLowerCase() → makes text lowercase
indexOf(" word ") !== -1 → check if a word is present
trim() → removes spaces

**Numbers & Math**

+, -, *, / → basic math
Math.random() → random number 0–1
Math.floor() → round down

**Arrays**

arr.length → how many items
arr.indexOf("thing") → check if “thing” is in list
for loops → loop through items

**Dates**

new Date().getHours() → current hour

**Regex**

/\bword\b/i.test(text) → check whole word safely

**Debugging**

console.log("Message:", context.chat.last_message);

🟡 Unsafe Tools (Never Work)

* .map(), .filter(), .reduce(), .forEach()
* Arrow functions () => {}
* Template strings `Hello ${name}`
* Spread operator ...
* async/await, Promises
* Classes
* try/catch (errors can’t be caught)
* setTimeout, setInterval, external calls (fetch)
* .includes(), .repeat(), .padStart(), .padEnd()

We are going to maintain a character sheet of the following form in the main orchestrator:

{
    "current_time": "yyyy-mm-ddTHH:MM:SS",
    "stats": { // the keys will be defined project by project; this is an example
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
    }, 
    "side-effects": [
        {
            "desc": "free text description",
            "expiry": "yyyy-mm-ddTHH:MM:SS",
            "impacts": [ // op can be set, add or sub 
                {"stats": "strength", "op": "set", "value": 0}, 
                {"stats": "dexterity", "op": "sub", "value": 1}
            ]
        }
    ],
    "flags": ["flag1", "flag2", "flag3"]
}

And we will have the following effect JSON defined: 

{
    "key": "consume_alcohol",  
    "what": "name of alcohol", 
    "temp": true, // temporary effect (expiry needs to calculate), false means no expiry
    "when": "yyyy-mm-ddTHH:MM:SS", // this with duration will calculate expiry
    "duration": "PT1H30M", // ISO 8601 duration format; 
    "impacts": [
        {"stats": "strength", "op": "set", "value": 0}, 
        {"stats": "dexterity", "op": "sub", "value": 1}
    ]
}

An input (to our orchestrator) from LLM will come as the following narrationSummary: 

{
    "elapsed_time": "PT1H30M", // ISO 8601 duration format; 
    "effects": [effect1, effect2] // array of effect JSONs
    "debug": {"ng": true} // a couple of flags for debug purposes
}

An output (from the orchestrator) to LLM will be the following: 

{
    "current_time": "yyyy-mm-ddTHH:MM:SS", 
    "narration_guide": "free text description",
    "debug": {"ng": true} // a couple of flags for debug purposes
}

We will have a sorted aspect functions (one for each possible "key" in the effect JSON) that will be called (in strict sequence) in the orchestrator loop. They will take the character sheet, the effect JSON (matching the key) and the output of the cleanUp utility matching the key (see below) as input and return a narration guide and a cleaned up effect JSON (they will host the logic to clean up).

Develop the following functionalities (as functions): 

* Base64 encode (for a given JSON object to a string)
* Base64 decode (for a given string to a JSON object)
* XOR cipher encrypt (for a given string to a string, using a given key)
* XOR cipher decrypt (for a given string to a string, using a given key)
* Necessary utilities function to parse ISO 8601 duration strings and "yyyy-mm-ddTHH:MM:SS" strings, add a duration to a date string, check if a date string is in the past, etc.
* Necessary LLM utilities function to parse LLM input and return a clean up LLM input (put a flag for each element not in the expected format)
* Dice roll function (for a given dice roll string to a number, using a given key) rollxdy that accepts x and y as parameters (default to 3d6)
* revertSideEffect function (for a given character sheet; it should check the current_time there and undo the side effects that have expired returning a new character sheet with smaller side-effects array)
* applySideEffect function (for a given character sheet and LLM input; it should apply the effect to the character sheet and return a new character sheet)
* necessary utility function to parse effect JSON from LLM input and return a mirror effect JSON (the same tree but with a boolean flag indicating if the element is in the expected format)

