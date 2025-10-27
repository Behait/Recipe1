// sw.js

// 导入 Babel standalone 脚本。
// 这将使 `Babel` 全局变量在 Service Worker 的作用域内可用。
self.importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

self.addEventListener('install', (event) => {
  // 安装后立即激活新的 Service Worker。
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 立即控制此 Service Worker 作用域下的所有页面。
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 检查请求是否针对 .ts 或 .tsx 文件
  if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
    event.respondWith(
      (async () => {
        try {
          // 1. 获取原始文件内容
          const response = await fetch(event.request);
          if (!response.ok) {
            return response; // 透传 404 等错误
          }
          const tsxCode = await response.text();

          // 2. 使用 Babel进行编译
          const { code: jsCode } = Babel.transform(tsxCode, {
            presets: ['react', 'typescript'],
            filename: url.pathname // 用于生成更清晰的错误信息
          });

          // 3. 创建并返回一个带有正确内容类型的新 Response
          return new Response(jsCode, {
            headers: {
              'Content-Type': 'text/javascript; charset=utf-8'
            }
          });
        } catch (error) {
          console.error('Service Worker 编译错误:', error);
          // 返回一个错误响应
          return new Response(`/* 编译失败: ${error.message} */`, {
            status: 500,
            headers: {
              'Content-Type': 'text/javascript; charset=utf-8'
            }
          });
        }
      })()
    );
  }
  // 对于所有其他请求，让它们正常通过。
});
