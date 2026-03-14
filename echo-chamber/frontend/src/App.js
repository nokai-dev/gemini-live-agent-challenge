import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// WebSocket connection
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [connected, setConnected] = useState(false);
  const [crisisState, setCrisisState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);
  const [stock, setStock] = useState({ price: 145.50, change: -2.30, changePercent: -1.55 });
  const [userInput, setUserInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  // WebSocket setup
  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(WS_URL);
      
      ws.current.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.current.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    
    connectWebSocket();
    
    return () => {
      ws.current?.close();
    };
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'init':
      case 'crisis_started':
      case 'reset':
        setCrisisState(data.data);
        setMessages(data.data.messages || []);
        setNews(data.data.news || []);
        setStock({
          price: data.data.stock_price,
          change: data.data.stock_change,
          changePercent: data.data.stock_change_percent
        });
        setCurrentSpeaker(data.data.current_speaker);
        break;
        
      case 'agent_responses':
      case 'decision_processed':
        if (data.data.state) {
          setMessages(data.data.state.messages || []);
          setNews(data.data.state.news || []);
          setStock({
            price: data.data.state.stock_price,
            change: data.data.state.stock_change,
            changePercent: data.data.state.stock_change_percent
          });
        }
        break;
        
      case 'interrupt':
        // Handle interruption
        break;
        
      default:
        break;
    }
  }, []);

  const startSimulation = async () => {
    try {
      await fetch(`${API_URL}/api/start`, { method: 'POST' });
      setIsSimulating(true);
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const resetSimulation = async () => {
    try {
      await fetch(`${API_URL}/api/reset`, { method: 'POST' });
      setIsSimulating(false);
      setMessages([]);
      setNews([]);
    } catch (error) {
      console.error('Failed to reset simulation:', error);
    }
  };

  const sendMessage = () => {
    if (!userInput.trim() || !ws.current) return;
    
    ws.current.send(JSON.stringify({
      type: 'user_message',
      content: userInput
    }));
    
    setUserInput('');
  };

  const makeDecision = (decisionType) => {
    if (!ws.current) return;
    
    ws.current.send(JSON.stringify({
      type: 'decision',
      decision_type: decisionType,
      content: `Decision: ${decisionType}`
    }));
    
    setDecisionOptions(null);
  };

  const interruptAgents = () => {
    if (!ws.current) return;
    ws.current.send(JSON.stringify({ type: 'interrupt' }));
  };

  const getAgentIcon = (role) => {
    switch (role) {
      case 'cto': return '🔥';
      case 'pr_head': return '🛡️';
      case 'hostile_actor': return '💀';
      default: return '👤';
    }
  };

  const getAgentName = (role) => {
    switch (role) {
      case 'cto': return 'Alex Chen, CTO';
      case 'pr_head': return 'Sarah Miller, PR Head';
      case 'hostile_actor': return 'UNKNOWN ACTOR';
      default: return 'Unknown';
    }
  };

  const getEmotionColor = (emotion) => {
    switch (emotion) {
      case 'panic': return '#ff4444';
      case 'defensive': return '#ffaa00';
      case 'threatening': return '#ff00ff';
      case 'relief': return '#44ff44';
      default: return '#888';
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔊</span>
          <h1>Echo-Chamber</h1>
        </div>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>
      </header>

      {/* Stock Ticker */}
      <div className="stock-ticker">
        <div className="stock-info">
          <span className="stock-symbol">TECH</span>
          <span className="stock-price">${stock.price.toFixed(2)}</span>
          <span className={`stock-change ${stock.change < 0 ? 'negative' : 'positive'}`}>
            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="crisis-timer">
          {isSimulating && <span className="live-indicator">● LIVE CRISIS</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="chat-header">
            <h2>Crisis Communications</h2>
            {currentSpeaker && (
              <span className="current-speaker">
                Speaking: {getAgentName(currentSpeaker)}
              </span>
            )}
          </div>
          
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>No messages yet. Start the simulation to begin.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-avatar">{getAgentIcon(msg.role)}</div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{getAgentName(msg.role)}</span>
                      <span 
                        className="message-emotion"
                        style={{ color: getEmotionColor(msg.emotion) }}
                      >
                        {msg.emotion.toUpperCase()}
                      </span>
                    </div>
                    <p className="message-text">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Decision Options */}
          {decisionOptions && (
            <div className="decision-panel">
              <h3>Make Your Decision</h3>
              <div className="decision-buttons">
                {decisionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className="decision-btn"
                    onClick={() => makeDecision(opt.id)}
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="input-area">
            <button 
              className="interrupt-btn"
              onClick={interruptAgents}
              disabled={!isSimulating}
            >
              ⏹ Interrupt
            </button>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isSimulating ? "Speak as CEO..." : "Start simulation to begin..."}
              disabled={!isSimulating}
            />
            <button 
              className="send-btn"
              onClick={sendMessage}
              disabled={!isSimulating || !userInput.trim()}
            >
              Send
            </button>
          </div>
        </div>

        {/* News Feed */}
        <div className="news-panel">
          <h2>📰 Breaking News</h2>
          <div className="news-list">
            {news.length === 0 ? (
              <p className="no-news">No breaking news...</p>
            ) : (
              news.map((item, idx) => (
                <div key={idx} className={`news-item severity-${item.severity}`}>
                  <div className="news-headline">{item.headline}</div>
                  <div className="news-meta">
                    <span className="news-source">{item.source}</span>
                    <span className="news-time">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <button 
          className="control-btn start"
          onClick={startSimulation}
          disabled={isSimulating}
        >
          ▶ Start Crisis
        </button>
        <button 
          className="control-btn reset"
          onClick={resetSimulation}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

export default App;