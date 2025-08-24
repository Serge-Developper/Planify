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
    await transporter.sendMail(mailOptions);
    
    return { statusCode: 200, headers, body: JSON.stringify({ 
      success: true, 
      message: 'Le message a été envoyé avec succès.' 
    }) };

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ 
      success: false, 
      message: "Erreur lors de l'envoi de l'e-mail." 
    }) };
  }
};