// StructuredOutputParser and ZOD
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";
import { StructuredOutputParser } from "langchain/output_parsers";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { z } from "zod";

dotenv.config();
let model = new ChatGoogleGenerativeAI();
let rl = readline.createInterface({ input, output });

// 🟢 in python this is Pydantic
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    question: z.string().describe(`tell me a random biology trivia question`),
    answers: z.array(z.string()).describe(`
                give 4 possible answers, in a random order, 
                out of which only one is true.`),
    correctIndex: z
      .number()
      .describe(`the number of the correct answer, zero indexed`),
  })
);

const prompt = PromptTemplate.fromTemplate(
  `Answer the user's question as best as possible.\n
    {format_instructions}`
);

const chain = prompt.pipe(model).pipe(parser);
// 🟢 show this; parser.getFormatInstructions(); parsers are just part of the prompt

console.log(parser.getFormatInstructions());
let data = await chain.invoke({
  format_instructions: parser.getFormatInstructions(),
});

console.log(data);

rl.close();
