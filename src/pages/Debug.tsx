const Debug = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Check if these are defined:</h2>
        <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '❌ UNDEFINED'}</p>
        <p><strong>VITE_SUPABASE_PUBLISHABLE_KEY:</strong> {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ DEFINED' : '❌ UNDEFINED'}</p>
        <p><strong>VITE_SUPABASE_PROJECT_ID:</strong> {import.meta.env.VITE_SUPABASE_PROJECT_ID || '❌ UNDEFINED'}</p>
        <p><strong>VITE_OPENAI_API_KEY:</strong> {import.meta.env.VITE_OPENAI_API_KEY ? '✅ DEFINED' : '❌ UNDEFINED'}</p>

        <h3 style={{ marginTop: '30px' }}>Full URL Value:</h3>
        <code style={{ background: '#f0f0f0', padding: '10px', display: 'block' }}>
          {import.meta.env.VITE_SUPABASE_URL || 'MISSING'}
        </code>

        <h3 style={{ marginTop: '30px' }}>Expected Value:</h3>
        <code style={{ background: '#e8f5e9', padding: '10px', display: 'block' }}>
          https://webnxfdutvupmqhztora.supabase.co
        </code>
      </div>
    </div>
  );
};

export default Debug;
