import { useState, useEffect, useRef } from 'react';
import { Save, Bell, ShieldCheck, Palette, Database, Download, Upload, CheckCircle, Building2, Plus, Edit2, Trash2, X, MessageSquareText, Send, Filter, User as UserIcon, Clock, CheckCheck, AlertTriangle, Lightbulb, HelpCircle } from 'lucide-react';

const categoryConfig = {
  general: { label: '一般咨询', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: HelpCircle },
  bug:     { label: 'Bug 反馈',  color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
  feature: { label: '功能建议',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Lightbulb },
  complaint:{ label: '投诉建议', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: MessageSquareText },
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Settings({
  isDark, setIsDark, currentUser, exportAllData, importAllData, rooms, setRooms, isAdmin,
  feedbacks, setFeedbacks, addNotification, users,
  jumpTarget, setJumpTarget,
}) {
  const [activeSection, setActiveSection] = useState(isAdmin ? 'rooms' : 'feedbacks');
  const [highlightFeedbackId, setHighlightFeedbackId] = useState(null);

  useEffect(() => {
    if (!jumpTarget) return;
    if (jumpTarget.page === 'settings' && jumpTarget.section) {
      setActiveSection(jumpTarget.section);
    }
    if (jumpTarget.feedbackId) {
      setHighlightFeedbackId(jumpTarget.feedbackId);
      if (jumpTarget.autoOpenReply) {
        const fb = feedbacks.find(f => f.id === jumpTarget.feedbackId);
        if (fb) {
          setTimeout(() => openReplyModal(fb), 120);
        }
      }
    }
    const timer = setTimeout(() => setJumpTarget(null), 500);
    return () => clearTimeout(timer);
  }, [jumpTarget, setJumpTarget, feedbacks]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', seatCount: 25 });
  const [roomToast, setRoomToast] = useState({ show: false, message: '', type: 'success' });
  const [notifications, setNotifications] = useState({
    enabled: true,
    email: true,
    push: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30,
  });

  const [appearance, setAppearance] = useState({
    theme: isDark ? 'dark' : 'light',
    fontSize: 'medium',
    compactLayout: false,
  });

  const [database, setDatabase] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
  });

  useEffect(() => {
    const savedAppearance = localStorage.getItem('appearance');
    if (savedAppearance) {
      const parsed = JSON.parse(savedAppearance);
      setAppearance(parsed);
      if (parsed.theme === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else if (parsed.theme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else if (parsed.theme === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemDark);
        if (systemDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      if (parsed.fontSize) {
        setFontSize(parsed.fontSize);
      }
      
      if (parsed.compactLayout) {
        document.body.classList.add('compact-layout');
      } else {
        document.body.classList.remove('compact-layout');
      }
    }
  }, [setIsDark]);

  const setFontSize = (size) => {
    const sizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem',
    };
    document.documentElement.style.fontSize = sizes[size] || '1rem';
  };

  const handleAppearanceChange = (key, value) => {
    const newAppearance = { ...appearance, [key]: value };
    setAppearance(newAppearance);
    
    if (key === 'theme') {
      if (value === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else if (value === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else if (value === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemDark);
        if (systemDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else if (key === 'fontSize') {
      setFontSize(value);
    } else if (key === 'compactLayout') {
      if (value) {
        document.body.classList.add('compact-layout');
      } else {
        document.body.classList.remove('compact-layout');
      }
    }
    
    localStorage.setItem('appearance', JSON.stringify(newAppearance));
  };

  const handleDatabaseChange = (key, value) => {
    setDatabase((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSecurityChange = (key, value) => {
    setSecurity((prev) => ({ ...prev, [key]: value }));
  };

  const sections = [
    ...(isAdmin ? [{ id: 'rooms', title: '房间管理', icon: Building2 }] : []),
    { id: 'feedbacks', title: '留言反馈', icon: MessageSquareText },
    { id: 'notifications', title: '通知设置', icon: Bell },
    { id: 'security', title: '安全设置', icon: ShieldCheck },
    { id: 'appearance', title: '外观设置', icon: Palette },
    { id: 'database', title: '数据管理', icon: Database },
  ];

  const [feedbackForm, setFeedbackForm] = useState({ category: 'general', title: '', content: '' });
  const [replyInputs, setReplyInputs] = useState({});
  const [feedbackToast, setFeedbackToast] = useState({ show: false, message: '', type: 'success' });
  const [replyFilters, setReplyFilters] = useState({ category: 'all', status: 'all' });

  const showFeedbackToast = (message, type = 'success') => {
    setFeedbackToast({ show: true, message, type });
    setTimeout(() => setFeedbackToast({ show: false, message: '', type: 'success' }), 2500);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackForm.title.trim()) {
      showFeedbackToast('请填写留言标题', 'error');
      return;
    }
    if (!feedbackForm.content.trim()) {
      showFeedbackToast('请填写留言内容', 'error');
      return;
    }
    const userName = currentUser?.name || '用户';
    const userEmail = currentUser?.email || '';
    const newFeedback = {
      id: Date.now(),
      userId: currentUser?.id || 0,
      userName,
      userEmail,
      category: feedbackForm.category,
      title: feedbackForm.title.trim(),
      content: feedbackForm.content.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      reply: null,
    };
    setFeedbacks([newFeedback, ...feedbacks]);
    setFeedbackForm({ category: 'general', title: '', content: '' });
    showFeedbackToast('留言已发送，管理员会尽快回复');

    addNotification({
      title: '收到新留言',
      message: `${userName} 提交了一条【${categoryConfig[newFeedback.category].label}】：${newFeedback.title}`,
      isAllUsers: false,
      userId: null,
      forAdmin: true,
      meta: { type: 'new_feedback', feedbackId: newFeedback.id },
    });
  };

  const handleAdminReply = (fbId) => {
    const reply = (replyInputs[fbId] || '').trim();
    if (!reply) {
      showFeedbackToast('请填写回复内容', 'error');
      return;
    }
    setFeedbacks(feedbacks.map(fb => {
      if (fb.id !== fbId) return fb;
      return {
        ...fb,
        status: 'replied',
        reply: {
          content: reply,
          createdAt: new Date().toISOString(),
          by: '管理员',
        },
      };
    }));
    setReplyInputs({ ...replyInputs, [fbId]: '' });
    showFeedbackToast('回复已发送');

    const fb = feedbacks.find(f => f.id === fbId);
    if (fb) {
      addNotification({
        title: '管理员已回复您的留言',
        message: `您关于【${fb.title}】的留言已收到管理员回复，点击此通知即可查看`,
        isAllUsers: false,
        userId: fb.userId,
        meta: { type: 'feedback_replied', feedbackId: fb.id },
      });
    }
  };

  const [feedbackConfirm, setFeedbackConfirm] = useState(null);
  const [replyModal, setReplyModal] = useState(null);

  useEffect(() => {
    if (!highlightFeedbackId) return;
    const el = document.getElementById(`feedback-${highlightFeedbackId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => setHighlightFeedbackId(null), 4000);
      return () => clearTimeout(t);
    }
  }, [highlightFeedbackId]);

  const handleDeleteFeedback = (fbId) => {
    setFeedbackConfirm(fbId);
  };
  const confirmDeleteFeedback = () => {
    if (feedbackConfirm) {
      setFeedbacks(feedbacks.filter(fb => fb.id !== feedbackConfirm));
      showFeedbackToast('已删除');
    }
    setFeedbackConfirm(null);
  };
  const openReplyModal = (fb) => setReplyModal(fb);
  const closeReplyModal = () => setReplyModal(null);

  const showRoomToast = (message, type = 'success') => {
    setRoomToast({ show: true, message, type });
    setTimeout(() => setRoomToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({ name: '', seatCount: 25 });
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({ name: room.name, seatCount: room.seatCount });
    setShowRoomModal(true);
  };

  const handleSaveRoom = () => {
    if (!roomForm.name.trim()) {
      showRoomToast('房间名称不能为空', 'error');
      return;
    }
    const count = parseInt(roomForm.seatCount);
    if (!count || count < 1) {
      showRoomToast('座位数必须大于 0', 'error');
      return;
    }

    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, name: roomForm.name.trim(), seatCount: count } : r));
      showRoomToast('房间已更新');
    } else {
      const maxId = rooms.reduce((m, r) => Math.max(m, r.id), 0);
      setRooms([...rooms, { id: maxId + 1, name: roomForm.name.trim(), seatCount: count }]);
      showRoomToast('房间已添加');
    }
    setShowRoomModal(false);
  };

  const handleDeleteRoom = (roomId) => {
    if (rooms.length <= 1) {
      showRoomToast('至少保留 1 个房间', 'error');
      return;
    }
    if (!window.confirm('删除房间会影响相关预约记录，确定删除？')) return;
    setRooms(rooms.filter(r => r.id !== roomId));
    showRoomToast('房间已删除');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('appearance', JSON.stringify(appearance));
    alert('设置已保存！');
  };

  const handleExportData = () => {
    if (exportAllData) {
      exportAllData();
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string' && importAllData) {
          const success = importAllData(content);
          if (success) {
            setImportSuccess(true);
            setShowImportModal(true);
            setTimeout(() => {
              setImportSuccess(false);
              setShowImportModal(false);
            }, 3000);
          } else {
            alert('导入失败，请检查文件格式是否正确！');
          }
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  return (
    <>
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>系统设置</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <nav className="p-4">
            <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>设置菜单</h2>
            <ul className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        activeSection === section.id ? 'bg-blue-500 text-white dark:bg-blue-600' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className={`lg:col-span-2 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="p-6">
            {(() => {
              const activeSectionData = sections.find((s) => s.id === activeSection);
              const ActiveIcon = activeSectionData?.icon || Bell;
              const ActiveTitle = activeSectionData?.title || '';

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <ActiveIcon className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{ActiveTitle}</h2>
                    </div>
                    {(activeSection === 'appearance' || activeSection === 'security' || activeSection === 'notifications') && (
                      <button
                        onClick={handleSaveSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                        <Save className="w-4 h-4" />
                        保存设置
                      </button>
                    )}
                  </div>

                  <div className={`space-y-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feedbackToast.show && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${feedbackToast.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                        <CheckCircle className="w-4 h-4" /> {feedbackToast.message}
                      </div>
                    )}

                    {activeSection === 'feedbacks' && (
                      <>
                        {!isAdmin && (
                          <div className={`rounded-lg p-5 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} space-y-4`}>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                              <Send className="w-4 h-4" /> 写留言给管理员
                            </h3>
                            <div>
                              <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分类</label>
                              <select
                                value={feedbackForm.category}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                              >
                                {Object.entries(categoryConfig).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标题</label>
                              <input
                                type="text"
                                value={feedbackForm.title}
                                placeholder="一句话总结你的问题"
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>详细描述</label>
                              <textarea
                                rows={4}
                                value={feedbackForm.content}
                                placeholder="请详细描述你的问题或建议..."
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                              />
                            </div>
                            <button
                              onClick={handleSubmitFeedback}
                              className="px-5 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" /> 提交留言
                            </button>
                          </div>
                        )}

                        <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-5`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {isAdmin ? `全部留言 (${feedbacks.length})` : `我的留言 (${feedbacks.filter(f => f.userId === currentUser?.id).length})`}
                            </h3>
                            {isAdmin && feedbacks.length > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <Filter className="w-3.5 h-3.5" />
                                <select
                                  value={replyFilters.category}
                                  onChange={(e) => setReplyFilters({ ...replyFilters, category: e.target.value })}
                                  className={`px-2 py-1 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                  <option value="all">全部分类</option>
                                  {Object.entries(categoryConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                                <select
                                  value={replyFilters.status}
                                  onChange={(e) => setReplyFilters({ ...replyFilters, status: e.target.value })}
                                  className={`px-2 py-1 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                  <option value="all">全部状态</option>
                                  <option value="pending">待回复</option>
                                  <option value="replied">已回复</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {(() => {
                            let list = [...feedbacks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                            if (!isAdmin) list = list.filter(f => f.userId === currentUser?.id);
                            if (isAdmin && replyFilters.category !== 'all') list = list.filter(f => f.category === replyFilters.category);
                            if (isAdmin && replyFilters.status !== 'all') list = list.filter(f => f.status === replyFilters.status);

                            if (list.length === 0) {
                              return (
                                <div className={`text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <MessageSquareText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                  <p>暂无留言</p>
                                  {!isAdmin && <p className="text-xs mt-1">有任何疑惑都可以留言给管理员</p>}
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {list.map(fb => {
                                  const cat = categoryConfig[fb.category] || categoryConfig.general;
                                  const CatIcon = cat.icon;
                                  const isHighlight = fb.id === highlightFeedbackId;
                                  return (
                                    <div
                                      id={`feedback-${fb.id}`}
                                      key={fb.id}
                                      className={`rounded-lg border p-4 transition-all ${isHighlight ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-800 shadow-lg scale-[1.01]' : ''} ${fb.reply ? (isDark ? 'border-green-500/60 bg-green-900/10' : 'border-green-400/60 bg-green-50') : ''} ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                                              <CatIcon className="w-3 h-3" />
                                              {cat.label}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${fb.status === 'replied' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>
                                              {fb.status === 'replied' ? <CheckCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                              {fb.status === 'replied' ? '已回复' : '待回复'}
                                            </span>
                                          </div>
                                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{fb.title}</div>
                                          <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {isAdmin && fb.userName ? <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" /> {fb.userName}{fb.userEmail ? ` · ${fb.userEmail}` : ''}</span> : null}
                                            <span className="inline-flex items-center gap-1 ml-2"><Clock className="w-3 h-3" /> {formatTime(fb.createdAt)}</span>
                                          </div>
                                          <div className={`mt-2 text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{fb.content}</div>

                                          {fb.reply && (
                                            <div
                                              className={`mt-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all hover:brightness-110 ${isAdmin ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-400' : 'bg-green-50 dark:bg-green-900/30 border-l-2 border-green-400'}`}
                                              onClick={() => openReplyModal(fb)}
                                              title="点击弹窗查看完整回复"
                                            >
                                              <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${isAdmin ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}`}>
                                                <span className="inline-flex items-center gap-1.5">
                                                  管理员回复 · {formatTime(fb.reply.createdAt)}
                                                </span>
                                                <span className="text-[10px] opacity-70">点击查看完整 ↗</span>
                                              </div>
                                              <div className={`whitespace-pre-wrap line-clamp-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{fb.reply.content}</div>
                                            </div>
                                          )}
                                        </div>
                                        {isAdmin && (
                                          <button
                                            onClick={() => handleDeleteFeedback(fb.id)}
                                            className={`p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 ${isDark ? 'text-red-400' : 'text-red-500'}`}
                                            title="删除"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>

                                      {isAdmin && !fb.reply && (
                                        <div className="mt-3 pt-3 border-t border-dashed rounded grid grid-cols-[1fr_auto] gap-2">
                                          <textarea
                                            rows={2}
                                            value={replyInputs[fb.id] || ''}
                                            placeholder="输入回复内容..."
                                            onChange={(e) => setReplyInputs({ ...replyInputs, [fb.id]: e.target.value })}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                                          />
                                          <button
                                            onClick={() => handleAdminReply(fb.id)}
                                            className="px-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                                          >
                                            <Send className="w-4 h-4" /> 回复
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    {activeSection === 'rooms' && (
                      <>
                        {roomToast.show && (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${roomToast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm`}>
                            <CheckCircle className="w-4 h-4" /> {roomToast.message}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button onClick={handleOpenAddRoom} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            <Plus className="w-4 h-4" /> 添加房间
                          </button>
                        </div>

                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>房间名称</th>
                                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>座位数</th>
                                <th className={`px-4 py-3 text-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rooms.map((r) => (
                                <tr key={r.id} className={`border-b ${isDark ? 'border-gray-600 hover:bg-gray-600/50' : 'border-gray-200 hover:bg-gray-100'}`}>
                                  <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{r.name}</td>
                                  <td className="px-4 py-3">{r.seatCount} 个座位</td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                      <button onClick={() => handleOpenEditRoom(r)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 cursor-pointer" title="编辑">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteRoom(r.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer text-red-500" title="删除">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {rooms.length === 0 && (
                                <tr>
                                  <td colSpan={3} className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无房间，点击上方按钮添加</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                          <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>说明</h4>
                          <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <li>• 所有房间的座位总数：<span className="font-semibold text-blue-500">{rooms.reduce((s, r) => s + (r.seatCount || 0), 0)}</span></li>
                            <li>• 可设置任意数量的房间和任意座位数（最少 1 个）</li>
                            <li>• 修改座位数后，座位管理页面会自动按新数量渲染</li>
                          </ul>
                        </div>
                      </>
                    )}
                    {activeSection === 'notifications' && (
                      <>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>启用通知</h3>
                              <p className="text-sm">接收系统通知和提醒</p>
                            </div>
                            <button
                              onClick={() => handleNotificationChange('enabled')}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                notifications.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  notifications.enabled ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>邮件通知</h3>
                              <p className="text-sm">通过邮件接收重要通知</p>
                            </div>
                            <button
                              onClick={() => handleNotificationChange('email')}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                notifications.email ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  notifications.email ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>推送通知</h3>
                              <p className="text-sm">通过浏览器推送接收通知</p>
                            </div>
                            <button
                              onClick={() => handleNotificationChange('push')}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                notifications.push ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  notifications.push ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSection === 'security' && (
                      <>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>双因素认证</h3>
                              <p className="text-sm">启用后登录需要额外验证</p>
                            </div>
                            <button
                              onClick={() => handleSecurityChange('twoFactor', !security.twoFactor)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                security.twoFactor ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  security.twoFactor ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>自动锁定时间</h3>
                              <p className="text-sm">空闲多长时间后自动锁定账户</p>
                            </div>
                            <select
                              value={security.sessionTimeout}
                              onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                              className={`appearance-none px-4 py-2 rounded-lg border ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option value={15}>15 分钟</option>
                              <option value={30}>30 分钟</option>
                              <option value={60}>1 小时</option>
                              <option value={120}>2 小时</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>登录尝试限制</h3>
                              <p className="text-sm">登录失败次数达到后锁定账户</p>
                            </div>
                            <select
                              className={`appearance-none px-4 py-2 rounded-lg border ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option>3 次</option>
                              <option>5 次</option>
                              <option>10 次</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSection === 'appearance' && (
                      <>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>主题模式</h3>
                              <p className="text-sm">选择界面显示主题</p>
                            </div>
                            <div className="flex gap-2">
                              {[
                                { value: 'light', label: '浅色' },
                                { value: 'dark', label: '深色' },
                                { value: 'auto', label: '跟随系统' },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleAppearanceChange('theme', option.value)}
                                  className={`px-4 py-2 rounded-lg transition-colors ${
                                    appearance.theme === option.value
                                      ? 'bg-blue-500 text-white'
                                      : isDark
                                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>字体大小</h3>
                              <p className="text-sm">调整界面文字大小</p>
                            </div>
                            <select
                              value={appearance.fontSize}
                              onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
                              className={`appearance-none px-4 py-2 rounded-lg border ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option value="small">小</option>
                              <option value="medium">中</option>
                              <option value="large">大</option>
                              <option value="extra-large">超大</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>紧凑布局</h3>
                              <p className="text-sm">减少元素间距，节省屏幕空间</p>
                            </div>
                            <button
                              onClick={() => handleAppearanceChange('compactLayout', !appearance.compactLayout)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                appearance.compactLayout ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  appearance.compactLayout ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSection === 'database' && (
                      <>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>自动备份</h3>
                              <p className="text-sm">定期自动备份数据库</p>
                            </div>
                            <button
                              onClick={() => handleDatabaseChange('autoBackup', !database.autoBackup)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                database.autoBackup ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  database.autoBackup ? 'left-7' : 'left-1'
                                }`}
                              ></span>
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>备份频率</h3>
                              <p className="text-sm">设置自动备份的时间间隔</p>
                            </div>
                            <select
                              value={database.backupFrequency}
                              onChange={(e) => handleDatabaseChange('backupFrequency', e.target.value)}
                              className={`appearance-none px-4 py-2 rounded-lg border ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option value="hourly">每小时</option>
                              <option value="daily">每天</option>
                              <option value="weekly">每周</option>
                              <option value="monthly">每月</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>备份保留时间</h3>
                              <p className="text-sm">备份文件保留的天数</p>
                            </div>
                            <select
                              className={`appearance-none px-4 py-2 rounded-lg border ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              <option>7 天</option>
                              <option>14 天</option>
                              <option>30 天</option>
                              <option>90 天</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>数据导入导出</h3>
                          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            导出数据到文件，换浏览器后可导入恢复数据
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={handleExportData}
                              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-5 h-5" />
                              导出数据
                            </button>
                            <button
                              onClick={handleImportClick}
                              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Upload className="w-5 h-5" />
                              导入数据
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                        </div>

                        {showImportModal && (
                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-96 max-w-[90vw]`}>
                              <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">导入成功！</h3>
                                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                  您的数据已成功恢复，页面将自动刷新
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRoomModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{editingRoom ? '编辑房间' : '添加房间'}</h3>
              <button onClick={() => setShowRoomModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>房间名称</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="例如：A栋自习室"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>座位数量</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={roomForm.seatCount}
                  onChange={(e) => setRoomForm({ ...roomForm, seatCount: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRoomModal(false)}
                  className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRoom}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {feedbackConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setFeedbackConfirm(null)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[340px] max-w-[92vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="font-semibold">确认删除</h3>
              <button onClick={() => setFeedbackConfirm(null)} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>确定要删除这条留言吗？此操作不可撤销。</p>
            </div>
            <div className={`flex gap-3 px-5 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setFeedbackConfirm(null)} className={`flex-1 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                取消
              </button>
              <button onClick={confirmDeleteFeedback} className="flex-1 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {replyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeReplyModal}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[520px] max-w-[92vw] max-h-[85vh] overflow-auto ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-3 border-b sticky top-0 backdrop-blur ${isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-white/90'}`}>
              <div>
                <h3 className="font-semibold">{replyModal.title}</h3>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {categoryConfig[replyModal.category]?.label || '一般咨询'} · {formatTime(replyModal.createdAt)}
                </div>
              </div>
              <button onClick={closeReplyModal} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>留言内容</div>
                <div className={`rounded-lg px-3 py-2.5 text-sm whitespace-pre-wrap ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                  {replyModal.content}
                </div>
              </div>
              {replyModal.reply && (
                <div>
                  <div className={`text-xs font-medium mb-1 ${isAdmin ? 'text-blue-600 dark:text-blue-300' : 'text-green-600 dark:text-green-300'}`}>
                    管理员回复 · {formatTime(replyModal.reply.createdAt)}
                  </div>
                  <div className={`rounded-lg px-3 py-2.5 text-sm whitespace-pre-wrap ${isAdmin ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500'}`}>
                    {replyModal.reply.content}
                  </div>
                </div>
              )}
            </div>
            <div className={`px-5 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={closeReplyModal} className={`w-full py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
