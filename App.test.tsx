import React from 'react';

const App: React.FC = () => {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>TESTE - Sistema SROC</h1>
            <p>Se você está vendo isto, o React está funcionando!</p>
            <p>Timestamp: {new Date().toLocaleString()}</p>
        </div>
    );
};

export default App;
