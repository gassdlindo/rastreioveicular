import { useEffect, useState } from 'react';
import { Car, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalVehicles: number;
  activeVehicles: number;
  totalAlerts: number;
  maintenanceVehicles: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalAlerts: 0,
    maintenanceVehicles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [vehiclesResult, alertsResult] = await Promise.all([
        supabase.from('vehicles').select('status').eq('user_id', user.id),
        supabase.from('alerts').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
      ]);

      const vehicles = vehiclesResult.data || [];
      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

      setStats({
        totalVehicles,
        activeVehicles,
        totalAlerts: alertsResult.count || 0,
        maintenanceVehicles,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Veículos',
      value: stats.totalVehicles,
      icon: Car,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Veículos Ativos',
      value: stats.activeVehicles,
      icon: Activity,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Alertas Pendentes',
      value: stats.totalAlerts,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenanceVehicles,
      icon: MapPin,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Visão Geral</h1>
        <p className="text-gray-600">Estatísticas e resumo da sua frota</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bem-vindo ao Sistema</h2>
        <p className="text-gray-600 mb-4">
          Este é o seu painel de rastreamento veicular. Aqui você pode:
        </p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Monitorar a localização em tempo real de todos os seus veículos
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Visualizar o histórico de rotas e trajetos percorridos
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Configurar alertas para eventos importantes como excesso de velocidade
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Gerenciar informações detalhadas sobre cada veículo da frota
          </li>
        </ul>
      </div>
    </div>
  );
}
