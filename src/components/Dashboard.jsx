import { useState, useEffect } from 'react';
import { User, Calendar, Square, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Clock, MapPin, CheckCircle, XCircle, BarChart3, LineChart, Bomb, Building2, Megaphone } from 'lucide-react';
import ReservationChart from './ReservationChart';

const MOTIVATIONAL_QUOTES = [
  '每一次努力，都是在为更好的自己铺路。',
  '今天多学一个知识点，明天少说一句求人话。',
  '保持专注，好运会自己找上门。',
  '别怕慢，就怕站。',
  '你今天读过的书，会变成明天脚下的路。',
  '优秀不是一种天赋，而是一种日复一日的习惯。',
  '悄悄努力，然后惊艳所有人。',
  '学习从来不是一件轻松的事，但坚持下来一定值得。',
  '再坚持一下，胜利就在下一个转角。',
  '静下心来，把手头的事做到极致。',
  '时间不会辜负每一个认真的人。',
  '把简单的事做透，就是不简单。',
];

const CLOSING_QUOTES = [
  '自习室即将在 22:00 关门啦，今天辛苦啦，记得早点休息～',
  '感谢今天努力学习的自己，明天我们 08:00 再见！',
  '夜幕已深，收拾好心情，晚安，奋斗者。',
  '一天的拼搏即将结束，别忘了照顾好身体。',
  '坚持到最后的你，已经很棒了，明天继续加油！',
];

const QUOTE_ROTATE_MS = 12000;

