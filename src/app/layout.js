import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Provider from '@/redux/Provider'
import UserProvider from '@/components/UserProvider'
import { ToastContainer } from 'react-toastify';
import MessageProvider from '@/components/MessageProvider'
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HGC Radio',
  description: 'HGC Radio created by hgc',
  icons: {
    icon: [
      {
        media: '(prefers-color-schema): light',
        url: '/images/logo.svg',
        href: '/images/logo.svg'
      }
    ]
  }
}

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.svg" type="image/svg" size="32x32"/>
      </head>
      <body className={inter.className}>
        <Provider>
          <UserProvider>
            <MessageProvider>
              <Header/>
              {children}
            </MessageProvider>
          </UserProvider>
        </Provider>
        <ToastContainer 
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  )
}
