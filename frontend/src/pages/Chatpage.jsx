import { useState, useEffect } from 'react';
import apiRequest from '../api/apiRequest';

function Chatpage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileName, setFileName] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await apiRequest('http://localhost:5000/api/conversations', {
        method: 'GET',
      });
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await apiRequest('http://localhost:5000/api/conversations', {
        method: 'POST',
      });
      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation._id);
      setChatHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    try {
      const response = await apiRequest(
        `http://localhost:5000/api/conversations/${conversationId}/messages`,
        { method: 'GET' }
      );
      const messages = await response.json();
      setChatHistory(messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiRequest('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) setUploadStatus('ready');
      else setUploadStatus('error');
    } catch (err) {
      setUploadStatus('error');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConversationId) {
      alert('Please start a new chat first');
      return;
    }

    const userMessage = message;
    setMessage('');
    setLoading(true);

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await apiRequest('http://localhost:5000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          conversationId: activeConversationId,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const dataStr = line.replace('data: ', '');
          if (dataStr === '[DONE]') continue;
          const parsed = JSON.parse(dataStr);

          setChatHistory(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + parsed.content
            };
            return updated;
          });
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      loadConversations();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => handleSelectConversation(conv._id)}
              className={`px-4 py-3 cursor-pointer border-l-4 transition-colors ${
                activeConversationId === conv._id
                  ? 'bg-blue-50 border-blue-600 text-blue-600'
                  : 'border-transparent hover:bg-gray-100'
              }`}
            >
              <p className="text-sm font-medium truncate">{conv.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload status */}
        {uploadStatus && (
          <div className="px-6 py-2">
            {uploadStatus === 'uploading' && (
              <p className="text-sm text-yellow-600">📤 Uploading {fileName}...</p>
            )}
            {uploadStatus === 'ready' && (
              <p className="text-sm text-green-600">✅ {fileName} ready!</p>
            )}
            {uploadStatus === 'error' && (
              <p className="text-sm text-red-600">❌ Upload failed</p>
            )}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              id="fileInput"
              className="hidden"
            />
            <label
              htmlFor="fileInput"
              className="text-2xl cursor-pointer hover:text-blue-600 transition-colors"
            >
              📎
            </label>

            <form onSubmit={handleSend} className="flex-1 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={activeConversationId ? "Type a message..." : "Start a new chat first"}
                disabled={loading || !activeConversationId}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !activeConversationId}
                className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳' : '→'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatpage;