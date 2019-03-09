const { ActionTypes, ActivityTypes, CardFactory, MessageFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { videos } = require('./resources/videoLibrary.js');

/**
 * A simple bot that responds to utterances with answers from the Language Understanding (LUIS) service.
 * If an answer is not found for an utterance, the bot responds with help.
 */
class LuisBot {
    /**
     * The LuisBot constructor requires one argument (`application`) which is used to create an instance of `LuisRecognizer`.
     * @param {LuisApplication} luisApplication The basic configuration needed to call LUIS. In this sample the configuration is retrieved from the .bot file.
     * @param {LuisPredictionOptions} luisPredictionOptions (Optional) Contains additional settings for configuring calls to LUIS.
     */
    constructor(application, luisPredictionOptions, includeApiResults) {
        this.luisRecognizer = new LuisRecognizer(application, luisPredictionOptions, true);
    }

    /**
     * Every conversation turn calls this method.
     * @param {TurnContext} turnContext Contains all the data needed for processing the conversation turn.
     */
    async onTurn(turnContext) {
        // By checking the incoming Activity type, the bot only calls LUIS in appropriate cases.

        switch (turnContext.activity.type) {
        case ActivityTypes.Message:
                // Perform a call to LUIS to retrieve results for the user's message.
            const results = await this.luisRecognizer.recognize(turnContext);

            // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
            const topIntent = results.luisResult.topScoringIntent;
            const sentiment = results.luisResult.sentimentAnalysis.label;

            const randomVideo = videos[sentiment][Math.floor(Math.random()*videos[sentiment].length)];
            const videoCard = MessageFactory.attachment(
                CardFactory.videoCard(
                    null,
                    [randomVideo],
                    [{
                        type: ActionTypes.OpenUrl,
                        title: 'Open in Youtube',
                        value: randomVideo
                    }]
                )
            );

            if (topIntent.intent !== 'None') {
                await turnContext.sendActivity(`Here's my suggestion based on your mood, enjoy!`);
                await turnContext.sendActivity(videoCard);
                
            } else {
                // If the top scoring intent was "None" tell the user no valid intents were found and provide help.
                await turnContext.sendActivity(`I can't understand.`);
            }
            break;
        case ActivityTypes.ConversationUpdate:
            // Welcome user.
            await this.welcomeUser(turnContext);
            break;
        default:
            // Handle other activity types as needed.
            break;
        }
    }

     /**
     * Async helper method to welcome all users that have joined the conversation.
     *
     * @param {TurnContext} context conversation context object
     *
     */
    async welcomeUser(turnContext) {
        // Do we have any new members added to the conversation?
        if (turnContext.activity.membersAdded.length !== 0) {
            // Iterate over all new members added to the conversation
            for (var idx in turnContext.activity.membersAdded) {
                // Greet anyone that was not the target (recipient) of this message
                // 'bot' is the recipient for events from the channel,
                // turnContext.activity.membersAdded === turnContext.activity.recipient.Id indicates the
                // bot was added to the conversation.
                if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                    // Welcome user.
                    await turnContext.sendActivity(MessageFactory.attachment(
                        CardFactory.animationCard(
                            'Welcome to Moody Tunes',
                            ['https://i.pinimg.com/originals/34/f0/9f/34f09f59e193f07cda58088545859a88.gif'],
                        )
                    ));
                    var reply = MessageFactory.suggestedActions(['Happy', 'Depressed', 'Angry', 'Splendid'], 'Hi, I am Moody Tunes bot. I can suggest a song depending on your mood.. Start by choosing a mood:');
                    await turnContext.sendActivity(reply);
                }
            }
        }
    }
}

module.exports.LuisBot = LuisBot;