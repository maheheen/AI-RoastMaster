
'use client';

import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface RoastDisplayProps {
  roastText: string;
  currentWordIndex: number;
}

export function RoastDisplay({ roastText, currentWordIndex }: RoastDisplayProps) {
  if (!roastText) return null;

  const words = roastText.split(' ');

  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-4xl mx-auto">
      <div className="flex items-center gap-3 rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
        <Bot className="h-6 w-6 text-primary animate-pulse" />
        <p className="text-sm text-primary-foreground/80 font-medium">RoastMaster AI is cooking...</p>
      </div>
      <h2 className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter">
        {words.map((word, index) => (
          <span
            key={index}
            className={cn(
              'transition-all duration-300',
              index === currentWordIndex
                ? 'text-accent scale-110 inline-block'
                : 'text-foreground/80'
            )}
            style={{
              textShadow: index === currentWordIndex ? '0 0 20px hsl(var(--accent) / 0.8)' : 'none'
            }}
          >
            {word}{' '}
          </span>
        ))}
      </h2>
    </div>
  );
}
