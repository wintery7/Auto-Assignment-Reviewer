const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors')({ origin: true, credentials: true });

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

exports.foodRecommendation = onRequest({
  region: "asia-northeast3"
}, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const userPreference = req.body.preference;
    if (!userPreference) {
      return res.status(400).json({ error: "Preference is required." });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const previousMenus = req.body.previousMenus || [];

      const prompt = `다음 형식으로 정확하게 응답해주세요.
사용자가 "${userPreference}"를 원할 때, 창의적이고 다양한 메뉴를 추천해주세요.

다음 메뉴들은 최근에 이미 추천되었으므로 제외하고 추천해주세요:
${previousMenus.join(', ')}

아래는 참고용 메뉴 예시입니다. 이 외의 다른 메뉴도 자유롭게 추천 가능합니다.
[한식 예시]
- 김치찌개, 된장찌개, 순두부찌개, 부대찌개, 동태찌개
- 갈비찜, 닭갈비, 감자탕, 삼겹살, 불고기
- 비빔밥, 제육볶음, 낙지볶음, 해물파전, 청국장

[중식 예시]
- 짜장면, 짬뽕, 탕수육, 마파두부, 깐풍기
- 유린기, 동파육, 양장피, 고추잡채, 깐쇼새우
- 유산슬, 팔보채, 볶음밥, 마라탕, 마라상궈

[일식 예시]
- 라멘, 돈카츠, 우동, 가츠동, 규동
- 오야코동, 텐동, 초밥, 사시미, 오코노미야키
- 야키소바, 규카츠, 카레라이스, 나베, 스키야키

[양식 예시]
- 스테이크, 파스타, 리조또, 피자, 햄버거
- 오믈렛, 샐러드, 그라탕, 치킨, 랍스터
- 감바스, 비프 스트로가노프, 라자냐, 퀘사디아, 타코

응답 형식:
추천 메뉴: [창의적이고 새로운 메뉴 이름]

레시피:
1. 재료:
[필요한 재료들을 상세히 나열]

2. 조리 방법:
[순서대로 조리 방법을 자세히 설명]

주의사항:
- 매번 새롭고 다양한 메뉴를 추천해주세요
- 입력된 카테고리에 맞는 메뉴를 추천해주세요
- 위 목록에 없는 메뉴도 자유롭게 추천 가능합니다
- 단, 해당 카테고리의 특징을 잘 반영하는 메뉴여야 합니다`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      
      console.log('AI 응답 원본:', text);
      
      // 정규식 수정
      const menuMatch = text.match(/추천 메뉴:\s*([^\n]+)/);
      const recipeMatch = text.match(/레시피:[\s\S]+/);

      console.log('메뉴 매칭:', menuMatch);
      console.log('레시피 매칭:', recipeMatch);

      const recommendation = {
        menu: menuMatch ? menuMatch[1].trim() : "메뉴를 찾을 수 없습니다.",
        recipe: recipeMatch ? 
          recipeMatch[0]
            .replace('레시피:', '')
            .replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>')
            .trim() 
          : "레시피를 찾을 수 없습니다."
      };

      console.log('최종 recommendation 객체:', recommendation);

      res.status(200).json({ recommendation });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: "Error generating recommendation." });
    }
  });
});