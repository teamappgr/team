// ForgotPassword.tsx

import React, { useState } from 'react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API}send-email1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'User', 
          email: email,
          message: 'Please reset my password.',
        }),
      });

      if (!response.ok) {
        throw new Error('Error sending email');
      }

      const data = await response.text();
      setMessage(data); // Assuming the backend sends a success message
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Your Password?</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ForgotPassword;
