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

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER/EMAIL_PASS non configurés - envoi simulé.');
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Message reçu (mode dégradé: email non envoyé)' }) };
    }

    // Transport SMTP (Gmail par défaut)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465,
      secure: !process.env.EMAIL_PORT || Number(process.env.EMAIL_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    // Options de l'e-mail: utiliser from = EMAIL_USER et replyTo = email de l'expéditeur
    const mailOptions = {
      from: `Planify Contact <${EMAIL_USER}>`,
      to: 'planifymmi@gmail.com',
      replyTo: `${name} <${email_from}>`,
      subject: `Nouveau message de contact : ${subject}`,
      html: `
        <h3>Nouveau message depuis le formulaire de contact Planify</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email_from}</p>
        <p><strong>Téléphone :</strong> ${phone || ''}</p>
        <p><strong>Promo :</strong> ${Promo || ''}</p>
        <hr />
        <h4>Sujet : ${subject}</h4>
        <p>${(Description || '').replace(/\n/g, '<br/>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Le message a été envoyé avec succès.' }) };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: "Erreur lors de l'envoi de l'e-mail." }) };
  }
};