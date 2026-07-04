import { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { loadModels, getFaceDescriptor, getDetectionWithLandmarks, descriptorToArray } from '../utils/faceApi';

export default function FaceCapture({ onCapture, onSkip, onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('loading');
  const [capturedImage, setCapturedImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const [descriptors, setDescriptors] = useState([]);
  const [faceBox, setFaceBox] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMsg('');

      await loadModels();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setStatus('ready');
    } catch (err) {
      console.error('摄像头启动失败:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('未检测到摄像头设备');
      } else if (err.message && err.message.includes('模型')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('摄像头启动失败: ' + (err.message || '未知错误'));
      }
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (status !== 'ready' || !videoRef.current) return;

    let running = true;
    let animFrame;

    const detect = async () => {
      if (!running || !videoRef.current) return;

      try {
        const detection = await getDetectionWithLandmarks(videoRef.current);
        if (detection && canvasRef.current) {
          setFaceBox(detection.box);
          const canvas = canvasRef.current;
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };
          faceapi.matchDimensions(canvas, displaySize);
          const resized = faceapi.resizeResults(detection, displaySize);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resized);
        } else {
          setFaceBox(null);
        }
      } catch (e) {
        // 静默忽略检测错误
      }

      if (running) {
        animFrame = requestAnimationFrame(detect);
      }
    };

    const onPlay = () => {
      detect();
    };

    const video = videoRef.current;
    video.addEventListener('play', onPlay);
    if (video.readyState >= 2) {
      detect();
    }

    return () => {
      running = false;
      video.removeEventListener('play', onPlay);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [status]);

  const handleContinueCapture = () => {
    setCapturedImage(null);
    setTimeout(() => {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
        if (!videoRef.current.srcObject && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      }
    }, 50);
  };

  const handleCapture = async () => {
    if (!videoRef.current || status !== 'ready') return;

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        setStatus('no-face');
        setTimeout(() => setStatus('ready'), 1500);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const newDescriptors = [...descriptors, descriptorToArray(descriptor)];
      setDescriptors(newDescriptors);
      setCapturedImage(imageData);
      setCaptureCount(newDescriptors.length);
    } catch (err) {
      console.error('拍照失败:', err);
      setErrorMsg('人脸检测失败，请重试');
    }
  };

  const handleConfirm = () => {
    if (descriptors.length === 0) return;

    const avgDescriptor = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      descriptors.forEach(d => { sum += d[i]; });
      avgDescriptor[i] = sum / descriptors.length;
    }

    const result = {
      descriptor: descriptorToArray(avgDescriptor),
      descriptors: descriptors,
      image: capturedImage,
    };

    if (onCapture) {
      onCapture(result);
    }
    if (onComplete) {
      onComplete(result);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDescriptors([]);
    setCaptureCount(0);
  };

  return (
    <div className="w-full">
      {/* 头部 */}
      <div className="text-center mb-4">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          <Camera className="w-6 h-6 text-white" />
        </div>
        <h2 className={`text-lg font-bold mb-1 ${document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'}`}>
          人脸信息采集
        </h2>
        <p className={`text-sm ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
          请拍摄 2~3 张正面照片用于身份验证
        </p>
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* 摄像头区域 */}
      <div className="relative mb-4">
        <div className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
          capturedImage ? 'border-green-400' :
          faceBox ? 'border-blue-400' :
          status === 'no-face' ? 'border-yellow-400' :
          'border-gray-300 dark:border-gray-600'
        }`}>
          {status === 'loading' && (
            <div className={`aspect-[4/3] flex flex-col items-center justify-center ${document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className={`text-sm ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
                正在加载人脸识别模型...
              </p>
            </div>
          )}

          {capturedImage && (
            <div className="relative aspect-[4/3]">
              <img src={capturedImage} alt="已拍摄" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  已拍摄 {captureCount} 张
                </div>
              </div>
            </div>
          )}

          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
            </>
          )}

          {/* 人脸检测提示 */}
          {status === 'no-face' && !capturedImage && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              未检测到人脸
            </div>
          )}

          {status === 'ready' && !capturedImage && faceBox && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs font-medium">
              已检测到人脸
            </div>
          )}
        </div>
      </div>

      {/* 进度提示 */}
      {!capturedImage && status === 'ready' && (
        <div className="mb-4 flex justify-center">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < captureCount ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
            <span className={`text-xs ml-1 ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
              建议 2~3 张
            </span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <>
            <button
              onClick={handleCapture}
              disabled={status !== 'ready'}
              className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                status === 'ready'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              <Camera className="w-4 h-4" />
              拍照 ({captureCount}/3)
            </button>
            <button
              onClick={onSkip}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                document.documentElement.classList.contains('dark')
                  ? 'text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              跳过
            </button>
          </>
        ) : (
          <>
            {captureCount < 3 && (
              <button
                onClick={handleContinueCapture}
                className="flex-1 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                继续拍摄 ({captureCount}/3)
              </button>
            )}
            {captureCount >= 1 && (
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认完成
              </button>
            )}
            <button
              onClick={handleRetake}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                document.documentElement.classList.contains('dark')
                  ? 'text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              重拍
            </button>
          </>
        )}
      </div>

      {/* 说明 */}
      <div className={`mt-4 p-3 rounded-lg ${
        document.documentElement.classList.contains('dark')
          ? 'bg-blue-900/20 border border-blue-800'
          : 'bg-blue-50 border border-blue-100'
      }`}>
        <p className={`text-xs ${document.documentElement.classList.contains('dark') ? 'text-blue-300' : 'text-blue-600'}`}>
          💡 请保持正面朝向摄像头，确保光线充足
        </p>
      </div>
    </div>
  );
}
