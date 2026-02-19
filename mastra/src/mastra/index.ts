import { Mastra } from "@mastra/core";
import { researchAgent } from "./agents/researchAgent";
import { evaluationAgent } from "./agents/evaluationAgent";
import { learningExtractionAgent } from "./agents/learningExtractionAgent";
import { reportAgent } from "./agents/reportAgent";
import { webSummarizationAgent } from "./agents/webSummarizationAgent";
import { researchWorkflow } from "./workflows/researchWorkflow";
import { generateReportWorkflow } from "./workflows/generateReportWorkflow";
import { storage } from "./lib/storage";

export const mastra = new Mastra({
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow },
  storage,
});
