import { useState } from 'react';
import { Eye, EyeOff, Home, Mail, Lock, User, ArrowLeft, Shield, X } from 'lucide-react';
import FaceCapture from './FaceCapture';

export default function Register({ onRegister, onBackToLogin, users }) {
  const [step, setStep] = useState('form'); // form | face
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写完整信息');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (users) {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        setError('该邮箱已被注册！');
        return;
      }
    }

    setError('');
    setStep('face');
  };

  const handleFaceCapture = (faceData) => {
    // 注册并携带人脸数据
    onRegister({ 
      name, 
      email, 
      password,
      faceDescriptor: faceData.descriptor,
      faceImage: faceData.image,
    });
  };

  const handleSkipFace = () => {
    // 跳过人脸采集，正常注册
    onRegister({ name, email, password });
  };

  const handleCancelFace = () => {
    setStep('form');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className={`rounded-2xl shadow-xl p-8 ${
          document.documentElement.classList.contains('dark') 
            ? 'bg-gray-800' 
            : 'bg-white'
        }`}>
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 ${
              document.documentElement.classList.contains('dark') 
                ? 'bg-blue-600' 
                : 'bg-blue-500'
            }`}>
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${
              document.documentElement.classList.contains('dark') 
                ? 'text-white' 
                : 'text-gray-800'
            }`}>注册新账户</h1>
            <p className={`text-sm ${
              document.documentElement.classList.contains('dark') 
                ? 'text-gray-400' 
                : 'text-gray-500'
            }`}>创建您的自习室管理系统账户</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                姓名
              </label>
              <div className={`relative ${
                document.documentElement.classList.contains('dark') 
                  ? 'bg-gray-700' 
                  : 'bg-gray-50'
              } rounded-lg border ${
                document.documentElement.classList.contains('dark') 
                  ? 'border-gray-600' 
                  : 'border-gray-300'
              } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors`}>
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  document.documentElement.classList.contains('dark') 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  className={`w-full pl-10 pr-4 py-3 bg-transparent outline-none ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-white placeholder-gray-400' 
                      : 'text-gray-700 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                邮箱地址
              </label>
              <div className={`relative ${
                document.documentElement.classList.contains('dark') 
                  ? 'bg-gray-700' 
                  : 'bg-gray-50'
              } rounded-lg border ${
                document.documentElement.classList.contains('dark') 
                  ? 'border-gray-600' 
                  : 'border-gray-300'
              } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors`}>
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  document.documentElement.classList.contains('dark') 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  className={`w-full pl-10 pr-4 py-3 bg-transparent outline-none ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-white placeholder-gray-400' 
                      : 'text-gray-700 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                密码
              </label>
              <div className={`relative ${
                document.documentElement.classList.contains('dark') 
                  ? 'bg-gray-700' 
                  : 'bg-gray-50'
              } rounded-lg border ${
                document.documentElement.classList.contains('dark') 
                  ? 'border-gray-600' 
                  : 'border-gray-300'
              } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors`}>
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  document.documentElement.classList.contains('dark') 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  className={`w-full pl-10 pr-12 py-3 bg-transparent outline-none ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-white placeholder-gray-400' 
                      : 'text-gray-700 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                确认密码
              </label>
              <div className={`relative ${
                document.documentElement.classList.contains('dark') 
                  ? 'bg-gray-700' 
                  : 'bg-gray-50'
              } rounded-lg border ${
                document.documentElement.classList.contains('dark') 
                  ? 'border-gray-600' 
                  : 'border-gray-300'
              } focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors`}>
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  document.documentElement.classList.contains('dark') 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className={`w-full pl-10 pr-12 py-3 bg-transparent outline-none ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-white placeholder-gray-400' 
                      : 'text-gray-700 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    document.documentElement.classList.contains('dark') 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              下一步：人脸采集
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className={`flex items-center justify-center gap-2 text-sm ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              已有账户？返回登录
            </button>
          </div>
        </div>

        {/* 人脸采集弹窗 */}
        {step === 'face' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden ${document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'}`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${document.documentElement.classList.contains('dark') ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${document.documentElement.classList.contains('dark') ? 'bg-blue-600' : 'bg-blue-500'}`}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">人脸信息采集</h3>
                    <p className={`text-xs ${document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'}`}>确认本人操作</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelFace}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <FaceCapture
                  onCapture={handleFaceCapture}
                  onSkip={handleSkipFace}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
