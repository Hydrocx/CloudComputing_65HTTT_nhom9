async function test() {
  const token = "1000.c4417dd29f412a0cdbb4075366147b63.bed405fe1cdfaa0448e78f9e5a52f389";
  const zsoid = "926433152";
  const res = await fetch(`https://meeting.zoho.com/api/v2/${zsoid}/users.json`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` }
  });
  console.log(await res.text());
}
test();
