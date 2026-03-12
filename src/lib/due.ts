import dayjs from "@/lib/dayjs";

export function getDueDatePart(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function getDueTimePart(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/(\d{2}:\d{2})$/);
  return match ? match[1] : null;
}

export function buildDueValue(date: string | null | undefined, time: string | null | undefined) {
  if (!date) return undefined;
  return time ? `${date} ${time}` : date;
}

export function compareDueValues(a: string | null | undefined, b: string | null | undefined) {
  const aDate = getDueDatePart(a);
  const bDate = getDueDatePart(b);

  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;

  const dateCompare = aDate.localeCompare(bDate);
  if (dateCompare !== 0) return dateCompare;

  const aTime = getDueTimePart(a) ?? "23:59";
  const bTime = getDueTimePart(b) ?? "23:59";
  return aTime.localeCompare(bTime);
}

export function isDueToday(value: string | null | undefined, today = dayjs().format("YYYY-MM-DD")) {
  return getDueDatePart(value) === today;
}

export function isOverdueDue(value: string | null | undefined, now = dayjs()) {
  const datePart = getDueDatePart(value);
  if (!datePart) return false;

  const timePart = getDueTimePart(value);
  if (!timePart) {
    return datePart < now.format("YYYY-MM-DD");
  }

  return dayjs(`${datePart}T${timePart}`).isBefore(now);
}

export function formatDueLabel(value: string | null | undefined) {
  const datePart = getDueDatePart(value);
  if (!datePart) return null;

  const timePart = getDueTimePart(value);
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

  let label = `${dayjs(datePart).format("M月D日")}`;
  if (datePart === today) label = "今天";
  if (datePart === tomorrow) label = "明天";
  if (datePart < today) label = "已逾期";

  return timePart ? `${label} ${timePart}` : label;
}
