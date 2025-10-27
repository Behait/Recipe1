import { GoogleGenAI } from "@google/genai";
import { toSlug } from "../_lib/slug";
import { uploadImage } from "../_lib/r2";
import { getSql, upsertRecipe, logGeneration, setDailyRecommendation } from "../_lib/db";

// 使用字符串字面量直接定义 schema，避免动态导入和打补丁
const recipeSchema = {
  type: 'OBJECT',
  properties: {
    recipeName: { type: 'STRING' },
    description: { type: 'STRING' },
    prepTime: { type: 'STRING' },
    cookTime: { type: 'STRING' },
    ingredients: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    instructions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
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

// FIX: Add a minimal type definition for PagesFunction to satisfy TypeScript
// when the Cloudflare global types are not available.
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Promise<Response> | Response;

// Cloudflare Function handler
export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string, DB_CONNECTION_STRING: string }> = async ({ request, env }) => {
  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const { type, payload } = await request.json();

    switch (type) {
      case 'generateOptions': {
        const prompt = `根据以下食材，推荐3个有创意的菜谱。请只提供菜谱的中文名称。食材：${payload.ingredients}`;
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: recipeOptionsSchema,
            temperature: 0.8,
          }
        });
        return new Response(geminiResponse.text, { headers: { 'Content-Type': 'application/json' } });
      }
      case 'generateDetails': {
        const prompt = `为“${payload.recipeName}”生成一份详细的菜谱，使用以下部分食材：${payload.ingredients}。可以随意添加常见的厨房常备品。菜谱应包含：1. 简短诱人的描述。2. 准备时间（例如，“15分钟”）。3. 烹饪时间（例如，“25分钟”）。4. 包含所有必要食材及其用量的列表。5. 详细的制作步骤。请以中文JSON格式提供输出。`;
        const detailsResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
            temperature: 0.5,
          }
        });
        const details = JSON.parse(detailsResp.text || '{}');

        // 先持久化至数据库（无图），避免因为图片失败而不入库
        const conn = (env as any).DB_CONNECTION_STRING;
        let up: { id: string; slug: string } | null = null;
        let imageUrl: string = '';
        let imageKey: string | null = null;
        const slug = toSlug(details.recipeName);
        if (conn) {
          try {
            const sql = getSql(conn);
            up = await upsertRecipe(sql, {
              slug,
              recipeName: details.recipeName,
              description: details.description,
              prepTime: details.prepTime,
              cookTime: details.cookTime,
              ingredients: details.ingredients,
              instructions: details.instructions,
              image_key: null,
              image_url: null,
              source: 'user',
            });
            await logGeneration(sql, payload.ingredients ?? '', up.id);
            // 生成图片并上传到 R2（成功则更新图片字段）
            try {
              const imageResp = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A professional, delicious photo of ${details.recipeName}, beautifully plated`,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '16:9' },
              });
              if (imageResp.generatedImages && imageResp.generatedImages.length > 0) {
                const base64ImageBytes = imageResp.generatedImages[0].image.imageBytes;
                const uploaded = await uploadImage(env, base64ImageBytes, slug);
                imageUrl = uploaded.image_url;
                imageKey = uploaded.image_key;
                await upsertRecipe(sql, {
                  slug,
                  recipeName: details.recipeName,
                  description: details.description,
                  prepTime: details.prepTime,
                  cookTime: details.cookTime,
                  ingredients: details.ingredients,
                  instructions: details.instructions,
                  image_key: imageKey,
                  image_url: imageUrl,
                  source: 'user',
                });
              }
            } catch (e) {
              console.error('Image generation/upload failed (generateDetails):', e);
            }
          } catch (e) {
            console.error('DB persist error (generateDetails):', e);
          }
        } else {
          console.error('DB_CONNECTION_STRING is not configured for generateDetails');
        }

        const finalRecipe = {
          id: up?.id || '',
          slug: up?.slug || slug,
          recipeName: details.recipeName,
          description: details.description,
          prepTime: details.prepTime,
          cookTime: details.cookTime,
          ingredients: details.ingredients,
          instructions: details.instructions,
          imageUrl: imageUrl,
        };
        return new Response(JSON.stringify(finalRecipe), { headers: { 'Content-Type': 'application/json' } });
      }
      case 'generateRotd': {
        const prompt = `为“今日推荐”生成一个有创意且受欢迎的菜谱。该菜谱应能吸引广大受众，使用相对常见的食材，并适合作为工作日晚餐。菜谱应包含：1. 简短诱人的描述。2. 准备时间（例如，“15分钟”）。3. 烹饪时间（例如，“25分钟”）。4. 包含所有必要食材及其用量的列表。5. 详细的制作步骤。请以中文JSON格式提供输出。`;
        const detailsResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
            temperature: 0.7,
          }
        });
        const details = JSON.parse(detailsResp.text || '{}');

        const conn = (env as any).DB_CONNECTION_STRING;
        let up: { id: string; slug: string } | null = null;
        let imageUrl: string = '';
        let imageKey: string | null = null;
        const slug = toSlug(details.recipeName);
        if (conn) {
          try {
            const sql = getSql(conn);
            // 先入库为 daily 来源
            up = await upsertRecipe(sql, {
              slug,
              recipeName: details.recipeName,
              description: details.description,
              prepTime: details.prepTime,
              cookTime: details.cookTime,
              ingredients: details.ingredients,
              instructions: details.instructions,
              image_key: null,
              image_url: null,
              source: 'daily',
            });
            const today = new Date().toISOString().slice(0, 10);
            await setDailyRecommendation(sql, today, up.id);
            // 图片生成与更新
            try {
              const imageResp = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A professional, delicious photo of ${details.recipeName}, beautifully plated`,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '16:9' },
              });
              if (imageResp.generatedImages && imageResp.generatedImages.length > 0) {
                const base64ImageBytes = imageResp.generatedImages[0].image.imageBytes;
                const uploaded = await uploadImage(env, base64ImageBytes, slug);
                imageUrl = uploaded.image_url;
                imageKey = uploaded.image_key;
                await upsertRecipe(sql, {
                  slug,
                  recipeName: details.recipeName,
                  description: details.description,
                  prepTime: details.prepTime,
                  cookTime: details.cookTime,
                  ingredients: details.ingredients,
                  instructions: details.instructions,
                  image_key: imageKey,
                  image_url: imageUrl,
                  source: 'daily',
                });
              }
            } catch (e) {
              console.error('Image generation/upload failed (generateRotd):', e);
            }
          } catch (e) {
            console.error('DB persist error (generateRotd):', e);
          }
        } else {
          console.error('DB_CONNECTION_STRING is not configured for generateRotd');
        }

        const finalRecipe = {
          id: up?.id || '',
          slug: up?.slug || slug,
          recipeName: details.recipeName,
          description: details.description,
          prepTime: details.prepTime,
          cookTime: details.cookTime,
          ingredients: details.ingredients,
          instructions: details.instructions,
          imageUrl: imageUrl,
        };
        return new Response(JSON.stringify(finalRecipe), { headers: { 'Content-Type': 'application/json' } });
      }
      case 'generateImage': {
        const prompt = `A professional, delicious, mouth-watering photo of ${payload.recipeName}, beautifully plated on a clean background, vibrant colors, appetizing, high-resolution food photography.`;
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '16:9',
            },
        });

        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            return new Response(JSON.stringify({ imageUrl }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
             return new Response(JSON.stringify({ imageUrl: '' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error: any) {
    console.error("Error in Cloudflare Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
};