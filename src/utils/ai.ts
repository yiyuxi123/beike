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

export async function generateSyllabus(courseName: string, grade: string, count: number): Promise<{title: string, goal: string}[]> {
  try {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个经验丰富的${grade}${courseName}教师。请为这门课程生成一个包含 ${count} 个课时的教学大纲。
请以严格的 JSON 数组格式输出，每个对象包含 "title" (课时标题) 和 "goal" (简短的教学目标，50字以内)。
不要输出任何其他内容，不要使用 markdown 代码块，只输出纯 JSON 数组。
示例格式：
[
  {"title": "第一课：XXX", "goal": "了解XXX的基本概念"},
  {"title": "第二课：YYY", "goal": "掌握YYY的计算方法"}
]`,
    });
    
    let text = response.text || '[]';
    // Clean up potential markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.error("Failed to parse syllabus JSON:", text);
      return [];
    }
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}

export async function generateLessonPlan(courseName: string, lessonTitle: string, grade: string, prepGoal: string): Promise<string> {
  try {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个经验丰富的${grade}${courseName}教师。请为课题为《${lessonTitle}》的课时写一份详细的教案正文。
这节课的教学目标是：
${prepGoal || '未提供具体目标'}

请包含以下部分：
1. 导入新课 (约3-5分钟)
2. 新课讲授 (约20-25分钟，分步骤详细说明)
3. 巩固练习 (约10分钟)
4. 课堂小结 (约3-5分钟)
5. 布置作业

请直接输出教案内容，使用 Markdown 格式，排版清晰，重点突出。`,
    });
    return response.text || '';
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}

export async function generateTasks(courseName: string, lessonTitle: string, grade: string, prepGoal: string): Promise<string[]> {
  try {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个经验丰富的${grade}${courseName}教师。请为课题为《${lessonTitle}》的课时生成一份备课任务清单（Checklist）。
这节课的教学目标是：
${prepGoal || '未提供具体目标'}

请以严格的 JSON 数组格式输出，每个元素是一个字符串，代表一个具体的备课任务（如"准备PPT"、"打印随堂练习"、"准备实验器材"等）。
控制在 3-6 个任务，每个任务不超过 20 个字。
不要输出任何其他内容，不要使用 markdown 代码块，只输出纯 JSON 数组。
示例格式：
["制作教学PPT", "准备课堂互动道具", "打印课后作业"]`,
    });
    
    let text = response.text || '[]';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
      return [];
    } catch (e) {
      console.error("Failed to parse tasks JSON:", text);
      return [];
    }
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}

export async function generateReflection(courseName: string, lessonTitle: string, grade: string, prepGoal: string): Promise<string> {
  try {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个经验丰富的${grade}${courseName}教师。你刚刚上完了一节名为《${lessonTitle}》的课。
这节课的教学目标是：
${prepGoal || '未提供具体目标'}

请帮我写一段课后教学反思，包括：
1. 教学目标的达成情况
2. 课堂上的亮点与不足
3. 下一步的改进措施

请直接输出反思内容，使用Markdown格式，不要多余的寒暄，控制在300字以内。`,
    });
    return response.text || '';
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}
