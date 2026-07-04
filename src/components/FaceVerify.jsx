import { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { ShieldCheck, X, AlertCircle, Loader2, RefreshCw, CheckCircle, UserX } from 'lucide-react';
import {
  loadModels,
  getFaceDescriptor,
  getDetectionWithLandmarks,
  compareDescriptors,
  arrayToDescriptor,
} from '../utils/faceApi';

export default function FaceVerify({ storedDescriptors, userName, onSuccess, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | scanning | verifying | success | failed | error | no-face
  const [errorMsg, setErrorMsg] = useState('');
  const [faceBox, setFaceBox] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [matchedAdminName, setMatchedAdminName] = useState('');

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
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.play().catch(() => {});
        
        setStatus('scanning');
      }
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
    if (!videoRef.current) return;

    if (videoRef.current.paused && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'scanning' || !videoRef.current) return;

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

          const box = resized.detection.box;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          if (resized.landmarks) {
            faceapi.draw.drawFaceLandmarks(canvas, resized);
          }
        } else {
          setFaceBox(null);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      } catch (e) {
        // 忽略
      }

      if (running) {
        animFrame = requestAnimationFrame(detect);
      }
    };

    const startDetection = () => {
      if (videoRef.current.readyState >= 2) {
        detect();
      } else {
        videoRef.current.addEventListener('loadeddata', () => {
          if (running) detect();
        }, { once: true });
      }
    };

    startDetection();

    return () => {
      running = false;
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [status]);

  const handleVerify = async () => {
    if (!videoRef.current || !storedDescriptors || storedDescriptors.length === 0) return;

    setStatus('verifying');
    setVerifyResult(null);
    setMatchedAdminName('');

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        setStatus('no-face');
        setTimeout(() => setStatus('scanning'), 1500);
        return;
      }

      let bestMatch = null;
      let bestDistance = Infinity;

      for (const storedFace of storedDescriptors) {
        const stored = arrayToDescriptor(storedFace.descriptor);
        const result = compareDescriptors(stored, descriptor);
        
        if (result.match && result.distance < bestDistance) {
          bestDistance = result.distance;
          bestMatch = {
            ...result,
            name: storedFace.name,
          };
        }
      }

      if (bestMatch) {
        setVerifyResult(bestMatch);
        setMatchedAdminName(bestMatch.name);
        setAttempts(prev => prev + 1);
        setStatus('success');
        
        setTimeout(() => {
          onSuccess(bestMatch.name);
        }, 800);
      } else {
        const result = { match: false, distance: bestDistance === Infinity ? 'N/A' : bestDistance };
        setVerifyResult(result);
        setAttempts(prev => prev + 1);
        setStatus('failed');
      }
    } catch (err) {
      console.error('验证失败:', err);
      setErrorMsg('人脸识别失败，请重试');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setVerifyResult(null);
    setMatchedAdminName('');
    setFaceBox(null);
    setErrorMsg('');
    
    if (videoRef.current && videoRef.current.paused && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
    
    setStatus('scanning');
  };

  const getResultStyle = () => {
    if (!verifyResult) return {};
    if (verifyResult.match) {
      return {
        bg: document.documentElement.classList.contains('dark') ? 'bg-green-900/30' : 'bg-green-50',
        border: document.documentElement.classList.contains('dark') ? 'border-green-700' : 'border-green-200',
        text: document.documentElement.classList.contains('dark') ? 'text-green-300' : 'text-green-700',
      };
    }
    return {
      bg: document.documentElement.classList.contains('dark') ? 'bg-red-900/30' : 'bg-red-50',
      border: document.documentElement.classList.contains('dark') ? 'border-red-700' : 'border-red-200',
      text: document.documentElement.classList.contains('dark') ? 'text-red-300' : 'text-red-700',
    };
  };

  const resultStyle = getResultStyle();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 ${document.documentElement.classList.contains('dark') ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status === 'success' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'}`}>
                人脸身份验证
              </h3>
              <p className={`text-xs ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
                {userName ? `确认 ${userName} 本人操作` : '请正对摄像头进行人脸验证'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-1.5 rounded-lg transition-colors ${
              document.documentElement.classList.contains('dark')
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${document.documentElement.classList.contains('dark') ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className={`text-sm ${document.documentElement.classList.contains('dark') ? 'text-red-300' : 'text-red-600'}`}>{errorMsg}</p>
          </div>
        )}

        {verifyResult && (
          <div className={`mb-4 p-4 rounded-xl border ${resultStyle.bg} ${resultStyle.border} flex items-center gap-3`}>
            {verifyResult.match ? (
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            ) : (
              <UserX className="w-6 h-6 text-red-500 shrink-0" />
            )}
            <div>
              <p className={`font-semibold ${resultStyle.text}`}>
                {verifyResult.match ? '验证通过' : '验证失败'}
              </p>
              {verifyResult.match && matchedAdminName && (
                <p className={`text-sm mt-1 ${resultStyle.text} opacity-90`}>
                  欢迎您，{matchedAdminName}
                </p>
              )}
              <p className={`text-xs mt-0.5 ${resultStyle.text} opacity-80`}>
                {verifyResult.match
                  ? '人脸匹配成功，即将进入系统...'
                  : `未匹配到人脸，请重试（距离: ${verifyResult.distance}）`}
              </p>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <div className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
            status === 'success' ? 'border-green-400' :
            status === 'failed' ? 'border-red-400' :
            status === 'no-face' ? 'border-yellow-400' :
            faceBox ? 'border-blue-400' :
            'border-gray-300 dark:border-gray-600'
          }`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full aspect-[4/3] object-cover ${
                status === 'loading' || status === 'verifying' || status === 'success'
                  ? 'opacity-0 absolute inset-0'
                  : 'opacity-100'
              }`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full ${
                status === 'loading' || status === 'verifying' || status === 'success'
                  ? 'opacity-0'
                  : 'opacity-100'
              }`}
            />

            {status === 'loading' && (
              <div className={`aspect-[4/3] flex flex-col items-center justify-center ${document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className={`text-sm ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
                  正在启动人脸识别...
                </p>
              </div>
            )}

            {status === 'verifying' && (
              <div className={`aspect-[4/3] flex flex-col items-center justify-center ${document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                <p className={`font-medium ${document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'}`}>
                  正在验证身份...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className={`aspect-[4/3] flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20`}>
                <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
                <p className={`text-lg font-bold ${document.documentElement.classList.contains('dark') ? 'text-green-300' : 'text-green-700'}`}>
                  验证通过
                </p>
                {matchedAdminName && (
                  <p className={`text-sm mt-1 ${document.documentElement.classList.contains('dark') ? 'text-green-400' : 'text-green-600'}`}>
                    欢迎您，{matchedAdminName}
                  </p>
                )}
              </div>
            )}

            {status === 'no-face' && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                未检测到人脸
              </div>
            )}
            {status === 'scanning' && faceBox && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                已检测到人脸 · 点击验证
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {status === 'scanning' && (
            <button
              onClick={handleVerify}
              className="flex-1 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              开始人脸验证
            </button>
          )}

          {status === 'failed' && (
            <>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新验证
              </button>
            </>
          )}

          {status !== 'success' && (
            <button
              onClick={onCancel}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                document.documentElement.classList.contains('dark')
                  ? 'text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              取消
            </button>
          )}
        </div>

        {attempts > 1 && status === 'failed' && (
          <p className={`text-xs text-center mt-3 ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>
            已尝试 {attempts} 次，请调整光线或角度后重试
          </p>
        )}
      </div>
    </div>
  );
}
