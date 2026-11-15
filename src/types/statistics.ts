export interface CommandStatisticsDay {
  date: string; // YYYY-MM-DD
  weekday: string; // Deutscher Wochentag
  count: number;
}

export interface CommandStatisticsResponse {
  period: '7d';
  total: number;
  data: CommandStatisticsDay[]; // exakt 7 Einträge, chronologisch
}
