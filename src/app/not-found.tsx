// 自定义 404 页面, 覆盖 Next.js 16 内置的 _not-found 预渲染
// 内置 _not-found 使用 useSearchParams, 在静态预渲染时失败
// 此页面用 force-dynamic 强制跳过预渲染
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            padding: '2rem',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          <div style={{ fontSize: '4.5rem', fontWeight: 700, color: '#262626', lineHeight: 1 }}>
            404
          </div>
          <div style={{ fontSize: '1rem', color: '#999999', marginTop: '0.5rem' }}>
            页面不存在
          </div>
          <a
            href="/"
            style={{
              marginTop: '1.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#fff',
              background: '#ffa153',
              textDecoration: 'none',
            }}
          >
            返回首页
          </a>
        </div>
      </body>
    </html>
  );
}
