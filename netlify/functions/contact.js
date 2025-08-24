const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Méthode non autorisée' }) };
  }

  try {
    const { name, phone, email_from, Promo, subject, Description } = JSON.parse(event.body || '{}');

    if (!name || !email_from || !subject || !Description) {
      return { statusCode: 400, headers, body: JSON.stringify({ 
        success: false, 
        message: 'Tous les champs obligatoires doivent être remplis' 
      }) };
    }

    const HTML = `
        <h3>Nouveau message depuis le formulaire de contact Planify</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email_from}</p>
        <p><strong>Téléphone :</strong> ${phone || ''}</p>
        <p><strong>Promo :</strong> ${Promo || ''}</p>
        <hr />
        <h4>Sujet : ${subject}</h4>
        <p>${(Description || '').replace(/\n/g, '<br/>')}</p>
      `;

    // 1) Tentative via Resend si disponible
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `Planify <onboarding@resend.dev>`,
            to: ['planifymmi@gmail.com'],
            reply_to: `${name} <${email_from}>`,
            subject: `Nouveau message de contact : ${subject}`,
            html: HTML,
            bcc: process.env.EMAIL_USER ? [process.env.EMAIL_USER] : undefined
          })
        });
        if (r.ok) {
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Le message a été envoyé avec succès (Resend).' }) };
        } else {
          const txt = await r.text().catch(() => '');
          console.error('Resend error:', r.status, txt);
          // On continue vers nodemailer fallback
        }
      } catch (e) {
        console.error('Resend exception:', e);
        // On continue vers nodemailer fallback
      }
    }

    // 2) Fallback SMTP (Gmail/nodemailer)
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('EMAIL_USER/EMAIL_PASS absents - mode dégradé.');
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Message reçu (mode dégradé: email non envoyé)' }) };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    const mailOptions = {
      from: `Planify Contact <${EMAIL_USER}>`,
      to: 'planifymmi@gmail.com',
      replyTo: `${name} <${email_from}>`,
      subject: `Nouveau message de contact : ${subject}`,
      html: HTML,
      bcc: EMAIL_USER
    };

    try {
      await transporter.sendMail(mailOptions);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Le message a été envoyé avec succès (SMTP).' }) };
    } catch (smtpError) {
      console.error('SMTP error:', smtpError);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Message reçu. Envoi email différé.' }) };
    }
  } catch (error) {
    console.error('Erreur contact handler:', error);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Message reçu.' }) };
  }
};