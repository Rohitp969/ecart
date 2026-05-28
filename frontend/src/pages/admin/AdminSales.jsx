import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'

const AdminSales = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    salesByDate: [],
    topProducts: [],
    categoryDistribution: [],
    recentOrders: [],
    previousPeriodStats: {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30) // days

  const fetchStats = async () => {
    setLoading(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/orders/sales`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: { days: timeRange }
      })
      if (res.data.success) {
        setStats(res.data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      change: calculateChange(stats.totalUsers, stats.previousPeriodStats?.totalUsers || 0)
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-600',
      change: calculateChange(stats.totalProducts, stats.previousPeriodStats?.totalProducts || 0)
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600',
      change: calculateChange(stats.totalOrders, stats.previousPeriodStats?.totalOrders || 0)
    },
    {
      title: 'Total Sales',
      value: `$${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600',
      change: calculateChange(stats.totalSales, stats.previousPeriodStats?.totalSales || 0)
    }
  ]

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B731']

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-lg font-bold text-gray-700">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
   
      <div className="pl-[280px] py-8 pr-8 m-15">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-lg bg-white shadow-sm border border-gray-200 p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Last {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    parseFloat(stat.change) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(stat.change) >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">{Math.abs(parseFloat(stat.change))}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Sales Trend Chart */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  Sales Trend
                </CardTitle>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* <div style={{ height: 350 }}> */}
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesByDate}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F472B6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F472B6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#F472B6" 
                      strokeWidth={2}
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* <div style={{ height: 350 }}> */}
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(stats.categoryDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Top Products */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* <div style={{ height: 350 }}> */}
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts || []} layout="vertical">
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="sales" fill="#4ECDC4" radius={[0, 4, 4, 0]}>
                      {(stats.topProducts || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Orders */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Daily Orders Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* <div style={{ height: 350 }}> */}
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.salesByDate}>
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#F7B731" 
                      strokeWidth={2}
                      dot={{ fill: '#F7B731', strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table */}
        {stats.recentOrders && stats.recentOrders.length > 0 && (
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">#{order.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.customer}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">${order.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AdminSales