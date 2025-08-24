import React from 'react';
import { Link } from 'react-router-dom';
import '../css/HomePage.css';

export const HomePage = () => {
  return (
    <div className="home">
      <h1>Embalming Girl</h1>
      <p>冰冷的她醒来之前！</p>
      <Link to="/lobby" className="btn">
        进入大厅
      </Link>
    </div>
  );
};