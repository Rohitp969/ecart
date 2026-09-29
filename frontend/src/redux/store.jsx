import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import productSlice from "./productSlice"
import {
  createMigrate,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const migrations = {
  // v2: addresses moved to the user's account on the server; drop the old browser copy
  // (it was shared by everyone who logged in on this browser)
  2: (state) => {
    // eslint-disable-next-line no-unused-vars
    const { addresses, selectedAddress, ...product } = state?.product || {}
    return { ...state, product }
  },
}

const persistConfig = {
  key: 'root',
  version: 2,
  storage,
  migrate: createMigrate(migrations, { debug: false }),
}

const rootReducer = combineReducers({
    user:userSlice,
    product: productSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export default store

