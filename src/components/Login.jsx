import { useState } from 'react';
import { Eye, EyeOff, Home, Mail, Lock, User, Shield, Camera } from 'lucide-react';

export default function Login({ onLogin, onGoToRegister, users, onFaceLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('user');
  const [loginMode, setLoginMode] = useState('password');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请填写用户名和密码');
      return;
    }

    if (userType === 'admin') {
      if (email === 'admin@example.com' && password === '123456') {
        setError('');
        onLogin({ email, name: '管理员', role: 'admin', id: 0 });
      } else {
        setError('管理员账号或密码错误');
      }
    } else {
      const user = users.find(u => u.email === email && u.password === password && u.role !== 'admin');
      if (user) {
        if (user.status === 'inactive') {
          setError('该账号已被管理员禁用，请联系管理员');
          return;
        }
        setError('');
        onLogin(user);
      } else {
        setError('用户账号或密码错误');
      }
    }
  };

  const handleFaceLogin = () => {
    if (onFaceLogin) {
      onFaceLogin();
    }
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
            }`}>自习室管理系统</h1>
            <p className={`text-sm ${
              document.documentElement.classList.contains('dark') 
                ? 'text-gray-400' 
                : 'text-gray-500'
            }`}>欢迎回来，请登录您的账户</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setUserType('user'); setLoginMode('password'); }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                userType === 'user' && loginMode === 'password'
                  ? 'bg-blue-500 text-white' 
                  : document.documentElement.classList.contains('dark') 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              用户登录
            </button>
            <button
              type="button"
              onClick={() => { setUserType('admin'); setLoginMode('password'); }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                userType === 'admin' && loginMode === 'password'
                  ? 'bg-blue-500 text-white' 
                  : document.documentElement.classList.contains('dark') 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              管理员登录
            </button>
          </div>

          {userType === 'admin' && (
            <div className="mb-6">
              <button
                onClick={() => setLoginMode(loginMode === 'password' ? 'face' : 'password')}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  loginMode === 'face'
                    ? 'bg-green-500 text-white' 
                    : document.documentElement.classList.contains('dark') 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                {loginMode === 'face' ? '切换为密码登录' : '人脸登录'}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {userType === 'admin' && loginMode === 'face' ? (
            <div className={`p-6 rounded-lg text-center ${
              document.documentElement.classList.contains('dark') 
                ? 'bg-green-900/30 border border-green-700' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <Camera className={`w-12 h-12 mx-auto mb-4 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-green-400' 
                  : 'text-green-600'
              }`} />
              <h3 className={`font-semibold mb-2 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-white' 
                  : 'text-gray-800'
              }`}>管理员人脸登录</h3>
              <p className={`text-sm mb-4 ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-gray-400' 
                  : 'text-gray-600'
              }`}>点击下方按钮，使用已录入的人脸信息进行身份验证</p>
              <button
                onClick={handleFaceLogin}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                开始人脸验证
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="请输入密码"
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

              <button
                type="submit"
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                登录
              </button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {userType === 'user' && (
              <button
                onClick={onGoToRegister}
                className={`text-sm ${
                  document.documentElement.classList.contains('dark') 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                } transition-colors`}
              >
                没有账户？立即注册
              </button>
            )}
            <p className={`text-sm ${
              document.documentElement.classList.contains('dark') 
                ? 'text-gray-400' 
                : 'text-gray-500'
            }`}>
              {userType === 'admin' 
                ? loginMode === 'face' 
                  ? '已录入的管理员人脸可直接验证登录' 
                  : '管理员: admin@example.com / 123456' 
                : '测试用户可使用注册功能创建账户'}
            </p>
            
            <div className={`mt-4 p-3 rounded-lg ${
              document.documentElement.classList.contains('dark') 
                ? 'bg-blue-900/30 border border-blue-700' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-xs ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-blue-300' 
                  : 'text-blue-600'
              }`}>
                💡 提示：您的注册信息和预约数据存储在当前浏览器中。换浏览器后需要重新注册或使用管理员账户登录。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
