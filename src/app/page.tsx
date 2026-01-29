import { RoastBooth } from '@/components/roast-booth';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <RoastBooth />
    </main>
  );
}
