import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Video, Home, Lightbulb, TrendingUp, BarChart3, LogOut, User, Zap, Sparkles, Youtube } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigation = [
    { name: 'ダッシュボード', href: '/', icon: Home },
    { name: 'AI企画案生成', href: '/planning', icon: Lightbulb },
    { name: 'トレンド分析', href: '/trends', icon: TrendingUp },
    { name: 'バイラル動画発見', href: '/viral', icon: Zap },
    { name: 'CSV分析', href: '/analytics', icon: BarChart3 },
    { name: '統合企画案', href: '/combined', icon: Sparkles },
    { name: 'チャンネル管理', href: '/channels', icon: Youtube },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-red-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                YouTube Content Studio AI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 YouTube Content Studio AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
