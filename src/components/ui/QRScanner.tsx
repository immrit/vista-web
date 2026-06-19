'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface QRScannerProps {
  onClose: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'requesting' | 'scanning' | 'error'>('requesting');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const processQRResult = useCallback((data: string) => {
    // Vista profile link: cafevista.ir/profile/username or vista://profile/username
    const profileMatch = data.match(/(?:cafevista\.ir\/profile\/|vista:\/\/profile\/)([^/?&]+)/);
    if (profileMatch) {
      router.push(`/profile/${profileMatch[1]}`);
      onClose();
      return;
    }

    // Group invite: cafevista.ir/group/code or vista://group/code
    const groupMatch = data.match(/(?:cafevista\.ir\/group\/|vista:\/\/group\/)([^/?&]+)/);
    if (groupMatch) {
      router.push(`/group/${groupMatch[1]}`);
      onClose();
      return;
    }

    // Post link: cafevista.ir/post/id
    const postMatch = data.match(/cafevista\.ir\/post\/([^/?&]+)/);
    if (postMatch) {
      router.push(`/post/${postMatch[1]}`);
      onClose();
      return;
    }

    toast.info(`QR خوانده شد: ${data.slice(0, 50)}`);
  }, [router, onClose]);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('scanning');

        const jsQR = (await import('jsqr')).default;

        const scan = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrameRef.current = requestAnimationFrame(scan);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            processQRResult(code.data);
            return;
          }
          animFrameRef.current = requestAnimationFrame(scan);
        };
        scan();
      }
    } catch {
      setStatus('error');
      setError('دسترسی به دوربین رد شد');
    }
  }, [processQRResult]);

  useEffect(() => {
    startScanning();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [startScanning]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 absolute top-0 inset-x-0 z-10">
        <h2 className="text-white font-bold text-lg">اسکن QR</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {status === 'requesting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <p className="text-white">در حال دسترسی به دوربین...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
          <AlertCircle className="w-12 h-12 text-vista-error" />
          <p className="text-white font-medium">{error}</p>
          <p className="text-white/60 text-sm">لطفاً از تنظیمات مرورگر دسترسی دوربین را مجاز کنید</p>
        </div>
      )}

      {status === 'scanning' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 relative">
            <div className="absolute inset-0 border-2 border-white/30 rounded-2xl" />
            {/* Corner guides */}
            {[
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
            ))}
            {/* Scan line */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-vista-primary/80 animate-pulse" />
          </div>
        </div>
      )}

      <p className="absolute bottom-12 inset-x-0 text-center text-white/70 text-sm px-4">
        کد QR پروفایل یا گروه ویستا را اسکن کنید
      </p>
    </div>
  );
}
