// ⛔️ npm i readline-sync
import { END, START, StateGraph, MemorySaver, 
    MessagesAnnotation, Annotation } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { z } from "zod"
import { tool } from "@langchain/core/tools"
import * as dotenv from "dotenv"
import * as reader  from "readline-sync"

dotenv.config({ path: '../.env' })

const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
})

const graphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    // 🟢 define new flag Annotation 
    askHumanUseCreditCard: Annotation(),
})

const purchaseTicketTool = tool(
    (input) => `Successfully purchased a plane 
    ticket for ${input.destination}`,
    {
        name: "purchase_ticket",
        description: "Buy a plane ticket for a given destination.",
        schema: z.object({
            destination: z.string().describe("The destination of the plane ticket."),
        }),
    }
)

const tools = [purchaseTicketTool]

const nodeTools = async (state) => {
    // 🟢 get the askHumanUseCreditCard flag Annotation 
    const { messages, askHumanUseCreditCard } = state
    if (!askHumanUseCreditCard) {
        throw new Error("Permission to use credit card is required.")
    }
    const lastMessage = messages[messages.length - 1]
    const toolCall = lastMessage.tool_calls[0]
    // invoke the tool to buy the plane ticket
    const result = await purchaseTicketTool.invoke(toolCall)
    return { messages: result }
}

const nodeAgent = async (state) => {
    const { messages } = state
    const llmWithTools = llm.bindTools(tools)
    const result = await llmWithTools.invoke(messages)
    return { messages: [result] }
}

const shouldContinue = (state) => {
    const { messages } = state
    const lastMessage = messages[messages.length - 1]
    if (lastMessage._getType() !== "ai" || !lastMessage.tool_calls?.length) {
        return END
    }
    return "tools"
}

const workflow = new StateGraph(graphState)
    .addNode("agent", nodeAgent)
    .addEdge(START, "agent")
    .addNode("tools", nodeTools)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END])

const graph = workflow.compile({
    checkpointer: new MemorySaver(),
})

const config = {
    configurable: { thread_id: "vacation" },
    // 🟢 define what nodes to interrupt 
    interruptBefore: ["tools"]
}

// 🟢 try with how are you
const input = {
    messages: [
        new HumanMessage("how are you?")
    ]
}

const intermediaryResult = await graph.invoke(input, config)

// 🟢  manually resume using if finish_reason !== stop
console.log(intermediaryResult)

// mention await graph.getState(config)).values.askHumanUseCreditCard

console.log("We need human authorization for this operation.")

// get human authorization
let userInput = reader.question("Type yes to allow credit card use: ")
await graph.updateState(config, { 
    askHumanUseCreditCard: userInput === "yes" 
})

// continuing graph after state update
// mention - graph.invoke(null, config)
const finalResult = await graph.invoke(null, config)
console.log(finalResult)