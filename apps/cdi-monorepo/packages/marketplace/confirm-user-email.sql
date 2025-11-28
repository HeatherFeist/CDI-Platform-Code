-- Manually confirm existing user email
-- Replace 'your-email@example.com' with your actual email

UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'your-email@example.com';