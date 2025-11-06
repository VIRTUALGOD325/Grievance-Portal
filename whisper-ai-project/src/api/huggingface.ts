import axios from 'axios';

const HUGGING_FACE_API_URL = 'https://api.huggingface.co/models';

export const getModelInfo = async (modelName: string) => {
    try {
        const response = await axios.get(`${HUGGING_FACE_API_URL}/${modelName}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching model info: ${error.message}`);
    }
};

export const sendRequestToModel = async (modelName: string, inputData: any) => {
    try {
        const response = await axios.post(`${HUGGING_FACE_API_URL}/${modelName}/predict`, inputData);
        return response.data;
    } catch (error) {
        throw new Error(`Error sending request to model: ${error.message}`);
    }
};