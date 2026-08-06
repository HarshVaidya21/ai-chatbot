import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Signup from './pages/SignUp';
import Login from './pages/Login';
import Home from './pages/Home';
import Chatpage from './pages/Chatpage';


function App() {
  return (
    <>
      <BrowserRouter>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chatpage" element={<Chatpage />} />
        </Routes>


      </BrowserRouter>

    </>
  )
}
export default App
