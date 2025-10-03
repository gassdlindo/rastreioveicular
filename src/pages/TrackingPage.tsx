import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Gauge } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  status: string;
  last_location_lat: number | null;
  last_location_lng: number | null;
  last_seen: string | null;
}

interface TrackingPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export default function TrackingPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedVehicle) {
      fetchTrackingData(selectedVehicle.id);
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('license_plate');

      if (error) throw error;

      const vehiclesList = data || [];
      setVehicles(vehiclesList);
      if (vehiclesList.length > 0 && !selectedVehicle) {
        setSelectedVehicle(vehiclesList[0]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('tracking_history')
        .select('id, latitude, longitude, speed, timestamp')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrackingData(data || []);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const simulateTracking = async () => {
    if (!selectedVehicle || !user) return;

    const baseLatitude = -23.5505;
    const baseLongitude = -46.6333;

    const newPoint = {
      vehicle_id: selectedVehicle.id,
      latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
      longitude: baseLongitude + (Math.random() - 0.5) * 0.1,
      speed: Math.random() * 80 + 20,
      heading: Math.random() * 360,
      altitude: Math.random() * 100 + 700,
      accuracy: Math.random() * 10 + 5,
    };

    try {
      const { error: insertError } = await supabase
        .from('tracking_history')
        .insert(newPoint);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          last_location_lat: newPoint.latitude,
          last_location_lng: newPoint.longitude,
          last_seen: new Date().toISOString(),
        })
        .eq('id', selectedVehicle.id);

      if (updateError) throw updateError;

      await fetchTrackingData(selectedVehicle.id);
      await fetchVehicles();
    } catch (error) {
      console.error('Error simulating tracking:', error);
    }
  };

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

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum veículo ativo
        </h3>
        <p className="text-gray-600">
          Adicione veículos e ative-os para começar o rastreamento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rastreamento em Tempo Real</h1>
          <p className="text-gray-600">Monitore a localização dos seus veículos</p>
        </div>
        <button
          onClick={simulateTracking}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Navigation className="w-5 h-5" />
          <span>Simular Localização</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Veículos Ativos</h3>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedVehicle?.id === vehicle.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {vehicle.license_plate}
                  </div>
                  <div className="text-sm text-gray-600">
                    {vehicle.brand} {vehicle.model}
                  </div>
                  {vehicle.last_seen && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(vehicle.last_seen)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedVehicle && selectedVehicle.last_location_lat && selectedVehicle.last_location_lng && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Localização Atual</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Coordenadas</div>
                    <div className="text-sm text-gray-600">
                      {selectedVehicle.last_location_lat.toFixed(6)}, {selectedVehicle.last_location_lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Mapa de Rastreamento</h3>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              </div>

              {selectedVehicle && selectedVehicle.last_location_lat && selectedVehicle.last_location_lng ? (
                <div className="relative z-10 text-center">
                  <div className="bg-white p-6 rounded-xl shadow-lg max-w-md">
                    <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-bounce" />
                    <h4 className="font-bold text-gray-900 mb-2">
                      {selectedVehicle.license_plate}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Última localização registrada
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Coordenadas GPS</p>
                      <p className="font-mono text-sm text-gray-900">
                        {selectedVehicle.last_location_lat.toFixed(6)}, {selectedVehicle.last_location_lng.toFixed(6)}
                      </p>
                    </div>
                    {selectedVehicle.last_seen && (
                      <p className="text-xs text-gray-500 mt-3">
                        Atualizado em: {formatDate(selectedVehicle.last_seen)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma localização registrada</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Clique em "Simular Localização" para adicionar dados
                  </p>
                </div>
              )}
            </div>

            {trackingData.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Últimas Posições</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trackingData.map((point) => (
                    <div
                      key={point.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(point.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Gauge className="w-4 h-4" />
                        <span>{point.speed.toFixed(1)} km/h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
