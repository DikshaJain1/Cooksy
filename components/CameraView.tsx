
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onBack: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      }
    };
    enableCamera();

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
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white text-center p-4 bg-red-500 rounded-md">
          <p>{error}</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-white text-black rounded">Go Back</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-around items-center">
            <button onClick={onBack} className="px-6 py-3 text-lg font-semibold text-black bg-gray-200 rounded-full">Back</button>
            <button onClick={handleCapture} className="px-8 py-4 text-xl font-bold text-white bg-primary rounded-full border-4 border-white">Capture</button>
            <div className="w-24"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;
