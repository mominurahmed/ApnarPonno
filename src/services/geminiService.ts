import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateProductDescription = async (productName: string, category: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a compelling, high-end, and SEO-friendly product description for an organic/natural product named "${productName}" in the category "${category}". Focus on health benefits, purity, and traditional quality. Keep it under 150 words.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Generation error:", error);
    throw new Error("Failed to generate description. Please check your API key.");
  }
};

export const analyzeSalesTrends = async (salesData: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this sales data and provide 3 actionable business insights for an organic shop owner: ${JSON.stringify(salesData)}. Keep each insight short and professional.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Unable to analyze trends at this time.";
  }
};
