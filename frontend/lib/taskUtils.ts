import { Clock, Mail, FileText, Globe } from 'lucide-react';

export const TASK_TYPES = [
  { value: 'email', label: 'Wysyłka emaila', icon: Mail },
  { value: 'pdf', label: 'Generowanie PDF', icon: FileText },
  { value: 'scraping', label: 'Web Scraping', icon: Globe },
  { value: 'custom', label: 'Zadanie własne', icon: Clock },
];

export const RECURRING_OPTIONS = [
  { label: 'Codziennie', value: 'daily' },
  { label: 'Co tydzień', value: 'weekly' },
  { label: 'Co miesiąc', value: 'monthly' },
  { label: 'Co godzinę', value: 'hourly' },
];

export function getTaskIcon(taskType: string) {
  const task = TASK_TYPES.find((t) => t.value === taskType);
  return task?.icon || Clock;
}

export function getTaskLabel(taskType: string) {
  const task = TASK_TYPES.find((t) => t.value === taskType);
  return task?.label || taskType;
}

export function dateToCron(date: string, time: string): string {
  const [hours, minutes] = time.split(':');
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  return `${minutes} ${hours} ${day} ${month} *`;
}

export function recurringToCron(type: string, time: string): string {
  const [hours, minutes] = time.split(':');
  switch (type) {
    case 'hourly':
      return `${minutes} * * * *`;
    case 'daily':
      return `${minutes} ${hours} * * *`;
    case 'weekly':
      return `${minutes} ${hours} * * 1`;
    case 'monthly':
      return `${minutes} ${hours} 1 * *`;
    default:
      return `${minutes} ${hours} * * *`;
  }
}

export function cronToReadable(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (dayOfMonth !== '*' && month !== '*') {
    return `${dayOfMonth}.${month} o ${hour}:${minute.padStart(2, '0')}`;
  }

  if (hour === '*') {
    return `Co godzinę o :${minute.padStart(2, '0')}`;
  }

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Codziennie o ${hour}:${minute.padStart(2, '0')}`;
  }

  if (dayOfWeek !== '*') {
    const days = [
      'Niedziela',
      'Poniedziałek',
      'Wtorek',
      'Środa',
      'Czwartek',
      'Piątek',
      'Sobota',
    ];
    return `Każdy ${days[parseInt(dayOfWeek)] || 'Poniedziałek'} o ${hour}:${minute.padStart(2, '0')}`;
  }

  if (dayOfMonth !== '*') {
    return `Co miesiąc ${dayOfMonth}-go o ${hour}:${minute.padStart(2, '0')}`;
  }

  return cron;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Nigdy';
  return new Date(dateString).toLocaleString('pl-PL');
}
