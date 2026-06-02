async function test() {
  const token = "1000.c4417dd29f412a0cdbb4075366147b63.bed405fe1cdfaa0448e78f9e5a52f389";
  const zsoid = "926433152";
  const payload = `{"session":{"topic":"test timezone","startTime":"Jun 03, 2026 10:00 AM","duration":3600000,"timezone":"INVALID_TZ","presenter":5541403000000012010}}`;
  
  const res = await fetch(`https://meeting.zoho.com/api/v2/${zsoid}/sessions.json`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: payload
  });
  console.log("Status:", res.status);
  console.log(await res.text());
}
test();
