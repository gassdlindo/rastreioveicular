import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, MapPin, Car as CarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddVehicleModal from '../components/AddVehicleModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  last_location_lat: number | null;
  last_location_lng: number | null;
  last_seen: string | null;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  useEffect(() => {
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  const fetchVehicles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
      setFilteredVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
      setDeletingVehicle(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inativo' },
      maintenance: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Manutenção' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Veículos</h1>
          <p className="text-gray-600">Cadastre e gerencie sua frota de veículos</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Veículo</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por placa, marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece adicionando seu primeiro veículo'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Veículo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <CarIcon className="w-6 h-6 text-blue-600" />
                </div>
                {getStatusBadge(vehicle.status)}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {vehicle.license_plate}
              </h3>
              <p className="text-gray-600 mb-4">
                {vehicle.brand} {vehicle.model}
                {vehicle.year && ` (${vehicle.year})`}
              </p>

              {vehicle.color && (
                <p className="text-sm text-gray-500 mb-2">Cor: {vehicle.color}</p>
              )}

              {vehicle.last_location_lat && vehicle.last_location_lng && (
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  Localização: {vehicle.last_location_lat.toFixed(4)}, {vehicle.last_location_lng.toFixed(4)}
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setShowAddModal(true);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setDeletingVehicle(vehicle)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddVehicleModal
          vehicle={editingVehicle}
          onClose={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
          }}
          onSuccess={() => {
            fetchVehicles();
            setShowAddModal(false);
            setEditingVehicle(null);
          }}
        />
      )}

      {deletingVehicle && (
        <DeleteConfirmModal
          title="Excluir Veículo"
          message={`Tem certeza que deseja excluir o veículo ${deletingVehicle.license_plate}? Esta ação não pode ser desfeita.`}
          onConfirm={() => handleDelete(deletingVehicle.id)}
          onCancel={() => setDeletingVehicle(null)}
        />
      )}
    </div>
  );
}
