import { useState } from 'react';
import apiRequest from '../api/apiRequest';

function Chatpage() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'ready', 'error'
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploadStatus('uploading');

    // TODO 1: Create a FormData object and append the file to it
    // hint: const formData = new FormData(); formData.append('file', file);

    // TODO 2: Call apiRequest to POST to '/api/documents/upload'
    // IMPORTANT: don't set Content-Type header manually — let the browser set it
    // for FormData, it automatically adds the correct multipart boundary
    // hint: apiRequest(url, { method: 'POST', body: formData, headers: {} })

    // TODO 3: If response is ok, setUploadStatus('ready')
    // If not, setUploadStatus('error')
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setReply('');
    setLoading(true);

    try {
      const response = await apiRequest('http://localhost:5000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
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
          setReply(prev => prev + parsed.content);
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* File upload section */}
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          id="fileInput"
          style={{ display: 'none' }}
        />
        <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
          📎 Upload PDF
        </label>
        {uploadStatus === 'uploading' && <span> Uploading {fileName}...</span>}
        {uploadStatus === 'ready' && <span> ✅ {fileName} ready — ask me anything!</span>}
        {uploadStatus === 'error' && <span> ❌ Upload failed, try again</span>}
      </div>

      {/* Chat section */}
      <form onSubmit={handleSend}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      <p>{reply}</p>
    </div>
  );
}

export default Chatpage;