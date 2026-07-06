export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development') {
    // Prevent multiple tunnels in hot-reload
    if (!(globalThis as any).__ngrok_listener) {
      try {
        const ngrok = await import('@ngrok/ngrok');
        const listener = await ngrok.forward({
          addr: 3000,
          authtoken: process.env.NGROK_AUTHTOKEN, // grabbed from ngrok dashboard
        });

        const tunnelUrl = listener.url();
        (globalThis as any).__ngrok_listener = listener;

        console.log(`\n🚀 Ingress established! Public proxy URL: ${tunnelUrl}`);
        console.log(`👉 Live telemetry endpoint: ${tunnelUrl}/api/webhooks/telemetry\n`);

        // Expose it to the Node.js process so the app can use it internally if needed
        process.env.NEXT_PUBLIC_NGROK_URL = tunnelUrl || '';

        // Automatically update the remote Supabase Edge Function secret with the new URL and the security token
        const telemetryToken = process.env.TELEMETRY_SECRET_TOKEN || 'local-dev-secret';

        console.log(`[Supabase API] Setting NEXTJS_TELEMETRY_URL in Supabase remote project...`);
        const { exec } = require('node:child_process');
        exec(
          `npx supabase secrets set NEXTJS_TELEMETRY_URL=${tunnelUrl}/api/webhooks/telemetry NEXTJS_TELEMETRY_TOKEN=${telemetryToken} --project-ref mcwarivltkjplzezkvgu`,
          (err: any) => {
            if (err) {
              console.error(
                '[Supabase API] Failed to update remote secret. Ensure your Supabase CLI is logged in.',
                err.message
              );
            } else {
              console.log(
                '[Supabase API] Successfully linked edge function telemetry to local Next.js tunnel!'
              );
            }
          }
        );
      } catch (err) {
        console.error('Failed to establish ngrok tunnel:', err);
      }
    }
  }
}
