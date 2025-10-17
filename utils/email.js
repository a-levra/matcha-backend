const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (email, token) => {
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirmez votre compte Matcha',
        html: `
            <h1>Bienvenue sur Matcha !</h1>
            <p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
            <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
                Confirmer mon compte
            </a>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p>${confirmationUrl}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

module.exports = { sendConfirmationEmail };
