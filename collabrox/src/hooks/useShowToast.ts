import { useDispatch } from 'react-redux'
import { setToast } from '../toastSlice'


function useShowToast() {
    const dispatch = useDispatch()

    /**
     * Show toast/alert/message on screen
     * @param content The content to show up (if no content string - then content will be either 'Failed' or 'No internet connection')
     * @param type `{default : 'error'}`-- allows one of the following type  - 'error' | 'success' | 'info' | 'warning'| 'default'
     */
    const showToast = (content: string = navigator.onLine ? 'Failed' : 'No internet connection', type: 'info' | 'success' | 'warning' | 'error' | 'default' = 'error') => {
        dispatch(setToast({
            content,
            toastOptions: {
                type
            }
        }))
    }

    return showToast
}

export default useShowToast
