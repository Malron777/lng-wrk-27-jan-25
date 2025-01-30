import { BaseMessage } from "@langchain/core/messages";
import { Annotation, StateGraph, messagesStateReducer } from "@langchain/langgraph";
export const StateAnnotation = Annotation.Root({
messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
    }),
});

const graph = new StateGraph(StateAnnotation)
    .addNode(...)




👉 https://github.com/langchain-ai/langgraphjs/tree/main/libs/langgraph/src/graph


// MessagesAnnotation has a key called messages that can be used to reference the conversation history:
const callModelNode = async (state) => {
    const { messages } = state
    const result = await llmWithTools.invoke(messages)
    return { messages: [result] }
}