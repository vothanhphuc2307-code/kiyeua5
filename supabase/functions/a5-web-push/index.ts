import * as webpush from "jsr:@negrel/webpush@0.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kiyeua5.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  // Browser calls are restricted to the known production origin. Non-browser CLI calls can omit Origin.
  if (origin && origin !== "https://kiyeua5.vercel.app") {
    return new Response("Origin not allowed", { status: 403 });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidJson = Deno.env.get("A5_VAPID_KEYS");
  const contact = Deno.env.get("A5_VAPID_SUBJECT");
  if (!supabaseUrl || !anonKey || !serviceKey || !vapidJson || !contact) {
    return json({ error: "Push service secrets are not fully configured." }, 503);
  }

  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required." }, 401);
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json({ error: "Invalid session." }, 401);

  let input: { action?: string; media_id?: string; notification_type?: string };
  try {
    const bodyText = await req.text();
    if (bodyText.length > 4000) return json({ error: "Request is too large." }, 413);
    input = JSON.parse(bodyText);
  } catch (_) {
    return json({ error: "Invalid JSON." }, 400);
  }
  if (!input || !["test", "activity"].includes(String(input.action))) {
    return json({ error: "Unsupported action." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let recipientIds: string[] = [];
  let matchingNotices: Array<{ id: string; user_id: string }> = [];
  let title = "NHỮNG BÉ BÁO 12A5";
  let body = "A5 có một thông báo mới. Ghé góc lưu bút xem nhé ♡";
  let tag = `a5-test-${user.id}`;

  if (input.action === "test") {
    // A test notification can only target the caller's own registered devices.
    recipientIds = [user.id];
    body = "Thông báo thử đã đến từ góc nhỏ A5. Mọi thứ đã sẵn sàng ♡";
    tag = `a5-test-${user.id}`;
  } else {
    const mediaId = String(input.media_id || "");
    const type = String(input.notification_type || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mediaId)) {
      return json({ error: "Invalid media id." }, 400);
    }
    if (!["comment", "reaction"].includes(type)) return json({ error: "Invalid notification type." }, 400);
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: notices, error: noticesError } = await admin
      .from("notifications")
      .select("id,user_id,actor_id,media_id,notification_type,created_at,push_sent_at")
      .is("push_sent_at", null)
      .eq("actor_id", user.id)
      .eq("media_id", mediaId)
      .eq("notification_type", type)
      .neq("user_id", user.id)
      .gte("created_at", since)
      .limit(25);
    if (noticesError) return json({ error: "Could not read matching in-app notifications." }, 500);
    matchingNotices = (notices || []).map((item: { id: string; user_id: string }) => ({ id: item.id, user_id: item.user_id }));
    recipientIds = [...new Set(matchingNotices.map(item => item.user_id).filter(Boolean))];
    if (!recipientIds.length) return json({ ok: true, sent: 0, message: "No new recipient notification was created." });
    const { data: actorProfile } = await admin.from("profiles").select("display_name,nickname").eq("id", user.id).maybeSingle();
    const actorName = String(actorProfile?.display_name || actorProfile?.nickname || "Một bạn A5").slice(0, 60);
    title = type === "comment" ? `${actorName} nhắn vào kỷ niệm ♡` : `${actorName} gửi cảm xúc ♡`;
    body = type === "comment" ? "Có lời nhắn mới trong góc kỷ niệm của cậu." : "Có người vừa thả cảm xúc vào kỷ niệm của cậu.";
    tag = `a5-${type}-${mediaId}`;
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("a5_push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .in("user_id", recipientIds);
  if (subscriptionsError) return json({ error: "Could not read push subscriptions. Did the subscription SQL migration run?" }, 500);
  if (!subscriptions?.length) return json({ ok: true, sent: 0, message: "Recipients have no registered push devices." });

  // Atomically claim the matching in-app notices before dispatch so retrying the client
  // cannot repeatedly notify the same people for the same recent comment/reaction.
  let activeSubscriptions = subscriptions;
  if (input.action === "activity") {
    const subscribedUsers = new Set(subscriptions.map((row: { user_id: string }) => row.user_id));
    const candidateNotices = matchingNotices.filter(item => subscribedUsers.has(item.user_id));
    const candidateIds = candidateNotices.map(item => item.id);
    if (!candidateIds.length) return json({ ok: true, sent: 0, message: "No recipient has a registered push device." });
    const { data: claimedNotices, error: claimError } = await admin
      .from("notifications")
      .update({ push_sent_at: new Date().toISOString() })
      .in("id", candidateIds)
      .is("push_sent_at", null)
      .select("id,user_id");
    if (claimError) return json({ error: "Could not claim push notifications." }, 500);
    const claimedUsers = new Set((claimedNotices || []).map((item: { user_id: string }) => item.user_id));
    if (!claimedUsers.size) return json({ ok: true, sent: 0, message: "This activity has already been dispatched." });
    activeSubscriptions = subscriptions.filter((row: { user_id: string }) => claimedUsers.has(row.user_id));
  }

  let vapidKeys;
  let appServer;
  try {
    vapidKeys = await webpush.importVapidKeys(JSON.parse(vapidJson), { extractable: false });
    appServer = await webpush.ApplicationServer.new({ contactInformation: contact, vapidKeys });
  } catch (error) {
    console.error("Invalid VAPID configuration", error);
    return json({ error: "VAPID keys are invalid. Regenerate keys and save A5_VAPID_KEYS." }, 503);
  }

  let sent = 0;
  let failed = 0;
  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    url: "/?from=notification",
    tag,
  });
  for (const row of activeSubscriptions) {
    try {
      const subscriber = appServer.subscribe({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      });
      await subscriber.pushTextMessage(payload, { ttl: 3600 });
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = String((error as Error)?.message || error);
      console.warn("Web push delivery failed", message.slice(0, 240));
      if (/\b(404|410)\b|gone|expired/i.test(message)) {
        await admin.from("a5_push_subscriptions").delete().eq("id", row.id);
      }
    }
  }
  return json({ ok: true, sent, failed, recipients: recipientIds.length });
});
