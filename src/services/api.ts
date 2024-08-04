import axios from 'axios';
import { API_URL } from '../variables/Variables';

export const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});