function zerofill(value: number, length: number) {
  if (value.toString().length >= length) return value.toString();
  return "0".repeat(length - value.toString().length) + value.toString();
}

export function getLocaleDateTimeString(date: Date) {
  // 1980-01-01T00:00
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}T${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function parseLocaleDateTimeString(s: string): Date {
  // 1980-01-01T00:00

  const offset = new Date().getTimezoneOffset() / 60; // hr
  return new Date(`${s}:00.000${offset >= 0 ? "-" : "+"}${zerofill(Math.abs(offset), 2)}:00`);
}