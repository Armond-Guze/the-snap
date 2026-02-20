// Email templates for newsletter confirmation and welcome emails
// These templates can be used with your newsletter service (Mailchimp, ConvertKit, etc.)
import { SITE_URL } from '@/lib/site-config';

const EMAIL_SITE_URL = SITE_URL;

export const confirmationEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Subscription - The Game Snap</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f3f4f6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .email-body {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background-color: #1f2937;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .content {
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #1f2937;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-body">
            <div class="header">
                <div class="logo">🏈</div>
                <h1 class="title">Welcome to The Game Snap!</h1>
                <p class="subtitle">Confirm your subscription to get started</p>
            </div>
            
            <div class="content">
                <p>Thank you for subscribing to The Game Snap newsletter! You're one step away from receiving the best NFL insights, analysis, and breaking news.</p>
                
                <p>Please confirm your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{{CONFIRMATION_LINK}}" class="button">Confirm Subscription</a>
                </div>
                
                <p>Once confirmed, you'll receive:</p>
                <ul>
                    <li>📊 Weekly NFL Power Rankings</li>
                    <li>⚡ Breaking news alerts</li>
                    <li>🎯 Exclusive analysis and insights</li>
                    <li>📈 Fantasy football tips</li>
                </ul>
                
                <p>If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
            </div>
            
            <div class="footer">
                <p>© 2025 The Game Snap. All rights reserved.</p>
                <p>You're receiving this because you subscribed to our newsletter.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const welcomeEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to The Game Snap Family!</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f3f4f6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .email-body {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background-color: #1f2937;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .content {
            margin: 30px 0;
        }
        .feature-box {
            background-color: #f9fafb;
            border-left: 4px solid #1f2937;
            padding: 20px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #1f2937;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-body">
            <div class="header">
                <div class="logo">🏈</div>
                <h1 class="title">Welcome to the Team!</h1>
                <p class="subtitle">Your subscription is confirmed</p>
            </div>
            
            <div class="content">
                <p>🎉 <strong>Congratulations!</strong> You're now part of The Game Snap family and will receive our premium NFL content straight to your inbox.</p>
                
                <div class="feature-box">
                    <h3 style="margin-top: 0; color: #1f2937;">What to Expect:</h3>
                    <ul style="margin-bottom: 0;">
                        <li><strong>Weekly Newsletter:</strong> Every Tuesday with power rankings, analysis, and predictions</li>
                        <li><strong>Breaking News:</strong> Instant alerts for major trades, injuries, and signings</li>
                        <li><strong>Exclusive Content:</strong> In-depth analysis you won't find anywhere else</li>
                        <li><strong>Fantasy Tips:</strong> Weekly insights to dominate your league</li>
                    </ul>
                </div>
                
                <p>While you wait for your first newsletter, explore our website for the latest NFL content:</p>
                
                <div style="text-align: center;">
                    <a href="${EMAIL_SITE_URL}/headlines" class="button">Read Latest Headlines</a>
                </div>
                
                <p>Have questions or feedback? Reply to this email - we read every message!</p>
                
                <p>Thanks for joining us,<br>
                <strong>The Game Snap Team</strong></p>
            </div>
            
            <div class="footer">
                <p>© 2025 The Game Snap. All rights reserved.</p>
                <p><a href="{{UNSUBSCRIBE_LINK}}" style="color: #6b7280;">Unsubscribe</a> | <a href="${EMAIL_SITE_URL}" style="color: #6b7280;">Visit Website</a></p>
            </div>
        </div>
    </div>
</body>
</html>
`;

// Newsletter template for weekly sends
export const weeklyNewsletterTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Game Snap Weekly - {{WEEK_TITLE}}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f3f4f6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .email-body {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background-color: #1f2937;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .date {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0 0 0;
        }
        .section {
            margin: 40px 0;
        }
        .section-title {
            color: #1f2937;
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .article {
            margin: 20px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 6px;
        }
        .article-title {
            color: #1f2937;
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 8px 0;
        }
        .article-summary {
            color: #4b5563;
            font-size: 14px;
            margin: 0 0 10px 0;
        }
        .read-more {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-body">
            <div class="header">
                <div class="logo">🏈</div>
                <h1 class="title">The Game Snap Weekly</h1>
                <p class="date">{{CURRENT_DATE}}</p>
            </div>
            
            <!-- Power Rankings Section -->
            <div class="section">
                <h2 class="section-title">📊 This Week's Power Rankings</h2>
                {{POWER_RANKINGS_CONTENT}}
            </div>
            
            <!-- Headlines Section -->
            <div class="section">
                <h2 class="section-title">📰 Top Headlines</h2>
                {{HEADLINES_CONTENT}}
            </div>
            
            <!-- Analysis Section -->
            <div class="section">
                <h2 class="section-title">🎯 Week Ahead</h2>
                {{ANALYSIS_CONTENT}}
            </div>
            
            <div class="footer">
                <p>© 2025 The Game Snap. All rights reserved.</p>
                <p><a href="{{UNSUBSCRIBE_LINK}}" style="color: #6b7280;">Unsubscribe</a> | <a href="${EMAIL_SITE_URL}" style="color: #6b7280;">Visit Website</a> | <a href="mailto:thegamesnap@yahoo.com" style="color: #6b7280;">Contact Us</a></p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const emailTemplates = {
  confirmationEmailTemplate,
  welcomeEmailTemplate,
  weeklyNewsletterTemplate,
};

export default emailTemplates;
