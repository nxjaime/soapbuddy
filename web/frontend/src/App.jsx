import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TierGate from './components/TierGate'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import AuthPage from './pages/Auth'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Ingredients from './pages/Ingredients'
import Recipes from './pages/Recipes'
import Production from './pages/Production'
import Inventory from './pages/Inventory'

import FormulaDesigner from './pages/FormulaDesigner'
import Suppliers from './pages/Suppliers'
import SupplyOrders from './pages/SupplyOrders'
import Customers from './pages/Customers'
import SalesOrders from './pages/SalesOrders'
import Expenses from './pages/Expenses'
import Financials from './pages/Financials'
import Traceability from './pages/Traceability'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import PrintRecipe from './pages/PrintRecipe'
import ShoppingList from './pages/ShoppingList'
import MoldManager from './pages/MoldManager'
import LabelStudio from './components/LabelStudio'

import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="ingredients" element={<Ingredients />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="production" element={
                <TierGate featureId="production"><Production /></TierGate>
              } />
              <Route path="inventory" element={
                <TierGate featureId="inventory"><Inventory /></TierGate>
              } />
              <Route path="formula-designer" element={<FormulaDesigner />} />
              <Route path="calculator" element={<Navigate to="/formula-designer" replace />} />
              <Route path="suppliers" element={
                <TierGate featureId="supplyChain"><Suppliers /></TierGate>
              } />
              <Route path="supply-orders" element={
                <TierGate featureId="supplyChain"><SupplyOrders /></TierGate>
              } />
              <Route path="customers" element={
                <TierGate featureId="salesTracking"><Customers /></TierGate>
              } />
              <Route path="sales-orders" element={
                <TierGate featureId="salesTracking"><SalesOrders /></TierGate>
              } />
              <Route path="expenses" element={
                <TierGate featureId="salesTracking"><Expenses /></TierGate>
              } />
              <Route path="financials" element={
                <TierGate featureId="financialInsights"><Financials /></TierGate>
              } />
              <Route path="traceability" element={
                <TierGate featureId="traceability"><Traceability /></TierGate>
              } />
              <Route path="label-creator" element={
                <TierGate featureId="labelCreator"><LabelStudio /></TierGate>
              } />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
              <Route path="shopping-list" element={<ShoppingList />} />
              <Route path="molds" element={
                <TierGate featureId="production"><MoldManager /></TierGate>
              } />
              <Route path="formula-designer/print" element={<PrintRecipe />} />
            </Route>
          </Routes>
        </SettingsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App
