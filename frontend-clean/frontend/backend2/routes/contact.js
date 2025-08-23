const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// POST route for sending email
router.post('/', (req, res) => {
    const { name, phone, email_from, Promo, subject, Description } = req.body;

    // Create a transporter object using a Google SMTP account
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Email options
    const mailOptions = {
        from: `"${name}" <${email_from}>`,
        to: 'planifymmi@gmail.com', // Your receiving email address
        subject: `Nouveau message de contact : ${subject}`,
        html: `
            <h3>Nouveau message depuis le formulaire de contact Planify</h3>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email_from}</p>
            <p><strong>Téléphone :</strong> ${phone}</p>
            <p><strong>Promo :</strong> ${Promo}</p>
            <hr>
            <h4>Sujet : ${subject}</h4>
            <p>${Description}</p>
        `
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail." });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ success: true, message: 'Le message a été envoyé avec succès.' });
    });
});

module.exports = router; 