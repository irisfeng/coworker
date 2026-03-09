import OpenAI from "openai";

const provider = process.env.AI_PROVIDER || "qwen";

const configs = {
  qwen: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.DASHSCOPE_API_KEY || "",
    model: "qwen-plus",
  },
  deepseek: {
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: "deepseek-chat",
  },
};

const config = configs[provider as keyof typeof configs] || configs.qwen;

export const ai = new OpenAI({
  baseURL: config.baseURL,
  apiKey: config.apiKey,
});

export const AI_MODEL = config.model;
