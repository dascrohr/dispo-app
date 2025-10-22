export function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }
  export function toYMD(d: Date) {
    return d.toISOString().slice(0,10);
  }