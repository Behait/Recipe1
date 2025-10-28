import { GoogleGenAI } from "@google/genai";

// 定义菜谱和菜谱选项的JSON Schema
const recipeSchema = {
  type: 'OBJECT',
  properties: {
    recipeName: { type: 'STRING' },
    description: { type: 'STRING' },
    prepTime: { type: 'STRING' },
    cookTime: { type: 'STRING' },
    ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
    instructions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['recipeName', 'description', 'prepTime', 'cookTime', 'ingredients', 'instructions'],
};

const recipeOptionsSchema = {
    type: 'OBJECT',
    properties: {
        recipes: {
            type: 'ARRAY',
            description: "A list of 3 creative recipe names based on the ingredients.",
            items: { type: 'STRING' }
        }
    },
    required: ["recipes"]
};

// 定义Cloudflare Pages Function的类型
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Promise<Response> | Response;

// CORS 预检请求处理
export const onRequestOptions: PagesFunction = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestGet: PagesFunction = () => {
  return new Response(JSON.stringify({ message: "Endpoint is working. Use POST for API calls." }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

// Cloudflare Function handler
export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "YOUR_API_KEY") {
    try {
      const { type } = await request.json();
      let mockData;
      switch (type) {
        case 'generateOptions':
          mockData = { recipes: ["模拟创意菜1", "模拟创意菜2", "模拟创意菜3"] };
          break;
        case 'generateDetails':
        case 'generateRotd':
          mockData = {
            recipeName: "美味模拟菜谱",
            description: "这是一份由模拟数据生成的美味菜谱，非常适合家庭享用。",
            prepTime: "15 分钟",
            cookTime: "30 分钟",
            ingredients: ["模拟食材A", "模拟食材B", "模拟食材C"],
            instructions: ["第一步：准备所有模拟食材。", "第二步：将食材混合。", "第三步：烹饪30分钟。"],
            imageUrl: 'https://img.youtube.com/vi/k-3v-9lG2Bw/maxresdefault.jpg'
          };
          break;
        default:
          return new Response(JSON.stringify({ error: 'Invalid request type' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
      return new Response(JSON.stringify(mockData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const { type, payload } = await request.json();

    let prompt: string;
    let responseSchema: object;

    switch (type) {
      case 'generateOptions':
        prompt = `根据以下食材，推荐3个有创意的菜谱。请只提供菜谱的中文名称。食材：${payload.ingredients}`;
        responseSchema = recipeOptionsSchema;
        break;

      case 'generateDetails':
        prompt = `为“${payload.recipeName}”生成一份详细的菜谱，使用以下部分食材：${payload.ingredients}。可以随意添加常见的厨房常备品。菜谱应包含：1. 简短诱人的描述。2. 准备时间。3. 烹饪时间。4. 食材列表。5. 制作步骤。请以中文JSON格式提供输出。`;
        responseSchema = recipeSchema;
        break;

      case 'generateRotd':
        prompt = `为“今日推荐”生成一个有创意且受欢迎的菜谱。该菜谱应能吸引广大受众，使用相对常见的食材，并适合作为工作日晚餐。请以中文JSON格式提供输出。`;
        responseSchema = recipeSchema;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: type === 'generateOptions' ? 0.8 : 0.5,
      }
    });

    // 在返回响应之前，为菜谱详情添加一个虚拟的imageUrl
    if (type === 'generateDetails' || type === 'generateRotd') {
        const data = JSON.parse(geminiResponse.text || '{}');
        data.imageUrl = 'https://img.youtube.com/vi/k-3v-9lG2Bw/maxresdefault.jpg'; // 使用一个占位图
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(geminiResponse.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error in Cloudflare Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};