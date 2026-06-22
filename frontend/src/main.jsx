// ===================== React & DOM ===================== //
import React from "react";
import { createRoot } from "react-dom/client";
// ===================== Routing ===================== //
import { BrowserRouter } from "react-router-dom";

// ===================== Redux ===================== //
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";

// ===================== Context ===================== //
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";

// ===================== App ===================== //
import "./locales/i18n";
import App from "./App";

// ===================== Global Styles ===================== //
import "./styles/global.css";

// ===================== Render ===================== //
// Mount application
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element with id 'root' not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <ThemeProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
