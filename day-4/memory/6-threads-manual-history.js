import { HumanMessage, AIMessage } from "@langchain/core/messages"
import {
  END, START, StateGraph, MessagesAnnotation
} from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import * as dotenv from "dotenv"

dotenv.config({ path: '../.env' })

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0
})

const getLastMessage = ({ messages }) => 
  messages[messages.length - 1]

const callModel = async (state) => {
  const { messages } = state
  const result = await llm.invoke(messages)
  return { messages: [result] }
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addEdge("agent", END)

const graph = workflow.compile();

let chatHistory = [
    new HumanMessage("hi! My name is Daniel and I like LangGraph!")
]


// user 1 request 1
const u1r1 = await graph.invoke({messages: chatHistory})
chatHistory.push(new AIMessage(getLastMessage(u1r1).content))
console.log(getLastMessage(u1r1).content)

// user 1 request 2
chatHistory.push(new HumanMessage("Sorry, did I already introduce myself?"))
const u1r2 = await graph.invoke({messages: chatHistory})
chatHistory.push(new AIMessage(getLastMessage(u1r2).content))
console.log(getLastMessage(u1r2).content)

// user 2 request 1
chatHistory.push(new HumanMessage("Sorry, did I already introduce myself?"))
const u2r1 = await graph.invoke({messages: chatHistory})
chatHistory.push(new AIMessage(getLastMessage(u2r1).content))
console.log(getLastMessage(u2r1).content)