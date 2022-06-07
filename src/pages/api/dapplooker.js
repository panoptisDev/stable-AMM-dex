import axios, { AxiosResponse } from 'axios'
export default async function handler(req, res) {
    const API_URL = "https://api.dapplooker.com/chart/9e2cb27e-553d-4943-8d76-6c3f15303ad9"
    try {
        const data = await axios.get(API_URL)
        return res.status(200).json(data.data)
    } catch (error) {
        console.log(error)
        return res.status(error.status || 500).end(error.message)
    }
}