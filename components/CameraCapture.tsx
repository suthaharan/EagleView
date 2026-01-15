
import React, { useRef, useEffect, useState } from 'react';
import { ICONS } from '../constants';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[110] flex flex-col">
      <div className="flex justify-between items-center p-6 text-white">
        <h2 className="text-2xl font-bold">Point Camera</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <ICONS.X />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
        {error ? (
          <div className="text-white text-center p-8">
            <p className="text-2xl font-bold mb-4">{error}</p>
            <button onClick={onClose} className="bg-senior-primary px-8 py-4 rounded-2xl text-xl font-bold">Go Back</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-10 flex justify-center bg-black/50 backdrop-blur-md">
        {!error && (
          <button 
            onClick={handleCapture}
            className="w-24 h-24 bg-white rounded-full border-8 border-senior-accent flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            aria-label="Take Photo"
          >
            <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-200" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;