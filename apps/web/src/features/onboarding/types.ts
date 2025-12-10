export interface OnboardingTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  categories: Array<{
    name: string;
    emoji: string;
    color: string;
  }>;
  sampleActivities: Array<{
    title: string;
    category: string;
    durationMinutes: number;
    mood: number;
    note?: string;
    date: string; // YYYY-MM-DD
  }>;
}

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: 'study',
    name: '勉強・資格',
    emoji: '📘',
    description: '学習や資格試験の記録に最適',
    categories: [
      { name: '勉強', emoji: '📚', color: '#3b82f6' },
      { name: '読書', emoji: '📖', color: '#6366f1' },
      { name: '復習', emoji: '🔄', color: '#8b5cf6' },
    ],
    sampleActivities: [
      {
        title: 'Java勉強',
        category: '勉強',
        durationMinutes: 45,
        mood: 4,
        note: '基礎文法を復習しました',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '英語リスニング',
        category: '勉強',
        durationMinutes: 20,
        mood: 4,
        note: 'TOEIC対策のリスニング練習',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '資格の過去問',
        category: '復習',
        durationMinutes: 30,
        mood: 3,
        note: '過去問を1セット解きました',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'programming',
    name: 'プログラミング・スキルアップ',
    emoji: '💻',
    description: 'コーディングや技術学習の記録に最適',
    categories: [
      { name: 'プログラミング', emoji: '💻', color: '#3b82f6' },
      { name: '学習', emoji: '📚', color: '#6366f1' },
      { name: '実践', emoji: '⚡', color: '#8b5cf6' },
    ],
    sampleActivities: [
      {
        title: 'Reactの学習',
        category: '学習',
        durationMinutes: 60,
        mood: 5,
        note: 'Hooksの使い方を学びました',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ポートフォリオサイト作成',
        category: 'プログラミング',
        durationMinutes: 90,
        mood: 4,
        note: 'Next.jsで実装中',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'コードレビュー',
        category: '実践',
        durationMinutes: 30,
        mood: 4,
        note: 'チームメンバーのコードをレビュー',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'fitness',
    name: '筋トレ・生活改善',
    emoji: '🏋️‍♂️',
    description: 'トレーニングや運動の記録に最適',
    categories: [
      { name: '筋トレ', emoji: '💪', color: '#ef4444' },
      { name: '有酸素運動', emoji: '🏃', color: '#10b981' },
      { name: 'ストレッチ', emoji: '🧘', color: '#8b5cf6' },
    ],
    sampleActivities: [
      {
        title: 'ベンチプレス',
        category: '筋トレ',
        durationMinutes: 45,
        mood: 4,
        note: '60kg × 5回 × 3セット',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ランニング',
        category: '有酸素運動',
        durationMinutes: 30,
        mood: 5,
        note: '5km走りました',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ストレッチ',
        category: 'ストレッチ',
        durationMinutes: 20,
        mood: 5,
        note: '体が柔らかくなりました',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'game',
    name: 'ゲーム練習・eスポーツ',
    emoji: '🎮',
    description: 'ゲームの練習や上達を目指す記録に最適',
    categories: [
      { name: '練習', emoji: '🎯', color: '#3b82f6' },
      { name: '試合', emoji: '🏆', color: '#ef4444' },
      { name: '復習', emoji: '🔄', color: '#8b5cf6' },
    ],
    sampleActivities: [
      {
        title: 'Aim練習',
        category: '練習',
        durationMinutes: 30,
        mood: 4,
        note: 'エイムトレーニングを実施',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ランクマッチ',
        category: '試合',
        durationMinutes: 60,
        mood: 5,
        note: '3勝1敗でランクアップ',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'リプレイ分析',
        category: '復習',
        durationMinutes: 20,
        mood: 4,
        note: '敗因を分析して改善点を発見',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'work',
    name: '仕事',
    emoji: '💼',
    description: '業務やプロジェクトの記録に最適',
    categories: [
      { name: '仕事', emoji: '💼', color: '#8b5cf6' },
      { name: '会議', emoji: '🤝', color: '#6366f1' },
      { name: '学習', emoji: '📚', color: '#3b82f6' },
    ],
    sampleActivities: [
      {
        title: 'プロジェクト企画',
        category: '仕事',
        durationMinutes: 120,
        mood: 4,
        note: '新機能の要件定義を完了',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'チームミーティング',
        category: '会議',
        durationMinutes: 60,
        mood: 3,
        note: '週次レビュー',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '技術調査',
        category: '学習',
        durationMinutes: 90,
        mood: 5,
        note: '新しいフレームワークを調査',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'diet',
    name: 'ダイエット',
    emoji: '🥗',
    description: '食事や健康管理の記録に最適',
    categories: [
      { name: '食事', emoji: '🍽️', color: '#f59e0b' },
      { name: '運動', emoji: '🏃', color: '#10b981' },
      { name: '記録', emoji: '📊', color: '#6366f1' },
    ],
    sampleActivities: [
      {
        title: '朝食の記録',
        category: '食事',
        durationMinutes: 20,
        mood: 4,
        note: 'バランスの良い朝食を摂取',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ウォーキング',
        category: '運動',
        durationMinutes: 40,
        mood: 5,
        note: '8000歩達成',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '体重測定',
        category: '記録',
        durationMinutes: 5,
        mood: 4,
        note: '目標に向かって順調',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'lifestyle',
    name: '生活改善',
    emoji: '✨',
    description: '日々の習慣や自己改善の記録に最適',
    categories: [
      { name: '習慣', emoji: '🔄', color: '#10b981' },
      { name: '趣味', emoji: '🎨', color: '#8b5cf6' },
      { name: '休息', emoji: '😴', color: '#6366f1' },
    ],
    sampleActivities: [
      {
        title: '朝のルーティン',
        category: '習慣',
        durationMinutes: 30,
        mood: 5,
        note: '瞑想とストレッチを実践',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '絵を描く',
        category: '趣味',
        durationMinutes: 60,
        mood: 5,
        note: '新しい作品を完成させました',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '質の良い睡眠',
        category: '休息',
        durationMinutes: 480,
        mood: 4,
        note: '7時間の睡眠を確保',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'language',
    name: '語学学習',
    emoji: '🌍',
    description: '外国語の学習記録に最適',
    categories: [
      { name: '語学', emoji: '🌍', color: '#3b82f6' },
      { name: '会話', emoji: '💬', color: '#10b981' },
      { name: '単語', emoji: '📝', color: '#8b5cf6' },
    ],
    sampleActivities: [
      {
        title: '英語の単語学習',
        category: '単語',
        durationMinutes: 30,
        mood: 4,
        note: '100個の単語を覚えました',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'オンライン英会話',
        category: '会話',
        durationMinutes: 25,
        mood: 5,
        note: 'フリートークで練習',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '文法の復習',
        category: '語学',
        durationMinutes: 45,
        mood: 4,
        note: '時制について理解を深めました',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'music',
    name: '音楽・楽器',
    emoji: '🎵',
    description: '楽器の練習や音楽活動の記録に最適',
    categories: [
      { name: '練習', emoji: '🎸', color: '#ef4444' },
      { name: '作曲', emoji: '🎹', color: '#8b5cf6' },
      { name: '鑑賞', emoji: '🎧', color: '#6366f1' },
    ],
    sampleActivities: [
      {
        title: 'ギター練習',
        category: '練習',
        durationMinutes: 60,
        mood: 5,
        note: '新しいコード進行を練習',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '作曲',
        category: '作曲',
        durationMinutes: 90,
        mood: 5,
        note: '新しいメロディを完成',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '音楽鑑賞',
        category: '鑑賞',
        durationMinutes: 30,
        mood: 4,
        note: '新しいアーティストを発見',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'art',
    name: 'アート・創作',
    emoji: '🎨',
    description: '絵画や創作活動の記録に最適',
    categories: [
      { name: '絵画', emoji: '🖼️', color: '#ef4444' },
      { name: 'デザイン', emoji: '✨', color: '#8b5cf6' },
      { name: '制作', emoji: '🛠️', color: '#6366f1' },
    ],
    sampleActivities: [
      {
        title: 'デッサン練習',
        category: '絵画',
        durationMinutes: 45,
        mood: 4,
        note: '静物デッサンを実施',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: 'ロゴデザイン',
        category: 'デザイン',
        durationMinutes: 120,
        mood: 5,
        note: 'クライアント向けロゴを完成',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        title: '作品制作',
        category: '制作',
        durationMinutes: 90,
        mood: 5,
        note: '新しい作品に着手',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  },
];
