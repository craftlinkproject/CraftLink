// Import Redux Toolkit core functions
import { configureStore, combineReducers } from "@reduxjs/toolkit";
// Import Redux Persist for state persistence
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
// Import reducers for each feature slice
import messageReducer from "./messageSlice";
import userReducer from "./userSlice";
import courseSlice from "./courseSlice";
import lectureSlice from "./lectureSlice";
import postReducer from "./postSlice";
import walletReducer from "./walletSlice";
// Combine all feature reducers into a single root reducer
const rootReducer = combineReducers({
  user: userReducer,         // Handles user authentication and profile state
  course: courseSlice,       // Manages course-related state
  lecture: lectureSlice,     // Manages lectures within courses
  messages: messageReducer,  // Handles messaging and chat state
  posts: postReducer,        // Handles posts and related actions
  wallet: walletReducer,     // Handles wallet/earnings data
});
// Configuration for Redux Persist
const persistConfig = {
  key: "root",               // Key for persisted state in storage
  storage,                   // Storage engine (localStorage)
  whitelist: ["user"],       // Only persist the user slice
};
// Create a persisted reducer using the configuration above
const persistedReducer = persistReducer(persistConfig, rootReducer);
// Configure the Redux store
export const store = configureStore({
  reducer: persistedReducer, // Use the persisted reducer
  middleware: (getDefaultMiddleware) =>
    // Disable serializableCheck for Redux Persist compatibility
    getDefaultMiddleware({ serializableCheck: false }),
});
export const persistor = persistStore(store);