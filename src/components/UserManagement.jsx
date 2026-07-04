import { useState } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Phone, User, X, Edit2, Trash2, Eye, AlertCircle, CheckCircle, Lock, MessageSquare, Check, Ban, Unlock, Download } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

const statusLabels = {
  active: '活跃',
  inactive: '禁用',
};

export default function UserManagement({ isDark, users, setUsers, reservations, setReservations, notifications, setNotifications }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '123456',
    remark: '',
  });

  const [quickEditRemark, setQuickEditRemark] = useState(null);
  const [quickRemarkValue, setQuickRemarkValue] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.remark || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddUser = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      showToastMessage('请填写完整信息', 'error');
      return;
    }

    const maxId = users.reduce((m, u) => Math.max(m, u.id), 0);
    const newUser = {
      id: maxId + 1,
      ...formData,
      status: 'active',
      role: 'user',
    };

    setUsers([...users, newUser]);
    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', password: '123456', remark: '' });
    showToastMessage('用户添加成功！');
  };

  const handleEditUser = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      showToastMessage('请填写完整信息', 'error');
      return;
    }

    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', password: '123456', remark: '' });
    showToastMessage('用户信息更新成功！');
  };

  const handleDeleteUser = () => {
    const deletedUser = users.find(u => u.id === userToDelete);
    
    if (deletedUser) {
      const userReservations = reservations ? reservations.filter(r => r.userId === deletedUser.id) : [];
      const userNotifications = notifications ? notifications.filter(n => n.userId === deletedUser.id) : [];
      
      const exportData = {
        user: deletedUser,
        reservations: userReservations,
        notifications: userNotifications,
        exportDate: new Date().toISOString(),
        exportedBy: '管理员',
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `用户数据_${deletedUser.name}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      if (setReservations) {
        setReservations(reservations.filter(r => r.userId !== deletedUser.id));
      }
      
      if (setNotifications) {
        setNotifications(notifications.filter(n => 
          n.userId !== deletedUser.id && 
          n.userId !== String(deletedUser.id) &&
          n.userId !== `user_${deletedUser.id}`
        ));
      }
    }
    
    setUsers(users.filter(u => u.id !== userToDelete));
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setUserToDelete(null);
    showToastMessage('用户已删除，数据已导出！');
  };

  const handleSaveQuickRemark = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, remark: quickRemarkValue } : u));
    setQuickEditRemark(null);
    showToastMessage('备注已更新');
  };

  const startQuickEdit = (user) => {
    setQuickEditRemark(user.id);
    setQuickRemarkValue(user.remark || '');
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    showToastMessage(newStatus === 'active' ? `${user.name} 已启用` : `${user.name} 已禁用`);
  };

  const confirmDelete = (userId) => {
    setUserToDelete(userId);
    setShowConfirmModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      remark: user.remark || '',
    });
    setShowAddModal(true);
  };

  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <div className="p-6 relative">
      {showToast.show && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          showToast.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {showToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {showToast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>用户管理</h1>
        <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', phone: '', password: '123456' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            添加用户
          </button>
      </div>

      <div className={`relative mb-6 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="搜索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>用户</th>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  邮箱
                </div>
              </th>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  电话
                </div>
              </th>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  密码
                </div>
              </th>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  备注
                </div>
              </th>
              <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>状态</th>
              <th className={`px-6 py-4 text-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden text-xl">
                      {user.avatar ? (
                        user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.avatar
                        )
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        用户 ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user.email}
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user.phone}
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="font-mono text-sm">{user.password}</div>
                </td>
                <td className="px-6 py-4">
                  {quickEditRemark === user.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={quickRemarkValue}
                        onChange={(e) => setQuickRemarkValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveQuickRemark(user.id); if (e.key === 'Escape') setQuickEditRemark(null); }}
                        placeholder="例如：VIP"
                        autoFocus
                        className={`w-28 px-2 py-1 text-sm rounded border ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <button onClick={() => handleSaveQuickRemark(user.id)} className="p-1 rounded text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 cursor-pointer" title="保存">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setQuickEditRemark(null)} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer" title="取消">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startQuickEdit(user)}
                      className={`group flex items-center gap-2 px-2.5 py-1 rounded text-sm cursor-pointer ${
                        user.remark
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                          : `${isDark ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`
                      }`}
                      title="点击编辑备注"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px]">{user.remark || '无备注'}</span>
                    </button>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`group flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                    title={user.status === 'active' ? '点击禁用该用户' : '点击启用该用户'}
                  >
                    {user.status === 'active' ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {statusLabels[user.status]}
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetail(user)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      title="查看详情"
                    >
                      <Eye className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      title="编辑"
                    >
                      <Edit2 className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    <button
                      onClick={() => confirmDelete(user.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{editingUser ? '编辑用户' : '添加用户'}</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', phone: '' });
              }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="请输入邮箱"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="请输入电话"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>密码</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="请输入密码"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>备注</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="例如：VIP、勤奋用户等"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', phone: '', password: '123456' });
                  }}
                  className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                >
                  取消
                </button>
                <button
                  onClick={editingUser ? handleEditUser : handleAddUser}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  {editingUser ? '保存修改' : '添加用户'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">用户详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">{selectedUser.name}</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>用户 ID: {selectedUser.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>邮箱</span>
                <span>{selectedUser.email}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>电话</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>密码</span>
                <span className="font-mono">{selectedUser.password}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>状态</span>
                <span className={`px-2 py-1 rounded-full text-sm ${statusColors[selectedUser.status]}`}>
                  {statusLabels[selectedUser.status]}
                </span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  <MessageSquare className="w-4 h-4 inline mr-1" />备注
                </span>
                <span className={selectedUser.remark ? '' : `${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                  {selectedUser.remark || '暂无备注'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  selectedUser.status === 'active'
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {selectedUser.status === 'active' ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {selectedUser.status === 'active' ? '禁用' : '启用'}
              </button>
              <button
                onClick={() => {
                  handleOpenEdit(selectedUser);
                  setShowDetailModal(false);
                }}
                className={`flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => confirmDelete(selectedUser.id)}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-80 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">确认删除</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>确定要删除该用户吗？此操作不可撤销。</p>
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-center justify-center gap-2 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                <Download className="w-4 h-4" />
                删除时将自动导出该用户的数据
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setUserToDelete(null);
                }}
                className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
              >
                取消
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
