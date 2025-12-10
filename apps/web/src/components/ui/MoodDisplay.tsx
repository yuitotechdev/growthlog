'use client';

interface MoodDisplayProps {
  mood: number;
  size?: 'sm' | 'md' | 'lg';
}

const moodEmojis = ['😢', '😐', '🙂', '😊', '😄'];

export function MoodDisplay({ mood, size = 'md' }: MoodDisplayProps) {
  const emoji = moodEmojis[mood - 1] || moodEmojis[2];
  const fontSize = size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.5rem';

  return (
    <span className="mood-display" style={{ fontSize }} title={`気分: ${mood}/5`}>
      {emoji}
    </span>
  );
}



