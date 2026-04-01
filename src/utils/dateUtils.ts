export function formatTimeUntil(dateString: string, reminderHours: number = 24): { text: string; isUrgent: boolean } {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return { text: '已上课', isUrgent: false };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  const isUrgent = diffHours < reminderHours;

  if (diffDays > 0) {
    return { text: `距上课 ${diffDays} 天`, isUrgent };
  }
  
  return { text: `距上课不足 ${diffHours} 小时`, isUrgent };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
