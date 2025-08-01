import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import videosReducer from './slices/videosSlice';
import explorationReducer from './slices/explorationSlice';

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['user', 'videos', 'exploration'], // Persist user, videos, and exploration state
};

// Root reducer
const rootReducer = combineReducers({
  user: userReducer,
  videos: videosReducer,
  exploration: explorationReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
