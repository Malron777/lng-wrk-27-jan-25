// StructuredOutputParser and ZOD
import { ChatOpenAI } from "@langchain/openai"
import * as dotenv from "dotenv"
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"

dotenv.config()
let model = new ChatOpenAI()
let rl = readline.createInterface({ input, output })

// 🟢 in python this is Pydantic
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
    {format_instructions}`
)

const chain = prompt.pipe(model).pipe(parser)
// 🟢 show this; parser.getFormatInstructions(); parsers are just part of the prompt

console.log(parser.getFormatInstructions())
let data = await chain.invoke({
    format_instructions: parser.getFormatInstructions()
})

console.log(data)

rl.close()