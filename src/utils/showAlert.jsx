


export const showMessage = (message) => async (dispatch) => {
	dispatch({type: 'setMessage',message: message});
}


export const showError = (message) => async (dispatch) => {
	dispatch({type: 'setError',message: message});
}

export const clearMessage = () => (dispatch) => {
	dispatch({type: 'clearMessage'});
}

export const clearError = () => (dispatch) => {
	dispatch({type: 'clearError'});
}