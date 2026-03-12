import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");

/** Wrapper: dayjs() returns UTC on Vercel; this always returns Asia/Shanghai */
function dayjsCST(...args: Parameters<typeof dayjs>) {
  return dayjs(...args).tz();
}
// Preserve dayjs static methods (extend, tz, locale, etc.)
Object.assign(dayjsCST, dayjs);

export default dayjsCST as typeof dayjs;
