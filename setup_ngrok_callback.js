const fs = require('fs');
const path = require('path');

// Script để setup ngrok callback URL nhanh
function setupNgrokCallback() {
  console.log('🔧 Setup Ngrok Callback URL...\n');

  const configPath = path.join(__dirname, 'config', 'zalopay.js');

  console.log('📋 Hướng dẫn setup:');
  console.log('1. Cài ngrok: npm install -g ngrok');
  console.log('2. Chạy ngrok: ngrok http 3000');
  console.log('3. Copy HTTPS URL từ ngrok (ví dụ: https://abc123.ngrok.io)');
  console.log('4. Chạy script này với URL đó\n');

  // Get ngrok URL from command line
  const ngrokUrl = process.argv[2];

  if (!ngrokUrl) {
    console.log('❌ Vui lòng provide ngrok URL:');
    console.log('node setup_ngrok_callback.js https://your-ngrok-url.ngrok.io');
    return;
  }

  if (!ngrokUrl.includes('ngrok.io') && !ngrokUrl.includes('https://')) {
    console.log('❌ URL không hợp lệ. Cần HTTPS ngrok URL');
    console.log('Ví dụ: https://abc123.ngrok.io');
    return;
  }

  try {
    // Read current config
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Update callback URL
    const newCallbackUrl = `${ngrokUrl}/api/payment/callback`;
    const updatedConfig = configContent.replace(
      /callback_url:\s*"[^"]*"/g,
      `callback_url: "${newCallbackUrl}"`
    );

    // Write updated config
    fs.writeFileSync(configPath, updatedConfig);

    console.log('✅ Đã cập nhật callback URL:');
    console.log(`   ${newCallbackUrl}`);
    console.log('\n🚀 Restart server để áp dụng thay đổi:');
    console.log('   npm run dev');
    console.log('\n🧪 Test ZaloPay API:');
    console.log('   node debug_zalopay_api.js');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật config:', error.message);
  }
}

// Tạo script restore callback URL về localhost
function restoreLocalCallback() {
  console.log('🔄 Restore callback URL về localhost...');

  const configPath = path.join(__dirname, 'config', 'zalopay.js');

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');

    const localCallbackUrl = 'http://localhost:3000/api/payment/callback';
    const updatedConfig = configContent.replace(
      /callback_url:\s*"[^"]*"/g,
      `callback_url: "${localCallbackUrl}"`
    );

    fs.writeFileSync(configPath, updatedConfig);

    console.log('✅ Đã restore callback URL về localhost');
    console.log('⚠️ Lưu ý: ZaloPay sẽ không thể access localhost callback');

  } catch (error) {
    console.error('❌ Lỗi khi restore config:', error.message);
  }
}

// Check command
const command = process.argv[2];

if (command === 'restore') {
  restoreLocalCallback();
} else if (command && command.startsWith('http')) {
  // URL provided
  setupNgrokCallback();
} else {
  console.log('🔧 ZaloPay Callback URL Setup Tool\n');
  console.log('Cách sử dụng:');
  console.log('1. Setup ngrok URL:');
  console.log('   node setup_ngrok_callback.js https://your-ngrok-url.ngrok.io');
  console.log('');
  console.log('2. Restore về localhost:');
  console.log('   node setup_ngrok_callback.js restore');
  console.log('');
  console.log('📝 Lưu ý:');
  console.log('- Ngrok URL cần có HTTPS');
  console.log('- Restart server sau khi thay đổi');
  console.log('- Dùng "restore" để về localhost khi không cần ngrok');
}
