import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<p className="p-8 text-lg font-semibold">Urbaniq storefront</p>} />
      </Route>
    </Routes>
  );
}

export default App;
