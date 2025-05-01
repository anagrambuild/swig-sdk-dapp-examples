import { useState } from 'react';
import ParaOAuth from './components/oauth/ParaOAuth';

const App = () => {
  const [view, setView] = useState<'login' | 'para_oauth'>('para_oauth');

  if (view === 'para_oauth') {
    return <ParaOAuth />;
  }
};

export default App;
