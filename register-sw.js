// register-sw.js

if ('serviceWorker' in navigator) {
  /**
   * 动态创建并注入主应用脚本，启动 React 应用。
   */
  const startApp = () => {
    console.log('Service Worker is ready, starting the application...');
    // 检查脚本是否已存在，防止重复注入
    if (document.querySelector('script[src="/index.tsx"]')) {
      console.log('Application script already injected.');
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/index.tsx';
    script.onerror = () => {
        console.error('Failed to load the main application script.');
        document.getElementById('root').innerHTML = '<h2>应用脚本加载失败</h2><p>无法加载应用核心文件，请检查网络连接或浏览器控制台获取更多信息。</p>';
    };
    document.head.appendChild(script);
  };

  /**
   * 注册 Service Worker 并等待其激活。
   */
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);

      // 如果 Service Worker 已经控制了页面（例如，在刷新页面时），
      // 我们可以直接启动应用。
      if (navigator.serviceWorker.controller) {
        startApp();
      } else {
        // 如果是首次加载，Service Worker 还未取得控制权。
        // 我们需要监听 'controllerchange' 事件，
        // 当新的 Service Worker 激活并接管页面时，该事件会触发。
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New Service Worker has taken control.');
          startApp();
        });
      }
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
      document.getElementById('root').innerHTML = '<h2>应用加载失败</h2><p>无法启动核心服务。请检查您的浏览器是否支持 Service Worker 并重试。</p>';
    });
} else {
  console.error('Service Workers are not supported in this browser.');
  document.getElementById('root').innerHTML = '<h2>浏览器不兼容</h2><p>此应用需要一个支持 Service Worker 的现代浏览器才能运行。</p>';
}