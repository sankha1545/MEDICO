import axios, { AxiosError } from 'axios';
import { useToast } from '../contexts/ToastContext';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Generic request wrapper
export const useAPI = () => {
  const { showToast } = useToast();

  const request = async <T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
  ): Promise<T> => {
    try {
      const response = await API({ method, url, data });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      const message =
        error.response?.data?.message || error.message || 'Unknown error';

      showToast({
        title: 'Request Failed',
        description: message,
        status: 'error',
      });

      throw err;
    }
  };

  return { request };
};