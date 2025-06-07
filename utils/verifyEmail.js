const VerificationEmail = (username, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        p {
            font-size: 16px;
            color: #555555;
            line-height: 1.5;
        }
        .otp {
            display: block;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #e74c3c;
            margin: 20px 0;
        }
        .footer {
            font-size: 14px;
            color: #999999;
            text-align: center;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Email Verification</h1>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <span class="otp">${otp}</span>
        <p>This code will expire in 15 minutes. If you didn’t request this, you can safely ignore this email.</p>
        <div class="footer">
            &copy; ${new Date().getFullYear()} D2 Company. All rights reserved.
        </div>
    </div>
</body>
</html>
`;
};

export default VerificationEmail;
