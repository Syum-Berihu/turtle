import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "./components";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Provider>
    <App />
  </Provider>,
);
