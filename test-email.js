
import nodemailer from 'nodemailer';

async function testEmail() {
    console.log('📧 Testing SMTP Credentials...');

    const config = {
        host: 'mail.nicola.id',
        port: 465, // Trying SSL first
        secure: true,
        auth: {
            user: 'gmail@nicola.id',
            pass: '@Nandha20'
        }
    };

    console.log(`Connecting to ${config.host}:${config.port} as ${config.auth.user}...`);

    try {
        const transporter = nodemailer.createTransport(config);

        // Verify connection
        await transporter.verify();
        console.log('✅ Connection Successful!');

        // Send test email
        const info = await transporter.sendMail({
            from: '"Nala System" <gmail@nicola.id>',
            to: 'gmail@nicola.id', // Send to self to test
            subject: 'Test Email Notification System',
            text: 'If you receive this, the email notification system is working correctly.',
            html: '<b>If you receive this, the email notification system is working correctly.</b>'
        });

        console.log(`✅ Message sent: ${info.messageId}`);

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.response) console.error('Response:', error.response);

        // If 465 fails, suggest 587
        if (config.port === 465) {
            console.log('\n⚠️  Tip: If this failed, maybe try Port 587 (TLS) with secure: false');
        }
    }
}

testEmail();
