import { Queue, type JobsOptions } from "bullmq";
import Redis from "ioredis";

export type ReminderChannel = "sms" | "email" | "push";
export type ReminderJob = { appointmentId: string; recipientId: string; channel: ReminderChannel; kind: "t_minus_24h" | "t_minus_1h" | "t_minus_10m"; dueAt: string; deepLink?: string; messageKey: string };

let redis: Redis | undefined;
let queue: Queue<ReminderJob> | undefined;
function getQueue() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Redis is not configured; appointment reminders remain in demo mode.");
  redis ??= new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  queue ??= new Queue<ReminderJob>("carewell-appointment-reminders", { connection: redis });
  return queue;
}

export function buildReminderJobs({ appointmentId, recipientId, startTime }: { appointmentId: string; recipientId: string; startTime: Date }, now = new Date()): ReminderJob[] {
  const start = startTime.getTime();
  const deepLink = `https://app.practo-clone.com/call/${encodeURIComponent(appointmentId)}`;
  const candidates: ReminderJob[] = [
    { appointmentId, recipientId, channel: "sms", kind: "t_minus_24h", dueAt: new Date(start - 24 * 60 * 60_000).toISOString(), messageKey: "appointment.reminder.24h.sms" },
    { appointmentId, recipientId, channel: "email", kind: "t_minus_24h", dueAt: new Date(start - 24 * 60 * 60_000).toISOString(), messageKey: "appointment.reminder.24h.email" },
    { appointmentId, recipientId, channel: "push", kind: "t_minus_1h", dueAt: new Date(start - 60 * 60_000).toISOString(), messageKey: "appointment.reminder.1h.test_devices" },
    { appointmentId, recipientId, channel: "push", kind: "t_minus_10m", dueAt: new Date(start - 10 * 60_000).toISOString(), deepLink, messageKey: "appointment.reminder.10m.urgent" },
    { appointmentId, recipientId, channel: "sms", kind: "t_minus_10m", dueAt: new Date(start - 10 * 60_000).toISOString(), deepLink, messageKey: "appointment.reminder.10m.urgent" },
  ];
  return candidates.filter((job) => new Date(job.dueAt).getTime() > now.getTime());
}

export async function enqueueAppointmentReminders(appointment: { appointmentId: string; recipientId: string; startTime: Date }) {
  const jobs = buildReminderJobs(appointment);
  const reminderQueue = getQueue();
  const options: JobsOptions = { removeOnComplete: 500, removeOnFail: 2000 };
  const queued = await Promise.all(jobs.map((job) => reminderQueue.add(job.kind, job, { ...options, jobId: `${job.appointmentId}:${job.kind}:${job.channel}`, delay: Math.max(0, new Date(job.dueAt).getTime() - Date.now()) })));
  return queued.map((job) => ({ id: job.id, kind: job.name, channel: job.data.channel, dueAt: job.data.dueAt }));
}

export async function closeReminderQueue() {
  await queue?.close();
  await redis?.quit();
  queue = undefined;
  redis = undefined;
}
