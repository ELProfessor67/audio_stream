import {createReducer} from '@reduxjs/toolkit';

const initailstate = {
    loading: false,
    user: null,
    isAuth: null,
    message: null,
    error: null
};

export const userReducer = createReducer(initailstate,{
    // load user 
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
        state.isAuth = false;
    },

    // logout user 
    logoutUserReq: (state) => {
        state.loading = true;
    },
    logoutUserSuc: (state,action) => {
        state.loading = false;
        state.user = null;
        state.isAuth = false;
        state.message = action.payload.message
    },
    logoutUserFai: (state,action) => {
        state.loading = false;
        state.error = action.payload;
    },

});