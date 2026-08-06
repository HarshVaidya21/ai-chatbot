import React from 'react'
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import apiRequest from '../api/apiRequest';

export default function Home() {
    const testProtected = async () => {
        const response = await apiRequest('http://localhost:5000/api/auth/test-protected', { method: 'GET' });
        const data = await response.json();
        console.log(data);
    }

    return (
        <>
            <div className="home-container">
                <div><b>Welcome to Chatbot</b></div><br/>
                <button onClick={testProtected}>Test Protected Route</button>
                <br/>
                <Link to="/login"><b>click here to use it free.</b> </Link><br />



            </div>


        </>

    )
}
