import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import * as dotenv from "dotenv"

dotenv.config({ path: '../.env' })
const llm = new ChatOpenAI({ temperature: 0 })

const weatherApiSchema = z.object({
  city: z.string().describe("The name of the city")
})

const weatherApiTool = tool(
  async ({ city }) => {
    return `The weather in ${city} is sunny, 20°C`
  },
  {
    name: "weatherApi",
    description: "Check the weather in a specified city.",
    schema: weatherApiSchema,
  }
)

const hotelsAvailabilitySchema = z.object({
  city: z.string().describe("The name of the city"),
  day: z.string().describe("Day of week to book the hotel"),
})

const hotelsAvailabilityTool = tool(
  async ({ city, day }) => {
    return `Hotel room in ${city} are available for ${day}.`
  },
  {
    name: "hotelsAvailability",
    description: "Check if hotels are available in a given city.",
    schema: hotelsAvailabilitySchema,
  }
)

// 🟢 binding the tools to the llm
// 🟢 https://python.langchain.com/v0.2/docs/integrations/chat/
const llmWithTools = llm.bindTools([
  weatherApiTool,
  hotelsAvailabilityTool
])

let messages = [
  new HumanMessage(`How will the weather be in Valencia this weekend?
I would like to go for weekend long hike and book one room for Saturday.`)
]

let llmOutput = await llmWithTools.invoke(messages)

console.log(llmOutput)

// 🟢 "finish_reason": "tool_calls"

// 🟢 the llm decides on 
//      1. if a tool is to be called 
//      2. the name the used tool
//      3. its parameters 

// 🟢 Descriptions are crucial * Functions must return strings.

// 🟢 finish_reason in should continue AI Agents --> day-3
