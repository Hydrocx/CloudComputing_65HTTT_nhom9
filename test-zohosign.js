async function test() {
  const token = '1000.dae390163eb16ea812e905405f33274b.5e2221592ad63b89ccb681da38906ffc';
  const payload = {
    requests: {
      request_name: 'Test Doc',
      actions: [{ recipient_name: 'Test', recipient_email: 'test@example.com', action_type: 'SIGN', signing_order: 1 }]
    }
  };
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  const fileRes = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const fileBuffer = await fileRes.arrayBuffer();
  formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), 'document.pdf');

  const res = await fetch('https://sign.zoho.com/api/v1/requests', {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    body: formData
  });
  console.log(await res.text());
}
test();
