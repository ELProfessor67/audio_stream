import {createReducer} from '@reduxjs/toolkit';

const initailstate = {
    loading: false,
    user: null,
    isAuth: null,
    message: null,
    error: null
};

export const userReducer = createReducer(initailstate,{
    loadUserReq: (state) => {
        state.loading = true;
    },
    loadUserSuc: (state,action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuth = true;
        state.message = action.payload.message
    },
    loadUserFai: (state,action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuth = true;
    },
});