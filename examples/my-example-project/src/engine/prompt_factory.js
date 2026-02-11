export const PromptFactory = {
    createNarrationSummary: function (header, template) {
        let summary = header;
        for (const key in template) {
            const rules = template[key];
            const schema = {
                what: rules.what,
                when: rules.when,
                temp: rules.temp,
                impacts: rules.impacts,
                duration: rules.duration,
            };

            summary += (rules.free_text || "") + "\n" +
                `key: ${key}\n` +
                `value: A JSON object with the following structure:\n${JSON.stringify(schema, null, 2)}\n`;
        }
        summary += "\n\n**IT IS IMPERATIVE THAT YOU PUT THE JSON OBJECT YOU OBTAINED AS ABOVE IN ENCLOSING PAIR OF [NARRATION_SUMMARY] AND [/NARRATION_SUMMARY]**"
        return summary;
    },

    createPersonalityPrepend: function (template, nextSecret, personality) {
        return template +
            "\n" +
            "The [SCRIPT_SECRET] block to start your next response is exactly as follow:" +
            "\n" +
            `[SCRIPT_SECRET]${nextSecret}[/SCRIPT_SECRET]` +
            "\n" +
            personality;
    },

    createScenarioAppend: function (template, narrationGuide, summary) {
        return template.replace("${narrationGuide}", narrationGuide) +
            "\n" +
            "In the following section, I provide you how to summarize the events in the narration " +
            "you just performed. **Follow these instructions STRICTLY.**" +
            "\n" +
            summary;
    },
};
