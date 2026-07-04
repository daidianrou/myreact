import { useState } from 'react';
import { User, Plus, Trash2, Edit2, CheckCircle, Circle, X, Camera, AlertCircle } from 'lucide-react';
import FaceCapture from './FaceCapture';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const ADMIN_FACES_KEY = 'admin_faces';

export default function AdminFaceManager({ isDark }) {
  const [faces, setFaces] = useRealtimeSync(ADMIN_FACES_KEY, []);
  const [showCapture, setShowCapture] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFaceId, setDeletingFaceId] = useState(null);

  const handleCaptureComplete = (data) => {
    if (data.descriptors && data.descriptors.length > 0) {
      const newFace = {
        id: Date.now(),
        name: editingName.trim() || `管理员 ${faces.length + 1}`,
        descriptor: data.descriptors[0],
        image: data.image,
        createdAt: new Date().toISOString(),
      };
      
      if (editingId) {
        setFaces(prev => prev.map(f => f.id === editingId ? newFace : f));
      } else {
        setFaces(prev => [...prev, newFace]);
      }
    }
    setShowCapture(false);
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  const handleDelete = (id) => {
    setDeletingFaceId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setFaces(prev => prev.filter(f => f.id !== deletingFaceId));
    setShowDeleteConfirm(false);
    setDeletingFaceId(null);
  };

  const handleStartEdit = (face) => {
    setEditingId(face.id);
    setEditingName(face.name);
    setShowCapture(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingName('');
    setShowCapture(true);
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-4xl mx-auto ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-600' : 'bg-indigo-100'}`}>
              <User className={`w-6 h-6 ${isDark ? 'text-white' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">管理员人脸管理</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                管理可用于登录验证的管理员人脸信息
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            添加人脸
          </button>
        </div>

        {/* 说明提示 */}
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className="font-medium mb-1">使用说明</p>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• 添加的人脸将用于管理员登录时的身份验证</li>
                <li>• 每个人脸需要设置一个姓名备注，方便识别</li>
                <li>• 登录时系统会自动匹配并显示对应的管理员姓名</li>
                <li>• 建议每个管理员录入2-3张不同角度的人脸以提高识别率</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 人脸列表 */}
        {faces.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <User className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>暂无管理员人脸</p>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击上方按钮添加第一个人脸</p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              添加人脸
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faces.map(face => (
              <div key={face.id} className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {face.image ? (
                    <img src={face.image} alt={face.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-white/50" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleStartEdit(face)}
                      className={`p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors cursor-pointer`}
                      title="编辑人脸"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(face.id)}
                      className={`p-2 rounded-lg bg-black/50 hover:bg-red-500/80 transition-colors cursor-pointer`}
                      title="删除人脸"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/20 text-white' : 'bg-black/50 text-white'}`}>
                      {new Date(face.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className="font-medium">{face.name}</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    人脸ID: #{String(face.id).slice(-6)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {faces.length > 0 && (
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 <strong>{faces.length}</strong> 个人脸记录
                </span>
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                最后更新: {new Date().toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 人脸采集弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-80 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">确认删除人脸</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                确定要删除这个人脸记录吗？删除后无法恢复。
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingFaceId(null);
                }}
                className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showCapture && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" onClick={() => setShowCapture(false)}>
          <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingId ? '重新录入人脸' : '添加管理员人脸'}
              </h3>
              <button onClick={() => setShowCapture(false)} className={`p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            {!editingId && (
              <div className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} shrink-0`}>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  管理员姓名备注
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  placeholder="请输入管理员姓名"
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4">
              <FaceCapture
                onComplete={handleCaptureComplete}
                onSkip={() => { setShowCapture(false); setEditingId(null); setEditingName(''); }}
                existingFace={editingId ? '有' : '无'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}