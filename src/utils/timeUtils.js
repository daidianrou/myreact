export function formatTimeAgo(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return '未知时间';
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < minute) {
      return '刚刚';
    } else if (absDiff < hour) {
      const minutes = Math.floor(absDiff / minute);
      return `${minutes}分钟后`;
    } else if (absDiff < day) {
      const hours = Math.floor(absDiff / hour);
      return `${hours}小时后`;
    } else {
      const date = new Date(timestamp);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}分钟前`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}小时前`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}天前`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks}周前`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months}个月前`;
  } else {
    const years = Math.floor(diff / year);
    return `${years}年前`;
  }
}

export function parseTimeString(timeStr) {
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  const match = timeStr.match(/(\d+)(分钟|小时|天|周|月|年)前/);
  if (match) {
    const num = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case '分钟':
        return now - num * minute;
      case '小时':
        return now - num * hour;
      case '天':
        return now - num * day;
      case '周':
        return now - num * 7 * day;
      case '月':
        return now - num * 30 * day;
      case '年':
        return now - num * 365 * day;
      default:
        return now;
    }
  }
  
  if (timeStr === '刚刚') {
    return now;
  }
  
  return now;
}