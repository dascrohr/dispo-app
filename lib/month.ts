export function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }
  
  /** Baut YYYY-MM-DD ohne Zeitzone/UTC-Konvertierung */
  export function ymd(year: number, month: number, day: number) {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }