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
    // Vérifier les variables d'environnement
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Variables d\'environnement manquantes:', {
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Configuration email manquante. Veuillez contacter l'administrateur."
        })
      };
    }

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
      // Utiliser l'adresse du compte comme expéditeur (DMARC/SPF safe)
      from: `"Planify Contact" <${process.env.EMAIL_USER}>`,
      // Répondre directement à l'expéditeur du formulaire
      replyTo: email_from,
      to: 'planifymmi@gmail.com', // Your receiving email address
      subject: `Nouveau message de contact : ${subject}`,
      html: `
        <h3>Nouveau message depuis le formulaire de contact Planify</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email_from}</p>
        <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
        <p><strong>Promo :</strong> ${Promo || 'Non renseigné'}</p>
        <hr>
        <h4>Sujet : ${subject}</h4>
        <p>${Description}</p>
      `
    };

    console.log('Envoi de l\'email...');
    
    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Email envoyé avec succès');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Le message a été envoyé avec succès.'
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