export default function Dashboard({ isDark, isAdmin, currentUser, reservations, rooms, setCurrentPage, onOpenProfile }) {
  const [chartType, setChartType] = useState('line');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isClosingTime, setIsClosingTime] = useState(false);

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      setIsClosingTime(h >= 22 || h < 1);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(i => i + 1);
    }, QUOTE_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const quotes = isClosingTime ? CLOSING_QUOTES : MOTIVATIONAL_QUOTES;
  const displayQuote = quotes[quoteIndex % quotes.length];
  const today = new Date().toISOString().split('T')[0];

  const totalSeats = rooms.reduce((s, r) => s + (r.seatCount || 0), 0);
  const totalRooms = rooms.length;
  
  const todayReservations = reservations.filter(r => r.date === today && r.status === 'pending').length;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayReservations = reservations.filter(r => r.date === yesterdayStr && r.status === 'pending').length;
  
  const reservationChange = todayReservations - yesterdayReservations;
  const reservationChangeStr = reservationChange > 0 ? `+${reservationChange}` : reservationChange.toString();
  
  const currentHour = new Date().getHours();
  const currentReservations = reservations.filter(r => {
    const [startHour] = r.time.split(' ')[0].split(':').map(Number);
    return r.date === today && r.status === 'pending' && startHour <= currentHour && startHour + 4 > currentHour;
  }).length;
  
  const yesterdayCurrentReservations = reservations.filter(r => {
    const [startHour] = r.time.split(' ')[0].split(':').map(Number);
    return r.date === yesterdayStr && r.status === 'pending' && startHour <= currentHour && startHour + 4 > currentHour;
  }).length;
  
  const usageRate = totalSeats > 0 ? Math.round((currentReservations / totalSeats) * 100) : 0;
  const yesterdayUsageRate = totalSeats > 0 ? Math.round((yesterdayCurrentReservations / totalSeats) * 100) : 0;
  
  const usageChange = usageRate - yesterdayUsageRate;
  const usageChangeStr = usageChange > 0 ? `+${usageChange}%` : `${usageChange}%`;

  const stats = [
    {
      title: '总座位数',
      value: totalSeats.toString(),
      sub: `${totalRooms} 个房间`,
      icon: Square,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: '今日预约',
      value: todayReservations.toString(),
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: reservationChangeStr,
      changeType: reservationChange >= 0 ? 'increase' : 'decrease',
      changeSub: `较昨日${reservationChange >= 0 ? '增加' : '减少'}${Math.abs(reservationChange)}人`,
    },
    {
      title: '当前使用',
      value: currentReservations.toString(),
      icon: User,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: '使用率',
      value: `${usageRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: usageChangeStr,
      changeType: usageChange >= 0 ? 'increase' : 'decrease',
      changeSub: `较昨日${usageChange >= 0 ? '上升' : '下降'}${Math.abs(usageChange)}个百分点`,
    },
  ];
  
  const isSpecialUser = currentUser?.email === '123@123.com';
  
  // 快速操作
  const quickActions = isAdmin ? [
    { title: '查看座位', icon: Square, color: 'bg-blue-500', action: 'seats' },
    { title: '管理预约', icon: Calendar, color: 'bg-green-500', action: 'reservations' },
    { title: '用户管理', icon: User, color: 'bg-purple-500', action: 'users' },
    { title: '系统设置', icon: TrendingUp, color: 'bg-orange-500', action: 'settings' },
    ...(isSpecialUser ? [{ title: '扫雷游戏', icon: Bomb, color: 'bg-red-500', action: 'minesweeper' }] : []),
  ] : [
    { title: '预约座位', icon: Plus, color: 'bg-blue-500', action: 'seats' },
    { title: '我的预约', icon: Calendar, color: 'bg-green-500', action: 'reservations' },
    { title: '个人资料', icon: User, color: 'bg-purple-500', action: 'profile' },
    ...(isSpecialUser ? [{ title: '扫雷游戏', icon: Bomb, color: 'bg-red-500', action: 'minesweeper' }] : []),
  ];
  
  // 最近预约
  const recentReservations = reservations
    .filter(r => isAdmin ? true : r.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // 生成趋势数据
  const getTrendData = () => {
    const slots = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-21'];
    return slots.map(label => {
      const [startH, endH] = label.split('-').map(n => parseInt(n));
      const count = reservations.filter(r => {
        if (r.date !== today) return false;
        if (r.status === 'cancelled' || r.status === 'checkedOut') return false;
        const [rStart] = r.time.split(' ')[0].split('-').map(s => parseInt(s.trim().split(':')[0]));
        return rStart >= startH && rStart < endH;
      }).length;
      return { label, startH, endH, count };
    });
  };

  const rawTrend = getTrendData();
  const maxCount = Math.max(...rawTrend.map(d => d.count), 1);
  const trendData = rawTrend.map(d => ({
    ...d,
    height: d.count === 0 ? 4 : Math.max(12, Math.round((d.count / maxCount) * 100)),
  }));
  const peakTime = trendData.reduce((a, b) => (b.count > a.count ? b : a));
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          欢迎回来，{currentUser?.name || '用户'}！
        </h1>
        <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {isAdmin ? '管理员' : '普通用户'}
          </span>
        </div>
      </div>

      <div
        className={`mb-6 rounded-xl px-5 py-3 flex items-center gap-3 border transition-colors ${
          isClosingTime
            ? (isDark ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/40 border-indigo-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200')
            : (isDark ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border-emerald-700' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200')
        }`}
      >
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isClosingTime
            ? (isDark ? 'bg-indigo-700' : 'bg-indigo-500')
            : (isDark ? 'bg-emerald-700' : 'bg-emerald-500')
        }`}>
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <div
            key={`${isClosingTime}-${quoteIndex}`}
            className="whitespace-nowrap inline-block animate-noticeSlide text-sm"
          >
            <span className={`font-medium ${
              isClosingTime
                ? (isDark ? 'text-indigo-200' : 'text-indigo-700')
                : (isDark ? 'text-emerald-200' : 'text-emerald-700')
            }`}>
              {isClosingTime ? '【今日闭馆公告】' : '【每日励志】'}
            </span>
            <span className={`ml-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {displayQuote}
            </span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-6 ${isDark ? 'border border-gray-700' : 'border border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <div className={`flex flex-col items-end ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {stat.changeType === 'increase' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                    {stat.changeSub && (
                      <div className={`text-xs opacity-75 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {stat.changeSub}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`text-3xl font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {stat.value}
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.title}
                {stat.sub && <span className="ml-1 text-gray-400">· {stat.sub}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 预约趋势图 */}
        <div className={`lg:col-span-2 rounded-xl p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <LineChart className="w-5 h-5" />
              今日预约趋势
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>高峰: {peakTime.label} ({peakTime.count}人)</span>
              </div>
              {/* 图表类型切换 */}
              <div className={`flex rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chartType === 'line' 
                      ? 'bg-blue-500 text-white' 
                      : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  折线图
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-blue-500 text-white' 
                      : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  柱状图
                </button>
              </div>
            </div>
          </div>
          
          {/* 图例 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预约人数趋势</span>
            </div>
          </div>
          
          {/* 图表区域 */}
          <div className="h-64">
            <ReservationChart 
              trendData={trendData} 
              chartType={chartType} 
              isDark={isDark}
              peakTime={peakTime}
            />
          </div>
          
          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              今日总计预约: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{todayReservations}</span> 人次
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              平均每时段: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {Math.round(todayReservations / Math.max(trendData.length, 1))}
              </span> 人
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>快速操作</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all hover:scale-105`}
                  onClick={() => {
                    if (action.action === 'profile' && onOpenProfile) {
                      onOpenProfile();
                    } else {
                      setCurrentPage(action.action);
                    }
                  }}
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 最近预约列表 */}
      <div className={`mt-6 rounded-xl p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {isAdmin ? '最近预约记录' : '我的预约'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>预约号</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>座位</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    日期
                  </div>
                </th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    时间
                  </div>
                </th>
                {isAdmin && (
                  <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      用户
                    </div>
                  </th>
                )}
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无预约记录
                  </td>
                </tr>
              ) : (
                recentReservations.map((reservation, index) => (
                  <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:bg-gray-700/50 transition-colors`}>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      #ORD{String(reservation.id).padStart(4, '0')}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {(rooms.find(r => r.id === reservation.roomId)?.name || '')} 座位 {reservation.seatId}
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {reservation.date}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {reservation.time}
                    </td>
                    {isAdmin && (
                      <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {reservation.userName}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                          : reservation.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {reservation.status === 'pending' ? (
                          <Clock className="w-3 h-3" />
                        ) : reservation.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {reservation.status === 'pending' ? '待使用' : reservation.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
