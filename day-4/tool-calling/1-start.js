import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import * as dotenv from "dotenv"

dotenv.config({ path: '../.env' })
const llm = new ChatOpenAI({ temperature: 0 })

let messages = [
  new HumanMessage(`How will the weather be in Valencia this weekend?
I would like to go for weekend long hike and book one room for Saturday.`)
]

let llmOutput = await llm.invoke(messages)

console.log(llmOutput)

// 🟢 this will work on the ChaptGPT app, but if you call the API will not work
// you have to provide this as a developer

