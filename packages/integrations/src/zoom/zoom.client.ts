/**
 * Zoom OAuth + Meeting creation client.
 * Handles OAuth code exchange, token refresh, and meeting lifecycle.
 */
export class ZoomClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(opts: { clientId: string; clientSecret: string; redirectUri: string }) {
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.redirectUri = opts.redirectUri;
  }

  getAuthUrl(state: string): string {
    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  async exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
    const res = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) throw new Error(`Zoom token exchange failed: ${res.status}`);
    return res.json();
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const res = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error(`Zoom token refresh failed: ${res.status}`);
    return res.json();
  }

  async createMeeting(
    accessToken: string,
    opts: { topic: string; startTime: string; durationMins: number }
  ): Promise<{ id: number; join_url: string; start_url: string }> {
    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: opts.topic,
        type: 2, // scheduled
        start_time: opts.startTime,
        duration: opts.durationMins,
        timezone: "Asia/Kolkata",
        settings: {
          join_before_host: false,
          waiting_room: true,
          auto_recording: "none",
        },
      }),
    });
    if (!res.ok) throw new Error(`Zoom create meeting failed: ${res.status}`);
    return res.json();
  }

  async deleteMeeting(accessToken: string, meetingId: string): Promise<void> {
    const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Zoom delete meeting failed: ${res.status}`);
    }
  }
}
