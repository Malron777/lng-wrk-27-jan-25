import { END, START, StateGraph, Annotation } from "@langchain/langgraph"

const GraphAnnotation = Annotation.Root({
    // Define a 'steps' channel
    steps: Annotation({
    // 🟢 Default function: Initialize the channel with the default value,
    default: () => 0,
        // 🟢 Reducer function: updates the current state
        reducer: (currentState, newValue) => currentState + 1,
    })
})


const funcGreen = state => {
    console.log('function Green')
    console.log(state)
    return state
}
const funcYellow = state => {
    console.log('function Yellow')
    console.log(state)
    return state
}

const workflow = new StateGraph(GraphAnnotation)
    .addNode("nodeGreen", funcGreen)
    .addNode("nodeYellow", funcYellow)
    .addEdge(START, "nodeGreen")
    .addEdge("nodeGreen", "nodeYellow")
    .addEdge("nodeYellow", END)

const graph = workflow.compile()
await graph.invoke({})
// calling default same as doing graph.invoke({ steps: 0 })