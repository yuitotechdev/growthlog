export interface GroupTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  defaultCategories: string[];
  defaultDescription?: string;
}

export const GROUP_TEMPLATES: GroupTemplate[] = [
  {
    id: 'study',
    name: '勉強会',
    emoji: '📚',
    description: '学習や資格試験のグループ',
    defaultCategories: ['勉強', '読書', '復習'],
    defaultDescription: '一緒に学習を頑張りましょう！',
  },
  {
    id: 'fitness',
    name: 'ダイエット',
    emoji: '💪',
    description: 'トレーニングやダイエットのグループ',
    defaultCategories: ['筋トレ', '有酸素運動', 'ストレッチ'],
    defaultDescription: '一緒に健康な体を目指しましょう！',
  },
  {
    id: 'game',
    name: 'ゲーム練習',
    emoji: '🎮',
    description: 'ゲームの練習や上達を目指すグループ',
    defaultCategories: ['練習', '試合', '復習'],
    defaultDescription: '一緒に上達を目指しましょう！',
  },
  {
    id: 'work',
    name: '仕事',
    emoji: '💼',
    description: '業務やプロジェクトのグループ',
    defaultCategories: ['仕事', '会議', '学習'],
    defaultDescription: 'チームで目標を達成しましょう！',
  },
  {
    id: 'custom',
    name: 'カスタム',
    emoji: '✨',
    description: '自由に設定するグループ',
    defaultCategories: [],
    defaultDescription: '',
  },
];

