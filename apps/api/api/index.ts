// Vercel用のエントリーポイント
// @vercel/nodeがTypeScriptを自動的にコンパイルするため、src/index.tsから直接インポート可能
import app from '../src/index';

// Vercelのサーバーレス関数としてエクスポート
export default app;

