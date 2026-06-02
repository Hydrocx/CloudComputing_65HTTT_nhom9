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
  const dummyPdfString = `%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>> endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer <</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF`;
  const fileBuffer = Buffer.from(dummyPdfString, "utf-8");
  
  formData.append('file', new File([fileBuffer], 'document.pdf', { type: 'application/pdf' }));

  const res = await fetch('https://sign.zoho.com/api/v1/requests', {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    body: formData
  });
  console.log(await res.text());
}
test();
