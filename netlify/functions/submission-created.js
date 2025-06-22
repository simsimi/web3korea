const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    const { payload } = JSON.parse(event.body);
    const formName = payload.form_name;

    // 'contact' 폼에 대해서만 함수를 실행합니다.
    if (formName !== 'contact') {
      return {
        statusCode: 200,
        body: 'Not a contact form submission. Skipping.',
      };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Netlify 환경 변수에서 줄바꿈 문자를 복원합니다.
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 폼 데이터에서 필요한 값을 추출합니다.
    const { name, email, phone, message } = payload.data;
    
    // 시트에 기록할 데이터 행을 준비합니다.
    const newRow = [
      new Date().toISOString(), // 제출 시간
      name || '',
      email || '',
      phone || '',
      message || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1', // 시트의 첫 번째 탭을 의미하며, 데이터는 마지막 행에 추가됩니다.
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Sheet updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating sheet:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update sheet' }),
    };
  }
}; 