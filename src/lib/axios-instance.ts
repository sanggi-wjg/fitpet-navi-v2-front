import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/env'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const promise = axiosInstance(config).then(({ data }) => data)
  return promise
}

export default customInstance
