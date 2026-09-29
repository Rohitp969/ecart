import { createSlice } from "@reduxjs/toolkit"

const userSlice = createSlice({
    name:'User',
    initialState:{
        user:null
    },
    reducers:{
        //actions
        setUser:(state, action)=>{
            state.user = action.payload
        },
        // saved delivery addresses live on the user (server-side address book)
        setAddresses:(state, action)=>{
            if(state.user) state.user.addresses = action.payload
        }
    }
})

export const {setUser, setAddresses} = userSlice.actions
export default userSlice.reducer
