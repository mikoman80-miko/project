// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.23:8000/api', // Django 기본 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;