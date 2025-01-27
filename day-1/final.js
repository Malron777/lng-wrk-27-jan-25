// keeping track of memory
import { ChatOpenAI } from "@langchain/openai"
import * as dotenv from "dotenv"
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser, StructuredOutputParser} from "@langchain/core/output_parsers"
import { z } from "zod"
import { MessagesPlaceholder } from "@langchain/core/prompts"
import { HumanMessage, AIMessage } from "@langchain/core/messages"

dotenv.config()
let model = new ChatOpenAI()
let rl = readline.createInterface({ input, output })

const parser = StructuredOutputParser.fromZodSchema(
    z.object({
        question: z.string().describe(
            `tell me a random geography trivia question`
        ),
        answers: z
            .array(z.string())
            .describe(`
                give 4 possible answers, in a random order, 
                out of which only one is true.`
            ),
        correctIndex: z.number().describe(
            `the number of the correct answer, zero indexed`
        ),
    })
)

const prompt = PromptTemplate.fromTemplate(
    `Answer the user's question as best as possible.\n
    Don't repeat previous questions \n
    {format_instructions}`
)

const formattedPrompt = await prompt.format({
    format_instructions: parser.getFormatInstructions()
});

const chatHistory = []

const chatPromptTemplate = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"]
])

const chain = chatPromptTemplate.pipe(model).pipe(new JsonOutputParser())

let oneMoreQuestion
do {
    const data = await chain.invoke({
        input: formattedPrompt,
        chat_history: chatHistory
    })
    console.log(data)
    // 🟢 HumanMessage and AIMessage
    chatHistory.push(new HumanMessage(formattedPrompt))
    chatHistory.push(new AIMessage(JSON.stringify(data)))
    oneMoreQuestion = await rl.question('💯 Ask one more question (y for yes):')
} while(oneMoreQuestion == 'y')
rl.close()