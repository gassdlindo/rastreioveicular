import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, XCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Alert {
  id: string;
  vehicle_id: string | null;
  type: 'geofence' | 'speed' | 'offline' | 'maintenance';
  title: string;
  message: string | null;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  triggered_at: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({});
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate')
        .eq('user_id', user.id);

      if (error) throw error;

      const vehiclesMap: { [key: string]: Vehicle } = {};
      (data || []).forEach((v) => {
        vehiclesMap[v.id] = v;
      });
      setVehicles(vehiclesMap);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      geofence: 'Cerca Geográfica',
      speed: 'Excesso de Velocidade',
      offline: 'Veículo Offline',
      maintenance: 'Manutenção',
    };
    return labels[type] || type;
  };

  const filteredAlerts = filter === 'unread' ? alerts.filter((a) => !a.is_read) : alerts;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alertas e Notificações</h1>
          <p className="text-gray-600">Acompanhe os eventos importantes dos seus veículos</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Não Lidos ({alerts.filter((a) => !a.is_read).length})
          </button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'unread' ? 'Nenhum alerta não lido' : 'Nenhum alerta'}
          </h3>
          <p className="text-gray-600">
            {filter === 'unread'
              ? 'Todos os seus alertas foram lidos'
              : 'Você não tem alertas no momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition hover:shadow-md ${
                alert.is_read ? 'border-gray-200' : getAlertColor(alert.severity)
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.severity)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {getTypeLabel(alert.type)}
                        </span>
                        {!alert.is_read && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Novo
                          </span>
                        )}
                      </div>

                      {alert.message && (
                        <p className="text-gray-600 mb-3">{alert.message}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {alert.vehicle_id && vehicles[alert.vehicle_id] && (
                          <span className="flex items-center">
                            <Bell className="w-4 h-4 mr-1" />
                            {vehicles[alert.vehicle_id].license_plate}
                          </span>
                        )}
                        <span>{formatDate(alert.triggered_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition group"
                        title="Marcar como lido"
                      >
                        <CheckCircle className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition group"
                      title="Excluir alerta"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
