/**
 * Google Calendar OAuth + Event management client.
 */
export class GoogleCalendarClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(opts: { clientId: string; clientSecret: string; redirectUri: string }) {
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.redirectUri = opts.redirectUri;
  }

  getAuthUrl(state: string): string {
    const scope = "https://www.googleapis.com/auth/calendar.events";
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;
  }

  async exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
    return res.json();
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
    return res.json();
  }

  async createEvent(
    accessToken: string,
    opts: {
      summary: string;
      description?: string;
      startTime: string;
      endTime: string;
      attendeeEmail?: string;
      zoomJoinUrl?: string;
    }
  ): Promise<{ id: string; htmlLink: string }> {
    const event: Record<string, unknown> = {
      summary: opts.summary,
      description: opts.description ?? "",
      start: { dateTime: opts.startTime, timeZone: "Asia/Kolkata" },
      end: { dateTime: opts.endTime, timeZone: "Asia/Kolkata" },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
    };

    if (opts.attendeeEmail) {
      event.attendees = [{ email: opts.attendeeEmail }];
    }
    if (opts.zoomJoinUrl) {
      event.location = opts.zoomJoinUrl;
      event.description = `${opts.description ?? ""}\n\nZoom: ${opts.zoomJoinUrl}`;
    }

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );
    if (!res.ok) throw new Error(`Google Calendar create event failed: ${res.status}`);
    return res.json();
  }

  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Google Calendar delete event failed: ${res.status}`);
    }
  }
}
