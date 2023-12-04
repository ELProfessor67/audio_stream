const { default: axios } = require("axios");


export const loadme = () => async (dispath) => {
    try {
        dispath({type: 'loadUserReq'});

        const {data} = await axios.get('/api/v1/load-me');
        console.log('user',data)
        dispath({type: 'loadUserSuc',payload: data});
    } catch (error) {
        console.warn('user',error);
        dispath({type: 'loadUserFai',payload: null});
        console.log(error.response.data.message);
    }
}

export const logout = () => async (dispath) => {
    try {
        dispath({type: 'logoutUserReq'});

        const {data} = await axios.get('/api/v1/login');


        dispath({type: 'logoutUserSuc',payload: data});

    } catch (error) {
        dispath({type: 'logoutUserFai',payload: error.response.data.message});
        console.log(error.response.data.message);
    }
}