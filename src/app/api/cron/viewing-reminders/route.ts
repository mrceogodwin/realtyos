import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

type Reminder = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  reminder_type: "24h" | "1h";
  scheduled_at: string;
  visitor_name: string;
  property_title: string;
  property_address: string | null;
  tenant_name: string;
  attempts: number;
};

async function runReminderDelivery(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
  }

  const claimed = await query<Reminder>(
    `WITH due AS (
       SELECT id FROM viewing_reminder_deliveries
        WHERE status IN ('pending', 'failed')
          AND scheduled_for <= now()
          AND next_attempt_at <= now()
          AND attempts < 5
        ORDER BY scheduled_for ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 25
     )
     UPDATE viewing_reminder_deliveries d
        SET status = 'processing', attempts = d.attempts + 1, updated_at = now()
       FROM due, property_viewings v, properties p, tenants t
      WHERE d.id = due.id
        AND v.id = d.viewing_id AND v.tenant_id = d.tenant_id
        AND p.id = v.property_id AND p.tenant_id = v.tenant_id
        AND t.id = d.tenant_id
     RETURNING d.id, d.recipient_email, d.recipient_name, d.reminder_type,
               v.scheduled_at, v.visitor_name, p.title AS property_title,
               p.address AS property_address, t.name AS tenant_name, d.attempts`
  );

  let sent = 0;
  let failed = 0;
  for (const reminder of claimed.rows) {
    const when = new Date(reminder.scheduled_at).toLocaleString("en-NG", {
      dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos",
    });
    const lead = reminder.reminder_type === "24h" ? "24 hours" : "1 hour";
    const subject = `Viewing reminder: ${reminder.property_title}`;
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17231f"><h2>Upcoming property viewing</h2><p>Hello ${escapeHtml(reminder.recipient_name || reminder.visitor_name)},</p><p>This is a reminder that your property viewing with <strong>${escapeHtml(reminder.tenant_name)}</strong> is scheduled in approximately ${lead}.</p><p><strong>Property:</strong> ${escapeHtml(reminder.property_title)}<br/><strong>Address:</strong> ${escapeHtml(reminder.property_address || "To be confirmed")}<br/><strong>Date and time:</strong> ${escapeHtml(when)}</p><p>Please contact the agency if you need to make changes.</p></div>`;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [reminder.recipient_email], subject, html }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 1000);
        throw new Error(`Resend ${response.status}: ${detail}`);
      }
      await query(
        "UPDATE viewing_reminder_deliveries SET status = 'sent', sent_at = now(), last_error = NULL, updated_at = now() WHERE id = $1 AND status = 'processing'",
        [reminder.id]
      );
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Email delivery failed";
      await query(
        `UPDATE viewing_reminder_deliveries
            SET status = 'failed',
                next_attempt_at = CASE WHEN attempts < 5 THEN now() + (LEAST(power(2, attempts), 60)::int * interval '1 minute') ELSE now() + interval '365 days' END,
                last_error = $2, updated_at = now()
          WHERE id = $1 AND status = 'processing'`,
        [reminder.id, message]
      );
      failed++;
    }
  }

  return NextResponse.json({ claimed: claimed.rowCount ?? 0, sent, failed });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export async function GET(request: NextRequest) {
  try {
    return await runReminderDelivery(request);
  } catch (error) {
    console.error("[viewing-reminders-cron]", error);
    return NextResponse.json({ error: "Reminder processing failed" }, { status: 500 });
  }
}

export const POST = GET;
