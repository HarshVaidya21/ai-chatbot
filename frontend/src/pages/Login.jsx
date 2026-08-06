import React, { useState } from "react";
import "./Login.css";
import { useNavigate, Link, redirect } from "react-router-dom";
import Chatpage from "./Chatpage";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO 1: Make a POST request to http://localhost:5000/api/auth/login
      // using fetch, with headers: { 'Content-Type': 'application/json' }
      // and body: JSON.stringify({ email, password })

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });



      // TODO 2: Parse the response as JSON (hint: await response.json())
      const data = await response.json()

      // TODO 3: If response.ok is false, throw an error with the message from the response
      // (hint: throw new Error(data.message))
      if (!response.ok) {
        throw new Error(data.message);
      }

      // TODO 4: If successful, store the token in localStorage
      // hint: localStorage.setItem('token', data.token)
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // TODO 5: Redirect the user somewhere (for now, just console.log("Logged in!"))
      console.log("hurray!")
      navigate("/chatpage");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>

      <div className="login-container">
        <div className="login-box">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          <p className="login-switch">
            New to chatbot? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </div>



    </>


  );
};

export default Login;
