import React, { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";


const Signup = () => {
  const navigate = useNavigate();
  

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // TODO 1: Make a POST request to http://localhost:5000/api/auth/login
      // using fetch, with headers: { 'Content-Type': 'application/json' }
      // and body: JSON.stringify({ email, password })

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name,email, password })
      });



      // TODO 2: Parse the response as JSON (hint: await response.json())
      const data = await response.json()

      // TODO 3: If response.ok is false, throw an error with the message from the response
      // (hint: throw new Error(data.message))
      if (!response.ok) {
  throw new Error(data.message);
}

  navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };


    

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sign Up</h2>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="login-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
