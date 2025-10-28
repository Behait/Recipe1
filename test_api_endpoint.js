// 生产环境API端点测试脚本
// 用于测试 /api/recipes/hit 端点是否正常工作

// 测试配置
const BASE_URL = 'https://your-production-domain.com'; // 替换为你的生产域名
const TEST_CASES = [
    {
        name: '测试AI生成菜谱统计',
        data: {
            recipeName: '测试AI菜谱_' + Date.now(),
            isAiGenerated: true
        }
    },
    {
        name: '测试数据库菜谱统计（使用slug）',
        data: {
            slug: 'test-recipe-slug', // 替换为实际存在的slug
            isAiGenerated: false
        }
    },
    {
        name: '测试数据库菜谱统计（使用ID）',
        data: {
            recipeId: 'test-recipe-id', // 替换为实际存在的ID
            recipeName: '测试数据库菜谱',
            isAiGenerated: false
        }
    }
];

// 测试函数
async function testApiEndpoint(testCase) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log('请求数据:', JSON.stringify(testCase.data, null, 2));
    
    try {
        const response = await fetch(`${BASE_URL}/api/recipes/hit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.data)
        });
        
        const responseText = await response.text();
        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        try {
            const responseData = JSON.parse(responseText);
            console.log('响应数据:', responseData);
        } catch (e) {
            console.log('响应文本:', responseText);
        }
        
        if (response.ok) {
            console.log('✅ 测试通过');
        } else {
            console.log('❌ 测试失败');
        }
        
    } catch (error) {
        console.log('❌ 网络错误:', error.message);
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始API端点测试...');
    console.log('目标URL:', BASE_URL);
    
    for (const testCase of TEST_CASES) {
        await testCase(testCase);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    }
    
    console.log('\n✨ 所有测试完成');
}

// 浏览器环境下的使用说明
if (typeof window !== 'undefined') {
    console.log(`
📋 使用说明：
1. 打开浏览器开发者工具
2. 修改 BASE_URL 为你的生产域名
3. 修改测试用例中的 slug 和 recipeId 为实际存在的值
4. 在控制台中运行: runAllTests()
5. 查看测试结果和错误信息
    `);
}

// Node.js环境下直接运行
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // 需要安装 node-fetch: npm install node-fetch
    const fetch = require('node-fetch');
    runAllTests();
}

// 导出函数供手动调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testApiEndpoint, runAllTests, TEST_CASES };
}