const { ChatGroq } = require("@langchain/groq");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");


const getGroqModel = () =>
  new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-20b",
    temperature: 0.4,
  });

const getGeminiModel = () =>
  new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
    temperature: 0.4,
  });


const callLLM = async (systemPrompt, userPrompt) => {
  const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];

  try {
    if (process.env.GROQ_API_KEY) {
      const model = getGroqModel();
      const response = await model.invoke(messages);
      return response.content;
    }
    throw new Error("No Groq key set");
  } catch (groqErr) {
    console.warn("Groq call failed, falling back to Gemini:", groqErr.message);
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("Both Groq and Gemini are unavailable");
    }
    const model = getGeminiModel();
    const response = await model.invoke(messages);
    return response.content;
  }
};

const generateTaskDescription = async (title, projectContext = "") => {
  const system =
    "You are a helpful project management assistant. Write clear, concise task descriptions for a software team.";
  const user = `Write a short task description (2-4 sentences) for a task titled "${title}".${
    projectContext ? ` Project context: ${projectContext}.` : ""
  } Keep it practical and specific enough for a developer to start work.`;

  return callLLM(system, user);
};

const generateSprintSummary = async (sprintName, tasks) => {
  const taskList = tasks
    .map((t) => `- ${t.title} [${t.status}, ${t.storyPoints} pts]`)
    .join("\n");

  const system =
    "You are a helpful agile assistant summarizing sprint progress for a project manager.";
  const user = `Summarize the progress of sprint "${sprintName}" in 3-5 sentences based on this task list:\n${taskList}\n\nMention completion rate, any risks (e.g. many tasks still in "todo"), and one actionable recommendation.`;

  return callLLM(system, user);
};

const generateProductivityRecommendation = async (workloadSummary) => {
  const system =
    "You are a helpful productivity coach for software teams. Be specific and brief.";
  const user = `Given this workload distribution across team members:\n${workloadSummary}\n\nGive 2-3 short, actionable recommendations to balance the workload or improve throughput.`;

  return callLLM(system, user);
};

module.exports = {
  generateTaskDescription,
  generateSprintSummary,
  generateProductivityRecommendation,
};
