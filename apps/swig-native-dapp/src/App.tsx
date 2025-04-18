import SwigPermissionsDemo from './components/SwigPermissionsDemo';

const App: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Swig Native Dapp Example
          </h1>
          <p className='mt-2 text-gray-600'>
            This demonstrates a dapp that is integrated with Swig's role-based
            permission system
          </p>
        </div>
      </header>
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='bg-white shadow overflow-hidden sm:rounded-lg p-6'>
          <div className='mt-8'>
            <SwigPermissionsDemo />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
