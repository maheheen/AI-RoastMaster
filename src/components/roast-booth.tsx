
'use client';

import { useState, useRef, useEffect, useCallback, useActionState } from 'react';
import { Camera, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getRoast } from '@/app/actions';
import { useSpeechSynthesis, SpeechSynthesisEventWithCharIndex } from '@/hooks/use-speech-synthesis';
import { RoastDisplay } from './roast-display';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Status = 'idle' | 'countdown' | 'capturing' | 'loading' | 'roasting' | 'error' | 'no_permissions';

const initialState = {
  roastText: null,
  error: null,
};

export function RoastBooth() {
  const [status, setStatus] = useState<Status>('idle');
  const [countdown, setCountdown] = useState(3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [roastWords, setRoastWords] = useState<{ word: string; start: number }[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [hasConsented, setHasConsented] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [state, formAction] = useActionState(getRoast, initialState);
  
  const handleSpeechEnd = useCallback(() => {
    setTimeout(() => {
      setStatus('idle');
      setCapturedImage(null);
      setCurrentWordIndex(-1);
      setRoastWords([]);
      // Do not reset consent
    }, 3000);
  }, []);

  const handleBoundary = useCallback((e: SpeechSynthesisEventWithCharIndex) => {
      const roastText = state.roastText || '';
      if (!roastText) return;
      const words = roastText.split(' ').map((word, index, arr) => {
        const start = arr.slice(0, index).join(' ').length + (index > 0 ? 1 : 0);
        return { word, start };
      });

      if (words.length > 0) {
        let wordIndex = -1;
        for(let i = words.length - 1; i >= 0; i--) {
          if (e.charIndex >= words[i].start) {
            wordIndex = i;
            break;
          }
        }
        if (wordIndex !== -1) {
          setCurrentWordIndex(wordIndex);
        }
      }
    },
    [state.roastText]
  );
  
  const { speak, isSupported: isTtsSupported } = useSpeechSynthesis(handleBoundary, handleSpeechEnd);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('no_permissions');
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus('no_permissions');
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state.error) {
      toast({ variant: 'destructive', title: 'Roast Failed', description: state.error });
      setStatus('idle');
      setCapturedImage(null);
    }
    if (state.roastText) {
      setStatus('roasting');
      const words = state.roastText.split(' ');
      let charCount = 0;
      setRoastWords(words.map(word => {
        const start = charCount;
        charCount += word.length + 1;
        return { word, start };
      }));
      setCurrentWordIndex(-1);
      speak(state.roastText);
    }
  }, [state, toast, speak]);

  const startCountdown = () => {
    if (!hasConsented) {
        toast({
            variant: 'destructive',
            title: 'Consent Required',
            description: 'You must agree to the terms before we can roast you.',
        });
        return;
    };
    setStatus('countdown');
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        handleCaptureAndSubmit();
      }
    }, 1000);
  };

  const handleCaptureAndSubmit = () => {
    if (!videoRef.current || !canvasRef.current || !formRef.current) return;
    setStatus('capturing');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUri);
      
      const form = formRef.current;
      const input = form.querySelector('input[name="photoDataUri"]') as HTMLInputElement;
      if (input) {
        input.value = dataUri;
      }
      
      setStatus('loading');
      form.requestSubmit();
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'no_permissions':
        return <div className="text-center p-8 bg-destructive/20 rounded-lg border border-destructive">
          <Camera className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Camera Access Denied</h2>
          <p className="text-destructive-foreground/80">RoastMaster AI needs camera access to see your face. Please enable it in your browser settings.</p>
        </div>

      case 'countdown':
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <span className="text-9xl font-bold text-white animate-ping">{countdown}</span>
        </div>;

      case 'loading':
        return <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-accent" />
            <h2 className="text-3xl font-bold">Analyzing your life choices...</h2>
            <p className="text-foreground/70">Please wait while the AI prepares your roast.</p>
        </div>

      case 'roasting':
         return <RoastDisplay roastText={state.roastText || ''} currentWordIndex={currentWordIndex} />;

      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-headline">RoastMaster AI</h1>
            <p className="max-w-xl text-lg text-foreground/80">
              Ready for a reality check? Stand in front of the camera, strike a pose, and let our AI tell you what it *really* thinks.
            </p>
             {!hasCameraPermission && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access in your browser to use this app. You might need to refresh the page after granting permission.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center space-x-2 my-4 p-4 border border-primary/20 rounded-md bg-background/50">
              <Checkbox id="terms" onCheckedChange={(checked) => setHasConsented(Boolean(checked))} checked={hasConsented} />
              <Label htmlFor="terms" className="text-sm text-foreground/70 font-normal">
                I understand this is all in good fun and promise not to get offended by a robot.
              </Label>
            </div>
            {!isTtsSupported && <p className="text-destructive">Warning: Text-to-Speech is not supported on this browser.</p>}
            <Button size="lg" className="animate-pulse-glow bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold py-8 px-10 rounded-full shadow-lg shadow-accent/20 disabled:opacity-50 disabled:animate-none" onClick={startCountdown} disabled={!hasConsented || !hasCameraPermission}>
              <Zap className="mr-2 h-6 w-6" /> CAPTURE & GET ROASTED
            </Button>
          </div>
        );
    }
  }

  return (
    <div className="relative w-[1280px] h-[720px] max-w-full max-h-[56.25vw] rounded-2xl bg-black shadow-2xl overflow-hidden border-4 border-primary/50 flex items-center justify-center">
      <video ref={videoRef} className={cn("absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100", (status !== 'idle' && status !== 'countdown') && 'opacity-0' )} playsInline muted />
      {capturedImage && <Image src={capturedImage} alt="Captured image for roast" fill className={cn("object-cover transform -scale-x-100", status === 'roasting' ? 'opacity-20 blur-sm' : 'opacity-100')} />}
      
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 p-8">
        {renderContent()}
      </div>
      
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="photoDataUri" />
      </form>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
