import { GoogleGenAI } from "@google/genai";

export async function generatePrepGoal(courseName: string, lessonTitle: string, grade: string): Promise<string> {
  try {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个经验丰富的${grade}${courseName}教师。请为课题为《${lessonTitle}》的课时写一段简明扼要的备课教学目标（包含知识与技能、过程与方法、情感态度与价值观）。请直接输出目标内容，不要多余的寒暄，控制在200字以内。`,
    });
    return response.text || '';
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}
