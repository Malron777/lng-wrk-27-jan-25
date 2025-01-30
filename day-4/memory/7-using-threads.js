import { HumanMessage } from "@langchain/core/messages"
import {
  END, START, StateGraph, MessagesAnnotation, MemorySaver
} from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"
import * as dotenv from "dotenv"

dotenv.config({ path: '../.env' })

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
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

const checkpointer = new MemorySaver()
const graph = workflow.compile({ checkpointer });

console.log("Starting first thread")
const configIntroThread = {
  configurable: { thread_id: "t1" }
}
const t1r1 = await graph.invoke({
  messages: [
    new HumanMessage("hi! My name is Daniel and I like LangGraph!")
],}, configIntroThread)
console.log(getLastMessage(t1r1).content)

const t1r2 = await graph.invoke({
  messages: [
    new HumanMessage("Sorry, did I already introduce myself?")
],}, configIntroThread)
console.log(getLastMessage(t1r2).content)

console.log("💬 Starting second thread")
const configAnotherThread = {
  configurable: { thread_id: "t2" }
}
const t2r1 = await graph.invoke({
  messages: [
    new HumanMessage("Sorry, did I already introduce myself?")
],}, configAnotherThread)
console.log(getLastMessage(t2r1).content)

/*
As a general recap of the process:
  1. the checkpointer mechanism writes the state at every step of the graph
  2. these checkpoints are saved in a thread
  3. we can access that thread in the future using the thread id
*/
