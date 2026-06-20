import { getSupportResponse, getSuggestedQuestions } from "../utils/supportKnowledgeBase.js";

const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length < 1) {
      return res.status(400).json({ reply: "Message is required." });
    }

    const lang = hasArabic(message) ? "ar" : "en";
    const result = getSupportResponse(message.trim(), lang);

    return res.json({
      reply: result.reply,
      faq_id: result.faqId,
      confidence: result.confidence || 0,
    });
  } catch (err) {
    console.error("Support Chat Error:", err.message);
    return res.status(500).json({ reply: "An error occurred. Please try again." });
  }
};

export const suggestions = async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    return res.json({ suggestions: getSuggestedQuestions(lang) });
  } catch (err) {
    console.error("Suggestions Error:", err.message);
    return res.status(500).json({ suggestions: [] });
  }
};
