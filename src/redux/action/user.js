const { default: axios } = require("axios");


export const loadme = () => async (dispath) => {
    try {
        dispath({type: 'loadUserReq'});

        const {data} = await axios.get('/api/v1/load-me');

        dispath({type: 'loadUserSuc',payload: data});
    } catch (error) {
        dispath({type: 'loadUserFai',payload: null});
        console.log(error.response.data.message);
    }
}