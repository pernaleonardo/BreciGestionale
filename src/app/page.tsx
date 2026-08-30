'use client';

import React, { useState, useEffect } from 'react';
import {
  login,
  logout,
  getCurrentUser,
  getUsers,
  createUser,
  deleteUser,
  getTripsData,
  createTrip,
  deleteTrip,
  createClient,
  deleteClient,
  createDestination,
  deleteDestination,
  createDisposalPrice,
  deleteDisposalPrice,
  createTransportPrice,
  deleteTransportPrice,
  createDriver,
  deleteDriver,
  createVehicle,
  deleteVehicle,
  createWasteType,
  deleteWasteType,
} from './actions';

// Helper per formattare i numeri come valuta (€)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

// Helper per formattare i pesi
const formatWeight = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'registro' | 'anagrafiche' | 'utenti'>('registro');
  const [anagraficaSubTab, setAnagraficaSubTab] = useState<'clienti' | 'destinatari' | 'autisti' | 'mezzi' | 'cer' | 'listinoSmaltimento' | 'listinoTrasporti'>('clienti');
  
  // Dati dal database
  const [trips, setTrips] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [disposalPrices, setDisposalPrices] = useState<any[]>([]);
  const [transportPrices, setTransportPrices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Caricamento stati
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filtri registro
  const [filterCliente, setFilterCliente] = useState<string>('ALL');
  const [filterMese, setFilterMese] = useState<string>('ALL');

  // Modali inserimento
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Search input state for searchable selectors
  const [cerSearchInput, setCerSearchInput] = useState('');
  const [isCerDropdownOpen, setIsCerDropdownOpen] = useState(false);
  const [driverSearchInput, setDriverSearchInput] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [vehicleSearchInput, setVehicleSearchInput] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [destSearchInput, setDestSearchInput] = useState('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);

  // Form states
  const [loginError, setLoginError] = useState('');
  const [selectedTripClientId, setSelectedTripClientId] = useState('');
  const [newTripData, setNewTripData] = useState({
    date: '',
    firNumber: '',
    wasteTypeId: '',
    weight: '',
    cerPrice: '',
    transportPrice: '',
    disposalPrice: '',
    fuoriRomaPrice: '0',
    noleggioPrice: '0',
    bigBagPrice: '0',
    analisiPrice: '0',
    servRagnoPrice: '0',
    sostaPrice: '0',
    address: '',
    notes: '',
    destinationId: '',
    driverId: '',
    vehicleId: '',
  });

  const [newClientData, setNewClientData] = useState({ name: '', billingAddress: '', vatNumber: '', clientCode: '' });
  const [newDestinationData, setNewDestinationData] = useState({ name: '', address: '', shippingCode: '', clientId: '' });
  const [newDriverData, setNewDriverData] = useState({ name: '', email: '', phone: '', licenseNumber: '' });
  const [newVehicleData, setNewVehicleData] = useState({ plateNumber: '', model: '', capacity: '' });
  const [newWasteData, setNewWasteData] = useState({ cerCode: '', description: '' });
  const [newUserData, setNewUserData] = useState({ email: '', name: '', password: '', role: 'OPERATOR' });
  const [newDisposalPriceData, setNewDisposalPriceData] = useState({ clientId: '', wasteTypeId: '', pricePerQuintal: '' });
  const [newTransportPriceData, setNewTransportPriceData] = useState({ clientId: '', vehicleId: '', price: '' });
  const [cerSearchQuery, setCerSearchQuery] = useState('');
  const [cerCategoryFilter, setCerCategoryFilter] = useState('');

  // Caricamento iniziale sessione e dati
  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await refreshData(user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Inizializzazione fallita:', err);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Ricarica tutti i dati dal DB
  async function refreshData(user = currentUser) {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTripsData();
      setTrips(data.trips || []);
      setClients(data.clients || []);
      setDestinations(data.destinations || []);
      setDrivers(data.drivers || []);
      setVehicles(data.vehicles || []);
      setWasteTypes(data.wasteTypes || []);
      setDisposalPrices(data.disposalPrices || []);
      setTransportPrices(data.transportPrices || []);

      if (user.role === 'ADMIN') {
        const userList = await getUsers();
        setUsers(userList || []);
      }
    } catch (e) {
      console.error('Errore ricaricamento dati:', e);
    } finally {
      setLoading(false);
    }
  }

  // Azione di Login
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const formData = new FormData(e.currentTarget);
    const res = await login(null, formData);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      await refreshData(res.user);
    } else {
      setLoginError(res.error || 'Credenziali non valide.');
    }
  };

  // Azione di Logout
  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setTrips([]);
    setIsMenuOpen(false);
  };

  // Filtraggio viaggi
  const filteredTrips = trips.filter((trip) => {
    // Filtro per Cliente di fatturazione (legato alla destinazione del viaggio)
    if (filterCliente !== 'ALL') {
      const clientId = Number(filterCliente);
      if (trip.destination?.clientId !== clientId) {
        return false;
      }
    }

    // Filtro per Mese (la data è stringa es. "05/08/2026")
    if (filterMese !== 'ALL') {
      const parts = trip.date.split('/');
      if (parts.length === 3) {
        const monthYear = `${parts[1]}/${parts[2]}`; // es. "08/2026"
        if (monthYear !== filterMese) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  });

  // Estrae tutti i mesi/anni unici disponibili per il filtro
  const uniqueMonths = Array.from(
    new Set(
      trips
        .map((t) => {
          const parts = t.date.split('/');
          return parts.length === 3 ? `${parts[1]}/${parts[2]}` : null;
        })
        .filter((x): x is string => !!x)
    )
  ).sort();

  // Converti mese in stringa leggibile (es: "08/2026" -> "Agosto 2026")
  const getMonthName = (monthYearStr: string) => {
    const [m, y] = monthYearStr.split('/');
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  // Calcoli dei totali basati sul filtro corrente
  const totalTrips = filteredTrips.length;
  const totalWeight = filteredTrips.reduce((sum, t) => sum + (t.weight || 0), 0);
  const totalTransport = filteredTrips.reduce((sum, t) => sum + (t.transportPrice || 0) + (t.fuoriRomaPrice || 0), 0);
  const totalDisposal = filteredTrips.reduce((sum, t) => sum + (t.disposalPrice || 0), 0);
  const totalAccessories = filteredTrips.reduce(
    (sum, t) =>
      sum +
      (t.noleggioPrice || 0) +
      (t.bigBagPrice || 0) +
      (t.analisiPrice || 0) +
      (t.servRagnoPrice || 0) +
      (t.sostaPrice || 0),
    0
  );
  const totalTaxable = totalTransport + totalDisposal + totalAccessories;

  // ----------------- AZIONI MUTATIVE (CRUD) -----------------

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTrip(newTripData);
    if (res.success) {
      setIsTripModalOpen(false);
      setSelectedTripClientId('');
      setNewTripData({
        date: '', firNumber: '', wasteTypeId: '', weight: '', cerPrice: '',
        transportPrice: '', disposalPrice: '', fuoriRomaPrice: '0', noleggioPrice: '0',
        bigBagPrice: '0', analisiPrice: '0', servRagnoPrice: '0', sostaPrice: '0',
        address: '', notes: '', destinationId: '', driverId: '', vehicleId: '',
      });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa riga di viaggio?')) {
      const res = await deleteTrip(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createClient(newClientData);
    if (res.success) {
      setIsClientModalOpen(false);
      setNewClientData({ name: '', billingAddress: '', vatNumber: '', clientCode: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm('Rimuovendo il cliente verranno cancellati anche tutti i viaggi e le destinazioni ad esso associati. Continuare?')) {
      const res = await deleteClient(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createDestination({
      ...newDestinationData,
      clientId: Number(newDestinationData.clientId)
    });
    if (res.success) {
      setIsDestinationModalOpen(false);
      setNewDestinationData({ name: '', address: '', shippingCode: '', clientId: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDestination = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere questa destinazione? I viaggi associati verranno cancellati.')) {
      const res = await deleteDestination(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateDisposalPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisposalPriceData.wasteTypeId) {
      alert('Seleziona un codice CER.');
      return;
    }
    const res = await createDisposalPrice({
      clientId: newDisposalPriceData.clientId || null,
      wasteTypeId: Number(newDisposalPriceData.wasteTypeId),
      pricePerQuintal: Number(newDisposalPriceData.pricePerQuintal || 0),
    });
    if (res.success) {
      setNewDisposalPriceData({ clientId: '', wasteTypeId: '', pricePerQuintal: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDisposalPrice = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa voce di listino?')) {
      const res = await deleteDisposalPrice(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateTransportPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransportPriceData.vehicleId) {
      alert('Seleziona un veicolo.');
      return;
    }
    const res = await createTransportPrice({
      clientId: newTransportPriceData.clientId || null,
      vehicleId: Number(newTransportPriceData.vehicleId),
      price: Number(newTransportPriceData.price || 0),
    });
    if (res.success) {
      setNewTransportPriceData({ clientId: '', vehicleId: '', price: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteTransportPrice = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa voce di listino?')) {
      const res = await deleteTransportPrice(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const calculatePrefilledPrices = (destId: string, cerId: string, vehId: string, wt: string) => {
    let cerPrice = '';
    let transportPrice = '';
    let disposalPrice = '';

    const destination = destinations.find(d => d.id === Number(destId));
    const clientId = destination ? destination.clientId : null;

    if (cerId) {
      let dispPrice = disposalPrices.find(dp => dp.clientId === clientId && dp.wasteTypeId === Number(cerId));
      if (!dispPrice) {
        dispPrice = disposalPrices.find(dp => dp.clientId === null && dp.wasteTypeId === Number(cerId));
      }
      if (dispPrice) {
        const rate = dispPrice.pricePerQuintal;
        cerPrice = String(rate * 10);
        if (wt) {
          disposalPrice = String(Number(wt) * 10 * rate);
        }
      }
    }

    if (vehId) {
      let transPrice = transportPrices.find(tp => tp.clientId === clientId && tp.vehicleId === Number(vehId));
      if (!transPrice) {
        transPrice = transportPrices.find(tp => tp.clientId === null && tp.vehicleId === Number(vehId));
      }
      if (transPrice) {
        transportPrice = String(transPrice.price);
      }
    }

    return { cerPrice, transportPrice, disposalPrice };
  };

  const handleTripDestinationChange = (destId: string) => {
    const calculated = calculatePrefilledPrices(destId, newTripData.wasteTypeId, newTripData.vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      destinationId: destId,
      cerPrice: calculated.cerPrice !== '' ? calculated.cerPrice : prev.cerPrice,
      transportPrice: calculated.transportPrice !== '' ? calculated.transportPrice : prev.transportPrice,
      disposalPrice: calculated.disposalPrice !== '' ? calculated.disposalPrice : prev.disposalPrice
    }));
  };

  const handleTripWasteTypeChange = (wasteTypeId: string) => {
    const calculated = calculatePrefilledPrices(newTripData.destinationId, wasteTypeId, newTripData.vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      wasteTypeId: wasteTypeId,
      cerPrice: calculated.cerPrice !== '' ? calculated.cerPrice : prev.cerPrice,
      disposalPrice: calculated.disposalPrice !== '' ? calculated.disposalPrice : prev.disposalPrice
    }));
  };

  const handleTripVehicleChange = (vehicleId: string) => {
    const calculated = calculatePrefilledPrices(newTripData.destinationId, newTripData.wasteTypeId, vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      vehicleId: vehicleId,
      transportPrice: calculated.transportPrice !== '' ? calculated.transportPrice : prev.transportPrice
    }));
  };

  const handleTripWeightChange = (wt: string) => {
    const wtVal = Number(wt || 0);
    const cerPriceVal = Number(newTripData.cerPrice || 0);
    const calculatedDispPrice = wtVal * cerPriceVal;
    setNewTripData(prev => ({
      ...prev,
      weight: wt,
      disposalPrice: wt ? String(calculatedDispPrice) : ''
    }));
  };

  const handleTripCerPriceChange = (cp: string) => {
    const wtVal = Number(newTripData.weight || 0);
    const cpVal = Number(cp || 0);
    const calculatedDispPrice = wtVal * cpVal;
    setNewTripData(prev => ({
      ...prev,
      cerPrice: cp,
      disposalPrice: prev.weight ? String(calculatedDispPrice) : ''
    }));
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createDriver(newDriverData);
    if (res.success) {
      setIsDriverModalOpen(false);
      setNewDriverData({ name: '', email: '', phone: '', licenseNumber: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere l\'autista?')) {
      const res = await deleteDriver(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createVehicle(newVehicleData);
    if (res.success) {
      setIsVehicleModalOpen(false);
      setNewVehicleData({ plateNumber: '', model: '', capacity: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere il veicolo?')) {
      const res = await deleteVehicle(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createWasteType(newWasteData);
    if (res.success) {
      setIsWasteModalOpen(false);
      setNewWasteData({ cerCode: '', description: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteWaste = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere questo codice CER?')) {
      const res = await deleteWasteType(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createUser(newUserData);
    if (res.success) {
      setIsUserModalOpen(false);
      setNewUserData({ email: '', name: '', password: '', role: 'OPERATOR' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (currentUser?.id === id) {
      alert('Non puoi cancellare l\'utente corrente loggato!');
      return;
    }
    if (confirm('Sicuro di voler eliminare questo utente?')) {
      const res = await deleteUser(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  // ----------------- VISTA LOGIN -----------------

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Breci Trasporti s.r.l.</h1>
            <p className="text-zinc-400 mt-2">Logistica Rifiuti & Formulari (FIR)</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {loginError && (
              <div className="p-3 bg-red-950/30 border border-red-900 rounded-lg text-red-400 text-sm">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-zinc-300">Email o Utente</label>
              <input
                type="email"
                name="email"
                required
                className="w-full mt-2 p-3 bg-zinc-850 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="nome@brecitrasporti.it"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-300">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full mt-2 p-3 bg-zinc-850 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg font-bold text-white transition-colors cursor-pointer"
            >
              Accedi
            </button>
          </form>

          <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
            <p className="font-semibold text-zinc-400 mb-2">Credenziali Demo di Prova:</p>
            <p>Admin: <code className="text-zinc-300">admin@brecitrasporti.it</code> / <code className="text-zinc-300">admin</code></p>
            <p className="mt-1">Operator: <code className="text-zinc-300">operator@brecitrasporti.it</code> / <code className="text-zinc-300">operator</code></p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- VISTA PRINCIPALE -----------------

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Hamburger (Lasagna) button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-zinc-800 active:bg-zinc-700 rounded-lg focus:outline-none cursor-pointer"
            title="Menu di navigazione"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Breci Trasporti</h1>
            <p className="text-xs text-zinc-400 hidden sm:block">Gestione Logistica Rifiuti</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-zinc-400 capitalize">{currentUser.role.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-red-700/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Esci
          </button>
        </div>
      </header>

      {/* Lasagna Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex" onClick={() => setIsMenuOpen(false)}>
          <div
            className="w-72 bg-zinc-900 border-r border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <span className="font-bold text-lg text-white">Menu Funzionalità</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setActiveTab('registro'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'registro' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>🚚</span>
                  <span>Registro Giornaliero</span>
                </button>
                <button
                  onClick={() => { setActiveTab('anagrafiche'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'anagrafiche' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>📁</span>
                  <span>Anagrafiche (Master)</span>
                </button>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => { setActiveTab('utenti'); setIsMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'utenti' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                  >
                    <span>👥</span>
                    <span>Gestione Utenti</span>
                  </button>
                )}
              </nav>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-500 font-medium">Breci Trasporti s.r.l. © 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        
        {loading && trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            <p className="mt-4 text-zinc-400">Caricamento dati...</p>
          </div>
        ) : (
          <>
            {/* TAB: REGISTRO GIORNALIERO */}
            {activeTab === 'registro' && (
              <div>
                {/* Header view */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Registro Viaggi Giornaliero</h2>
                    <p className="text-sm text-zinc-400">Modifica o visualizza le movimentazioni dei rifiuti.</p>
                  </div>
                  <button
                    onClick={() => setIsTripModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto"
                  >
                    <span>+</span> Aggiungi Riga Viaggio
                  </button>
                </div>

                {/* Filters Row */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center">
                  <div className="flex flex-col">
                    <label className="text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Filtra per Cliente</label>
                    <select
                      value={filterCliente}
                      onChange={(e) => setFilterCliente(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">Tutti i Clienti</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Filtra per Mese</label>
                    <select
                      value={filterMese}
                      onChange={(e) => setFilterMese(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">Tutti i Mesi</option>
                      {uniqueMonths.map((m) => (
                        <option key={m} value={m}>{getMonthName(m)}</option>
                      ))}
                    </select>
                  </div>

                  {(filterCliente !== 'ALL' || filterMese !== 'ALL') && (
                    <button
                      onClick={() => { setFilterCliente('ALL'); setFilterMese('ALL'); }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold mt-4 sm:mt-0 cursor-pointer"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>

                {/* KPI Cards (based on filters) */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Viaggi Filtrati</p>
                    <p className="text-xl font-bold mt-2 text-white">{totalTrips}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Peso Gestito (t)</p>
                    <p className="text-xl font-bold mt-2 text-white">{formatWeight(totalWeight)} t</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Totale Trasporti</p>
                    <p className="text-xl font-bold mt-2 text-blue-400">{formatCurrency(totalTransport)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Totale Smaltimenti</p>
                    <p className="text-xl font-bold mt-2 text-amber-400">{formatCurrency(totalDisposal)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Imponibile Totale</p>
                    <p className="text-xl font-bold mt-2 text-emerald-400">{formatCurrency(totalTaxable)}</p>
                  </div>
                </section>

                {/* Table Container */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                          <th className="p-3">Data</th>
                          <th className="p-3">N. FIR</th>
                          <th className="p-3">CER</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Destinazione</th>
                          <th className="p-3 text-right">Peso (t)</th>
                          <th className="p-3">Mezzo</th>
                          <th className="p-3">Autista</th>
                          <th className="p-3 text-right">Trasporto</th>
                          <th className="p-3 text-right">Smaltimento</th>
                          <th className="p-3 text-right">Accessori</th>
                          <th className="p-3 text-right font-bold">Imponibile</th>
                          <th className="p-3 text-center">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-sm">
                        {filteredTrips.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="p-8 text-center text-zinc-500">Nessun viaggio trovato con i filtri selezionati.</td>
                          </tr>
                        ) : (
                          filteredTrips.map((trip) => {
                            const rowTransport = (trip.transportPrice || 0) + (trip.fuoriRomaPrice || 0);
                            const rowDisposal = trip.disposalPrice || 0;
                            const rowAccessories =
                              (trip.noleggioPrice || 0) +
                              (trip.bigBagPrice || 0) +
                              (trip.analisiPrice || 0) +
                              (trip.servRagnoPrice || 0) +
                              (trip.sostaPrice || 0);
                            const rowTaxable = rowTransport + rowDisposal + rowAccessories;

                            return (
                              <tr key={trip.id} className="hover:bg-zinc-800/40 transition-colors">
                                <td className="p-3 whitespace-nowrap font-medium">{trip.date}</td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded border border-zinc-700 text-zinc-300">
                                    {trip.firNumber}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-md bg-zinc-850 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-700">
                                    {trip.cerCode}
                                  </span>
                                </td>
                                <td className="p-3 truncate max-w-[150px]" title={trip.destination?.client?.name || ''}>
                                  {trip.destination?.client?.name || '-'}
                                </td>
                                <td className="p-3 truncate max-w-[150px]" title={trip.destination?.name || ''}>
                                  {trip.destination?.name || '-'}
                                </td>
                                <td className="p-3 text-right font-semibold">{formatWeight(trip.weight)}</td>
                                <td className="p-3">
                                  <span className="font-mono font-bold text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
                                    {trip.vehicle?.plateNumber || "-"}
                                  </span>
                                </td>
                                <td className="p-3 truncate max-w-[100px]" title={trip.driver?.name || ''}>
                                  {trip.driver?.name || "-"}
                                </td>
                                <td className="p-3 text-right">{formatCurrency(rowTransport)}</td>
                                <td className="p-3 text-right">{formatCurrency(rowDisposal)}</td>
                                <td className="p-3 text-right text-zinc-500">
                                  {rowAccessories > 0 ? formatCurrency(rowAccessories) : "-"}
                                </td>
                                <td className="p-3 text-right font-bold text-emerald-400">
                                  {formatCurrency(rowTaxable)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="p-1 hover:bg-zinc-800 hover:text-red-400 text-zinc-500 rounded transition-colors cursor-pointer"
                                    title="Cancella riga"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-zinc-800/30 font-bold border-t border-zinc-800">
                          <td className="p-3" colSpan={5}>Totale Selezionato</td>
                          <td className="p-3 text-right">{formatWeight(totalWeight)} t</td>
                          <td className="p-3" colSpan={2}></td>
                          <td className="p-3 text-right text-blue-400">{formatCurrency(totalTransport)}</td>
                          <td className="p-3 text-right text-amber-400">{formatCurrency(totalDisposal)}</td>
                          <td className="p-3 text-right text-zinc-400">{formatCurrency(totalAccessories)}</td>
                          <td className="p-3 text-right text-emerald-400">{formatCurrency(totalTaxable)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANAGRAFICHE */}
            {activeTab === 'anagrafiche' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Anagrafiche Aziendali & Risorse</h2>
                  <p className="text-sm text-zinc-400">Gestisci i soggetti, gli autisti, i mezzi e i codici CER dei rifiuti.</p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex border-b border-zinc-800 mb-6 gap-2 flex-wrap">
                  <button
                    onClick={() => setAnagraficaSubTab('clienti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'clienti' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    👥 Clienti
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('destinatari')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'destinatari' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    📍 Destinazioni (Cantieri)
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('autisti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'autisti' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    👤 Autisti
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('mezzi')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'mezzi' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🚛 Veicoli (Mezzi)
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('cer')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'cer' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🏷️ Codici CER
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('listinoSmaltimento')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'listinoSmaltimento' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    💰 Listino Smaltimento
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('listinoTrasporti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'listinoTrasporti' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🚚 Listino Trasporti
                  </button>
                </div>

                {/* SUB TAB: CLIENTI */}
                {anagraficaSubTab === 'clienti' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Clienti</h3>
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Cliente
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Codice Cliente</th>
                            <th className="p-3">Ragione Sociale</th>
                            <th className="p-3">Indirizzo Fatturazione</th>
                            <th className="p-3">Cod. Fiscale / P.IVA</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {clients.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-blue-400">{c.clientCode}</td>
                              <td className="p-3 font-semibold text-white">{c.name}</td>
                              <td className="p-3 text-zinc-300">{c.billingAddress || '-'}</td>
                              <td className="p-3 font-mono text-zinc-400">{c.vatNumber || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteClient(c.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: DESTINATARI */}
                {anagraficaSubTab === 'destinatari' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Destinazioni (Cantieri di Spedizione)</h3>
                      <button
                        onClick={() => setIsDestinationModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Destinazione
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Codice Spedizione</th>
                            <th className="p-3">Nome Cantiere / Indirizzo</th>
                            <th className="p-3">Indirizzo di Spedizione</th>
                            <th className="p-3">Cliente Collegato (Fatturazione)</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {destinations.map((d) => (
                            <tr key={d.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-amber-400">{d.shippingCode}</td>
                              <td className="p-3 font-semibold text-white">{d.name}</td>
                              <td className="p-3 text-zinc-300">{d.address}</td>
                              <td className="p-3 text-zinc-400">
                                {d.client?.name} ({d.client?.clientCode})
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteDestination(d.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: AUTISTI */}
                {anagraficaSubTab === 'autisti' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Autisti</h3>
                      <button
                        onClick={() => setIsDriverModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Autista
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Nome Autista</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Telefono</th>
                            <th className="p-3">N. Patente</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {drivers.map((d) => (
                            <tr key={d.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-semibold text-white">{d.name}</td>
                              <td className="p-3 text-zinc-300">{d.email}</td>
                              <td className="p-3 text-zinc-400">{d.phone || '-'}</td>
                              <td className="p-3 font-mono text-zinc-400">{d.licenseNumber || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteDriver(d.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: VEICOLI */}
                {anagraficaSubTab === 'mezzi' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Flotta Mezzi</h3>
                      <button
                        onClick={() => setIsVehicleModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Veicolo
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Targa Veicolo</th>
                            <th className="p-3">Modello</th>
                            <th className="p-3 text-right">Portata Utile (kg)</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {vehicles.map((v) => (
                            <tr key={v.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-blue-400">{v.plateNumber}</td>
                              <td className="p-3 text-zinc-300">{v.model || '-'}</td>
                              <td className="p-3 text-right font-semibold">{v.capacity ? `${formatWeight(v.capacity)} kg` : '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: CER CODES */}
                {anagraficaSubTab === 'cer' && (() => {
                  const cerCategories = [
                    '01 - Rifiuti da estrazione e prospezione di miniere e cave',
                    '02 - Rifiuti da agricoltura, selvicoltura, caccia e pesca',
                    '03 - Rifiuti da lavorazione del legno, carta e cartone',
                    '04 - Rifiuti da industria tessile e conciaria',
                    '05 - Rifiuti da raffinazione del petrolio e trattamento carbone',
                    '06 - Rifiuti da processi chimici inorganici',
                    '07 - Rifiuti da processi chimici organici',
                    '08 - Rifiuti da produzione di vernici, pitture, inchiostri e adesivi',
                    '09 - Rifiuti dell\'industria fotografica',
                    '10 - Rifiuti provenienti da processi termici',
                    '11 - Rifiuti da trattamento chimico e rivestimento di metalli',
                    '12 - Rifiuti da lavorazione fisica e meccanica di metalli e plastica',
                    '13 - Oli esausti e residui di combustibili liquidi',
                    '14 - Solventi organici e refrigeranti esausti',
                    '15 - Imballaggi, assorbenti, stracci e materiali filtranti',
                    '16 - Rifiuti non specificati altrove nel catalogo',
                    '17 - Rifiuti da operazioni di costruzione e demolizione',
                    '18 - Rifiuti sanitari e veterinari o da attività di ricerca',
                    '19 - Rifiuti da impianti di trattamento rifiuti e acque reflue',
                    '20 - Rifiuti urbani e domestici della raccolta differenziata'
                  ];

                  const filtered = wasteTypes.filter((w) => {
                    const matchesSearch = 
                      (w.cerCode || '').toLowerCase().includes(cerSearchQuery.toLowerCase()) ||
                      (w.description || '').toLowerCase().includes(cerSearchQuery.toLowerCase());
                    const matchesCategory = cerCategoryFilter === '' || w.category === cerCategoryFilter;
                    return matchesSearch && matchesCategory;
                  });

                  const grouped = filtered.reduce((acc: { [key: string]: any[] }, w) => {
                    const cat = w.category || 'Altro';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(w);
                    return acc;
                  }, {});

                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    if (a === 'Altro') return 1;
                    if (b === 'Altro') return -1;
                    return a.localeCompare(b);
                  });

                  return (
                    <div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">Anagrafica Codici EER/CER (Articoli)</h3>
                          <p className="text-xs text-zinc-400 mt-1">Totale codici trovati: {filtered.length} di {wasteTypes.length}</p>
                        </div>
                        <button
                          onClick={() => setIsWasteModalOpen(true)}
                          className="self-start md:self-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Aggiungi Codice CER
                        </button>
                      </div>

                      {/* FILTERS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Ricerca per Codice o Descrizione</label>
                          <input
                            type="text"
                            placeholder="Cerca es: 170107 o cemento..."
                            value={cerSearchQuery}
                            onChange={(e) => setCerSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Filtro Categoria (Capitolo)</label>
                          <select
                            value={cerCategoryFilter}
                            onChange={(e) => setCerCategoryFilter(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-700"
                          >
                            <option value="">Tutte le categorie</option>
                            {cerCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* TABLE WITH GROUPING */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
                        {sortedKeys.length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-sm">
                            Nessun codice CER corrisponde ai filtri impostati.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-md">
                                <th className="p-3 w-48">Codice CER</th>
                                <th className="p-3">Descrizione del Rifiuto</th>
                                <th className="p-3 text-center w-24">Rimuovi</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {sortedKeys.map((catKey) => (
                                <React.Fragment key={catKey}>
                                  {/* Category Header Row */}
                                  <tr className="bg-zinc-850/80 font-bold border-y border-zinc-800 text-xs text-emerald-400 select-none">
                                    <td colSpan={3} className="p-2.5 px-4 bg-zinc-800/20">
                                      📁 Categoria: {catKey}
                                    </td>
                                  </tr>
                                  {grouped[catKey].map((w) => (
                                    <tr key={w.id} className="hover:bg-zinc-800/20 border-b border-zinc-800/30">
                                      <td className="p-3 px-6 font-mono font-bold text-zinc-100">{w.cerCode}</td>
                                      <td className="p-3 text-zinc-300 truncate max-w-xl" title={w.description || ''}>
                                        {w.description || '-'}
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleDeleteWaste(w.id)}
                                          className="text-red-500 hover:text-red-400 p-1 px-2.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors text-xs font-semibold"
                                        >
                                          Elimina
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB TAB: LISTINO SMALTIMENTO */}
            {anagraficaSubTab === 'listinoSmaltimento' && (
              <div>
                <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-md font-bold text-white mb-4">Aggiungi Voce Listino Smaltimento</h3>
                  <form onSubmit={handleCreateDisposalPrice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Cliente (Opzionale: vuoto per prezzo base)</label>
                      <select
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                        value={newDisposalPriceData.clientId}
                        onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, clientId: e.target.value })}
                      >
                        <option value="">-- PREZZO BASE (Generale) --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Codice CER</label>
                      <select
                        required
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                        value={newDisposalPriceData.wasteTypeId}
                        onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, wasteTypeId: e.target.value })}
                      >
                        <option value="">Seleziona CER...</option>
                        {wasteTypes.map((w) => (
                          <option key={w.id} value={w.id}>{w.cerCode} - {w.description?.substring(0, 45)}...</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Prezzo al Quintale (€/q.le)</label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        placeholder="Es: 1.70"
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                        value={newDisposalPriceData.pricePerQuintal}
                        onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, pricePerQuintal: e.target.value })}
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        Salva nel Listino
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Codice CER</th>
                        <th className="p-3">Descrizione</th>
                        <th className="p-3 text-right">Prezzo al Quintale</th>
                        <th className="p-3 text-right">Prezzo al Tonnellata</th>
                        <th className="p-3 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {disposalPrices.map((dp) => (
                        <tr key={dp.id} className="hover:bg-zinc-800/20">
                          <td className="p-3 font-semibold text-zinc-200">
                            {dp.client ? (
                              <span className="text-blue-400">{dp.client.name} ({dp.client.clientCode})</span>
                            ) : (
                              <span className="text-zinc-500 font-bold italic">PREZZO BASE</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{dp.wasteType?.cerCode}</td>
                          <td className="p-3 text-zinc-400 max-w-md truncate" title={dp.wasteType?.description || ''}>
                            {dp.wasteType?.description || '-'}
                          </td>
                          <td className="p-3 text-right text-zinc-100 font-mono">{formatCurrency(dp.pricePerQuintal)} /q.le</td>
                          <td className="p-3 text-right text-amber-400 font-mono">{formatCurrency(dp.pricePerQuintal * 10)} /t</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteDisposalPrice(dp.id)}
                              className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded cursor-pointer"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))}
                      {disposalPrices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-500">Nessuna voce definita nel listino smaltimento.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB TAB: LISTINO TRASPORTI */}
            {anagraficaSubTab === 'listinoTrasporti' && (
              <div>
                <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-md font-bold text-white mb-4">Aggiungi Voce Listino Trasporto</h3>
                  <form onSubmit={handleCreateTransportPrice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Cliente (Opzionale: vuoto per prezzo base)</label>
                      <select
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                        value={newTransportPriceData.clientId}
                        onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, clientId: e.target.value })}
                      >
                        <option value="">-- PREZZO BASE (Generale) --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Automezzo</label>
                      <select
                        required
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                        value={newTransportPriceData.vehicleId}
                        onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, vehicleId: e.target.value })}
                      >
                        <option value="">Seleziona Veicolo...</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400">Prezzo Trasporto (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Es: 220.00"
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                        value={newTransportPriceData.price}
                        onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        Salva nel Listino
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Automezzo</th>
                        <th className="p-3 text-right">Prezzo Trasporto (€)</th>
                        <th className="p-3 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {transportPrices.map((tp) => (
                        <tr key={tp.id} className="hover:bg-zinc-800/20">
                          <td className="p-3 font-semibold text-zinc-200">
                            {tp.client ? (
                              <span className="text-blue-400">{tp.client.name} ({tp.client.clientCode})</span>
                            ) : (
                              <span className="text-zinc-500 font-bold italic">PREZZO BASE</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-750 mr-2">
                              {tp.vehicle?.plateNumber}
                            </span>
                            <span className="text-zinc-400 text-xs">{tp.vehicle?.model}</span>
                          </td>
                          <td className="p-3 text-right text-emerald-400 font-mono font-bold">{formatCurrency(tp.price)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteTransportPrice(tp.id)}
                              className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded cursor-pointer"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))}
                      {transportPrices.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-zinc-500">Nessuna voce definita nel listino trasporti.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: UTENTI (ADMIN ONLY) */}
            {activeTab === 'utenti' && currentUser.role === 'ADMIN' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Gestione Utenti del Sistema</h2>
                    <p className="text-sm text-zinc-400">Aggiungi, modifica o rimuovi gli account autorizzati.</p>
                  </div>
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                  >
                    + Aggiungi Utente
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                        <th className="p-3">Nome</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Password (In Chiaro)</th>
                        <th className="p-3">Ruolo</th>
                        <th className="p-3 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/20">
                          <td className="p-3 font-semibold text-white">{u.name || '-'}</td>
                          <td className="p-3 text-zinc-300">{u.email}</td>
                          <td className="p-3 font-mono text-zinc-400">{u.password}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-950/40 text-purple-400 border border-purple-900' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer disabled:opacity-30"
                              disabled={currentUser.id === u.id}
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ----------------- MODALI DI CREAZIONE ----------------- */}

      {/* TRIP MODAL */}
      {isTripModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Nuova Riga di Viaggio</h3>
              <button onClick={() => setIsTripModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-6">
              {(() => {
                const chosenDest = destinations.find(d => d.id === Number(newTripData.destinationId));
                const destDisplayValue = chosenDest ? `${chosenDest.name} (${chosenDest.client?.name} - ${chosenDest.shippingCode})` : '';
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Data di Consegna</label>
                        <input
                          type="date"
                          required
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.date}
                          onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Numero Formulario (FIR)</label>
                        <input
                          type="text"
                          required
                          placeholder="Es: NVBNH006245YQ"
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                          value={newTripData.firNumber}
                          onChange={(e) => setNewTripData({ ...newTripData, firNumber: e.target.value })}
                        />
                      </div>
                      
                      {/* Searchable CER Code dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Codice CER</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca CER (es: 170107 o cemento...)"
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isCerDropdownOpen ? cerSearchInput : (wasteTypes.find(w => w.id === Number(newTripData.wasteTypeId))?.cerCode || '')}
                            onFocus={() => {
                              setIsCerDropdownOpen(true);
                              setCerSearchInput('');
                            }}
                            onChange={(e) => setCerSearchInput(e.target.value)}
                          />
                          {isCerDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              {wasteTypes
                                .filter(w => {
                                  const query = cerSearchInput.toLowerCase();
                                  return w.cerCode.toLowerCase().includes(query) || 
                                         (w.description || '').toLowerCase().includes(query);
                                })
                                .slice(0, 50)
                                .map(w => (
                                  <div
                                    key={w.id}
                                    className="p-2 text-xs text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      handleTripWasteTypeChange(String(w.id));
                                      setIsCerDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-mono font-bold bg-zinc-900 text-emerald-400 px-1.5 py-0.5 rounded mr-2">{w.cerCode}</span>
                                    <span>{w.description?.substring(0, 60)}...</span>
                                  </div>
                                ))}
                              {wasteTypes.filter(w => {
                                const query = cerSearchInput.toLowerCase();
                                return w.cerCode.toLowerCase().includes(query) || 
                                       (w.description || '').toLowerCase().includes(query);
                              }).length === 0 && (
                                <div className="p-2 text-xs text-zinc-500 text-center">Nessun codice CER trovato.</div>
                              )}
                            </div>
                          )}
                          {isCerDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsCerDropdownOpen(false)} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Searchable Destination selector (sole selector, removing client selector) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-zinc-400 uppercase">Destinazione (Cantiere / Cliente)</label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          placeholder="Cerca e seleziona destinazione (es: Colosseo...)"
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                          value={isDestDropdownOpen ? destSearchInput : destDisplayValue}
                          onFocus={() => {
                            setIsDestDropdownOpen(true);
                            setDestSearchInput('');
                          }}
                          onChange={(e) => setDestSearchInput(e.target.value)}
                        />
                        {isDestDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                            {destinations
                              .filter(d => {
                                const query = destSearchInput.toLowerCase();
                                return d.name.toLowerCase().includes(query) || 
                                       (d.client?.name || '').toLowerCase().includes(query) ||
                                       d.shippingCode.toLowerCase().includes(query);
                              })
                              .map(d => (
                                <div
                                  key={d.id}
                                  className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                  onClick={() => {
                                    handleTripDestinationChange(String(d.id));
                                    setIsDestDropdownOpen(false);
                                  }}
                                >
                                  <span className="font-bold">{d.name}</span>
                                  <span className="text-xs ml-2 text-zinc-400">
                                    (Cod: {d.shippingCode} - Client: {d.client?.name})
                                  </span>
                                </div>
                              ))}
                            {destinations.filter(d => {
                              const query = destSearchInput.toLowerCase();
                              return d.name.toLowerCase().includes(query) || 
                                     (d.client?.name || '').toLowerCase().includes(query) ||
                                     d.shippingCode.toLowerCase().includes(query);
                            }).length === 0 && (
                              <div className="p-2 text-xs text-zinc-500 text-center">Nessuna destinazione trovata.</div>
                            )}
                          </div>
                        )}
                        {isDestDropdownOpen && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsDestDropdownOpen(false)} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Searchable Autista dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Autista</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca autista..."
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isDriverDropdownOpen ? driverSearchInput : (drivers.find(d => d.id === Number(newTripData.driverId))?.name || 'Non Assegnato')}
                            onFocus={() => {
                              setIsDriverDropdownOpen(true);
                              setDriverSearchInput('');
                            }}
                            onChange={(e) => setDriverSearchInput(e.target.value)}
                          />
                          {isDriverDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              <div
                                className="p-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  setNewTripData({ ...newTripData, driverId: '' });
                                  setIsDriverDropdownOpen(false);
                                }}
                              >
                                Non Assegnato
                              </div>
                              {drivers
                                .filter(d => d.name.toLowerCase().includes(driverSearchInput.toLowerCase()))
                                .map(d => (
                                  <div
                                    key={d.id}
                                    className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      setNewTripData({ ...newTripData, driverId: String(d.id) });
                                      setIsDriverDropdownOpen(false);
                                    }}
                                  >
                                    {d.name}
                                  </div>
                                ))}
                            </div>
                          )}
                          {isDriverDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsDriverDropdownOpen(false)} />
                          )}
                        </div>
                      </div>

                      {/* Searchable Vehicle dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Automezzo</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca mezzo..."
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isVehicleDropdownOpen ? vehicleSearchInput : (vehicles.find(v => v.id === Number(newTripData.vehicleId))?.plateNumber || 'Non Assegnato')}
                            onFocus={() => {
                              setIsVehicleDropdownOpen(true);
                              setVehicleSearchInput('');
                            }}
                            onChange={(e) => setVehicleSearchInput(e.target.value)}
                          />
                          {isVehicleDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              <div
                                className="p-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  setNewTripData({ ...newTripData, vehicleId: '' });
                                  setIsVehicleDropdownOpen(false);
                                }}
                              >
                                Non Assegnato
                              </div>
                              {vehicles
                                .filter(v => v.plateNumber.toLowerCase().includes(vehicleSearchInput.toLowerCase()) || (v.model || '').toLowerCase().includes(vehicleSearchInput.toLowerCase()))
                                .map(v => (
                                  <div
                                    key={v.id}
                                    className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      handleTripVehicleChange(String(v.id));
                                      setIsVehicleDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-mono font-bold text-xs bg-zinc-900 text-blue-400 px-1.5 py-0.5 rounded mr-2">{v.plateNumber}</span>
                                    <span className="text-zinc-450 text-xs">{v.model}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                          {isVehicleDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsVehicleDropdownOpen(false)} />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Peso (t)</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          placeholder="Es: 12.4"
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.weight}
                          onChange={(e) => handleTripWeightChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Prezzo CER (€/t)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Es: 17"
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.cerPrice}
                          onChange={(e) => handleTripCerPriceChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                      <span className="text-sm font-semibold text-white block mb-3">Prezzi Contabili (€)</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Trasporto</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.transportPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, transportPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Smaltimento</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.disposalPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, disposalPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Fuori Roma</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.fuoriRomaPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, fuoriRomaPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Noleggio Cassoni</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.noleggioPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, noleggioPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Fornitura Big Bag</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.bigBagPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, bigBagPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Analisi Rifiuto</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.analisiPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, analisiPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Carico Ragno</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.servRagnoPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, servRagnoPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Indennizzo Sosta</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.sostaPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, sostaPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase font-sans">Annotazioni</label>
                      <textarea
                        rows={2}
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                        value={newTripData.notes}
                        onChange={(e) => setNewTripData({ ...newTripData, notes: e.target.value })}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTripModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold cursor-pointer"
                >
                  Registra Viaggio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Cliente</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Es: CL001"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newClientData.clientCode}
                  onChange={(e) => setNewClientData({ ...newClientData, clientCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ragione Sociale</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo Sede (Fatturazione)</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newClientData.billingAddress}
                  onChange={(e) => setNewClientData({ ...newClientData, billingAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Partita IVA / Cod. Fiscale</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newClientData.vatNumber}
                  onChange={(e) => setNewClientData({ ...newClientData, vatNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTINATION MODAL */}
      {isDestinationModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Destinazione</h3>
              <button onClick={() => setIsDestinationModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Cliente Collegato (Fatturazione)</label>
                <select
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newDestinationData.clientId}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, clientId: e.target.value })}
                >
                  <option value="">Seleziona Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice Spedizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es: SP001"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newDestinationData.shippingCode}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, shippingCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome Destinazione/Cantiere</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Cantiere Colosseo"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDestinationData.name}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo di Spedizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Piazza del Colosseo 1, Roma"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDestinationData.address}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, address: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDestinationModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Destinazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Autista</h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome e Cognome</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Email</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.email}
                  onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Telefono</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.phone}
                  onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Numero Patente</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newDriverData.licenseNumber}
                  onChange={(e) => setNewDriverData({ ...newDriverData, licenseNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Autista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Automezzo</h3>
              <button onClick={() => setIsVehicleModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Targa</label>
                <input
                  type="text"
                  required
                  placeholder="Es: HD014KY"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newVehicleData.plateNumber}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, plateNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Modello Veicolo</label>
                <input
                  type="text"
                  placeholder="Es: Iveco Stralis"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newVehicleData.model}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Portata Utile (kg)</label>
                <input
                  type="number"
                  placeholder="Es: 26000"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newVehicleData.capacity}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, capacity: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Mezzo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WASTE MODAL */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Codice EER/CER (Articolo)</h3>
              <button onClick={() => setIsWasteModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateWaste} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice CER</label>
                <input
                  type="text"
                  required
                  placeholder="Es: 170904"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newWasteData.cerCode}
                  onChange={(e) => setNewWasteData({ ...newWasteData, cerCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Descrizione del Rifiuto</label>
                <textarea
                  rows={3}
                  placeholder="Inserisci la descrizione ufficiale del rifiuto..."
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newWasteData.description}
                  onChange={(e) => setNewWasteData({ ...newWasteData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWasteModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Codice CER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Nuovo Utente</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome dell'utente</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Maria Rossi"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo Email (Username)</label>
                <input
                  type="email"
                  required
                  placeholder="maria@brecitrasporti.it"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Password</label>
                <input
                  type="text"
                  required
                  placeholder="Password di accesso"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ruolo Sistema</label>
                <select
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="OPERATOR">Operatore (Solo visualizzazione e inserimenti)</option>
                  <option value="ADMIN">Amministratore (Pieno controllo + Gestione Utenti)</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Utente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
