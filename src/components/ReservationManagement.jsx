﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useMemo } from 'react';
import { Calendar, Timer, User, ChevronDown, Eye, Edit2, Trash2, X, CheckCircle, AlertCircle, Plus, Download, MapPin, Building2 } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  missed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels = {
  pending: '待使用',
  checked_in: '已签到',
  completed: '已完成',
  cancelled: '已取消',
  missed: '未使用',
};

export default function ReservationManagement({ isDark, isAdmin, currentUser, reservations, setReservations, users, rooms, addNotification }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({ date: '', startTime: '', endTime: '', seat: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms.length > 0 ? rooms[0].id : 1);

  const today = new Date().toISOString().split('T')[0];

  const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
    const h = 8 + i;
    return { value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` };
  });

  const getEndHourOptions = (startH) => {
    const start = typeof startH === 'number' ? startH : parseInt((startH || '').split(':')[0] || '0');
    return HOUR_OPTIONS.filter(o => {
      const h = parseInt(o.value.split(':')[0]);
      return h > start && h <= 22;
    });
  };

  const isValidTimeRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return false;
    }
    
    if (!start || !end) return true;
    const [sh] = start.split(':').map(Number);
    const [eh] = end.split(':').map(Number);
    if (eh <= sh) return false;
    if (sh < 8 || eh > 22) return false;
    
    if (dateStr === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const nowHour = now.getHours();
      const nowMinute = now.getMinutes();
      if (sh < nowHour || (sh === nowHour && start.split(':')[1] <= nowMinute)) {
        return false;
      }
    }
    return true;
  };

  const joinTime = (fd) => fd.startTime && fd.endTime ? `${fd.startTime} - ${fd.endTime}` : '';
  const splitTime = (slot) => {
    if (!slot) return { startTime: '', endTime: '' };
    const parts = slot.split(' - ');
    return { startTime: parts[0] || '', endTime: parts[1] || '' };
  };

  const filteredReservations = useMemo(() => {
    let list = reservations;
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);
    if (filterRoom !== 'all') list = list.filter(r => r.roomId === parseInt(filterRoom));
    return list;
  }, [reservations, filterStatus, filterRoom]);

  const userReservations = currentUser?.role !== 'admin'
    ? filteredReservations.filter(r => r.userId === currentUser?.id)
    : filteredReservations;

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleViewDetail = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleOpenEdit = (reservation) => {
    setEditingReservation(reservation);
    const { startTime, endTime } = splitTime(reservation.time);
    setFormData({ date: reservation.date, startTime, endTime, seat: String(reservation.seatId) });
    setShowEditModal(true);
  };

  const handleEditReservation = () => {
    const time = joinTime(formData);
    if (!formData.date || !time || !formData.seat) {
      showToastMessage('请填写完整信息', 'error');
      return;
    }
    if (!isValidTimeRange(formData.date, formData.startTime, formData.endTime)) {
      showToastMessage('时间范围无效（08:00-22:00，开始早于结束，今天不能早于当前）', 'error');
      return;
    }

    setReservations(reservations.map(r =>
      r.id === editingReservation.id
        ? { ...r, date: formData.date, time, seatId: parseInt(formData.seat) }
        : r
    ));
    setShowEditModal(false);
    setEditingReservation(null);
    setFormData({ date: '', startTime: '', endTime: '', seat: '' });
    showToastMessage('预约信息更新成功！');
  };

  const handleCancelReservation = () => {
    setReservations(reservations.map(r =>
      r.id === selectedReservation.id
        ? { ...r, status: 'cancelled' }
        : r
    ));
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setSelectedReservation(null);
    showToastMessage('预约已取消！');
  };

  const confirmCancel = (reservation) => {
    setSelectedReservation(reservation);
    setShowConfirmModal(true);
  };

  const handleAdminDelete = () => {
    setReservations(reservations.filter(r => r.id !== selectedReservation.id));
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setSelectedReservation(null);
    showToastMessage('预约记录已删除！');
  };

  const confirmAdminDelete = (reservation) => {
    setSelectedReservation(reservation);
    setShowConfirmModal(true);
  };

  const handleCheckIn = (reservation) => {
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setReservations(reservations.map(r =>
      r.id === reservation.id
        ? { ...r, status: 'checked_in', checkInTime }
        : r
    ));
    showToastMessage('签到成功！');
  };

  const canCheckIn = (reservation) => {
    if (reservation.status !== 'pending') return false;

    const now = new Date();
    const reservationDate = new Date(reservation.date);
    const today = new Date();

    if (reservationDate.toDateString() !== today.toDateString()) return false;

    const startTimeStr = reservation.time.split(' - ')[0];
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);

    const startTime = new Date(today);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTimeStr = reservation.time.split(' - ')[1];
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    const endTime = new Date(today);
    endTime.setHours(endHour, endMinute, 0, 0);

    const fifteenMinutesBefore = new Date(startTime);
    fifteenMinutesBefore.setMinutes(fifteenMinutesBefore.getMinutes() - 15);

    return now >= fifteenMinutesBefore && now <= endTime;
  };

  const exportToCSV = () => {
    const headers = ['预约号', '用户', '座位号', '日期', '时间', '签到时间', '状态'];
    const rows = reservations.map(r => [
      `#ORD${String(r.id).padStart(4, '0')}`,
      users.find(u => u.id === r.userId)?.name || r.userName,
      `座位 ${r.seatId}`,
      r.date,
      r.time,
      r.checkInTime || '',
      statusLabels[r.status]
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `预约记录_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddReservation = () => {
    setErrorMessage('');
    
    const time = joinTime(formData);
    if (!formData.date || !time || !formData.seat) {
      setErrorMessage('请填写完整的预约信息');
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setErrorMessage('预约日期不能早于今天');
      return;
    }

    if (!isValidTimeRange(formData.date, formData.startTime, formData.endTime)) {
      setErrorMessage('时间选择无效：请选择08:00-22:00之间的时段，且开始时间需早于结束时间');
      return;
    }

    const existingReservation = reservations.find(
      r => r.seatId === parseInt(formData.seat) && r.date === formData.date && r.time === time && r.status === 'pending'
    );

    if (existingReservation) {
      setErrorMessage('该座位在该时段已被预约');
      return;
    }

    const newId = reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1;
    const newReservation = {
      id: newId,
      userId: currentUser?.id || 0,
      userName: currentUser?.name || '用户',
      seatId: parseInt(formData.seat),
      date: formData.date,
      time: time,
      status: 'pending'
    };

    setReservations([...reservations, newReservation]);

    addNotification({
      title: '预约成功',
      message: `您已成功预约座位 ${formData.seat}，${formData.date} ${time}`,
      isAllUsers: false,
      userId: currentUser?.id || 'unknown'
    });

    addNotification({
      title: '新预约通知',
      message: `${currentUser?.name || '用户'} 预约了座位 ${formData.seat}，${formData.date} ${time}`,
      isAllUsers: false,
      userId: null,
      forAdmin: true,
    });

    setShowAddModal(false);
    setFormData({ date: '', startTime: '', endTime: '', seat: '' });
    showToastMessage('预约成功！');
  };

  const handleOpenAdd = () => {
    setFormData({ date: '', startTime: '', endTime: '', seat: '' });
    setErrorMessage('');
    setShowAddModal(true);
  };

  const getUserInfo = (userId) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>预约管理</h2>
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
            >
              <option value="all">所有房间</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
            >
              <option value="all">所有状态</option>
              <option value="pending">待使用</option>
              <option value="checked_in">已签到</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="missed">未使用</option>
            </select>
            {isAdmin && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                导出Excel
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增预约
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {[
                  { key: 'id', label: '预约号' },
                  { key: 'user', label: '用户' },
                  { key: 'seat', label: '座位' },
                  { key: 'date', label: '日期' },
                  { key: 'time', label: '时间' },
                  { key: 'status', label: '状态' },
                  { key: 'actions', label: '操作' }
                ].map(col => (
                  <th key={col.key} className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {userReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无预约记录
                  </td>
                </tr>
              ) : (
                userReservations.map(reservation => {
                  const user = getUserInfo(reservation.userId);
                  const canCheck = canCheckIn(reservation);
                  return (
                    <tr key={reservation.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>#{String(reservation.id).padStart(4, '0')}</td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'} flex items-center justify-center overflow-hidden text-lg`}>
                            {user?.avatar ? (
                              user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.avatar
                              )
                            ) : (
                              (user?.name || reservation.userName).charAt(0)
                            )}
                          </div>
                          <div>
                            <div>{user?.name || reservation.userName}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {user?.role === 'admin' ? '管理员' : '用户'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {rooms.find(r => r.id === reservation.roomId)?.name || ''} 座位 {reservation.seatId}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {reservation.date}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-gray-400" />
                          {reservation.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
                          {statusLabels[reservation.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(reservation)}
                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canCheck && (
                            <button
                              onClick={() => handleCheckIn(reservation)}
                              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && reservation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(reservation)}
                                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmCancel(reservation)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && reservation.status !== 'pending' && (
                            <button
                              onClick={() => confirmAdminDelete(reservation)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">预约详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm font-medium mb-2">#{String(selectedReservation.id).padStart(4, '0')}</div>
                <div className={`flex items-center justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>状态</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedReservation.status]}`}>
                    {statusLabels[selectedReservation.status]}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>用户</span>
                  </div>
                  <span className="font-medium">{getUserInfo(selectedReservation.userId)?.name || selectedReservation.userName}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>座位</span>
                  </div>
                  <span className="font-medium">{rooms.find(r => r.id === selectedReservation.roomId)?.name || ''} 座位 {selectedReservation.seatId}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>日期</span>
                  </div>
                  <span className="font-medium">{selectedReservation.date}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>时间</span>
                  </div>
                  <span className="font-medium">{selectedReservation.time}</span>
                </div>
                {selectedReservation.checkInTime && (
                  <div className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>签到时间</span>
                    </div>
                    <span className="font-medium">{selectedReservation.checkInTime}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                {isAdmin && selectedReservation.status === 'pending' && (
                  <button
                    onClick={() => confirmCancel(selectedReservation)}
                    className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  >
                    取消预约
                  </button>
                )}
                {isAdmin && selectedReservation.status !== 'pending' && (
                  <button
                    onClick={() => confirmAdminDelete(selectedReservation)}
                    className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  >
                    删除记录
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">编辑预约</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>日期</label>
                <input
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    let startTime = formData.startTime;
                    let endTime = formData.endTime;
                    if (newDate === today && startTime) {
                      const now = new Date();
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      const [h, m] = startTime.split(':').map(Number);
                      if (h * 60 + m <= nowMin) { startTime = ''; endTime = ''; }
                    }
                    setFormData({ ...formData, date: newDate, startTime, endTime });
                  }}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>时间</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.startTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      let end = formData.endTime;
                      if (end && v) {
                        const vH = parseInt(v.split(':')[0]);
                        const eH = parseInt(end.split(':')[0]);
                        if (eH <= vH) end = '';
                      }
                      if (formData.date && v) {
                        const now = new Date();
                        const todayNow = now.toISOString().slice(0, 10);
                        if (formData.date === todayNow) {
                          const nowH = now.getHours();
                          const vH = parseInt(v.split(':')[0]);
                          if (vH <= nowH) { showToastMessage('开始时间不能早于当前小时', 'error'); return; }
                        }
                      }
                      setFormData({ ...formData, startTime: v, endTime: end });
                    }}
                    disabled={!formData.date}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${!formData.date ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">开始时间</option>
                    {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>至</span>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    disabled={!formData.date || !formData.startTime}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${(!formData.date || !formData.startTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">结束时间</option>
                    {getEndHourOptions(formData.startTime).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    <option value="22:00">22:00</option>
                  </select>
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>范围 08:00-22:00，开始小时须早于结束小时</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>座位号</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.seat}
                  onChange={(e) => setFormData({ ...formData, seat: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="1-25"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReservation(null);
                  }}
                  className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                >
                  取消
                </button>
                <button
                  onClick={handleEditReservation}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">预约座位</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
                  </p>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>预约日期</label>
                <input
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    let startTime = formData.startTime;
                    let endTime = formData.endTime;
                    if (newDate === today && startTime) {
                      const now = new Date();
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      const [h, m] = startTime.split(':').map(Number);
                      if (h * 60 + m <= nowMin) { startTime = ''; endTime = ''; }
                    }
                    setFormData({ ...formData, date: newDate, startTime, endTime });
                  }}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>预约时间</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.startTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      let end = formData.endTime;
                      if (end && v) {
                        const vH = parseInt(v.split(':')[0]);
                        const eH = parseInt(end.split(':')[0]);
                        if (eH <= vH) end = '';
                      }
                      if (formData.date && v) {
                        const now = new Date();
                        const todayNow = now.toISOString().slice(0, 10);
                        if (formData.date === todayNow) {
                          const nowH = now.getHours();
                          const vH = parseInt(v.split(':')[0]);
                          if (vH <= nowH) { showToastMessage('开始时间不能早于当前小时', 'error'); return; }
                        }
                      }
                      setFormData({ ...formData, startTime: v, endTime: end });
                    }}
                    disabled={!formData.date}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${!formData.date ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">开始时间</option>
                    {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>至</span>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    disabled={!formData.date || !formData.startTime}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${(!formData.date || !formData.startTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">结束时间</option>
                    {getEndHourOptions(formData.startTime).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    <option value="22:00">22:00</option>
                  </select>
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>范围 08:00-22:00，开始小时须早于结束小时</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>座位号</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.seat}
                  onChange={(e) => setFormData({ ...formData, seat: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="1-25"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                >
                  取消
                </button>
                <button
                  onClick={handleAddReservation}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  确认预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-80 max-w-[90vw] ${isDark ? 'text-white' : 'text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedReservation.status === 'pending' ? '确认取消预约' : '确认删除记录'}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedReservation.status === 'pending' ? '确定要取消此预约吗？' : '确定要删除此记录吗？删除后无法恢复。'}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedReservation(null);
                }}
                className={`flex-1 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedReservation.status === 'pending') {
                    handleCancelReservation();
                  } else {
                    handleAdminDelete();
                  }
                  setShowConfirmModal(false);
                  setSelectedReservation(null);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-pulse">
          <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            showToast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {showToast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {showToast.message}
          </div>
        </div>
      )}
    </div>
  );
}
