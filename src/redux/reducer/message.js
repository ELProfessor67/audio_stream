import {createReducer} from '@reduxjs/toolkit';

const initailstate = {
    message: null,
    error: null
};

export const messageReducer = createReducer(initailstate,{
    setMessage: (state,action) => {
        state.message = action.message;
    },
    clearMessage: (state) => {
        state.message = null;
    },
    setError: (state,action) => {
        state.error = action.message;
    },
    clearError: (state) => {
        state.error = null;
    },
});