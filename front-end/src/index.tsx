import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './common/reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import Application from './components/Application/Application';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <Application />
    </React.StrictMode>
  </BrowserRouter>
);

reportWebVitals(console.log);