const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors')({ origin: true, credentials: true });

// 환경 변수에서 API 키 가져오기
const genAI = new GoogleGenerativeAI(process.env.API_KEY);


exports.chatBot = onRequest({
  region: "asia-northeast3"
}, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    console.log("POST request received");

    const userMessage = req.body.message;
    console.log("User message received:", userMessage);

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    try {
      // Gemini 1.5 모델 호출
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `${userMessage}`;
      const result = await model.generateContent(prompt);

      // 여기서 response의 내용을 await으로 감싸서 정확히 텍스트를 반환하도록 함
      const text = await result.response.text();

      console.log("Generated response:", text);
      res.status(200).json({ response: text });
      
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ error: "Error generating response." });
    }
  });
});