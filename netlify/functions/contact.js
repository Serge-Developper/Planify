const nodemailer = require('nodemailer');

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

exports.handler = async (event, context) => {
  // Headers pour CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { name, phone, email_from, Promo, subject, Description } = JSON.parse(event.body || '{}');

    if (!name || !email_from || !subject || !Description) {
      return { statusCode: 400, headers, body: JSON.stringify({ 
        success: false, 
        message: 'Tous les champs obligatoires doivent être remplis' 
      }) };
    }

    console.log('Tentative d\'envoi d\'email avec les données:', {
      name,
      email_from,
      subject,
      hasDescription: !!Description
    });

    // Préparer le contenu
    const html = `
        <h3>Nouveau message depuis le formulaire de contact Planify</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email_from}</p>
        <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
        <p><strong>Promo :</strong> ${Promo || 'Non renseigné'}</p>
        <hr>
        <h4>Sujet : ${subject}</h4>
        <p>${Description}</p>
      `;

    // 1) Tentative via Gmail SMTP (Nodemailer)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: `"Planify Contact" <${process.env.EMAIL_USER}>`,
          replyTo: email_from,
          to: 'planifymmi@gmail.com',
          subject: `Nouveau message de contact : ${subject}`,
          html
        };

        console.log('Envoi de l\'email via Gmail SMTP...');
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès (SMTP)');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Le message a été envoyé avec succès.' })
        };
      } catch (smtpError) {
        console.error('✉️  Échec SMTP:', smtpError?.message || smtpError);
        // Fallback vers Resend si disponible
      }
    } else {
      console.warn('EMAIL_USER/PASS manquants, tentative Resend si disponible...');
    }

    // 2) Fallback via Resend REST API si clé disponible
    if (process.env.RESEND_API_KEY) {
      try {
        const payload = {
          from: 'Planify <onboarding@resend.dev>',
          to: ['planifymmi@gmail.com'],
          subject: `Nouveau message de contact : ${subject}`,
          html,
          reply_to: email_from
        };
        console.log('Envoi via Resend...');
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.error('Resend non OK:', resp.status, data);
          throw new Error('Resend error ' + resp.status);
        }
        console.log('Email envoyé avec succès (Resend)');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Le message a été envoyé avec succès.' })
        };
      } catch (resendError) {
        console.error('✉️  Échec Resend:', resendError?.message || resendError);
      }
    }

    // Si tout a échoué
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Impossible d'envoyer l'e-mail pour le moment. Vérifiez la configuration SMTP ou RESEND_API_KEY."
      })
    };

  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi de l\'e-mail:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Erreur lors de l'envoi de l'e-mail. Veuillez réessayer plus tard."
      })
    };
  }
};