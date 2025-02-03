// ⛔️ be sure to run npm i @langchain/community @langchain/core cheerio

import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
//🟢 document loader that can retrive the content of a web page
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
//🟢 tool for making the vectors and embeddings
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
//🟢 retrieval tool
import { TaskType } from "@google/generative-ai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from "dotenv";
import { createRetrievalChain } from "langchain/chains/retrieval";

dotenv.config();

const model = new ChatGoogleGenerativeAI({});

const prompt = ChatPromptTemplate.fromTemplate(
  `Answer the user's question from the following context: 
    {context}
    Question: {input}`
);

let retrievalChain, splitDocs;

//🟢 the RAG process
async function loadDocumentsFromUrl(url) {
  //🟢 document loaders
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  //🟢 document transformers
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  splitDocs = await splitter.splitDocuments(docs);

  //🟢 setting up the embeddings
  //const embeddings = new OpenAIEmbeddings();
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004", // 768 dimensions
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "Document title",
  });

  //🟢 making a local vector DB
  const vectorstore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  //🟢 what we use to fetch data from the vector DB
  const retriever = vectorstore.asRetriever();

  const chain = await createStuffDocumentsChain({
    llm: model,
    prompt,
  });

  retrievalChain = await createRetrievalChain({
    combineDocsChain: chain,
    retriever,
  });
}

await loadDocumentsFromUrl("https://www.js-craft.io/about/");

console.log("✅ document loaded");

const answer = await retrievalChain.invoke({
  input: "What is the name of Daniel's cat?",
  context: splitDocs,
});

console.log(answer);

const storyPrompt = new PromptTemplate({
  inputVariables: ["sentence"],
  template:
    "Tell me a story based on the characters from this sentence: {sentence}",
});

const chain = storyPrompt.pipe(model).pipe(new StringOutputParser());

const stream = await chain.stream({ sentence: answer });
const chunks = [];
for await (const chunk of stream) {
  chunks.push(chunk);
  // console.log(chunk)
  process.stdout.write(chunk);
}
