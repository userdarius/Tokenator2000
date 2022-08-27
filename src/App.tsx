import React from 'react';
import './App.css';
import './components/MintToken';
import MintToken from "./components/MintToken";
import MintNft from "./components/MintNft";
import SendSOL from "./components/SendSOL";

function App() {
  return (
    <div className="App">
      <header className="App-header">
          <MintToken/>
          <MintNft/>
          <SendSOL/>
      </header>
    </div>
  );
}

export default App;
