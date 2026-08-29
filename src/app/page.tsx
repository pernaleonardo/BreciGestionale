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
  createCompany,
  deleteCompany,
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
  const [anagraficaSubTab, setAnagraficaSubTab] = useState<'aziende' | 'autisti' | 'mezzi' | 'cer'>('aziende');
  
  // Dati dal database
  const [trips, setTrips] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
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
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Form states
  const [loginError, setLoginError] = useState('');
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
    producerId: '',
    recipientId: '',
    driverId: '',
    vehicleId: '',
  });

  const [newCompanyData, setNewCompanyData] = useState({ name: '', address: '', vatNumber: '', role: 'PRODUCER' });
  const [newDriverData, setNewDriverData] = useState({ name: '', email: '', phone: '', licenseNumber: '' });
  const [newVehicleData, setNewVehicleData] = useState({ plateNumber: '', model: '', capacity: '' });
  const [newWasteData, setNewWasteData] = useState({ cerCode: '', description: '' });
  const [newUserData, setNewUserData] = useState({ email: '', name: '', password: '', role: 'OPERATOR' });

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
      setCompanies(data.companies || []);
      setDrivers(data.drivers || []);
      setVehicles(data.vehicles || []);
      setWasteTypes(data.wasteTypes || []);

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
    // Filtro per Cliente (produttore o destinatario)
    if (filterCliente !== 'ALL') {
      const clientId = Number(filterCliente);
      if (trip.producerId !== clientId && trip.recipientId !== clientId) {
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
      setNewTripData({
        date: '', firNumber: '', wasteTypeId: '', weight: '', cerPrice: '',
        transportPrice: '', disposalPrice: '', fuoriRomaPrice: '0', noleggioPrice: '0',
        bigBagPrice: '0', analisiPrice: '0', servRagnoPrice: '0', sostaPrice: '0',
        address: '', notes: '', producerId: '', recipientId: '', driverId: '', vehicleId: '',
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

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createCompany(newCompanyData);
    if (res.success) {
      setIsCompanyModalOpen(false);
      setNewCompanyData({ name: '', address: '', vatNumber: '', role: 'PRODUCER' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (confirm('Rimuovendo l\'azienda verranno cancellati anche i viaggi ad essa associati. Continuare?')) {
      const res = await deleteCompany(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
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
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.role === 'PRODUCER' ? 'Produttore' : 'Destinatario'})</option>
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
                          <th className="p-3">Produttore</th>
                          <th className="p-3">Destinatario</th>
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
                                <td className="p-3 truncate max-w-[150px]" title={trip.producer?.name || ''}>
                                  {trip.producer?.name || '-'}
                                </td>
                                <td className="p-3 truncate max-w-[150px]" title={trip.recipient?.name || ''}>
                                  {trip.recipient?.name || '-'}
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
                <div className="flex border-b border-zinc-800 mb-6 gap-2">
                  <button
                    onClick={() => setAnagraficaSubTab('aziende')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'aziende' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🏢 Aziende (Prod/Dest)
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
                </div>

                {/* SUB TAB: AZIENDE */}
                {anagraficaSubTab === 'aziende' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Produttori & Destinatari</h3>
                      <button
                        onClick={() => setIsCompanyModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Azienda
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Ragione Sociale</th>
                            <th className="p-3">Indirizzo</th>
                            <th className="p-3">Cod. Fiscale / P.IVA</th>
                            <th className="p-3">Ruolo</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {companies.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-semibold text-white">{c.name}</td>
                              <td className="p-3 text-zinc-300">{c.address || '-'}</td>
                              <td className="p-3 font-mono text-zinc-400">{c.vatNumber || '-'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.role === 'PRODUCER' ? 'bg-amber-950/40 text-amber-400 border border-amber-900' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900'}`}>
                                  {c.role === 'PRODUCER' ? 'Produttore' : 'Destinatario'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteCompany(c.id)}
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
                {anagraficaSubTab === 'cer' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Codici EER/CER (Articoli)</h3>
                      <button
                        onClick={() => setIsWasteModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Codice CER
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3 w-48">Codice CER</th>
                            <th className="p-3">Descrizione del Rifiuto</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {wasteTypes.map((w) => (
                            <tr key={w.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-emerald-400">{w.cerCode}</td>
                              <td className="p-3 text-zinc-300 truncate max-w-xl" title={w.description || ''}>{w.description || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteWaste(w.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Data (gg/mm/aaaa)</label>
                  <input
                    type="text"
                    required
                    placeholder="Es: 05/08/2026"
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
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
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Codice CER (Catalogo)</label>
                  <select
                    required
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.wasteTypeId}
                    onChange={(e) => setNewTripData({ ...newTripData, wasteTypeId: e.target.value })}
                  >
                    <option value="">Seleziona CER...</option>
                    {wasteTypes.map((w) => (
                      <option key={w.id} value={w.id}>{w.cerCode} - {w.description?.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Produttore (Mittente)</label>
                  <select
                    required
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.producerId}
                    onChange={(e) => setNewTripData({ ...newTripData, producerId: e.target.value })}
                  >
                    <option value="">Seleziona Produttore...</option>
                    {companies.filter(c => c.role === 'PRODUCER' || c.role === 'BOTH').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Destinatario (Impianto)</label>
                  <select
                    required
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.recipientId}
                    onChange={(e) => setNewTripData({ ...newTripData, recipientId: e.target.value })}
                  >
                    <option value="">Seleziona Destinatario...</option>
                    {companies.filter(c => c.role === 'RECIPIENT' || c.role === 'BOTH').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Autista</label>
                  <select
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.driverId}
                    onChange={(e) => setNewTripData({ ...newTripData, driverId: e.target.value })}
                  >
                    <option value="">Non Assegnato</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Automezzo</label>
                  <select
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.vehicleId}
                    onChange={(e) => setNewTripData({ ...newTripData, vehicleId: e.target.value })}
                  >
                    <option value="">Non Assegnato</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Peso (t)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="Es: 12.4"
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.weight}
                    onChange={(e) => setNewTripData({ ...newTripData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase">Prezzo CER (€/t)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Es: 17"
                    className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                    value={newTripData.cerPrice}
                    onChange={(e) => setNewTripData({ ...newTripData, cerPrice: e.target.value })}
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
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.transportPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, transportPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Smaltimento</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.disposalPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, disposalPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Fuori Roma</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.fuoriRomaPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, fuoriRomaPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Noleggio Cassoni</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.noleggioPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, noleggioPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Fornitura Big Bag</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.bigBagPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, bigBagPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Analisi Rifiuto</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.analisiPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, analisiPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Carico Ragno</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.servRagnoPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, servRagnoPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400">Indennizzo Sosta</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                      value={newTripData.sostaPrice}
                      onChange={(e) => setNewTripData({ ...newTripData, sostaPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase font-sans">Destinazione Cantiere / Indirizzo</label>
                <input
                  type="text"
                  placeholder="Es: VIA DEI MILLE 40, Roma"
                  className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newTripData.address}
                  onChange={(e) => setNewTripData({ ...newTripData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase font-sans">Annotazioni</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newTripData.notes}
                  onChange={(e) => setNewTripData({ ...newTripData, notes: e.target.value })}
                />
              </div>

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

      {/* COMPANY MODAL */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Azienda</h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ragione Sociale</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newCompanyData.name}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo Sede/Cantiere</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newCompanyData.address}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Partita IVA / Cod. Fiscale</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newCompanyData.vatNumber}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, vatNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ruolo Azienda</label>
                <select
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newCompanyData.role}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, role: e.target.value })}
                >
                  <option value="PRODUCER">Produttore (Speditore)</option>
                  <option value="RECIPIENT">Destinatario (Impianto)</option>
                  <option value="BOTH">Entrambi (Produttore & Destinatario)</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Azienda
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
