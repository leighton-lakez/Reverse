const Debug = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Check if these are defined:</h2>
        <p><strong>VITE_SUPABASE_URL:</strong> {url || '❌ UNDEFINED'}</p>
        <p><strong>VITE_SUPABASE_PUBLISHABLE_KEY:</strong> {key ? '✅ DEFINED' : '❌ UNDEFINED'}</p>
        <p><strong>VITE_SUPABASE_PROJECT_ID:</strong> {import.meta.env.VITE_SUPABASE_PROJECT_ID || '❌ UNDEFINED'}</p>
        <p><strong>VITE_OPENAI_API_KEY:</strong> {import.meta.env.VITE_OPENAI_API_KEY ? '✅ DEFINED' : '❌ UNDEFINED'}</p>

        <h3 style={{ marginTop: '30px' }}>URL Details:</h3>
        <p><strong>Length:</strong> {url?.length || 0} characters</p>
        <p><strong>Has quotes?</strong> {url?.includes('"') || url?.includes("'") ? '⚠️ YES - THIS IS THE PROBLEM!' : '✅ No'}</p>
        <p><strong>Has spaces?</strong> {url?.trim().length !== url?.length ? '⚠️ YES - THIS IS THE PROBLEM!' : '✅ No'}</p>
        <code style={{ background: '#f0f0f0', padding: '10px', display: 'block', wordBreak: 'break-all' }}>
          {url || 'MISSING'}
        </code>

        <h3 style={{ marginTop: '30px' }}>Key Details:</h3>
        <p><strong>Length:</strong> {key?.length || 0} characters (should be ~200+)</p>
        <p><strong>Has quotes?</strong> {key?.includes('"') || key?.includes("'") ? '⚠️ YES - THIS IS THE PROBLEM!' : '✅ No'}</p>
        <p><strong>First 20 chars:</strong> {key?.substring(0, 20) || 'MISSING'}...</p>
        <p><strong>Last 20 chars:</strong> ...{key?.substring(key.length - 20) || 'MISSING'}</p>

        <h3 style={{ marginTop: '30px' }}>Expected URL:</h3>
        <code style={{ background: '#e8f5e9', padding: '10px', display: 'block' }}>
          https://webnxfdutvupmqhztora.supabase.co
        </code>

        <h3 style={{ marginTop: '30px' }}>Test Supabase Client:</h3>
        <button
          onClick={async () => {
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const cleanUrl = url?.trim().replace(/["']/g, '').replace(/\/$/, '');
              const cleanKey = key?.trim().replace(/["']/g, '');
              console.log('Testing with cleanUrl:', cleanUrl);
              console.log('Testing with cleanKey length:', cleanKey?.length);
              const client = createClient(cleanUrl!, cleanKey!);
              const { data, error } = await client.auth.getSession();
              alert(error ? `Error: ${error.message}` : 'Success! Client works!');
            } catch (err: any) {
              alert(`Error creating client: ${err.message}`);
              console.error(err);
            }
          }}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Supabase Connection
        </button>
      </div>
    </div>
  );
};

export default Debug;
