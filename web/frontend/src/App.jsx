import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import AuthPage from './pages/Auth'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Ingredients from './pages/Ingredients'
import Recipes from './pages/Recipes'
import Production from './pages/Production'

import Calculator from './pages/Calculator'
import Suppliers from './pages/Suppliers'
import SupplyOrders from './pages/SupplyOrders'
import Customers from './pages/Customers'
import SalesOrders from './pages/SalesOrders'
import Expenses from './pages/Expenses'
import Financials from './pages/Financials'
import Traceability from './pages/Traceability'
import Settings from './pages/Settings'
import PrintRecipe from './pages/PrintRecipe'

import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="production" element={<Production />} />

            <Route path="calculator" element={<Calculator />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="supply-orders" element={<SupplyOrders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="sales-orders" element={<SalesOrders />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="financials" element={<Financials />} />
            <Route path="traceability" element={<Traceability />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calculator/print" element={<PrintRecipe />} />
          </Route>
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App
