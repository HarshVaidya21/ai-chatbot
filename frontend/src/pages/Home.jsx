import React from 'react'
import { Link } from "react-router-dom";
import apiRequest from '../api/apiRequest';

export default function Home() {
    const testProtected = async () => {
        const response = await apiRequest('http://localhost:5000/api/auth/test-protected', { method: 'GET' });
        const data = await response.json();
        console.log(data);
    }

    return (
        <div className="h-screen w-full bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url("/Chatbot.avif")' }}>
            
            
            <div className="absolute inset-0 bg-black/40"></div>

            
            <div className="relative z-10 text-center space-y-6">
                <h1 className="text-5xl font-bold text-white mb-8">
                    Welcome to Chatbot
                </h1>

                <button
                    onClick={testProtected}
                    className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Test Protected Route
                </button>

                <div>
                    <Link
                        to="/login"
                        className="text-white text-lg font-bold hover:text-blue-300 transition-colors underline"
                    >
                        Click here to use it free.
                    </Link>
                </div>
            </div>
        </div>
    )
}