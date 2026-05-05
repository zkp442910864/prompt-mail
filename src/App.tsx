import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/stores'
import { MailProvider } from '@/features/mail/context/MailContext'
import AppLayout from '@/components/AppLayout'
import InboxPage from '@/pages/InboxPage'
import SettingsPage from '@/pages/SettingsPage'
import 'virtual:uno.css'
import './assets/editor.css'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MailProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/inbox" replace />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </MailProvider>
    </QueryClientProvider>
  )
}
