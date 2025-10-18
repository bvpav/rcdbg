export type LogLine = {
  id: string;
  text: string;
  level?: 'info' | 'warn' | 'error' | 'success';
};