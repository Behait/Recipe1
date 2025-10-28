import { getSql, incrementRecipeHit, getRecipeBySlug } from "../../_lib/db";

export const onRequestPost = async ({ request, env }: any) => {
  try {
    const body = await request.json();
    const { recipeId, slug, recipeName, isAiGenerated } = body;

    if (!recipeId && !slug && !recipeName) {
      return new Response(JSON.stringify({ error: "需要提供 recipeId、slug 或 recipeName" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conn = (env as any).DB_CONNECTION_STRING;
    if (!conn) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sql = getSql(conn);
    let targetRecipeId = recipeId;

    // 如果只提供了 slug，先查找对应的 recipeId
    if (!targetRecipeId && slug) {
      const recipe = await getRecipeBySlug(sql, slug);
      if (!recipe) {
        return new Response(JSON.stringify({ error: "菜谱不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      targetRecipeId = recipe.id;
    }

    // 处理AI生成的菜谱统计
    if (isAiGenerated && recipeName) {
      try {
        // 为AI生成的菜谱创建统计记录
        // 使用菜谱名称的哈希作为唯一标识，并转换为UUID格式
        const aiRecipeHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(recipeName)
        );
        const hashArray = Array.from(new Uint8Array(aiRecipeHash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // 将哈希转换为UUID格式 (8-4-4-4-12)
        const aiRecipeId = [
          hashHex.substring(0, 8),
          hashHex.substring(8, 12),
          hashHex.substring(12, 16),
          hashHex.substring(16, 20),
          hashHex.substring(20, 32)
        ].join('-');

        // 插入或更新AI菜谱统计
        await sql`
          INSERT INTO recipe_hit_stats (recipe_id, hit_date, hit_count, recipe_name, is_ai_generated)
          VALUES (${aiRecipeId}::uuid, CURRENT_DATE, 1, ${recipeName}, true)
          ON CONFLICT (recipe_id, hit_date)
          DO UPDATE SET hit_count = recipe_hit_stats.hit_count + 1
        `;

        return new Response(JSON.stringify({ success: true, message: "AI菜谱统计记录成功" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("记录AI菜谱统计失败:", error);
        // 如果AI菜谱统计失败，继续尝试常规统计
      }
    }

    // 记录数据库菜谱的点击统计
    if (targetRecipeId) {
      await incrementRecipeHit(sql, targetRecipeId);
    }

    return new Response(JSON.stringify({ success: true, message: "统计记录成功" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("记录菜谱点击统计失败:", error);
    return new Response(JSON.stringify({ error: "内部服务器错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};